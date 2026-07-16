// src/routes/requestRoutes.js
const express = require('express');
const router = express.Router();
const { createRequest, getMyRequests } = require('../controllers/requestController');
const { authenticateToken } = require('../middlewares/authMiddleware');

// Todas las rutas de solicitudes requieren que el usuario esté autenticado
router.use(authenticateToken);

router.post('/', createRequest);
router.get('/me', getMyRequests);

module.exports = router;