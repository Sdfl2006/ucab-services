// src/routes/authRoutes.js
const express = require('express');
const router = express.Router();
const { login, logout, getMe, getSessions } = require('../controllers/authController');
const { authenticateToken, authorizeRoles } = require('../middlewares/authMiddleware');

// Rutas Públicas
router.post('/login', login);
router.post('/logout', logout);

// Rutas Protegidas de Usuario Autenticado
router.get('/me', authenticateToken, getMe);

// Ruta Administrativa de Auditoría (Requiere rol Personal_Administrativo)
router.get('/sessions', authenticateToken, authorizeRoles('Personal_Administrativo'), getSessions);

module.exports = router;