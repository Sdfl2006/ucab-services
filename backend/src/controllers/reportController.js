const { pool } = require('../config/db');

/**
 * @desc    HU-08: Reporte de auditoría de seguridad y accesos
 * @route   GET /api/v1/reportes/seguridad
 * @access  Private (Admin)
 */
const getSecurityAuditReport = async (req, res, next) => {
    try {
        const query = `
            SELECT 
                c.estado_cuenta,
                COUNT(c.cedula) AS total_usuarios,
                SUM(c.intentos_fallidos) AS intentos_fallidos_acumulados,
                MAX(s.fecha_hora_acceso) AS ultimo_acceso_global,
                COUNT(s.uuid_dispositivo) AS total_sesiones_registradas
            FROM Cuenta c
            LEFT JOIN Sesion s ON c.cedula = s.cedula
            GROUP BY c.estado_cuenta
            ORDER BY total_usuarios DESC;
        `;
        const { rows } = await pool.query(query);
        res.status(200).json({ success: true, data: rows });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    HU-17: Rentabilidad y tasa de ocupación de espacios (Interno vs Externo)
 * @route   GET /api/v1/reportes/ocupacion-espacios
 * @access  Private (Admin)
 */
const getSpaceOccupancyReport = async (req, res, next) => {
    try {
        const query = `
            SELECT 
                ed.nombre_sede,
                ef.nro_identificador AS espacio,
                COUNT(sol.nro_solicitud) AS total_reservaciones,
                COUNT(CASE WHEN t.perfil_solicitante = 'público externo' THEN 1 END) AS uso_comercial_externo,
                COUNT(CASE WHEN t.perfil_solicitante != 'público externo' THEN 1 END) AS uso_academico_interno,
                COALESCE(SUM(f.saldo), 0) AS ingresos_generados
            FROM Espacio_fisico ef
            JOIN Edificacion ed ON ef.nombre_edificacion = ed.nombre_edificacion
            LEFT JOIN Solicitud_Servicio sol ON ef.nro_identificador = sol.nro_identificador_espacio
            LEFT JOIN Tarifa t ON sol.codigo_servicio = t.codigo_servicio
            LEFT JOIN Factura f ON sol.nro_solicitud = f.nro_solicitud
            GROUP BY ed.nombre_sede, ef.nro_identificador
            HAVING COUNT(sol.nro_solicitud) > 0
            ORDER BY ingresos_generados DESC;
        `;
        const { rows } = await pool.query(query);
        res.status(200).json({ success: true, data: rows });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    HU-31: Cuellos de botella y tiempo promedio por paso de actividad
 * @route   GET /api/v1/reportes/tiempos-respuesta
 * @access  Private (Admin)
 */
const getBottleneckReport = async (req, res, next) => {
    try {
        const query = `
            SELECT 
                pa.nro_paso,
                pa.descripcion AS paso_dependencia,
                COUNT(pa.nro_solicitud) AS tramites_procesados,
                ROUND(AVG(EXTRACT(EPOCH FROM (pa.fecha_hora_fin - pa.fecha_hora_inicio)) / 3600)::numeric, 2) AS tiempo_promedio_horas,
                MIN(pa.cedula_admin) AS ultimo_responsable_registrado
            FROM Paso_Actividad pa
            WHERE pa.estatus = 'completado' AND pa.fecha_hora_fin IS NOT NULL
            GROUP BY pa.nro_paso, pa.descripcion
            ORDER BY tiempo_promedio_horas DESC;
        `;
        const { rows } = await pool.query(query);
        res.status(200).json({ success: true, data: rows });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    HU-35: Ingresos consolidados por Sede y Categoría
 * @route   GET /api/v1/reportes/ingresos-consolidados
 * @access  Private (Admin, Finanzas)
 */
const getConsolidatedRevenueReport = async (req, res, next) => {
    try {
        const query = `
            SELECT 
                COALESCE(ed.nombre_sede, ss.nombre_sede, 'Montalbán') AS sede_generadora,
                c.nombre_categoria,
                srv.codigo_servicio,
                COUNT(f.nro_control) AS facturas_emitidas,
                COALESCE(SUM(f.saldo), 0) AS monto_total_consolidado
            FROM Factura f
            JOIN Folio_Consumo fc ON f.nro_solicitud = fc.nro_solicitud AND f.fecha_apertura_folio = fc.fecha_apertura
            JOIN Solicitud_Servicio sol ON fc.nro_solicitud = sol.nro_solicitud
            JOIN Servicio srv ON sol.codigo_servicio = srv.codigo_servicio
            JOIN Categoria_servicio c ON srv.nombre_categoria = c.nombre_categoria
            LEFT JOIN Espacio_fisico ef ON sol.nro_identificador_espacio = ef.nro_identificador
            LEFT JOIN Edificacion ed ON ef.nombre_edificacion = ed.nombre_edificacion
            LEFT JOIN Servicio_Sede ss ON srv.codigo_servicio = ss.codigo_servicio
            GROUP BY COALESCE(ed.nombre_sede, ss.nombre_sede, 'Montalbán'), c.nombre_categoria, srv.codigo_servicio
            ORDER BY monto_total_consolidado DESC;
        `;
        const { rows } = await pool.query(query);
        res.status(200).json({ success: true, data: rows });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    HU-44: Conciliación financiera diaria (Cruza cobros en taquilla vs facturas pagadas)
 * @route   GET /api/v1/reportes/conciliacion-diaria
 * @access  Private (Admin, Finanzas)
 */
const getDailyReconciliationReport = async (req, res, next) => {
    try {
        const query = `
            SELECT 
                CURRENT_DATE AS fecha_corte,
                COUNT(p.nro_control_factura) AS transacciones_recibidas,
                SUM(p.monto) AS total_recaudado,
                COUNT(CASE WHEN pd.nro_control_factura IS NOT NULL THEN 1 END) AS pagos_digitales_blockchain,
                COUNT(CASE WHEN pp.nro_control_factura IS NOT NULL THEN 1 END) AS pagos_taquilla_presencial
            FROM Pago p
            LEFT JOIN Pago_Digital pd ON p.nro_control_factura = pd.nro_control_factura AND p.fecha_pago = pd.fecha_pago
            LEFT JOIN Pago_Presencial pp ON p.nro_control_factura = pp.nro_control_factura AND p.fecha_pago = pp.fecha_pago
            WHERE p.fecha_pago >= CURRENT_DATE;
        `;
        const { rows } = await pool.query(query);
        res.status(200).json({ success: true, data: rows[0] });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getSecurityAuditReport,
    getSpaceOccupancyReport,
    getBottleneckReport,
    getConsolidatedRevenueReport,
    getDailyReconciliationReport
};