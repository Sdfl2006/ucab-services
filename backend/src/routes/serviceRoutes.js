// src/routes/serviceRoutes.js
const express = require('express');
const router = express.Router();
const { getAllServices, getServiceById } = require('../controllers/serviceController');
const { authenticateToken } = require('../middlewares/authMiddleware');

// Rutas Públicas (El frontend las puede consumir sin token)
router.get('/', getAllServices);
router.get('/:codigo', getServiceById);

// Si más adelante necesitamos que un estudiante logueado vea servicios exclusivos:
// router.get('/exclusivos', authenticateToken, getExclusiveServices);

module.exports = router;