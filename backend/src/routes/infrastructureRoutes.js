const express = require('express');
const router = express.Router();
const {
    createEdificacion,
    createEspacioFisico,
    toggleMantenimiento,
    checkDisponibilidad,
    getEspacios
} = require('../controllers/infrastructureController');

// Importación exacta de tu middleware de seguridad
const { authenticateToken, authorizeRoles } = require('../middlewares/authMiddleware');

// Todas las rutas de infraestructura exigen un Token JWT válido
router.use(authenticateToken);

// HU-16: Cualquier miembro autenticado puede consultar la disponibilidad de un salón
router.get('/espacios/disponibilidad', checkDisponibilidad);
router.get('/espacios', authorizeRoles('Admin', 'Personal_Administrativo'), getEspacios); // <-- NUEVA

// HU-13, HU-14, HU-15: La creación y bloqueo por mantenimiento son exclusivas de Administración
router.post('/edificaciones', authorizeRoles('Admin', 'Personal_Administrativo'), createEdificacion);
router.post('/espacios', authorizeRoles('Admin', 'Personal_Administrativo'), createEspacioFisico);
router.put('/espacios/:nro_identificador/mantenimiento', authorizeRoles('Admin', 'Personal_Administrativo'), toggleMantenimiento);

module.exports = router;