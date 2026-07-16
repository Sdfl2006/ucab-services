// src/controllers/authController.js
const jwt = require('jsonwebtoken');
const db = require('../config/db'); 
const { JWT_SECRET } = require('../middlewares/authMiddleware');

const login = async (req, res, next) => {
  try {
    const { correo, password, uuid_dispositivo, geolocalizacion } = req.body;
    const ip = req.ip || req.headers['x-forwarded-for'] || '127.0.0.1';

    if (!correo || !password) {
      return res.status(400).json({ success: false, message: 'El correo y la contraseña son campos obligatorios.' });
    }

    if (!uuid_dispositivo) {
      return res.status(400).json({ success: false, message: 'Por políticas de seguridad (R-02), es obligatorio registrar el uuid_dispositivo.' });
    }

    // CORRECCIÓN: Buscamos usando 'cedula' y extraemos la columna 'contrasena'
    const userQuery = `
      SELECT 
        m.cedula, m.correo, m.nombres, m.apellidos, m.categoria_fidelidad,
        c.estado_cuenta, c.intentos_fallidos, c.contrasena
      FROM Miembro_comunidad m
      JOIN Cuenta c ON m.cedula = c.cedula
      WHERE m.correo = $1 LIMIT 1;
    `;
    
    const userResult = await db.query(userQuery, [correo]);

    if (userResult.rows.length === 0) {
      return res.status(401).json({ success: false, message: 'Credenciales de acceso incorrectas.' });
    }

    const user = userResult.rows[0];

    if (user.estado_cuenta === 'bloqueada') {
      return res.status(403).json({ success: false, message: 'Su cuenta está bloqueada temporalmente. Contacte a soporte.' });
    }

    if (user.estado_cuenta === 'suspendida') {
      return res.status(403).json({ success: false, message: 'Esta cuenta se encuentra suspendida por ausencia de vinculaciones vigentes (R-19).' });
    }

    if (user.contrasena !== password) {
      const nuevosIntentos = user.intentos_fallidos + 1;
      
      if (nuevosIntentos >= 3) {
        // CORRECCIÓN: Actualizamos usando 'cedula'
        await db.query("UPDATE Cuenta SET intentos_fallidos = $1, estado_cuenta = 'bloqueada' WHERE cedula = $2", [nuevosIntentos, user.cedula]);
        return res.status(403).json({ success: false, message: 'Cuenta bloqueada automáticamente debido a 3 intentos fallidos.' });
      } else {
        await db.query("UPDATE Cuenta SET intentos_fallidos = $1 WHERE cedula = $2", [nuevosIntentos, user.cedula]);
        return res.status(401).json({ success: false, message: `Contraseña incorrecta. Intentos restantes: ${3 - nuevosIntentos}` });
      }
    }

    const rolesQuery = `
      SELECT 'Estudiante' AS rol FROM Estudiante v WHERE v.cedula = $1 AND (SELECT fecha_fin FROM Periodo WHERE cedula = v.cedula AND fecha_inicio = (SELECT MAX(fecha_inicio) FROM Periodo WHERE cedula = v.cedula)) IS NULL
      UNION
      SELECT 'Profesor' AS rol FROM Profesor v WHERE v.cedula = $1 AND (SELECT fecha_fin FROM Periodo WHERE cedula = v.cedula AND fecha_inicio = (SELECT MAX(fecha_inicio) FROM Periodo WHERE cedula = v.cedula)) IS NULL
      UNION
      SELECT 'Personal_Administrativo' AS rol FROM Personal_Administrativo v WHERE v.cedula = $1 AND (SELECT fecha_fin FROM Periodo WHERE cedula = v.cedula AND fecha_inicio = (SELECT MAX(fecha_inicio) FROM Periodo WHERE cedula = v.cedula)) IS NULL
      UNION
      SELECT 'Egresado' AS rol FROM Egresado v WHERE v.cedula = $1;
    `;
    const rolesResult = await db.query(rolesQuery, [user.cedula]);
    const roles = rolesResult.rows.map(r => r.rol);

    if (roles.length === 0) {
      await db.query("UPDATE Cuenta SET estado_cuenta = 'suspendida' WHERE cedula = $1", [user.cedula]);
      return res.status(403).json({ success: false, message: 'Acceso denegado. Sin roles institucionales activos.' });
    }

    await db.query("UPDATE Cuenta SET intentos_fallidos = 0 WHERE cedula = $1", [user.cedula]);

    // CORRECCIÓN: Insertamos en Sesion usando 'cedula'
    const insertSesion = `
      INSERT INTO Sesion (cedula, fecha_hora_acceso, direccion_ip, uuid_dispositivo, geolocalizacion)
      VALUES ($1, CURRENT_TIMESTAMP, $2, $3, $4);
    `;
    await db.query(insertSesion, [user.cedula, ip, uuid_dispositivo, geolocalizacion || 'Caracas, Venezuela']);

    const tokenPayload = {
      cedula: user.cedula,
      correo: user.correo,
      nombres: user.nombres,
      apellidos: user.apellidos,
      roles: roles,
      categoria_fidelidad: user.categoria_fidelidad
    };

    const token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: '8h' });

    res.status(200).json({
      success: true,
      message: 'Inicio de sesión exitoso',
      token,
      user: tokenPayload
    });

  } catch (error) {
    next(error);
  }
};

const logout = (req, res) => {
  res.status(200).json({ success: true, message: 'Sesión cerrada correctamente.' });
};

const getMe = (req, res) => {
  res.status(200).json({ success: true, user: req.user });
};

const getSessions = async (req, res, next) => {
  try {
    const queryStr = `
      SELECT cedula, fecha_hora_acceso, direccion_ip, uuid_dispositivo, geolocalizacion 
      FROM Sesion ORDER BY fecha_hora_acceso DESC LIMIT 100;
    `;
    const result = await db.query(queryStr);
    res.status(200).json({ success: true, sessions: result.rows });
  } catch (error) {
    next(error);
  }
};

module.exports = { login, logout, getMe, getSessions };