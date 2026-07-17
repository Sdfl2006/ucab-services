// src/controllers/serviceController.js
const db = require('../config/db');
const { pool } = require('../config/db');


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

/**
 * @desc    HU-18: Registrar una Entidad Prestadora (Interna o Externa)
 * @route   POST /api/v1/servicios/entidades
 * @access  Private (Admin, Personal_Administrativo)
 */
const createEntidadPrestadora = async (req, res, next) => {
    const client = await pool.connect();
    try {
        const {
            nombre_entidad,
            tipo_entidad, // 'interna' o 'externa'
            codigo_presupuestario,
            director_oficina,
            rif,
            razon_social,
            fecha_vencimiento_contrato,
            contactos_legales
        } = req.body;

        if (!['interna', 'externa'].includes(tipo_entidad.toLowerCase())) {
            const error = new Error("El tipo de entidad debe ser 'interna' o 'externa'.");
            error.statusCode = 400;
            throw error;
        }

        await client.query('BEGIN');

        // 1. Insertar en la tabla padre: Entidad_prestadora
        await client.query(
            `INSERT INTO Entidad_prestadora (nombre_entidad) VALUES ($1)`,
            [nombre_entidad]
        );

        // 2. Insertar en la especialización correspondiente (Regla R-21 / R-22)
        let detalleRes;
        if (tipo_entidad.toLowerCase() === 'interna') {
            const queryInterna = `
                INSERT INTO Interna (nombre_entidad, codigo_presupuestario, director_oficina)
                VALUES ($1, $2, $3) RETURNING *;
            `;
            detalleRes = await client.query(queryInterna, [nombre_entidad, codigo_presupuestario, director_oficina]);
        } else {
            const queryExterna = `
                INSERT INTO Externa (nombre_entidad, rif, razon_social, fecha_vencimiento_contrato, contactos_legales)
                VALUES ($1, $2, $3, $4, $5) RETURNING *;
            `;
            detalleRes = await client.query(queryExterna, [
                nombre_entidad, rif, razon_social, fecha_vencimiento_contrato, contactos_legales
            ]);
        }

        await client.query('COMMIT');

        res.status(201).json({
            success: true,
            message: `Entidad prestadora ${tipo_entidad} registrada exitosamente.`,
            data: {
                nombre_entidad,
                tipo_entidad,
                detalle: detalleRes.rows[0]
            }
        });
    } catch (error) {
        await client.query('ROLLBACK');
        if (error.code === '23505') {
            error.message = 'El nombre de la entidad o el RIF ya se encuentra registrado.';
            error.statusCode = 400;
        }
        next(error);
    } finally {
        client.release();
    }
};

/**
 * @desc    HU-21: Crear un Servicio con su esquema de tarifas y sedes asociadas
 * @route   POST /api/v1/servicios
 * @access  Private (Admin, Personal_Administrativo)
 */
const createService = async (req, res, next) => {
    const client = await pool.connect();
    try {
        const {
            codigo_servicio,
            nombre_entidad,
            nombre_categoria,
            descripcion_detallada,
            precio_base,
            sedes, // Array de strings: ['Montalbán', 'Guayana']
            tarifas // Array de objetos: [{ perfil: 'miembro activo', monto: 10 }, ...]
        } = req.body;

        await client.query('BEGIN');

        // 1. Validar límite máximo de la categoría (Regla R-07 / R-17)
        const catRes = await client.query(
            `SELECT limite_costo_max FROM Categoria_servicio WHERE nombre_categoria = $1`,
            [nombre_categoria]
        );
        if (catRes.rows.length === 0) {
            const error = new Error('La categoría especificada no existe.');
            error.statusCode = 404;
            throw error;
        }
        const limiteMax = parseFloat(catRes.rows[0].limite_costo_max);

        if (precio_base > limiteMax) {
            const error = new Error(`El precio base (${precio_base}) supera el límite máximo permitido por la categoría (${limiteMax}).`);
            error.statusCode = 400;
            throw error;
        }

        // 2. Insertar Servicio
        const insertServicio = `
            INSERT INTO Servicio (codigo_servicio, nombre_entidad, nombre_categoria, descripcion_detallada, precio_base)
            VALUES ($1, $2, $3, $4, $5) RETURNING *;
        `;
        const servicioRes = await client.query(insertServicio, [
            codigo_servicio, nombre_entidad, nombre_categoria, descripcion_detallada, precio_base
        ]);

        // 3. Vincular con las Sedes
        if (sedes && sedes.length > 0) {
            for (const sede of sedes) {
                await client.query(
                    `INSERT INTO Servicio_Sede (codigo_servicio, nombre_sede) VALUES ($1, $2)`,
                    [codigo_servicio, sede]
                );
            }
        }

        // 4. Insertar Tarifas diferenciadas (HU-21)
        const tarifasGuardadas = [];
        if (tarifas && tarifas.length > 0) {
            let idCounter = 1;
            for (const t of tarifas) {
                if (t.monto > limiteMax) {
                    const error = new Error(`La tarifa para ${t.perfil} supera el límite de costo máximo (${limiteMax}).`);
                    error.statusCode = 400;
                    throw error;
                }
                const tRes = await client.query(
                    `INSERT INTO Tarifa (codigo_servicio, id, fecha_inicio_vigencia, perfil_solicitante, monto)
                     VALUES ($1, $2, CURRENT_DATE, $3, $4) RETURNING *`,
                    [codigo_servicio, idCounter++, t.perfil, t.monto]
                );
                tarifasGuardadas.push(tRes.rows[0]);
            }
        }

        await client.query('COMMIT');

        res.status(201).json({
            success: true,
            message: 'Servicio y esquema de tarifas creados con éxito.',
            data: {
                ...servicioRes.rows[0],
                sedes,
                tarifas: tarifasGuardadas
            }
        });
    } catch (error) {
        await client.query('ROLLBACK');
        if (error.code === '23503') {
            error.message = 'La entidad prestadora o la categoría no existen en la base de datos.';
            error.statusCode = 404;
        }
        next(error);
    } finally {
        client.release();
    }
};

