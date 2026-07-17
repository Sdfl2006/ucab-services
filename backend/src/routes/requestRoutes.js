const express = require('express');
const router = express.Router();
const {
    createRequest,
    getRequests, // <-- Mantenemos tu listado general
    addCompanion,
    completeStep,
    getRequestTracking
} = require('../controllers/requestController');

const { authenticateToken, authorizeRoles } = require('../middlewares/authMiddleware');

router.use(authenticateToken);

// Rutas generales
router.post('/', createRequest);
router.get('/', getRequests); // <-- Ruta de tu Sprint 1 intacta
router.post('/:nro_solicitud/acompanantes', addCompanion);
router.get('/:nro_solicitud/seguimiento', getRequestTracking);

// Rutas administrativas de workflow
router.put('/:nro_solicitud/pasos/:nro_paso/completar', authorizeRoles('Admin', 'Personal_Administrativo'), completeStep);

module.exports = router;