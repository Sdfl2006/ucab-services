const cron = require('node-cron');
const pool = require('../config/db');

const initCronJobs = () => {
    // TAREA 1: Barrido Diario (Todos los días a las 00:01) - HU-07
    const client = await pool.connect();
    cron.schedule('1 0 * * *', async () => {
        console.log('[CRON] Ejecutando barrido de cuentas sin vinculación activa...');
        try {
            await pool.query(`
                UPDATE Cuenta c
                SET estado_cuenta = 'suspendida'
                WHERE c.estado_cuenta != 'suspendida'
                AND NOT EXISTS (
                    SELECT 1 FROM Periodo p 
                    WHERE p.cedula = c.cedula 
                    AND (p.fecha_fin IS NULL OR p.fecha_fin >= CURRENT_DATE)
                )
            `);
        } catch (error) {
            console.error('[CRON] Error suspendiendo cuentas:', error);
        }
    });

    // TAREA 2: Purga Anual (Cada 1 de enero a las 01:00) - HU-12
    cron.schedule('0 1 1 1 *', async () => {
        console.log('[CRON] Iniciando purga anual de expedientes caducados...');
        const client = await pool.connect();
        try {
            await client.query('BEGIN');
            
            // Elimina acompañantes si la solicitud cerró hace más de 1 año
            await client.query(`
                DELETE FROM Acompanante
                WHERE nro_solicitud IN (
                    SELECT nro_solicitud FROM Solicitud_Servicio
                    WHERE fecha_cierre < CURRENT_DATE - INTERVAL '1 year'
                )
            `);
            
            // Limpia beneficiarios cuya cobertura venció hace más de 1 año y están inactivos
            await client.query(`
                DELETE FROM Beneficiario
                WHERE fecha_fin_cobertura < CURRENT_DATE - INTERVAL '1 year'
                AND beneficios_activos = FALSE
            `);
            
            await client.query('COMMIT');
        } catch (error) {
            await client.query('ROLLBACK');
            console.error('[CRON] Error en purga anual:', error);
        } finally {
            client.release();
        }
    });

    // TAREA 3: Facturación Masiva por Lotes (Último día del mes a las 23:50) - HU-34
    cron.schedule('50 23 28-31 * *', async () => {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        if (tomorrow.getDate() !== 1) return; // Validación extra: Si mañana no es día 1, aborta.

        console.log('[CRON] Iniciando facturación masiva de folios...');
        const client = await pool.connect();
        try {
            await client.query('BEGIN');
            
            // Seleccionamos Folios que no tengan una Factura amarrada a su (nro_solicitud, fecha_apertura)
            await client.query(`
                INSERT INTO Factura (nro_solicitud, fecha_apertura_folio, saldo, estatus, cedula_titular)
                SELECT 
                    fc.nro_solicitud, 
                    fc.fecha_apertura,
                    COALESCE((
                        SELECT SUM(lc.cantidad * lc.precio_unitario) 
                        FROM Linea_Cargo lc 
                        WHERE lc.nro_solicitud = fc.nro_solicitud 
                        AND lc.fecha_apertura_folio = fc.fecha_apertura
                    ), 0) AS saldo,
                    'Pendiente',
                    s.cedula_miembro
                FROM Folio_Consumo fc
                JOIN Solicitud_Servicio s ON fc.nro_solicitud = s.nro_solicitud
                WHERE NOT EXISTS (
                    SELECT 1 FROM Factura f 
                    WHERE f.nro_solicitud = fc.nro_solicitud 
                    AND f.fecha_apertura_folio = fc.fecha_apertura
                )
            `);
            
            await client.query('COMMIT');
            console.log('[CRON] Facturación masiva completada.');
        } catch (error) {
            await client.query('ROLLBACK');
            console.error('[CRON] Fallo crítico en facturación:', error);
        } finally {
            client.release();
        }
    });
};

module.exports = initCronJobs;