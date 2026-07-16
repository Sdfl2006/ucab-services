// src/routes/userRoutes.js
const express = require('express');
const router = express.Router();
const { registerUser, activateUser } = require('../controllers/userController');
const { authenticateToken, authorizeRoles } = require('../middlewares/authMiddleware');

// Ruta Pública de Registro (Cuarentena)
router.post('/register', registerUser);

// Ruta Privada de Aprobación (Solo Personal Administrativo)
router.put('/:cedula/activate', authenticateToken, authorizeRoles('Personal_Administrativo'), activateUser);

module.exports = router;