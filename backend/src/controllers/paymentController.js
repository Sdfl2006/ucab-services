// src/controllers/paymentController.js
const db = require('../config/db');

// Generar una Factura a partir de una Solicitud (HU-32 y HU-33)
// Generar una Factura a partir de una Solicitud (HU-32 y HU-33)
const generateInvoice = async (req, res, next) => {
  const client = await db.pool.connect(); 
  try {
    const { cedula } = req.user;
    const { nro_solicitud } = req.body;

    await client.query('BEGIN'); 

    // 1. Validar propiedad de la solicitud y obtener el precio del servicio
    const solQuery = `
      SELECT s.precio_base 
      FROM Solicitud_Servicio sol
      JOIN Servicio s ON sol.codigo_servicio = s.codigo_servicio
      WHERE sol.nro_solicitud = $1 AND sol.cedula_miembro = $2;
    `;
    const solResult = await client.query(solQuery, [nro_solicitud, cedula]);
    
    if (solResult.rows.length === 0) {
      throw { statusCode: 404, message: 'Solicitud no encontrada o no autorizada.' };
    }
    const precio = solResult.rows[0].precio_base;

    // SOLUCIÓN: Definimos la fecha exacta en Node.js como string ISO
    // Esto garantiza que BD y servidor manejen exactamente los mismos milisegundos
    const fechaExacta = new Date().toISOString();

    // 2. Abrir Folio de Consumo usando nuestra fecha exacta
    await client.query(
      'INSERT INTO Folio_Consumo (nro_solicitud, fecha_apertura) VALUES ($1, $2)', 
      [nro_solicitud, fechaExacta]
    );

    // 3. Insertar la Línea de Cargo amarrada a la fecha exacta
    await client.query(`
      INSERT INTO Linea_Cargo (nro_solicitud, fecha_apertura_folio, nro_linea, concepto, cantidad, impuestos, precio_unitario)
      VALUES ($1, $2, 1, 'Cargo automático por servicio', 1, 0, $3)
    `, [nro_solicitud, fechaExacta, precio]);

    // 4. Generar Factura Oficial amarrada a la fecha exacta
    const facResult = await client.query(`
      INSERT INTO Factura (nro_solicitud, fecha_apertura_folio, saldo, estatus, cedula_titular)
      VALUES ($1, $2, $3, 'Pendiente', $4)
      RETURNING nro_control, saldo, estatus;
    `, [nro_solicitud, fechaExacta, precio, cedula]);

    await client.query('COMMIT'); 
    
    res.status(201).json({
      success: true,
      message: 'Factura generada exitosamente.',
      data: facResult.rows[0]
    });
  } catch (error) {
    await client.query('ROLLBACK'); 
    next(error);
  } finally {
    client.release(); 
  }
};

// Procesar Pago Digital (Zelle - HU-36)
const processZellePayment = async (req, res, next) => {
  const client = await db.pool.connect();
  try {
    const { nro_control_factura, monto, correo_origen, nombre_titular, codigo_transaccion } = req.body;

    // Regla R-13: El monto debe ser mayor a cero
    if (!monto || monto <= 0) {
      return res.status(400).json({ success: false, message: 'El monto de la transacción debe ser mayor a cero (R-13).' });
    }

    await client.query('BEGIN');

    // SOLUCIÓN: Congelamos el timestamp exacto en Node.js para amarrar la herencia
    const fechaExacta = new Date().toISOString();

    // 1. Insertar en la tabla padre (Pago) forzando nuestra fecha exacta
    await client.query(`
      INSERT INTO Pago (nro_control_factura, fecha_pago, monto) 
      VALUES ($1, $2, $3);
    `, [nro_control_factura, fechaExacta, monto]);

    // 2. Insertar en la jerarquía intermedia (Pago_Digital) con la misma fecha
    await client.query(`
      INSERT INTO Pago_Digital (nro_control_factura, fecha_pago) 
      VALUES ($1, $2);
    `, [nro_control_factura, fechaExacta]);

    // 3. Insertar en la hoja final (Pago_Zelle) con la misma fecha
    await client.query(`
      INSERT INTO Pago_Zelle (nro_control_factura, fecha_pago, correo_origen, nombre_titular, codigo_transaccion) 
      VALUES ($1, $2, $3, $4, $5);
    `, [nro_control_factura, fechaExacta, correo_origen, nombre_titular, codigo_transaccion]);

    // Nota: El Trigger AFTER INSERT en la BD se encargará de restar este monto al saldo de la factura (R-18).

    await client.query('COMMIT');
    
    res.status(201).json({
      success: true,
      message: 'Pago vía Zelle registrado exitosamente. El saldo de la factura ha sido actualizado.'
    });
  } catch (error) {
    await client.query('ROLLBACK');
    next(error);
  } finally {
    client.release();
  }
};

module.exports = { generateInvoice, processZellePayment };