const { pool } = require('../config/db');

/**
 * @desc    Obtener listado de facturas del usuario (o todas si es Admin)
 * @route   GET /api/v1/pagos/facturas
 * @access  Private
 */
const getInvoices = async (req, res, next) => {
    try {
        const cedula = req.user.cedula;
        const roles = req.user.roles || [];

        let query = `
          SELECT
            f.*,
            s.descripcion_detallada AS servicio,
            s.nombre_categoria AS categoria,
            COALESCE(ed.nombre_sede, 'Sin sede asignada') AS sede,
            COALESCE(fa.total_linea, f.saldo) AS monto_usd,
            COALESCE(fa.total_linea, f.saldo) AS monto_bs,
            COALESCE(m.nombres || ' ' || m.apellidos, 'Estudiante UCAB') AS solicitante,
            m.cedula AS cedula_solicitante,
            m.correo AS correo_solicitante,
            COALESCE(pago.metodo_pago, 'Sin pago registrado') AS metodo_pago,
            pago.referencia
          FROM Factura f
          JOIN Solicitud_Servicio ss ON ss.nro_solicitud = f.nro_solicitud
          JOIN Servicio s ON s.codigo_servicio = ss.codigo_servicio
          LEFT JOIN Miembro_comunidad m ON m.cedula = ss.cedula_miembro
          LEFT JOIN Espacio_fisico ef ON ef.nro_identificador = ss.nro_identificador_espacio
          LEFT JOIN Edificacion ed ON ed.nombre_edificacion = ef.nombre_edificacion
          LEFT JOIN (
            SELECT lc.nro_solicitud, lc.fecha_apertura_folio,
                   SUM((lc.cantidad * lc.precio_unitario) + lc.impuestos) AS total_linea
            FROM Linea_Cargo lc
            GROUP BY lc.nro_solicitud, lc.fecha_apertura_folio
          ) fa ON fa.nro_solicitud = f.nro_solicitud AND fa.fecha_apertura_folio = f.fecha_apertura_folio
          LEFT JOIN LATERAL (
            SELECT
              p.nro_control_factura,
              p.fecha_pago,
              CASE
                WHEN pt.nro_control_factura IS NOT NULL THEN 'Tarjeta'
                WHEN pm.nro_control_factura IS NOT NULL THEN 'Pago Móvil'
                WHEN pe.nro_control_factura IS NOT NULL THEN 'Efectivo'
                WHEN t.nro_control_factura IS NOT NULL THEN 'Billetera TAI'
                WHEN z.nro_control_factura IS NOT NULL THEN 'Zelle'
                WHEN c.nro_control_factura IS NOT NULL THEN 'Criptomoneda'
                ELSE 'Pago'
              END AS metodo_pago,
              COALESCE(pm.nro_referencia, z.codigo_transaccion, c.hash_txid, pt.nro_tarjeta, t.uid_chip, p.fecha_pago::text) AS referencia
            FROM Pago p
            LEFT JOIN Pago_Presencial pp ON pp.nro_control_factura = p.nro_control_factura AND pp.fecha_pago = p.fecha_pago
            LEFT JOIN Pago_Tarjeta pt ON pt.nro_control_factura = p.nro_control_factura AND pt.fecha_pago = p.fecha_pago
            LEFT JOIN Pago_Movil pm ON pm.nro_control_factura = p.nro_control_factura AND pm.fecha_pago = p.fecha_pago
            LEFT JOIN Pago_Efectivo pe ON pe.nro_control_factura = p.nro_control_factura AND pe.fecha_pago = p.fecha_pago
            LEFT JOIN Pago_TAI t ON t.nro_control_factura = p.nro_control_factura AND t.fecha_pago = p.fecha_pago
            LEFT JOIN Pago_Zelle z ON z.nro_control_factura = p.nro_control_factura AND z.fecha_pago = p.fecha_pago
            LEFT JOIN Pago_Criptomoneda c ON c.nro_control_factura = p.nro_control_factura AND c.fecha_pago = p.fecha_pago
            WHERE p.nro_control_factura = f.nro_control
            ORDER BY p.fecha_pago DESC
            LIMIT 1
          ) pago ON TRUE
          ORDER BY f.fecha_emision DESC;
        `;
        let params = [];

        if (!roles.includes('Admin') && !roles.includes('Personal_Administrativo') && !roles.includes('Cajero principal')) {
            query = `
              SELECT
                f.*,
                s.descripcion_detallada AS servicio,
                s.nombre_categoria AS categoria,
                COALESCE(ed.nombre_sede, 'Sin sede asignada') AS sede,
                COALESCE(fa.total_linea, f.saldo) AS monto_usd,
                COALESCE(fa.total_linea, f.saldo) AS monto_bs,
                COALESCE(m.nombres || ' ' || m.apellidos, 'Estudiante UCAB') AS solicitante,
                m.cedula AS cedula_solicitante,
                m.correo AS correo_solicitante,
                COALESCE(pago.metodo_pago, 'Sin pago registrado') AS metodo_pago,
                pago.referencia
              FROM Factura f
              JOIN Solicitud_Servicio ss ON ss.nro_solicitud = f.nro_solicitud
              JOIN Servicio s ON s.codigo_servicio = ss.codigo_servicio
              LEFT JOIN Miembro_comunidad m ON m.cedula = ss.cedula_miembro
              LEFT JOIN Espacio_fisico ef ON ef.nro_identificador = ss.nro_identificador_espacio
              LEFT JOIN Edificacion ed ON ed.nombre_edificacion = ef.nombre_edificacion
              LEFT JOIN (
                SELECT lc.nro_solicitud, lc.fecha_apertura_folio,
                       SUM((lc.cantidad * lc.precio_unitario) + lc.impuestos) AS total_linea
                FROM Linea_Cargo lc
                GROUP BY lc.nro_solicitud, lc.fecha_apertura_folio
              ) fa ON fa.nro_solicitud = f.nro_solicitud AND fa.fecha_apertura_folio = f.fecha_apertura_folio
              LEFT JOIN LATERAL (
                SELECT
                  p.nro_control_factura,
                  p.fecha_pago,
                  CASE
                    WHEN pt.nro_control_factura IS NOT NULL THEN 'Tarjeta'
                    WHEN pm.nro_control_factura IS NOT NULL THEN 'Pago Móvil'
                    WHEN pe.nro_control_factura IS NOT NULL THEN 'Efectivo'
                    WHEN t.nro_control_factura IS NOT NULL THEN 'Billetera TAI'
                    WHEN z.nro_control_factura IS NOT NULL THEN 'Zelle'
                    WHEN c.nro_control_factura IS NOT NULL THEN 'Criptomoneda'
                    ELSE 'Pago'
                  END AS metodo_pago,
                  COALESCE(pm.nro_referencia, z.codigo_transaccion, c.hash_txid, pt.nro_tarjeta, t.uid_chip, p.fecha_pago::text) AS referencia
                FROM Pago p
                LEFT JOIN Pago_Presencial pp ON pp.nro_control_factura = p.nro_control_factura AND pp.fecha_pago = p.fecha_pago
                LEFT JOIN Pago_Tarjeta pt ON pt.nro_control_factura = p.nro_control_factura AND pt.fecha_pago = p.fecha_pago
                LEFT JOIN Pago_Movil pm ON pm.nro_control_factura = p.nro_control_factura AND pm.fecha_pago = p.fecha_pago
                LEFT JOIN Pago_Efectivo pe ON pe.nro_control_factura = p.nro_control_factura AND pe.fecha_pago = p.fecha_pago
                LEFT JOIN Pago_TAI t ON t.nro_control_factura = p.nro_control_factura AND t.fecha_pago = p.fecha_pago
                LEFT JOIN Pago_Zelle z ON z.nro_control_factura = p.nro_control_factura AND z.fecha_pago = p.fecha_pago
                LEFT JOIN Pago_Criptomoneda c ON c.nro_control_factura = p.nro_control_factura AND c.fecha_pago = p.fecha_pago
                WHERE p.nro_control_factura = f.nro_control
                ORDER BY p.fecha_pago DESC
                LIMIT 1
              ) pago ON TRUE
              WHERE f.cedula_titular = $1
              ORDER BY f.fecha_emision DESC;
            `;
            params = [cedula];
        }

        const { rows } = await pool.query(query, params);
        res.status(200).json({ success: true, count: rows.length, data: rows });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    HU-33: Generar Factura individual a partir de un Folio de Consumo
 * @route   POST /api/v1/pagos/facturas
 * @access  Private
 */
const generateInvoice = async (req, res, next) => {
    const client = await pool.connect();
    try {
        const { nro_solicitud, rif_corporativo, razon_social_corporativa } = req.body;
        await client.query('BEGIN');

        // 1. Obtener la solicitud para saber quién es el titular
        const solRes = await client.query(`SELECT cedula_miembro FROM Solicitud_Servicio WHERE nro_solicitud = $1`, [nro_solicitud]);
        if (solRes.rows.length === 0) {
            const error = new Error('La solicitud especificada no existe.');
            error.statusCode = 404;
            throw error;
        }

        // 1.5 NUEVO: Obtenemos el folio real directo de la BD para ignorar la zona horaria del frontend
        const folioRes = await client.query(
            `SELECT fecha_apertura FROM Folio_Consumo WHERE nro_solicitud = $1 ORDER BY fecha_apertura DESC LIMIT 1`, 
            [nro_solicitud]
        );
        
        if (folioRes.rows.length === 0) {
            const error = new Error('No se encontró un folio de consumo para esta solicitud.');
            error.statusCode = 404;
            throw error;
        }
        const fecha_apertura_real = folioRes.rows[0].fecha_apertura;

        // 2. Sumar las líneas de cargo del folio usando la fecha_apertura_real
        const sumaRes = await client.query(
            `SELECT COALESCE(SUM((cantidad * precio_unitario) + impuestos), 0) AS total_deuda 
             FROM Linea_Cargo WHERE nro_solicitud = $1 AND fecha_apertura_folio = $2`,
            [nro_solicitud, fecha_apertura_real]
        );

        const totalDeuda = parseFloat(sumaRes.rows[0].total_deuda);
        if (totalDeuda <= 0) {
            const error = new Error('No se puede generar una factura para un folio sin cargos acumulados.');
            error.statusCode = 400;
            throw error;
        }

        // 3. Insertar Factura
        const insertQuery = `
            INSERT INTO Factura (
                nro_solicitud, fecha_apertura_folio, saldo, estatus, 
                cedula_titular, rif_corporativo, razon_social_corporativa
            ) VALUES ($1, $2, $3, 'Pendiente', $4, $5, $6) RETURNING *;
        `;
        const { rows } = await client.query(insertQuery, [
            nro_solicitud, fecha_apertura_real, totalDeuda, solRes.rows[0].cedula_miembro, 
            rif_corporativo || null, razon_social_corporativa || null
        ]);

        await client.query('COMMIT');
        res.status(201).json({ success: true, message: 'Factura fiscal generada con éxito.', data: rows[0] });
    } catch (error) {
        await client.query('ROLLBACK');
        next(error);
    } finally {
        client.release();
    }
};

const registrarPagoRaiz = async (client, nro_control_factura, monto) => {
    // Generamos el timestamp exacto en Node.js para las llaves compuestas
    const fecha_pago = new Date().toISOString();

    try {
        // Al insertar aquí, el Trigger de Postgres se disparará. Si el monto es mayor al saldo, 
        // el Trigger rebotará la transacción arrojando una excepción y cancelando todo.
        await client.query(
            `INSERT INTO Pago (nro_control_factura, fecha_pago, monto) VALUES ($1, $2, $3);`,
            [nro_control_factura, fecha_pago, monto]
        );
        await client.query(`
            UPDATE Factura 
            SET estatus = CASE WHEN saldo <= 0 THEN 'Pagada' ELSE 'Pago_Parcial' END 
            WHERE nro_control = $1
        `, [nro_control_factura]);

        return { nro_control_factura, fecha_pago };
    } catch (error) {
        // Atrapamos la excepción 'RAISE EXCEPTION' lanzada por el Trigger de DB
        if (error.message.includes('no puede ser mayor al saldo')) {
            error.statusCode = 400;
        }
        throw error;
    }
};

/**
 * @desc    HU-37: Procesar Pago con Criptomonedas (TRC20 / ERC20)
 * @route   POST /api/v1/pagos/criptomoneda
 * @access  Private
 */
const processCryptoPayment = async (req, res, next) => {
    const client = await pool.connect();
    try {
        const { nro_control_factura, monto, hash_txid, red_utilizada, billetera_origen, tasa_conversion } = req.body;
        await client.query('BEGIN');

        const { nro_control_factura: nro, fecha_pago } = await registrarPagoRaiz(client, nro_control_factura, monto);

        // Herencia Digital -> Criptomoneda
        await client.query(`INSERT INTO Pago_Digital (nro_control_factura, fecha_pago) VALUES ($1, $2)`, [nro, fecha_pago]);
        await client.query(
            `INSERT INTO Pago_Criptomoneda (nro_control_factura, fecha_pago, hash_txid, red_utilizada, billetera_origen, tasa_conversion)
             VALUES ($1, $2, $3, $4, $5, $6)`,
            [nro, fecha_pago, hash_txid, red_utilizada, billetera_origen, tasa_conversion]
        );

        await client.query('COMMIT');

        // Consultar factura actualizada (por si actuó el trigger DB R-18)
        const facActualizada = await pool.query(`SELECT saldo, estatus FROM Factura WHERE nro_control = $1`, [nro]);
        res.status(201).json({
            success: true,
            message: 'Pago en criptomonedas confirmado en blockchain y procesado.',
            data: { metodo: 'Criptomoneda', hash_txid, factura_actualizada: facActualizada.rows[0] }
        });
    } catch (error) {
        await client.query('ROLLBACK');
        if (error.code === '23505') error.message = 'El hash TXID de criptomoneda ya fue registrado en otra transacción.';
        next(error);
    } finally {
        client.release();
    }
};

/**
 * @desc    HU-38: Procesar Pago Presencial con Tarjeta (Crédito / Débito)
 * @route   POST /api/v1/pagos/tarjeta
 * @access  Private (Caja / Admin)
 */
const processCardPayment = async (req, res, next) => {
    const client = await pool.connect();
    try {
        const { nro_control_factura, monto, nro_tarjeta, fecha_vencimiento, compania_emisora, tipo_red, tasa_bcv } = req.body;

        if (!['Nacional', 'Internacional'].includes(tipo_red)) {
            const error = new Error("El tipo de red debe ser 'Nacional' o 'Internacional'.");
            error.statusCode = 400;
            throw error;
        }

        await client.query('BEGIN');
        const { nro_control_factura: nro, fecha_pago } = await registrarPagoRaiz(client, nro_control_factura, monto);

        // Herencia Presencial -> Tarjeta
        await client.query(`INSERT INTO Pago_Presencial (nro_control_factura, fecha_pago, tasa_bcv) VALUES ($1, $2, $3)`, [nro, fecha_pago, tasa_bcv || 1.0]);
        await client.query(
            `INSERT INTO Pago_Tarjeta (nro_control_factura, fecha_pago, nro_tarjeta, fecha_vencimiento, compania_emisora, tipo_red)
             VALUES ($1, $2, $3, $4, $5, $6)`,
            [nro, fecha_pago, nro_tarjeta, fecha_vencimiento, compania_emisora, tipo_red]
        );

        await client.query('COMMIT');
        const facActualizada = await pool.query(`SELECT saldo, estatus FROM Factura WHERE nro_control = $1`, [nro]);
        res.status(201).json({
            success: true,
            message: `Pago procesado por red ${tipo_red} con tarjeta ${compania_emisora}.`,
            data: { metodo: 'Tarjeta', factura_actualizada: facActualizada.rows[0] }
        });
    } catch (error) {
        await client.query('ROLLBACK');
        next(error);
    } finally {
        client.release();
    }
};

/**
 * @desc    HU-39: Procesar Pago Presencial por Pago Móvil
 * @route   POST /api/v1/pagos/pago-movil
 * @access  Private (Caja / Admin)
 */
const processMobilePayment = async (req, res, next) => {
    const client = await pool.connect();
    try {
        const { nro_control_factura, monto, nro_telefono, banco_origen, nro_referencia, tasa_bcv } = req.body;
        await client.query('BEGIN');

        const { nro_control_factura: nro, fecha_pago } = await registrarPagoRaiz(client, nro_control_factura, monto);

        await client.query(`INSERT INTO Pago_Presencial (nro_control_factura, fecha_pago, tasa_bcv) VALUES ($1, $2, $3)`, [nro, fecha_pago, tasa_bcv || 1.0]);
        await client.query(
            `INSERT INTO Pago_Movil (nro_control_factura, fecha_pago, nro_telefono, fecha_movimiento, banco_origen, nro_referencia)
             VALUES ($1, $2, $3, CURRENT_TIMESTAMP, $4, $5)`,
            [nro, fecha_pago, nro_telefono, banco_origen, nro_referencia]
        );

        await client.query('COMMIT');
        const facActualizada = await pool.query(`SELECT saldo, estatus FROM Factura WHERE nro_control = $1`, [nro]);
        res.status(201).json({
            success: true,
            message: 'Pago móvil validado y conciliado en caja.',
            data: { metodo: 'Pago Móvil', nro_referencia, factura_actualizada: facActualizada.rows[0] }
        });
    } catch (error) {
        await client.query('ROLLBACK');
        if (error.code === '23505') error.message = 'Este número de referencia de Pago Móvil ya fue procesado.';
        next(error);
    } finally {
        client.release();
    }
};

/**
 * @desc    HU-40: Procesar Pago Presencial en Efectivo (Divisas / Bolívares)
 * @route   POST /api/v1/pagos/efectivo
 * @access  Private (Caja / Admin)
 */
const processCashPayment = async (req, res, next) => {
    const client = await pool.connect();
    try {
        const { nro_control_factura, monto, moneda_curso, monto_recibido, desgloce_denominaciones, tasa_bcv } = req.body;

        if (!['bolívares', 'divisas'].includes(moneda_curso.toLowerCase())) {
            const error = new Error("La moneda de curso debe ser 'bolívares' o 'divisas'.");
            error.statusCode = 400;
            throw error;
        }

        await client.query('BEGIN');
        const { nro_control_factura: nro, fecha_pago } = await registrarPagoRaiz(client, nro_control_factura, monto);

        await client.query(`INSERT INTO Pago_Presencial (nro_control_factura, fecha_pago, tasa_bcv) VALUES ($1, $2, $3)`, [nro, fecha_pago, tasa_bcv || 1.0]);
        await client.query(
            `INSERT INTO Pago_Efectivo (nro_control_factura, fecha_pago, moneda_curso, monto_recibido, desgloce_denominaciones)
             VALUES ($1, $2, $3, $4, $5)`,
            [nro, fecha_pago, moneda_curso.toLowerCase(), monto_recibido, desgloce_denominaciones || null]
        );

        await client.query('COMMIT');
        const facActualizada = await pool.query(`SELECT saldo, estatus FROM Factura WHERE nro_control = $1`, [nro]);
        res.status(201).json({
            success: true,
            message: `Pago en efectivo (${moneda_curso}) ingresado en taquilla.`,
            data: { metodo: 'Efectivo', factura_actualizada: facActualizada.rows[0] }
        });
    } catch (error) {
        await client.query('ROLLBACK');
        next(error);
    } finally {
        client.release();
    }
};

/**
 * @desc    HU-41: Procesar Pago Inteligente con Billetera TAI (Lectura chip NFC)
 * @route   POST /api/v1/pagos/tai
 * @access  Private (Caja / Terminal POS)
 */
// =======================================================================
// PAGOS CON BILLETERA TAI Y RECARGAS
// =======================================================================

const processTAIPayment = async (req, res, next) => {
    const client = await pool.connect();
    try {
        const { nro_control_factura, monto, uid_chip, codigo_terminal_pos } = req.body;
        await client.query('BEGIN');

        // Validar y descontar saldo
        const billeteraRes = await client.query(`
            SELECT saldo_actual, cedula_miembro 
            FROM Billetera_TAI 
            WHERE saldo_actual >= $1 LIMIT 1; 
        `, [monto]); 

        if (billeteraRes.rows.length === 0) {
             const error = new Error('Saldo insuficiente en la Billetera TAI o carnet no válido.');
             error.statusCode = 400;
             throw error;
        }
        
        const cedula = billeteraRes.rows[0].cedula_miembro;

        // Descontar
        await client.query(`UPDATE Billetera_TAI SET saldo_actual = saldo_actual - $1 WHERE cedula_miembro = $2`, [monto, cedula]);
        
        // Registrar Movimiento de Consumo
        await client.query(`
            INSERT INTO Movimiento_TAI (cedula_miembro, tipo_movimiento, monto, estatus, referencia_bancaria)
            VALUES ($1, 'CONSUMO', $2, 'aprobado', $3)
        `, [cedula, monto, `FAC-${nro_control_factura}`]);

        const { nro_control_factura: nro, fecha_pago } = await registrarPagoRaiz(client, nro_control_factura, monto);
        await client.query(`INSERT INTO Pago_Presencial (nro_control_factura, fecha_pago, tasa_bcv) VALUES ($1, $2, 1.0)`, [nro, fecha_pago]);
        await client.query(`
            INSERT INTO Pago_TAI (nro_control_factura, fecha_pago, uid_chip, codigo_terminal_pos)
            VALUES ($1, $2, $3, $4)
        `, [nro, fecha_pago, uid_chip, codigo_terminal_pos]);

        await client.query('COMMIT');
        const facActualizada = await pool.query(`SELECT saldo, estatus FROM Factura WHERE nro_control = $1`, [nro]);
        res.status(201).json({
            success: true,
            message: 'Cobro por carnet NFC debitado exitosamente.',
            data: { metodo: 'Billetera TAI', uid_chip, factura_actualizada: facActualizada.rows[0] }
        });
    } catch (error) {
        await client.query('ROLLBACK');
        next(error);
    } finally {
        client.release();
    }
};

const solicitarRecargaTAI = async (req, res, next) => {
    const client = await pool.connect();
    try {
        const cedula = req.user.cedula;
        const { monto, referencia_bancaria, metodo_fondeo } = req.body; 
        
        const metodosValidos = ['Zelle', 'Pago Móvil', 'Transferencia Nacional'];
        if (!metodosValidos.includes(metodo_fondeo)) {
            const error = new Error('Método de fondeo inválido.');
            error.statusCode = 400;
            throw error;
        }

        await client.query('BEGIN');
        
        await client.query(`
            INSERT INTO Billetera_TAI (cedula_miembro, saldo_actual) 
            VALUES ($1, 0.00) ON CONFLICT DO NOTHING;
        `, [cedula]);

        const query = `
            INSERT INTO Movimiento_TAI (cedula_miembro, tipo_movimiento, monto, referencia_bancaria, metodo_fondeo, estatus)
            VALUES ($1, 'RECARGA', $2, $3, $4, 'en_revision') RETURNING *;
        `;
        const { rows } = await client.query(query, [cedula, monto, referencia_bancaria, metodo_fondeo]);
        
        await client.query('COMMIT');
        res.status(201).json({ success: true, message: 'Recarga en revisión.', data: rows[0] });
    } catch (error) {
        await client.query('ROLLBACK');
        next(error);
    } finally {
        client.release();
    }
};

const getRecargasPendientes = async (req, res, next) => {
    try {
        const query = `
            SELECT m.id_movimiento, m.cedula_miembro, c.nombres || ' ' || c.apellidos AS solicitante, 
                   m.monto, m.referencia_bancaria, m.metodo_fondeo, m.fecha_hora
            FROM Movimiento_TAI m
            JOIN Miembro_comunidad c ON m.cedula_miembro = c.cedula
            WHERE m.tipo_movimiento = 'RECARGA' AND m.estatus = 'en_revision'
            ORDER BY m.fecha_hora ASC;
        `;
        const { rows } = await pool.query(query);
        res.status(200).json({ success: true, data: rows });
    } catch (error) {
        next(error);
    }
};

const aprobarRecargaTAI = async (req, res, next) => {
    const client = await pool.connect();
    try {
        const { id_movimiento } = req.params;
        await client.query('BEGIN');
        
        const updateMov = await client.query(`
            UPDATE Movimiento_TAI SET estatus = 'aprobado' 
            WHERE id_movimiento = $1 AND estatus = 'en_revision' RETURNING monto, cedula_miembro;
        `, [id_movimiento]);

        if (updateMov.rows.length === 0) {
            const error = new Error('Movimiento no encontrado.');
            error.statusCode = 404;
            throw error;
        }

        const { monto, cedula_miembro } = updateMov.rows[0];

        await client.query(`
            UPDATE Billetera_TAI 
            SET saldo_actual = saldo_actual + $1, ultima_actualizacion = CURRENT_TIMESTAMP
            WHERE cedula_miembro = $2;
        `, [monto, cedula_miembro]);

        await client.query('COMMIT');
        res.status(200).json({ success: true, message: 'Recarga aprobada.' });
    } catch (error) {
        await client.query('ROLLBACK');
        next(error);
    } finally {
        client.release();
    }
};

const monthlyMassClose = async (req, res, next) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        const foliosPendientes = await client.query(`
            SELECT fc.nro_solicitud, fc.fecha_apertura, s.cedula_miembro,
                   COALESCE(SUM((lc.cantidad * lc.precio_unitario) + lc.impuestos), 0) AS total_deuda
            FROM Folio_Consumo fc
            JOIN Solicitud_Servicio s ON fc.nro_solicitud = s.nro_solicitud
            JOIN Linea_Cargo lc ON fc.nro_solicitud = lc.nro_solicitud AND fc.fecha_apertura = lc.fecha_apertura_folio
            LEFT JOIN Factura f ON fc.nro_solicitud = f.nro_solicitud AND fc.fecha_apertura = f.fecha_apertura_folio
            WHERE f.nro_control IS NULL
            GROUP BY fc.nro_solicitud, fc.fecha_apertura, s.cedula_miembro
            HAVING COALESCE(SUM((lc.cantidad * lc.precio_unitario) + lc.impuestos), 0) > 0;
        `);

        if (foliosPendientes.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(200).json({ success: true, message: 'No hay folios pendientes de facturación.', facturas_generadas: 0 });
        }

        const facturasEmitidas = [];
        for (const folio of foliosPendientes.rows) {
            const insertFac = await client.query(`
                INSERT INTO Factura (nro_solicitud, fecha_apertura_folio, saldo, estatus, cedula_titular)
                VALUES ($1, $2, $3, 'Pendiente', $4) RETURNING nro_control, saldo;
            `, [folio.nro_solicitud, folio.fecha_apertura, folio.total_deuda, folio.cedula_miembro]);
            facturasEmitidas.push(insertFac.rows[0]);
        }
        await client.query('COMMIT');
        res.status(200).json({ success: true, message: `Cierre ejecutado. ${facturasEmitidas.length} facturas emitidas.`, facturas_generadas: facturasEmitidas.length, detalle: facturasEmitidas });
    } catch (error) {
        await client.query('ROLLBACK');
        next(error);
    } finally {
        client.release();
    }
};