/**
 * @desc    HU-21: Agregar cargos suplementarios o consumibles a un servicio
 * @route   POST /api/v1/servicios/:codigo_servicio/cargos
 * @access  Private (Admin, Personal_Administrativo)
 */
const addCargoAdicional = async (req, res, next) => {
    try {
        const { codigo_servicio } = req.params;
        const { concepto, costo } = req.body;

        const query = `
            INSERT INTO Cargos_adicionales (codigo_servicio, concepto, costo)
            VALUES ($1, $2, $3) RETURNING *;
        `;
        const { rows } = await pool.query(query, [codigo_servicio, concepto, costo]);

        res.status(201).json({
            success: true,
            message: 'Cargo adicional integrado al catálogo del servicio.',
            data: rows[0]
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    HU-23 & Foco Técnico: Calcular precio dinámico según token y sede
 * @route   POST /api/v1/servicios/:codigo_servicio/calcular-precio
 * @access  Private (Cualquier usuario autenticado)
 */
const calcularPrecioDinamico = async (req, res, next) => {
    try {
        const { codigo_servicio } = req.params;
        const { nombre_sede, conceptos_adicionales } = req.body; // array de strings: ['Uso de Laboratorio', ...]
        const userRoles = req.user.roles || [];

        // 1. Determinar el perfil del solicitante según los roles del JWT (Regla R-08)
        let perfilSolicitante = 'público externo';
        const rolesActivos = ['Estudiante', 'Profesor', 'Personal_Administrativo', 'Becario', 'Preparador'];
        
        if (userRoles.some(r => rolesActivos.includes(r))) {
            perfilSolicitante = 'miembro activo';
        } else if (userRoles.includes('Egresado')) {
            perfilSolicitante = 'egresado';
        }

        // 2. Obtener servicio y factor de ajuste geográfico de la Sede
        const querySede = `
            SELECT s.precio_base, sd.ajuste_ubicacion, c.limite_costo_max
            FROM Servicio s
            JOIN Servicio_Sede ss ON s.codigo_servicio = ss.codigo_servicio
            JOIN Sede sd ON ss.nombre_sede = sd.nombre_sede
            JOIN Categoria_servicio c ON s.nombre_categoria = c.nombre_categoria
            WHERE s.codigo_servicio = $1 AND sd.nombre_sede = $2;
        `;
        const servicioRes = await pool.query(querySede, [codigo_servicio, nombre_sede]);

        if (servicioRes.rows.length === 0) {
            const error = new Error(`El servicio ${codigo_servicio} no está disponible en la sede ${nombre_sede}.`);
            error.statusCode = 404;
            throw error;
        }

        const { precio_base, ajuste_ubicacion, limite_costo_max } = servicioRes.rows[0];

        // 3. Buscar tarifa específica vigente para su perfil, si no existe usamos precio_base
        const queryTarifa = `
            SELECT monto FROM Tarifa 
            WHERE codigo_servicio = $1 AND perfil_solicitante = $2 
            ORDER BY fecha_inicio_vigencia DESC LIMIT 1;
        `;
        const tarifaRes = await pool.query(queryTarifa, [codigo_servicio, perfilSolicitante]);
        
        let costoBase = tarifaRes.rows.length > 0 ? parseFloat(tarifaRes.rows[0].monto) : parseFloat(precio_base);

        // 4. Aplicar ajuste de ubicación (Ej: Guayana vs Montalbán)
        let subtotalServicio = costoBase * parseFloat(ajuste_ubicacion);

        // Garantizar que el subtotal ajustado no supere el tope de la categoría (Regla R-07)
        if (subtotalServicio > parseFloat(limite_costo_max)) {
            subtotalServicio = parseFloat(limite_costo_max);
        }

        // 5. Sumar suplementos y cargos adicionales seleccionados
        let totalCargosExtras = 0;
        const desgloseCargos = [];
        
        if (conceptos_adicionales && conceptos_adicionales.length > 0) {
            const queryExtras = `
                SELECT concepto, costo FROM Cargos_adicionales 
                WHERE codigo_servicio = $1 AND concepto = ANY($2::text[]);
            `;
            const extrasRes = await pool.query(queryExtras, [codigo_servicio, conceptos_adicionales]);
            
            for (const extra of extrasRes.rows) {
                totalCargosExtras += parseFloat(extra.costo);
                desgloseCargos.push({ concepto: extra.concepto, costo: parseFloat(extra.costo) });
            }
        }

        const costoTotalFinal = subtotalServicio + totalCargosExtras;

        res.status(200).json({
            success: true,
            data: {
                codigo_servicio,
                sede_aplicada: nombre_sede,
                perfil_detectado: perfilSolicitante,
                desglose_financiero: {
                    tarifa_base_aplicada: costoBase,
                    factor_ajuste_sede: parseFloat(ajuste_ubicacion),
                    subtotal_servicio: Number(subtotalServicio.toFixed(2)),
                    cargos_suplementarios: desgloseCargos,
                    total_extras: Number(totalCargosExtras.toFixed(2)),
                    monto_final_a_pagar: Number(costoTotalFinal.toFixed(2))
                }
            }
        });

    } catch (error) {
        next(error);
    }
};

module.exports = {
    getAllServices, getServiceById,
    createEntidadPrestadora,
    createService,
    addCargoAdicional,
    calcularPrecioDinamico
};
