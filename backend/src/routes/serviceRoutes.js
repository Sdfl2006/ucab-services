// src/routes/serviceRoutes.js
const express = require('express');
const router = express.Router();
const { getAllServices, getServiceById, createEntidadPrestadora, createService, addCargoAdicional, calcularPrecioDinamico } = require('../controllers/serviceController');
const { authenticateToken, authorizeRoles } = require('../middlewares/authMiddleware');

router.use(authenticateToken); // Blindaje global con JWT

// Rutas Públicas (El frontend las puede consumir sin token)
router.get('/', getAllServices);
router.get('/:codigo', getServiceById);

router.post('/entidades', authorizeRoles('Admin', 'Personal_Administrativo'), createEntidadPrestadora);
router.post('/', authorizeRoles('Admin', 'Personal_Administrativo'), createService);
router.post('/:codigo_servicio/cargos', authorizeRoles('Admin', 'Personal_Administrativo'), addCargoAdicional);

// HU-23: Cálculo de precios dinámicos accesible para cualquier usuario que cotice
router.post('/:codigo_servicio/calcular-precio', calcularPrecioDinamico);

// Si más adelante necesitamos que un estudiante logueado vea servicios exclusivos:
// router.get('/exclusivos', authenticateToken, getExclusiveServices);

module.exports = router;