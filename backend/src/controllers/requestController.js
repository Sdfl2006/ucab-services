const { pool } = require('../config/db');

/**
 * Función auxiliar para calcular días hábiles entre dos fechas (excluyendo fines de semana)
 */
const calcularTiempoHabil = (fechaInicio, fechaFin) => {
    const inicio = new Date(fechaInicio);
    const fin = fechaFin ? new Date(fechaFin) : new Date();
    let diasHabiles = 0;
    const actual = new Date(inicio);

    while (actual <= fin) {
        const diaSemana = actual.getDay();
        if (diaSemana !== 0 && diaSemana !== 6) { // 0: Domingo, 6: Sábado
            diasHabiles++;
        }
        actual.setDate(actual.getDate() + 1);
    }
    
    const horasTotales = Math.abs(fin - inicio) / (1000 * 60 * 60);
    return {
        dias_habiles: diasHabiles,
        horas_totales: Number(horasTotales.toFixed(2))
    };
};

/**
 * @desc    HU-27 & HU-11: Crear Solicitud evolucionada (incluye Acompañantes y Workflow)
 * @route   POST /api/v1/solicitudes
 * @access  Private
 */
const createRequest = async (req, res, next) => {
    const client = await pool.connect();
    try {
        const cedula_miembro = req.user.cedula;
        const {
            codigo_servicio,
            nro_identificador_espacio,
            acompanantes // Array opcional: [{ cedula_acompanante: '99888777', nombre: 'Marta Gómez' }]
        } = req.body;

        await client.query('BEGIN');

        // 1. Validar existencia del servicio
        const servCheck = await client.query(`SELECT codigo_servicio FROM Servicio WHERE codigo_servicio = $1`, [codigo_servicio]);
        if (servCheck.rows.length === 0) {
            const error = new Error('El código de servicio especificado no existe.');
            error.statusCode = 404;
            throw error;
        }

        // 2. Crear la solicitud base (Compatibilidad con tu Sprint 1)
        const insertSolicitud = `
            INSERT INTO Solicitud_Servicio (cedula_miembro, codigo_servicio, nro_identificador_espacio, estatus_general)
            VALUES ($1, $2, $3, 'en_proceso')
            RETURNING *;
        `;
        const solicitudRes = await client.query(insertSolicitud, [
            cedula_miembro, codigo_servicio, nro_identificador_espacio || null
        ]);
        const nro_solicitud = solicitudRes.rows[0].nro_solicitud;

        // 3. Registrar Acompañantes temporales (HU-11)
        const acompanantesGuardados = [];
        if (acompanantes && acompanantes.length > 0) {
            for (const a of acompanantes) {
                const aRes = await client.query(
                    `INSERT INTO Acompanante (cedula_acompanante, nro_solicitud, nombre)
                     VALUES ($1, $2, $3) RETURNING *;`,
                    [a.cedula_acompanante, nro_solicitud, a.nombre]
                );
                acompanantesGuardados.push(aRes.rows[0]);
            }
        }

        // 4. Generar Workflow automático en Paso_Actividad (HU-27)
        const pasosEstandar = [
            { paso: 1, desc: 'Verificación de Aranceles y Solvencia en Caja', estatus: 'en progreso', inicio: 'CURRENT_TIMESTAMP' },
            { paso: 2, desc: 'Validación de Expediente y Requisitos en Secretaría', estatus: 'pendiente', inicio: 'NULL' },
            { paso: 3, desc: 'Aprobación Final y Emisión de Documento por Rectorado', estatus: 'pendiente', inicio: 'NULL' }
        ];

        const pasosGuardados = [];
        for (const p of pasosEstandar) {
            const queryPaso = `
                INSERT INTO Paso_Actividad (nro_solicitud, nro_paso, descripcion, estatus, fecha_hora_inicio)
                VALUES ($1, $2, $3, $4, ${p.inicio}) RETURNING *;
            `;
            const pRes = await client.query(queryPaso, [nro_solicitud, p.paso, p.desc, p.estatus]);
            pasosGuardados.push(pRes.rows[0]);
        }

        await client.query('COMMIT');

        res.status(201).json({
            success: true,
            message: 'Solicitud creada con éxito y workflow inicializado.',
            data: {
                ...solicitudRes.rows[0],
                acompanantes: acompanantesGuardados,
                workflow: pasosGuardados
            }
        });

    } catch (error) {
        await client.query('ROLLBACK');
        next(error);
    } finally {
        client.release();
    }
};

/**
 * @desc    Listar solicitudes (Mantiene la compatibilidad con lo que ya tenías en el Sprint 1)
 * @route   GET /api/v1/solicitudes
 * @access  Private
 */
