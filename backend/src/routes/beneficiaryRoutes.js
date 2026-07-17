const express = require('express');
const router = express.Router();
const {
    registerBeneficiary,
    getMyBeneficiaries,
    getAllBeneficiaries,
    evaluateAgeTransitions,
    uploadConstanciaEstudios
} = require('../controllers/beneficiaryController');

// Middleware de autenticación existente en tu proyecto
const { authenticateToken, authorizeRoles } = require('../middlewares/authMiddleware');

router.use(authenticateToken); // Todas las rutas requieren JWT válido

router.post('/', registerBeneficiary);
router.get('/', authorizeRoles('Admin', 'Personal_Administrativo'), getAllBeneficiaries);
router.get('/mis-beneficiarios', getMyBeneficiaries);
router.put('/:cedula/constancia', uploadConstanciaEstudios);

// Este endpoint debería ser exclusivo de un rol admin o gatillado por un cron job
router.post('/evaluar-mayoria-edad', authorizeRoles('Admin', 'Personal_Administrativo'), evaluateAgeTransitions);

module.exports = router;