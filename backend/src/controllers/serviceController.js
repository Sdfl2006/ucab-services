// src/controllers/serviceController.js
const db = require('../config/db');

// Obtener el catálogo general de servicios
const getAllServices = async (req, res, next) => {
  try {
    // Aplicamos la regla de negocio: El precio final se calcula multiplicando 
    // el precio base por el ajuste de ubicación de la sede correspondiente.
    const query = `
      SELECT 
        s.codigo_servicio, 
        s.descripcion_detallada, 
        s.precio_base,
        ep.nombre_entidad AS entidad_prestadora,
        c.nombre_categoria,
        sd.nombre_sede,
        (s.precio_base * sd.ajuste_ubicacion) AS precio_final_sede
      FROM Servicio s
      JOIN Entidad_prestadora ep ON s.nombre_entidad = ep.nombre_entidad
      JOIN Categoria_servicio c ON s.nombre_categoria = c.nombre_categoria
      JOIN Servicio_Sede ss ON s.codigo_servicio = ss.codigo_servicio
      JOIN Sede sd ON ss.nombre_sede = sd.nombre_sede;
    `;
    
    const result = await db.query(query);

    res.status(200).json({
      success: true,
      count: result.rowCount,
      data: result.rows
    });
  } catch (error) {
    next(error);
  }
};

// Obtener detalles de un servicio específico por su código
const getServiceById = async (req, res, next) => {
  try {
    const { codigo } = req.params;
    
    const query = `
      SELECT * FROM Servicio WHERE codigo_servicio = $1;
    `;
    const result = await db.query(query, [codigo]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Servicio no encontrado en el catálogo de UCAB-Services.'
      });
    }

    res.status(200).json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { getAllServices, getServiceById };