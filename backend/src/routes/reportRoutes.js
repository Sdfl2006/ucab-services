const express = require('express');
const router = express.Router();
const {
    getSecurityAuditReport,
    getSpaceOccupancyReport,
    getBottleneckReport,
    getConsolidatedRevenueReport,
    getDailyReconciliationReport
} = require('../controllers/reportController');

const { authenticateToken, authorizeRoles } = require('../middlewares/authMiddleware');

router.use(authenticateToken);
router.use(authorizeRoles('Admin', 'Personal_Administrativo')); // Trancado para gerencia

router.get('/seguridad', getSecurityAuditReport);
router.get('/ocupacion-espacios', getSpaceOccupancyReport);
router.get('/tiempos-respuesta', getBottleneckReport);
router.get('/ingresos-consolidados', getConsolidatedRevenueReport);
router.get('/conciliacion-diaria', getDailyReconciliationReport);

module.exports = router;
