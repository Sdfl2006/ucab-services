const express = require('express');
const router = express.Router();
const {
    registerBeneficiary,
    getMyBeneficiaries,
    evaluateAgeTransitions,
    uploadConstanciaEstudios
} = require('../controllers/beneficiaryController');

// Middleware de autenticación existente en tu proyecto
const { authenticateToken } = require('../middlewares/authMiddleware');

router.use(authenticateToken); // Todas las rutas requieren JWT válido

router.post('/', registerBeneficiary);
router.get('/mis-beneficiarios', getMyBeneficiaries);
router.put('/:cedula/constancia', uploadConstanciaEstudios);

// Este endpoint debería ser exclusivo de un rol admin o gatillado por un cron job
router.post('/evaluar-mayoria-edad', evaluateAgeTransitions);

module.exports = router;