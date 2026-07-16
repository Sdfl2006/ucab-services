// src/controllers/userController.js
const db = require('../config/db');

// HU-01: Registrar un nuevo miembro en el sistema
const registerUser = async (req, res, next) => {
  const client = await db.pool.connect();
  try {
    const {
      cedula, correo, nombres, apellidos, telefono, sexo,
      ciudad, municipio, calle, password, rol,
      // Datos específicos según el rol (Ejemplo base: Estudiante)
      facultad, escuela, semestre_actual
    } = req.body;

    await client.query('BEGIN'); // Inicia la transacción atómica

    // 1. Insertar datos personales en Miembro_comunidad
    const insertMiembro = `
      INSERT INTO Miembro_comunidad (cedula, correo, nombres, apellidos, telefono, sexo, ciudad, municipio, calle)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    `;
    await client.query(insertMiembro, [cedula, correo, nombres, apellidos, telefono, sexo, ciudad, municipio, calle]);

    // 2. Crear su Cuenta de acceso y credenciales (Estado en cuarentena por defecto)
    const insertCuenta = `
      INSERT INTO Cuenta (cedula, contrasena, estado_cuenta)
      VALUES ($1, $2, 'suspendida')
    `;
    await client.query(insertCuenta, [cedula, password]);

    // 3. HU-05: Registrar Periodo de Vinculación Activo
    const fechaInicio = new Date().toISOString().split('T')[0]; // Formato YYYY-MM-DD
    const insertPeriodo = `
      INSERT INTO Periodo (cedula, fecha_inicio, fecha_fin)
      VALUES ($1, $2, NULL)
    `;
    await client.query(insertPeriodo, [cedula, fechaInicio]);

    // 4. HU-06: Asignar los atributos específicos del Rol Activo
    if (rol === 'Estudiante') {
      const insertEstudiante = `
        INSERT INTO Estudiante (cedula, promedio, facultad, semestre_actual, escuela, uc_aprobadas, estatus_beca)
        VALUES ($1, 0, $2, $3, $4, 0, 'Ninguna')
      `;
      await client.query(insertEstudiante, [cedula, facultad, semestre_actual, escuela]);
    } else if (rol === 'Profesor') {
      const insertProfesor = `
        INSERT INTO Profesor (cedula, escalafon_docente, carga_semanal, cod_investigador)
        VALUES ($1, 'Instructor', 10, NULL)
      `;
      await client.query(insertProfesor, [cedula]);
    }
    // La estructura soporta añadir fácilmente los IFs para Personal_Administrativo y Egresado.

    await client.query('COMMIT'); // Se confirma la transacción si todo salió bien

    res.status(201).json({
      success: true,
      message: 'Miembro de la comunidad registrado exitosamente. Ya puede iniciar sesión.'
    });

  } catch (error) {
    await client.query('ROLLBACK'); // Si algo falla, se deshace toda la inserción
    
    // Capturador amigable para violaciones de campos UNIQUE (como el correo o cédula repetida)
    if (error.code === '23505') {
      return res.status(409).json({ success: false, message: 'La cédula o el correo ya se encuentran registrados en el sistema.' });
    }
    
    next(error);
  } finally {
    client.release();
  }
};

// HU-02: Activar cuenta de usuario (Solo para Administradores)
const activateUser = async (req, res, next) => {
  try {
    const { cedula } = req.params;
    
    // Cambiamos el estado de 'suspendida' a 'activa'
    const result = await db.query(
      "UPDATE Cuenta SET estado_cuenta = 'activa' WHERE cedula = $1 RETURNING cedula, estado_cuenta",
      [cedula]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'No se encontró ninguna cuenta asociada a esa cédula.' 
      });
    }

    res.status(200).json({
      success: true,
      message: 'Cuenta activada exitosamente. El usuario ya puede iniciar sesión en la plataforma.',
      data: result.rows[0]
    });

  } catch (error) {
    next(error);
  }
};

module.exports = { registerUser, activateUser };