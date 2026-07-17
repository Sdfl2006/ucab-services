const { pool } = require('../config/db');

/** 
 * @desc HU-24: Publicar una nueva vacante laboral (Exclusivo para Aliados Externos) 
 * @route POST /api/v1/bolsa-trabajo/vacantes 
 * @access Private (Admin, Personal_Administrativo) 
 */ 

const getVacantes = async (req, res, next) => {
  try {
    const { rows } = await pool.query(`SELECT * FROM Vacante ORDER BY fecha_oferta DESC`);
    res.status(200).json({ success: true, data: rows });
  } catch (error) {
    next(error);
  }
};

const createVacante = async (req, res, next) => { 
  try { 
    const { nombre_entidad, cargo, fecha_oferta, responsabilidades, beneficios, perfil_buscado } = req.body; 

    // Validar que la entidad sea de tipo Externa (Regla R-25) 
    const extCheck = await pool.query(`SELECT nombre_entidad FROM Externa WHERE nombre_entidad = $1`, [nombre_entidad]); 
    if (extCheck.rows.length === 0) { 
      const error = new Error('Solo las entidades prestadoras externas (aliados comerciales) pueden publicar vacantes.'); 
      error.statusCode = 403; 
      throw error; 
    } 

    const query = ` 
      INSERT INTO Vacante (nombre_entidad, cargo, fecha_oferta, responsabilidades, beneficios, perfil_buscado, estatus_vacante) 
      VALUES ($1, $2, COALESCE($3, CURRENT_DATE), $4, $5, $6, 'disponible') 
      RETURNING *; 
    `; 
    const { rows } = await pool.query(query, [ 
      nombre_entidad, 
      cargo, 
      fecha_oferta, 
      responsabilidades, 
      beneficios, 
      perfil_buscado 
    ]); 

    res.status(201).json({ success: true, message: 'Vacante laboral publicada exitosamente en la plataforma.', data: rows[0] }); 
  } catch (error) { 
    if (error.code === '23505') { 
      error.message = 'Ya existe una vacante con ese mismo cargo y fecha de oferta para esta entidad.'; 
      error.statusCode = 400; 
    } 
    next(error); 
  } 
}; 

/** 
 * @desc HU-24: Cerrar una oferta laboral activa 
 * @route PUT /api/v1/bolsa-trabajo/vacantes/cerrar 
 * @access Private (Admin, Personal_Administrativo) 
 */ 
const closeVacante = async (req, res, next) => { 
  try { 
    const { nombre_entidad, cargo, fecha_oferta } = req.body; 
    const query = ` 
      UPDATE Vacante SET estatus_vacante = 'finalizada' 
      WHERE nombre_entidad = $1 AND cargo = $2 AND fecha_oferta = $3 
      RETURNING *; 
    `; 
    const { rows } = await pool.query(query, [nombre_entidad, cargo, fecha_oferta]); 

    if (rows.length === 0) { 
      const error = new Error('Vacante no encontrada.'); 
      error.statusCode = 404; 
      throw error; 
    } 

    res.status(200).json({ success: true, message: 'La vacante laboral ha sido cerrada oficialmente.', data: rows[0] }); 
  } catch (error) { 
    next(error); 
  } 
}; 

/** 
 * @desc HU-25 & Foco Técnico: Emparejamiento inteligente de vacantes para el Egresado 
 * @route GET /api/v1/bolsa-trabajo/sugerencias 
 * @access Private (Egresados) 
 */ 
