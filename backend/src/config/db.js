// src/config/db.js
const { Pool } = require('pg');
require('dotenv').config();

// Configuración del pool de conexiones utilizando las variables de entorno
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_DATABASE,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
  // Configuraciones óptimas para desarrollo local
  max: 10, // Máximo número de conexiones simultáneas en el pool
  idleTimeoutMillis: 30000, // Tiempo de espera antes de cerrar una conexión inactiva
  connectionTimeoutMillis: 2000, // Tiempo límite para establecer una conexión
});

// Eventos del pool para auditoría y debugging en la terminal
pool.on('connect', () => {
  console.log('📌 Nueva conexión establecida con la base de datos PostgreSQL');
});

pool.on('error', (err) => {
  console.error('❌ Error inesperado en el pool de conexiones de PostgreSQL:', err.message);
});

// Exportamos una función helper para ejecutar consultas de forma centralizada
module.exports = {
  query: (text, params) => pool.query(text, params),
  pool // Exportamos el pool completo por si requerimos transacciones complejas luego
};