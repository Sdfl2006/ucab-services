/**
 * @desc    HU-26: Reporte de efectividad e inserción laboral de los egresados
 */
const getInsertionReport = async (req, res, next) => {
    try {
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