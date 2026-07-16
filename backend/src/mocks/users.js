// src/mocks/users.js

// Simulación de la base de datos de Miembros de la Comunidad y sus Cuentas institucionales
const mockUsers = [
  {
    cedula: 'V-12345678',
    correo: 'estudiante@ucab.edu.ve',
    password: 'password123', 
    nombres: 'Jimena',
    apellidos: 'Martínez',
    sexo: 'F',
    ciudad: 'Caracas',
    municipio: 'Baruta',
    calle: 'Av. Teherán',
    categoria_fidelidad: 'Regular',
    cuenta: {
      id_cuenta: 1,
      estado_cuenta: 'activa', // R-01: 'activa', 'suspendida', 'bloqueada'
      intentos_fallidos: 0,
      estatus: 'activo'
    },
    roles: ['Estudiante'] 
  },
  {
    cedula: 'V-87654321',
    correo: 'profesor@ucab.edu.ve',
    password: 'password123',
    nombres: 'Carlos',
    apellidos: 'Gómez',
    sexo: 'M',
    ciudad: 'Caracas',
    municipio: 'Libertador',
    calle: 'Montalbán',
    categoria_fidelidad: 'Preferencial',
    cuenta: {
      id_cuenta: 2,
      estado_cuenta: 'activa',
      intentos_fallidos: 0,
      estatus: 'activo'
    },
    roles: ['Profesor']
  },
  {
    cedula: 'V-11223344',
    correo: 'admin@ucab.edu.ve',
    password: 'password123',
    nombres: 'Ana',
    apellidos: 'Rodríguez',
    sexo: 'F',
    ciudad: 'Caracas',
    municipio: 'Chacao',
    calle: 'La Castellana',
    categoria_fidelidad: 'Frecuente',
    cuenta: {
      id_cuenta: 3,
      estado_cuenta: 'activa',
      intentos_fallidos: 0,
      estatus: 'activo'
    },
    roles: ['Personal_Administrativo']
  },
  {
    cedula: 'V-55667788',
    correo: 'egresado@ucab.edu.ve',
    password: 'password123',
    nombres: 'Santiago',
    apellidos: 'De Freitas',
    sexo: 'M',
    ciudad: 'Caracas',
    municipio: 'Baruta',
    calle: 'Prados del Este',
    categoria_fidelidad: 'Preferencial',
    cuenta: {
      id_cuenta: 4,
      estado_cuenta: 'activa',
      intentos_fallidos: 0,
      estatus: 'activo'
    },
    roles: ['Egresado']
  }
];

module.exports = { mockUsers };