const getSaldoTAI = async (req, res, next) => {
    try {
        const cedula = req.user.cedula;
        const query = 'SELECT saldo_actual FROM Billetera_TAI WHERE cedula_miembro = $1';
        const { rows } = await pool.query(query, [cedula]);
        
        // Si no tiene billetera creada aún, su saldo es 0
        const saldo = rows.length > 0 ? rows[0].saldo_actual : 0.00;
        
        res.status(200).json({ success: true, saldo });
    } catch (error) {
        next(error);
    }
};

const processOnlineTAIPayment = async (req, res, next) => {
    const client = await pool.connect();
    try {
        const cedula = req.user.cedula; // Tomamos la cédula directo de su sesión web
        const { nro_control_factura, monto } = req.body;
        
        await client.query('BEGIN');

        // Validar saldo del propio estudiante
        const billeteraRes = await client.query(`
            SELECT saldo_actual FROM Billetera_TAI WHERE cedula_miembro = $1 AND saldo_actual >= $2 LIMIT 1; 
        `, [cedula, monto]); 

        if (billeteraRes.rows.length === 0) {
             const error = new Error('Saldo virtual insuficiente para cubrir esta factura.');
             error.statusCode = 400;
             throw error;
        }

        // Descontar el saldo
        await client.query(`UPDATE Billetera_TAI SET saldo_actual = saldo_actual - $1 WHERE cedula_miembro = $2`, [monto, cedula]);
        
        // Registrar Movimiento de Consumo
        await client.query(`
            INSERT INTO Movimiento_TAI (cedula_miembro, tipo_movimiento, monto, estatus, referencia_bancaria)
            VALUES ($1, 'CONSUMO', $2, 'aprobado', $3)
        `, [cedula, monto, `PAGO-WEB-FAC-${nro_control_factura}`]);

        // Pagar la factura
        const { nro_control_factura: nro, fecha_pago } = await registrarPagoRaiz(client, nro_control_factura, monto);
        
        // Lo guardamos como pago presencial/TAI pero con etiquetas "WEB" para saber que fue online
        await client.query(`INSERT INTO Pago_Presencial (nro_control_factura, fecha_pago, tasa_bcv) VALUES ($1, $2, 1.0)`, [nro, fecha_pago]);
        await client.query(`
            INSERT INTO Pago_TAI (nro_control_factura, fecha_pago, uid_chip, codigo_terminal_pos)
            VALUES ($1, $2, 'PAGO-ONLINE', 'PORTAL-WEB')
        `, [nro, fecha_pago]);

        await client.query('COMMIT');
        
        const facActualizada = await pool.query(`SELECT saldo, estatus FROM Factura WHERE nro_control = $1`, [nro]);
        res.status(201).json({
            success: true,
            message: 'Pago procesado exitosamente usando tu Billetera TAI.',
            data: { metodo: 'Billetera TAI (Online)', factura_actualizada: facActualizada.rows[0] }
        });
    } catch (error) {
        await client.query('ROLLBACK');
        next(error);
    } finally {
        client.release();
    }
};

module.exports = {
    getInvoices,
    generateInvoice,
    processCryptoPayment,
    processCardPayment,
    processMobilePayment,
    processCashPayment,
    processTAIPayment,
    monthlyMassClose,
    solicitarRecargaTAI,     
    getRecargasPendientes,   
    aprobarRecargaTAI,       
    getSaldoTAI,
    processOnlineTAIPayment   
};