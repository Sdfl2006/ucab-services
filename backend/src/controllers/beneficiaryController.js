const { pool } = require('../config/db');

/**
 * Función auxiliar para calcular edad exacta en años.
 * `fechaReferencia` permite determinismo en pruebas.
 */
const calcularEdad = (fechaNacimiento, fechaReferencia = new Date()) => {
    const nac = new Date(fechaNacimiento);
    let edad = fechaReferencia.getFullYear() - nac.getFullYear();
    const mes = fechaReferencia.getMonth() - nac.getMonth();
    if (mes < 0 || (mes === 0 && fechaReferencia.getDate() < nac.getDate())) {
        edad--;
    }
    return edad;
};

const clasificarBeneficiario = (fechaNacimiento, constanciaEstudios, fechaReferencia = new Date()) => {
    const edad = calcularEdad(fechaNacimiento, fechaReferencia);
    const esMayor = edad >= 18;

    return {
        tipo_carga: esMayor ? 'Carga_mayor' : 'Carga_menor',
        beneficios_activos: esMayor ? Boolean(constanciaEstudios) : true
    };
};

/**
 * @desc    HU-09: Registrar un beneficiario (Carga menor o mayor según edad)
 * @route   POST /api/beneficiarios
 * @access  Private (Sólo Docentes y Personal Administrativo)
 */
const registerBeneficiary = async (req, res, next) => {
    const client = await pool.connect();
    try {
        const cedula_titular = req.user.cedula; // Inyectado por authMiddleware (JWT)
        const {
            cedula_beneficiario,
            nombres,
            apellidos,
            parentesco,
            fecha_nacimiento,
            esquema_vacunacion,
            centro_educacion_inicial,
            constancia_estudios,
            certificado_solteria
        } = req.body;

        await client.query('BEGIN');

        // 1. Validar regla de negocio R-05: El titular debe ser Profesor o Personal Administrativo
        const titularCheck = await client.query(
            `SELECT cedula FROM Profesor WHERE cedula = $1
             UNION
             SELECT cedula FROM Personal_Administrativo WHERE cedula = $1`,
            [cedula_titular]
        );

        if (titularCheck.rows.length === 0) {
            const error = new Error('Acceso denegado. Solo docentes o personal administrativo pueden registrar beneficiarios.');
            error.statusCode = 403;
            throw error;
        }

        // 2. Determinar edad y lógica de beneficios
        const { tipo_carga, beneficios_activos } = clasificarBeneficiario(fecha_nacimiento, constancia_estudios);

        // 3. Insertar en tabla fuerte: Beneficiario
        const insertBeneficiarioQuery = `
            INSERT INTO Beneficiario (
                cedula_beneficiario, cedula_titular, nombres, apellidos, 
                parentesco, fecha_nacimiento, fecha_inicio_cobertura, beneficios_activos
            ) VALUES ($1, $2, $3, $4, $5, $6, CURRENT_DATE, $7)
            RETURNING *;
        `;
        const beneficiarioRes = await client.query(insertBeneficiarioQuery, [
            cedula_beneficiario, cedula_titular, nombres, apellidos,
            parentesco, fecha_nacimiento, beneficios_activos
        ]);

        // 4. Bifurcación transaccional según la edad (Regla R-20)
        let subtipoRes;
        if (tipo_carga === 'Carga_mayor') {
            const insertCargaMayor = `
                INSERT INTO Carga_mayor (cedula_beneficiario, constancia_estudios, certificado_solteria)
                VALUES ($1, $2, $3) RETURNING *;
            `;
            subtipoRes = await client.query(insertCargaMayor, [
                cedula_beneficiario, constancia_estudios || null, certificado_solteria || null
            ]);
        } else {
            const insertCargaMenor = `
                INSERT INTO Carga_menor (cedula_beneficiario, esquema_vacunacion, centro_educacion_inicial)
                VALUES ($1, $2, $3) RETURNING *;
            `;
            subtipoRes = await client.query(insertCargaMenor, [
                cedula_beneficiario, esquema_vacunacion || null, centro_educacion_inicial || null
            ]);
        }

        await client.query('COMMIT');
        const esMayor = tipo_carga === 'Carga_mayor';

        res.status(201).json({
            success: true,
            message: 'Beneficiario registrado exitosamente.',
            data: {
                ...beneficiarioRes.rows[0],
                tipo_carga,
                detalle_carga: subtipoRes.rows[0]
            }
        });

    } catch (error) {
        await client.query('ROLLBACK');
        // Manejo de errores de clave duplicada en PG
        if (error.code === '23505') {
            error.message = 'La cédula del beneficiario ya se encuentra registrada.';
            error.statusCode = 400;
        }
        next(error);
    } finally {
        client.release();
    }
};

