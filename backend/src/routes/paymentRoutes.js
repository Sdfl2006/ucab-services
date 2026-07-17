const express = require('express');
const router = express.Router();
const {
    getInvoices,
    generateInvoice,
    processCryptoPayment,
    processCardPayment,
    processMobilePayment,
    processCashPayment,
    processTAIPayment,
    monthlyMassClose
} = require('../controllers/paymentController');

const { authenticateToken, authorizeRoles } = require('../middlewares/authMiddleware');
const paymentController = require('../controllers/paymentController');

router.use(authenticateToken); // Seguridad global con JWT

// Rutas generales y de facturación
router.get('/facturas', getInvoices);
router.post('/facturas', generateInvoice);

// Rutas de liquidación multicanal (HU-37 a HU-41)
router.post('/criptomoneda', processCryptoPayment);
router.post('/tarjeta', authorizeRoles('Admin', 'Personal_Administrativo'), processCardPayment);
router.post('/pago-movil', processMobilePayment);
router.post('/efectivo', authorizeRoles('Admin', 'Personal_Administrativo'), processCashPayment);
router.post('/tai', authorizeRoles('Admin', 'Personal_Administrativo'), processTAIPayment);
router.post('/tai/recarga', paymentController.solicitarRecargaTAI);
router.get('/tai/recargas-pendientes', authorizeRoles('Admin', 'Personal_Administrativo'), paymentController.getRecargasPendientes);
router.put('/tai/recarga/:id_movimiento/aprobar', authorizeRoles('Admin', 'Personal_Administrativo'), paymentController.aprobarRecargaTAI);
router.post('/tai/online', paymentController.processOnlineTAIPayment);
router.get('/tai/saldo', paymentController.getSaldoTAI);
// HU-34: Cierre masivo mensual (exclusivo de Admin / Finanzas)
router.post('/cierre-masivo', authorizeRoles('Admin', 'Personal_Administrativo'), monthlyMassClose);

module.exports = router;