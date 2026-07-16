// src/routes/paymentRoutes.js
const express = require('express');
const router = express.Router();
const { generateInvoice, processZellePayment } = require('../controllers/paymentController');
const { authenticateToken } = require('../middlewares/authMiddleware');

router.use(authenticateToken); // Proteger bloque financiero

router.post('/invoice', generateInvoice);
router.post('/pay/zelle', processZellePayment);

module.exports = router;