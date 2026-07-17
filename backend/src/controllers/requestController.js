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
            hora_inicio, // <-- AÑADIDO: Recibir la hora del frontend
            hora_fin,    // <-- AÑADIDO: Recibir la hora del frontend
            acompanantes 
        } = req.body;

        await client.query('BEGIN');

        // 1. Validar existencia del servicio
        const servCheck = await client.query(`SELECT codigo_servicio FROM Servicio WHERE codigo_servicio = $1`, [codigo_servicio]);
        if (servCheck.rows.length === 0) {
            const error = new Error('El código de servicio especificado no existe.');
            error.statusCode = 404;
            throw error;
        }

        // 2. Crear la solicitud base (AHORA SÍ GUARDANDO LAS HORAS PARA LA HU-16)
        const insertSolicitud = `
            INSERT INTO Solicitud_Servicio (cedula_miembro, codigo_servicio, nro_identificador_espacio, hora_inicio, hora_fin, estatus_general)
            VALUES ($1, $2, $3, $4, $5, 'en_proceso')
            RETURNING *;
        `;
        const solicitudRes = await client.query(insertSolicitud, [
            cedula_miembro, 
            codigo_servicio, 
            nro_identificador_espacio || null,
            hora_inicio, // <-- AÑADIDO: Pasar parámetro
            hora_fin     // <-- AÑADIDO: Pasar parámetro
        ]);
        const nro_solicitud = solicitudRes.rows[0].nro_solicitud;

        // --- NUEVO: CREAR EL FOLIO Y LA LÍNEA DE CARGO ---
        const servData = await client.query(`SELECT precio_base, descripcion_detallada FROM Servicio WHERE codigo_servicio = $1`, [codigo_servicio]);
        
        const insertFolio = await client.query(
            `INSERT INTO Folio_Consumo (nro_solicitud, fecha_apertura) VALUES ($1, $2) RETURNING fecha_apertura`,
            [nro_solicitud, solicitudRes.rows[0].fecha_creacion]
        );
        
        await client.query(
            `INSERT INTO Linea_Cargo (nro_solicitud, fecha_apertura_folio, nro_linea, concepto, cantidad, precio_unitario)
             VALUES ($1, $2, 1, $3, 1, $4)`,
            [nro_solicitud, insertFolio.rows[0].fecha_apertura, servData.rows[0].descripcion_detallada, servData.rows[0].precio_base]
        );
        // --------------------------------------------------

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

        let query = `
          SELECT
            ss.*, 
            s.descripcion_detallada AS servicio,
            s.nombre_categoria     AS categoria,
            COALESCE(ed.nombre_sede, 'Sin sede asignada') AS sede,
            COALESCE(s.precio_base, 0) AS monto_usd
          FROM Solicitud_Servicio ss
          JOIN Servicio s ON s.codigo_servicio = ss.codigo_servicio
          LEFT JOIN Espacio_fisico ef ON ef.nro_identificador = ss.nro_identificador_espacio
          LEFT JOIN Edificacion ed ON ed.nombre_edificacion = ef.nombre_edificacion
          ORDER BY ss.fecha_creacion DESC
        `;
        let params = [];

        // Si no es admin o personal administrativo, solo ve sus propias solicitudes
        if (!userRoles.includes('Admin') && !userRoles.includes('Personal_Administrativo')) {
            query = `
              SELECT
                ss.*, 
                s.descripcion_detallada AS servicio,
                s.nombre_categoria     AS categoria,
                COALESCE(ed.nombre_sede, 'Sin sede asignada') AS sede,
                COALESCE(s.precio_base, 0) AS monto_usd
              FROM Solicitud_Servicio ss
              JOIN Servicio s ON s.codigo_servicio = ss.codigo_servicio
              LEFT JOIN Espacio_fisico ef ON ef.nro_identificador = ss.nro_identificador_espacio
              LEFT JOIN Edificacion ed ON ed.nombre_edificacion = ef.nombre_edificacion
              WHERE ss.cedula_miembro = $1
              ORDER BY ss.fecha_creacion DESC
            `;
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
            // 1. Cerramos la solicitud
            await client.query(
                `UPDATE Solicitud_Servicio
                 SET estatus_general = 'completado', fecha_cierre = CURRENT_TIMESTAMP
                 WHERE nro_solicitud = $1;`,
                [nro_solicitud]
            );

            // 2. HU-33: Generación Automática de Factura
            const folioQuery = await client.query(
                `SELECT fecha_apertura FROM Folio_Consumo WHERE nro_solicitud = $1 LIMIT 1`, 
                [nro_solicitud]
            );

            if (folioQuery.rows.length > 0) {
                const fecha_apertura = folioQuery.rows[0].fecha_apertura;
                
                const sumaRes = await client.query(
                    `SELECT COALESCE(SUM((cantidad * precio_unitario) + impuestos), 0) AS total_deuda 
                     FROM Linea_Cargo WHERE nro_solicitud = $1 AND fecha_apertura_folio = $2`,
                    [nro_solicitud, fecha_apertura]
                );
                
                const totalDeuda = parseFloat(sumaRes.rows[0].total_deuda);
                
                if (totalDeuda > 0) {
                    // Evita duplicar la factura si ya se generó en el Checkout
                    const facCheck = await client.query(`SELECT 1 FROM Factura WHERE nro_solicitud = $1`, [nro_solicitud]);
                    if (facCheck.rows.length === 0) { 
                        const solRes = await client.query(`SELECT cedula_miembro FROM Solicitud_Servicio WHERE nro_solicitud = $1`, [nro_solicitud]);
                        await client.query(`
                            INSERT INTO Factura (
                                nro_solicitud, fecha_apertura_folio, saldo, estatus, cedula_titular
                            ) VALUES ($1, $2, $3, 'Pendiente', $4);
                        `, [nro_solicitud, fecha_apertura, totalDeuda, solRes.rows[0].cedula_miembro]);
                    }
                }
            }

            mensajeEstado = `Paso ${pasoActualNum} finalizado. ¡Trámite completado y Factura generada automáticamente!`;
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