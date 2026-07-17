const express = require('express');
const router = express.Router();
const {
    createVacante,
    closeVacante,
    getSmartSuggestions,
    applyToVacante,
    getInsertionReport,
    getVacantes
} = require('../controllers/jobBoardController');

const { authenticateToken, authorizeRoles } = require('../middlewares/authMiddleware');

router.use(authenticateToken);

router.get('/vacantes', getVacantes);

// HU-24 & HU-26: Publicación y métricas
router.post('/vacantes', authorizeRoles('Admin', 'Personal_Administrativo'), createVacante);
router.put('/vacantes/cerrar', authorizeRoles('Admin', 'Personal_Administrativo'), closeVacante);
router.get('/reporte-insercion', authorizeRoles('Admin', 'Personal_Administrativo'), getInsertionReport);

// HU-25: Inteligencia laboral para Egresados
router.get('/sugerencias', getSmartSuggestions);
router.post('/postular', applyToVacante);

module.exports = router;