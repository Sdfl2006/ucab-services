// src/app.js
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const errorHandler = require('./middlewares/errorHandler');

// Importar rutas
const authRoutes = require('./routes/authRoutes');
const serviceRoutes = require('./routes/serviceRoutes'); // <- Nueva importación
const requestRoutes = require('./routes/requestRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const userRoutes = require('./routes/userRoutes');

const app = express();

app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

app.get('/api/v1/health', (req, res) => {
  res.status(200).json({ success: true, message: 'API operativa' });
});

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/services', serviceRoutes); 
app.use('/api/v1/requests', requestRoutes);
app.use('/api/v1/payments', paymentRoutes);
app.use('/api/v1/users', userRoutes);

app.use(errorHandler);

module.exports = app;