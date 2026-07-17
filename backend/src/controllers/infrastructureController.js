const { pool } = require('../config/db');

/**
 * @desc    HU-13: Registrar una nueva Edificación vinculada a una Sede
 * @route   POST /api/v1/infraestructura/edificaciones
 * @access  Private (Admin)
 */
const createEdificacion = async (req, res, next) => {
    try {
        const { nombre_edificacion, nombre_sede } = req.body;

        // Validar que la sede sea válida según R-06 ('Montalbán' o 'Guayana')
        if (!['Montalbán', 'Guayana'].includes(nombre_sede)) {
            const error = new Error("La sede debe ser estrictamente 'Montalbán' o 'Guayana'.");
            error.statusCode = 400;
            throw error;
        }

        const query = `
            INSERT INTO Edificacion (nombre_edificacion, nombre_sede)
            VALUES ($1, $2)
            RETURNING *;
        `;
        const { rows } = await pool.query(query, [nombre_edificacion, nombre_sede]);

        res.status(201).json({
            success: true,
            message: 'Edificación registrada exitosamente.',
            data: rows[0]
        });
    } catch (error) {
        if (error.code === '23505') {
            error.message = 'Esta edificación ya se encuentra registrada.';
            error.statusCode = 400;
        } else if (error.code === '23503') {
            error.message = 'La sede especificada no existe en la base de datos.';
            error.statusCode = 404;
        }
        next(error);
    }
};

/**
 * @desc    HU-14: Crear un Espacio Físico (auditorios, salones, laboratorios)
 * @route   POST /api/v1/infraestructura/espacios
 * @access  Private (Admin)
 */
const createEspacioFisico = async (req, res, next) => {
    try {
        const {
            nro_identificador,
            nombre_edificacion,
            capacidad_max,
            tipo_mobiliario,
            recursos_tecnologicos
        } = req.body;

        const query = `
            INSERT INTO Espacio_fisico (
                nro_identificador, nombre_edificacion, capacidad_max, 
                tipo_mobiliario, recursos_tecnologicos, estado_mantenimiento, estatus_disponibilidad
            ) VALUES ($1, $2, $3, $4, $5, 'operativo', 'disponible')
            RETURNING *;
        `;
        
        const { rows } = await pool.query(query, [
            nro_identificador, nombre_edificacion, capacidad_max, 
            tipo_mobiliario, recursos_tecnologicos
        ]);

        res.status(201).json({
            success: true,
            message: 'Espacio físico creado e incorporado al inventario.',
            data: rows[0]
        });
    } catch (error) {
        if (error.code === '23505') {
            error.message = 'El número identificador de este espacio ya existe.';
            error.statusCode = 400;
        }
        next(error);
    }
};

/**
 * @desc    HU-15: Cambiar estado a "en mantenimiento" y bloquear reservaciones
 * @route   PUT /api/v1/infraestructura/espacios/:nro_identificador/mantenimiento
 * @access  Private (Admin)
 */
const toggleMantenimiento = async (req, res, next) => {
    try {
        const { nro_identificador } = req.params;
        const { en_mantenimiento, motivo } = req.body; // boolean

        const estado_mantenimiento = en_mantenimiento ? `en mantenimiento: ${motivo || 'Programado'}` : 'operativo';
        const estatus_disponibilidad = en_mantenimiento ? 'no disponible' : 'disponible';

        const query = `
            UPDATE Espacio_fisico 
            SET estado_mantenimiento = $1, estatus_disponibilidad = $2
            WHERE nro_identificador = $3
            RETURNING *;
        `;
        const { rows } = await pool.query(query, [estado_mantenimiento, estatus_disponibilidad, nro_identificador]);

        if (rows.length === 0) {
            const error = new Error('Espacio físico no encontrado.');
            error.statusCode = 404;
            throw error;
        }

        res.status(200).json({
            success: true,
            message: `El espacio ${nro_identificador} ahora está ${en_mantenimiento ? 'bloqueado por mantenimiento' : 'operativo y disponible'}.`,
            data: rows[0]
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    HU-16 & Foco Técnico: Consultar disponibilidad real y bloqueo por solapamiento
 * @route   GET /api/v1/infraestructura/espacios/disponibilidad
 * @access  Private
 */
const checkDisponibilidad = async (req, res, next) => {
    try {
        const { nro_identificador, fecha_inicio, fecha_fin } = req.query;

        if (!nro_identificador || !fecha_inicio || !fecha_fin) {
            const error = new Error('Debes proporcionar nro_identificador, fecha_inicio y fecha_fin en formato ISO.');
            error.statusCode = 400;
            throw error;
        }

        // 1. Verificar si el espacio existe y si no está bloqueado por mantenimiento
        const espacioQuery = `SELECT * FROM Espacio_fisico WHERE nro_identificador = $1`;
        const espacioRes = await pool.query(espacioQuery, [nro_identificador]);

        if (espacioRes.rows.length === 0) {
            const error = new Error('El espacio físico consultado no existe.');
            error.statusCode = 404;
            throw error;
        }

        const espacio = espacioRes.rows[0];
        if (espacio.estatus_disponibilidad === 'no disponible') {
            return res.status(200).json({
                disponible: false,
                razon: 'Espacio bloqueado temporalmente por mantenimiento o inhabilitación.',
                detalle_mantenimiento: espacio.estado_mantenimiento
            });
        }

        // 2. Verificar solapamiento de horarios (Interval Overlap: InicioA < FinB Y FinA > InicioB)
        // Buscamos solicitudes en ese espacio que no estén canceladas ni rechazadas
        const solapamientoQuery = `
            SELECT nro_solicitud, fecha_creacion, fecha_cierre, estatus_general
            FROM Solicitud_Servicio
            WHERE nro_identificador_espacio = $1
              AND estatus_general NOT IN ('cancelado', 'rechazado')
              AND (fecha_creacion < $3 AND COALESCE(fecha_cierre, fecha_creacion + INTERVAL '2 hours') > $2);
        `;
        
        const solapamientoRes = await pool.query(solapamientoQuery, [
            nro_identificador, fecha_inicio, fecha_fin
        ]);

        if (solapamientoRes.rows.length > 0) {
            return res.status(200).json({
                disponible: false,
                razon: 'Bloqueo de horario: Ya existe una solicitud reservada en esa franja de tiempo.',
                solapamiento_con: solapamientoRes.rows[0]
            });
        }

        // 3. Si pasa ambas validaciones, el salón está realmente disponible
        res.status(200).json({
            disponible: true,
            message: 'El espacio está libre y operativo para la franja horaria solicitada.',
            espacio: {
                nro_identificador: espacio.nro_identificador,
                capacidad_max: espacio.capacidad_max,
                recursos: espacio.recursos_tecnologicos
            }
        });

    } catch (error) {
        next(error);
    }
};

module.exports = {
    createEdificacion,
    createEspacioFisico,
    toggleMantenimiento,
    checkDisponibilidad
};