const getRequests = async (req, res, next) => {
    try {
        const cedula_miembro = req.user.cedula;
        const userRoles = req.user.roles || [];

        let query = `SELECT * FROM Solicitud_Servicio ORDER BY fecha_creacion DESC`;
        let params = [];

        // Si no es admin o personal administrativo, solo ve sus propias solicitudes
        if (!userRoles.includes('Admin') && !userRoles.includes('Personal_Administrativo')) {
            query = `SELECT * FROM Solicitud_Servicio WHERE cedula_miembro = $1 ORDER BY fecha_creacion DESC`;
            params = [cedula_miembro];
        }

        const { rows } = await pool.query(query, params);

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
 * @desc    HU-11: Añadir un acompañante adicional a una solicitud existente
 * @route   POST /api/v1/solicitudes/:nro_solicitud/acompanantes
 * @access  Private
 */
const addCompanion = async (req, res, next) => {
    try {
        const { nro_solicitud } = req.params;
        const { cedula_acompanante, nombre } = req.body;

        const query = `
            INSERT INTO Acompanante (cedula_acompanante, nro_solicitud, nombre)
            VALUES ($1, $2, $3) RETURNING *;
        `;
        const { rows } = await pool.query(query, [cedula_acompanante, nro_solicitud, nombre]);

        res.status(201).json({
            success: true,
            message: 'Acompañante vinculado exitosamente.',
            data: rows[0]
        });
    } catch (error) {
        if (error.code === '23505') {
            error.message = 'Este acompañante ya se encuentra registrado en esta solicitud.';
            error.statusCode = 400;
        }
        next(error);
    }
};

/**
 * @desc    HU-28 & HU-29: Completar paso, auditar fecha inmutable y liberar el siguiente
 * @route   PUT /api/v1/solicitudes/:nro_solicitud/pasos/:nro_paso/completar
 * @access  Private (Admin, Personal_Administrativo)
 */
const completeStep = async (req, res, next) => {
    const client = await pool.connect();
    try {
        const { nro_solicitud, nro_paso } = req.params;
        const cedula_admin = req.user.cedula;
        const pasoActualNum = parseInt(nro_paso);

        await client.query('BEGIN');

        // Validar orden lógico (HU-28)
        if (pasoActualNum > 1) {
            const prevCheck = await client.query(
                `SELECT estatus FROM Paso_Actividad WHERE nro_solicitud = $1 AND nro_paso = $2`,
                [nro_solicitud, pasoActualNum - 1]
            );

            if (prevCheck.rows.length === 0 || prevCheck.rows[0].estatus !== 'completado') {
                const error = new Error(`Violación del flujo: No puedes completar el Paso ${pasoActualNum} porque el Paso ${pasoActualNum - 1} aún no está completado.`);
                error.statusCode = 400;
                throw error;
            }
        }

        const updateCurrentQuery = `
            UPDATE Paso_Actividad
            SET estatus = 'completado', cedula_admin = $1
            WHERE nro_solicitud = $2 AND nro_paso = $3
            RETURNING *;
        `;
        const currentRes = await client.query(updateCurrentQuery, [cedula_admin, nro_solicitud, pasoActualNum]);

        if (currentRes.rows.length === 0) {
            const error = new Error('El paso especificado no existe.');
            error.statusCode = 404;
            throw error;
        }

        // Evaluar si hay paso siguiente
        const nextStepCheck = await client.query(
            `SELECT nro_paso FROM Paso_Actividad WHERE nro_solicitud = $1 AND nro_paso = $2`,
            [nro_solicitud, pasoActualNum + 1]
        );

        let mensajeEstado = '';
        let siguientePaso = null;

        if (nextStepCheck.rows.length > 0) {
            const activateNextQuery = `
                UPDATE Paso_Actividad
                SET estatus = 'en progreso', fecha_hora_inicio = CURRENT_TIMESTAMP
                WHERE nro_solicitud = $1 AND nro_paso = $2
                RETURNING *;
            `;
            const nextRes = await client.query(activateNextQuery, [nro_solicitud, pasoActualNum + 1]);
            siguientePaso = nextRes.rows[0];
            mensajeEstado = `Paso ${pasoActualNum} finalizado. Liberado automáticamente el Paso ${pasoActualNum + 1}.`;
        } else {
            await client.query(
                `UPDATE Solicitud_Servicio
                 SET estatus_general = 'completado', fecha_cierre = CURRENT_TIMESTAMP
                 WHERE nro_solicitud = $1;`,
                [nro_solicitud]
            );
            mensajeEstado = `Paso ${pasoActualNum} finalizado. ¡Trámite completado en su totalidad!`;
        }

        await client.query('COMMIT');

        res.status(200).json({
            success: true,
            message: mensajeEstado,
            data: {
                paso_completado: currentRes.rows[0],
                siguiente_paso_activo: siguientePaso
            }
        });

    } catch (error) {
        await client.query('ROLLBACK');
        next(error);
    } finally {
        client.release();
    }
};

/**
 * @desc    HU-30: Consultar trazabilidad completa y calcular tiempos hábiles
 * @route   GET /api/v1/solicitudes/:nro_solicitud/seguimiento
 * @access  Private
 */
const getRequestTracking = async (req, res, next) => {
    try {
        const { nro_solicitud } = req.params;

        const solRes = await pool.query(`SELECT * FROM Solicitud_Servicio WHERE nro_solicitud = $1`, [nro_solicitud]);
        if (solRes.rows.length === 0) {
            const error = new Error('Solicitud no encontrada.');
            error.statusCode = 404;
            throw error;
        }
        const solicitud = solRes.rows[0];

        const pasosRes = await pool.query(
            `SELECT * FROM Paso_Actividad WHERE nro_solicitud = $1 ORDER BY nro_paso ASC`, 
            [nro_solicitud]
        );

        const acompRes = await pool.query(
            `SELECT * FROM Acompanante WHERE nro_solicitud = $1`, 
            [nro_solicitud]
        );

        const metricasTiempo = calcularTiempoHabil(solicitud.fecha_creacion, solicitud.fecha_cierre);

        res.status(200).json({
            success: true,
            data: {
                solicitud,
                eficiencia_operativa: {
                    estatus_actual: solicitud.estatus_general,
                    tiempo_transcurrido_dias_habiles: metricasTiempo.dias_habiles,
                    horas_totales_registradas: metricasTiempo.horas_totales
                },
                acompanantes_vinculados: acompRes.rows,
                linea_de_tiempo_workflow: pasosRes.rows
            }
        });

    } catch (error) {
        next(error);
    }
};

// Exportación única sin duplicados, manteniendo compatibilidad con tu archivo de rutas
module.exports = {
    createRequest,
    getRequests,
    addCompanion,
    completeStep,
    getRequestTracking
};