/**
 * @desc    HU-09: Listar los beneficiarios asociados al titular autenticado con su subtipo
 * @route   GET /api/beneficiarios/mis-beneficiarios
 * @access  Private
 */
const getMyBeneficiaries = async (req, res, next) => {
    try {
        const cedula_titular = req.user.cedula;

        const query = `
            SELECT 
                b.*,
                CASE 
                    WHEN cma.cedula_beneficiario IS NOT NULL THEN 'Carga_mayor'
                    WHEN cme.cedula_beneficiario IS NOT NULL THEN 'Carga_menor'
                END AS tipo_carga,
                cme.esquema_vacunacion,
                cme.centro_educacion_inicial,
                cma.constancia_estudios,
                cma.certificado_solteria
            FROM Beneficiario b
            LEFT JOIN Carga_menor cme ON b.cedula_beneficiario = cme.cedula_beneficiario
            LEFT JOIN Carga_mayor cma ON b.cedula_beneficiario = cma.cedula_beneficiario
            WHERE b.cedula_titular = $1;
        `;

        const { rows } = await pool.query(query, [cedula_titular]);

        res.status(200).json({
            success: true,
            count: rows.length,
            data: rows
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    HU-10: Auditoría y transición automática al cumplir 18 años
 * @route   POST /api/beneficiarios/evaluar-mayoría-edad
 * @access  Private (Admin / Sistema)
 */
const ejecutarTransicionMayorEdad = async (client = null) => {
    const ownClient = client || await pool.connect();
    const debeLiberar = client === null;
    let debeCerrarTransaccion = false;

    try {
        if (!client) {
            await ownClient.query('BEGIN');
            debeCerrarTransaccion = true;
        }

        const queryDetect = `
            SELECT b.cedula_beneficiario, b.nombres, b.apellidos
            FROM Beneficiario b
            JOIN Carga_menor cm ON b.cedula_beneficiario = cm.cedula_beneficiario
            WHERE EXTRACT(YEAR FROM AGE(CURRENT_DATE, b.fecha_nacimiento)) >= 18;
        `;
        const { rows: candidatos } = await ownClient.query(queryDetect);

        if (candidatos.length === 0) {
            if (debeCerrarTransaccion) {
                await ownClient.query('ROLLBACK');
            }
            return { migrados: [] };
        }

        const migrados = [];

        for (const cand of candidatos) {
            await ownClient.query(`DELETE FROM Carga_menor WHERE cedula_beneficiario = $1`, [cand.cedula_beneficiario]);
            await ownClient.query(`INSERT INTO Carga_mayor (cedula_beneficiario, constancia_estudios, certificado_solteria)
                 VALUES ($1, NULL, NULL)`, [cand.cedula_beneficiario]);
            await ownClient.query(`UPDATE Beneficiario 
                 SET beneficios_activos = false 
                 WHERE cedula_beneficiario = $1`, [cand.cedula_beneficiario]);
            migrados.push({ cedula: cand.cedula_beneficiario, nombre: `${cand.nombres} ${cand.apellidos}` });
        }

        if (debeCerrarTransaccion) {
            await ownClient.query('COMMIT');
        }

        return { migrados };
    } catch (error) {
        if (debeCerrarTransaccion) {
            await ownClient.query('ROLLBACK');
        }
        throw error;
    } finally {
        if (debeLiberar) {
            ownClient.release();
        }
    }
};

const evaluateAgeTransitions = async (req, res, next) => {
    const client = await pool.connect();
    try {
        const result = await ejecutarTransicionMayorEdad(client);

        if (result.migrados.length === 0) {
            return res.status(200).json({
                success: true,
                message: 'No se detectaron beneficiarios pendientes por transición de mayoría de edad.',
                migrados: 0
            });
        }

        res.status(200).json({
            success: true,
            message: `Se ha procesado la transición de mayoría de edad para ${result.migrados.length} beneficiario(s). Sus beneficios han sido suspendidos temporalmente hasta consignar constancia de estudios.`,
            migrados: result.migrados
        });
    } catch (error) {
        next(error);
    } finally {
        client.release();
    }
};

/**
 * @desc    HU-10 / HU-20: Cargar constancia de estudios para activar beneficios de Carga Mayor
 * @route   PUT /api/beneficiarios/:cedula/constancia
 * @access  Private (Docentes y Personal Administrativo)
 */
const uploadConstanciaEstudios = async (req, res, next) => {
    const client = await pool.connect();
    try {
        const { cedula } = req.params;
        const { constancia_estudios, certificado_solteria } = req.body;
        const cedula_titular = req.user.cedula;

        if (!constancia_estudios) {
            const error = new Error('La referencia o documento de constancia de estudios es obligatoria.');
            error.statusCode = 400;
            throw error;
        }

        await client.query('BEGIN');

        // Validar propiedad del beneficiario
        const checkOwner = await client.query(
            `SELECT cedula_beneficiario FROM Beneficiario WHERE cedula_beneficiario = $1 AND cedula_titular = $2`,
            [cedula, cedula_titular]
        );

        if (checkOwner.rows.length === 0) {
            const error = new Error('No tienes permisos para modificar este beneficiario o no existe.');
            error.statusCode = 404;
            throw error;
        }

        // Actualizar documentos en Carga_mayor
        const updateMayor = await client.query(
            `UPDATE Carga_mayor 
             SET constancia_estudios = $1, certificado_solteria = COALESCE($2, certificado_solteria)
             WHERE cedula_beneficiario = $3 RETURNING *`,
            [constancia_estudios, certificado_solteria || null, cedula]
        );

        if (updateMayor.rows.length === 0) {
            const error = new Error('Este beneficiario no está registrado bajo la modalidad de Carga Mayor.');
            error.statusCode = 400;
            throw error;
        }

        // Reactivar beneficios
        const updateBeneficiario = await client.query(
            `UPDATE Beneficiario SET beneficios_activos = true WHERE cedula_beneficiario = $1 RETURNING *`,
            [cedula]
        );

        await client.query('COMMIT');

        res.status(200).json({
            success: true,
            message: 'Constancia de estudios cargada con éxito. Los beneficios han sido reactivados.',
            data: {
                ...updateBeneficiario.rows[0],
                documentos: updateMayor.rows[0]
            }
        });

    } catch (error) {
        await client.query('ROLLBACK');
        next(error);
    } finally {
        client.release();
    }
};

const getAllBeneficiaries = async (req, res, next) => {
    try {
        const query = `
            SELECT 
                b.*, 
                CASE 
                    WHEN cma.cedula_beneficiario IS NOT NULL THEN 'Carga_mayor'
                    WHEN cme.cedula_beneficiario IS NOT NULL THEN 'Carga_menor'
                END AS tipo_carga,
                cme.esquema_vacunacion,
                cme.centro_educacion_inicial,
                cma.constancia_estudios,
                cma.certificado_solteria
            FROM Beneficiario b
            LEFT JOIN Carga_menor cme ON b.cedula_beneficiario = cme.cedula_beneficiario
            LEFT JOIN Carga_mayor cma ON b.cedula_beneficiario = cma.cedula_beneficiario;
        `;

        const { rows } = await pool.query(query);

        const stats = rows.reduce(
            (acc, item) => {
                acc.total += 1;
                if (item.beneficios_activos) acc.activos += 1;
                else acc.inactivos += 1;
                if (item.tipo_carga === 'Carga_mayor') acc.cargaMayor += 1;
                if (item.tipo_carga === 'Carga_menor') acc.cargaMenor += 1;
                return acc;
            },
            { total: 0, activos: 0, inactivos: 0, cargaMayor: 0, cargaMenor: 0 }
        );

        res.status(200).json({
            success: true,
            count: rows.length,
            stats,
            data: rows
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    registerBeneficiary,
    getMyBeneficiaries,
    getAllBeneficiaries,
    evaluateAgeTransitions,
    uploadConstanciaEstudios,
    calcularEdad,
    clasificarBeneficiario,
    ejecutarTransicionMayorEdad
};