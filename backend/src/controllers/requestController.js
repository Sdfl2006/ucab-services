// src/controllers/requestController.js
const db = require('../config/db');

const createRequest = async (req, res, next) => {
  try {
    // La cédula viene del token JWT que interceptó el authMiddleware
    const { cedula } = req.user; 
    const { codigo_servicio, nro_identificador_espacio } = req.body;

    if (!codigo_servicio) {
      return res.status(400).json({ success: false, message: 'El código de servicio es obligatorio.' });
    }

    // Insertamos la solicitud. Usamos RETURNING para obtener el ID serial generado automáticamente
    const insertQuery = `
      INSERT INTO Solicitud_Servicio (cedula_miembro, codigo_servicio, nro_identificador_espacio, estatus_general)
      VALUES ($1, $2, $3, 'en_proceso')
      RETURNING nro_solicitud, fecha_creacion;
    `;
    
    const result = await db.query(insertQuery, [cedula, codigo_servicio, nro_identificador_espacio || null]);
    const nuevaSolicitud = result.rows[0];

    // Automáticamente generamos el primer Paso de Actividad (Revisión)
    const pasoQuery = `
      INSERT INTO Paso_Actividad (nro_solicitud, nro_paso, descripcion, estatus)
      VALUES ($1, 1, 'Recepción y validación de solicitud', 'pendiente');
    `;
    await db.query(pasoQuery, [nuevaSolicitud.nro_solicitud]);

    res.status(201).json({
      success: true,
      message: 'Solicitud creada exitosamente.',
      data: nuevaSolicitud
    });

  } catch (error) {
    next(error);
  }
};

const getMyRequests = async (req, res, next) => {
  try {
    const { cedula } = req.user;
    
    const query = `
      SELECT sol.nro_solicitud, sol.fecha_creacion, sol.estatus_general, s.descripcion_detallada
      FROM Solicitud_Servicio sol
      JOIN Servicio s ON sol.codigo_servicio = s.codigo_servicio
      WHERE sol.cedula_miembro = $1
      ORDER BY sol.fecha_creacion DESC;
    `;
    
    const result = await db.query(query, [cedula]);

    res.status(200).json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { createRequest, getMyRequests };