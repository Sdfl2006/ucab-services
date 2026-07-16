// src/server.js
require('dotenv').config();
const app = require('./app');
const { query } = require('./config/db'); // Importamos el helper de la base de datos

const PORT = process.env.PORT || 3000;

// Función asíncrona para verificar servicios antes de levantar el servidor
async function startServer() {
  try {
    console.log('🔄 Verificando conexión con PostgreSQL...');
    
    // Ejecutamos una consulta simple para comprobar que la base de datos responde
    const res = await query('SELECT NOW()');
    
    console.log(`✅ Conexión a la base de datos exitosa. Hora del servidor DB: ${res.rows[0].now}`);

    // Si la base de datos responde, levantamos el servidor Express
    app.listen(PORT, () => {
      console.log(`🚀 Servidor backend de UCAB-Services corriendo en http://localhost:${PORT}`);
      console.log(`Entorno: ${process.env.NODE_ENV || 'development'}`);
    });

  } catch (error) {
    console.error('💥 Error crítico: No se pudo conectar a la base de datos PostgreSQL.');
    console.error(`Detalle del error: ${error.message}`);
    process.exit(1); // Detiene el proceso de Node si la base de datos no está disponible
  }
}

startServer();