const getSmartSuggestions = async (req, res, next) => { 
  try { 
    const cedula = req.user.cedula; 

    // 1. Obtener perfil académico del egresado 
    const egresadoRes = await pool.query( 
      `SELECT e.*, m.nombres, m.apellidos FROM Egresado e JOIN Miembro_comunidad m ON e.cedula = m.cedula WHERE e.cedula = $1`, 
      [cedula] 
    ); 
    if (egresadoRes.rows.length === 0) { 
      const error = new Error('Acceso denegado. Este módulo es exclusivo para Egresados de la UCAB.'); 
      error.statusCode = 403; 
      throw error; 
    } 
    const egresado = egresadoRes.rows[0]; 

    // 2. Algoritmo SQL inteligente 
    const querySuggestions = ` 
      SELECT v.*, ex.razon_social, 
      CASE 
        WHEN v.perfil_buscado ILIKE '%' || $1 || '%' OR v.cargo ILIKE '%' || $1 || '%' THEN 'Alta Coincidencia' 
        WHEN $2 >= 16.00 THEN 'Perfil de Excelencia Recomendado' 
        ELSE 'Oportunidad General' 
      END AS nivel_relevancia 
      FROM Vacante v 
      JOIN Externa ex ON v.nombre_entidad = ex.nombre_entidad 
      WHERE v.estatus_vacante = 'disponible' 
      ORDER BY 
        CASE 
          WHEN v.perfil_buscado ILIKE '%' || $1 || '%' OR v.cargo ILIKE '%' || $1 || '%' THEN 1 
          WHEN $2 >= 16.00 THEN 2 
          ELSE 3 
        END, v.fecha_oferta DESC; 
    `; 
    const { rows } = await pool.query(querySuggestions, [egresado.titulo_obtenido, egresado.indice_final]); 

    res.status(200).json({ 
      success: true, 
      perfil_evaluado: { 
        egresado: `${egresado.nombres} ${egresado.apellidos}`, 
        titulo: egresado.titulo_obtenido, 
        indice: parseFloat(egresado.indice_final) 
      }, 
      total_sugerencias: rows.length, 
      data: rows 
    }); 
  } catch (error) { 
    next(error); 
  } 
}; 

/** 
 * @desc Postularse a una vacante y registrar selección 
 * @route POST /api/v1/bolsa-trabajo/postular 
 * @access Private (Egresados) 
 */ 
const applyToVacante = async (req, res, next) => { 
  try { 
    const cedula = req.user.cedula; 
    const { nombre_entidad, cargo, fecha_oferta } = req.body; 

    const query = ` 
      INSERT INTO Postulacion (cedula, nombre_entidad, cargo, fecha_oferta, estatus_seleccion) 
      VALUES ($1, $2, $3, $4, 'en revisión') 
      RETURNING *; 
    `; 
    const { rows } = await pool.query(query, [cedula, nombre_entidad, cargo, fecha_oferta]); 

    res.status(201).json({ success: true, message: 'Postulación registrada exitosamente. Tu perfil está en revisión por el aliado externo.', data: rows[0] }); 
  } catch (error) { 
    if (error.code === '23505') { 
      error.message = 'Ya te has postulado anteriormente a esta oferta laboral.'; 
      error.statusCode = 400; 
    } else if (error.code === '23503') { 
      error.message = 'Debes estar registrado como Egresado y la vacante debe existir.'; 
      error.statusCode = 404; 
    } 
    next(error); 
  } 
}; 

/** 
 * @desc HU-26: Reporte de efectividad e inserción laboral de los egresados 
 * @route GET /api/v1/bolsa-trabajo/reporte-insercion 
 * @access Private (Admin, Autoridades) 
 */ 
const getInsertionReport = async (req, res, next) => { 
  try { 
    // Usamos directamente la vista relacional que definiste en tu BD
    const { rows } = await pool.query('SELECT * FROM v_rep_insercion_laboral'); 
    res.status(200).json({ 
      success: true, 
      message: 'Reporte estratégico de inserción laboral generado.', 
      data: rows 
    }); 
  } catch (error) { 
    next(error); 
  } 
}; 

module.exports = { 
  createVacante, 
  closeVacante, 
  getSmartSuggestions, 
  applyToVacante, 
  getInsertionReport,
  getVacantes
};
