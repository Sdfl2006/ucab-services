const { pool } = require('../config/db');

// HU-08: Reporte de seguridad
const getSecurityAuditReport = async (req, res, next) => {
    try {
        const { rows } = await pool.query('SELECT * FROM v_rep_seguridad_cuentas ORDER BY nivel_riesgo');
        res.status(200).json({ success: true, data: rows });
    } catch (error) { next(error); }
};

// HU-17: Ocupación de espacios
const getSpaceOccupancyReport = async (req, res, next) => {
    try {
        const { rows } = await pool.query('SELECT * FROM v_rep_ocupacion_espacios');
        res.status(200).json({ success: true, data: rows });
    } catch (error) { next(error); }
};

// HU-31: Cuellos de botella
const getBottleneckReport = async (req, res, next) => {
    try {
        const { rows } = await pool.query('SELECT * FROM v_rep_cuellos_botella');
        res.status(200).json({ success: true, data: rows });
    } catch (error) { next(error); }
};

// HU-35: Ingresos consolidados
const getConsolidatedRevenueReport = async (req, res, next) => {
    try {
        const { rows } = await pool.query('SELECT * FROM v_rep_ingresos');
        res.status(200).json({ success: true, data: rows });
    } catch (error) { next(error); }
};

// HU-44: Conciliación financiera
const getDailyReconciliationReport = async (req, res, next) => {
    try {
        // Ejecutamos las dos vistas de conciliación para un reporte súper completo
        const resumen = await pool.query('SELECT * FROM v_rep_conciliacion_resumen');
        const detalles = await pool.query('SELECT * FROM v_rep_conciliacion_pagos');
        res.status(200).json({ 
            success: true, 
            data: { resumen_diario: resumen.rows, transacciones_detalladas: detalles.rows } 
        });
    } catch (error) { next(error); }
};

module.exports = {
    getSecurityAuditReport, getSpaceOccupancyReport, getBottleneckReport,
    getConsolidatedRevenueReport, getDailyReconciliationReport
};