// Tasa referencial simulada BCV (Bs. por USD) para cálculos duales HU-08
export const TASA_BCV = 55.40;

// Catálogo de Facultades y Carreras UCAB
export const FACULTADES_UCAB = [
  { id: 'ing', nombre: 'Facultad de Ingeniería', carreras: ['Ingeniería Informática', 'Ingeniería Civil', 'Ingeniería Industrial', 'Ingeniería Telecomunicaciones'] },
  { id: 'faces', nombre: 'Facultad de Ciencias Económicas y Sociales', carreras: ['Administración de Empresas', 'Contaduría Pública', 'Economía', 'Relaciones Industriales'] },
  { id: 'der', nombre: 'Facultad de Derecho', carreras: ['Derecho'] },
  { id: 'hum', nombre: 'Facultad de Humanidades y Educación', carreras: ['Comunicación Social', 'Psicología', 'Educación', 'Letras', 'Filosofía'] },
];

// Directorio Médico UCAB (Sedes Montalbán y Guayana)
export const MOCK_DIRECTORIO_MEDICO = [
  { id: 'med-01', nombre: 'Dra. María Alejandra Rojas', especialidad: 'Medicina General / Familiar', sede: 'Montalbán', consultorio: 'Edif. Cincuentenario, Piso 1, Cons. 102', horario: 'Lun a Vie - 8:00 AM a 1:00 PM', costoUsd: 15, disponible: true },
  { id: 'med-02', nombre: 'Dr. Carlos Mendoza', especialidad: 'Psicología Clínica y Orientación', sede: 'Montalbán', consultorio: 'Centro de Asesoría y Desarrollo Humano (CADH)', horario: 'Mar y Jue - 1:00 PM a 5:00 PM', costoUsd: 20, disponible: true },
  { id: 'med-03', nombre: 'Dra. Patricia Fernández', especialidad: 'Odontología General', sede: 'Montalbán', consultorio: 'Unidad Clínica Odontológica, Módulo 4', horario: 'Lun, Mie y Vie - 8:00 AM a 3:00 PM', costoUsd: 25, disponible: true },
  { id: 'med-04', nombre: 'Dr. Fernando Silva', especialidad: 'Medicina General y Emergencias', sede: 'Guayana', consultorio: 'Unidad Médica Campus Guayana, Planta Baja', horario: 'Lun a Vie - 7:30 AM a 2:30 PM', costoUsd: 15, disponible: true },
  { id: 'med-05', nombre: 'Dra. Gabriela Escalona', especialidad: 'Fisioterapia y Rehabilitación', sede: 'Montalbán', consultorio: 'Gimnasio Techado, Área de Rehabilitación', horario: 'Lun a Jue - 9:00 AM a 4:00 PM', costoUsd: 18, disponible: true },
  { id: 'med-06', nombre: 'Dr. Roberto Gómez', especialidad: 'Psicología Clínica', sede: 'Guayana', consultorio: 'Edif. Biblioteca, Piso 2, Sala de Bienestar', horario: 'Mie y Vie - 8:00 AM a 12:00 PM', costoUsd: 20, disponible: false },
];

// Catálogo de Espacios Físicos Deportivos y Culturales
export const MOCK_ESPACIOS = [
  { id: 'esp-01', nombre: 'Cancha de Fútbol Campo (Grama Artificial)', categoria: 'Deportes', sede: 'Montalbán', capacidad: '22 jugadores + 10 espectadores', tarifaHoraUsd: 40, requiereAcompanantes: true },
  { id: 'esp-02', nombre: 'Cancha de Tenis Nro. 1', categoria: 'Deportes', sede: 'Montalbán', capacidad: '4 jugadores', tarifaHoraUsd: 15, requiereAcompanantes: true },
  { id: 'esp-03', nombre: 'Auditorio Nohemí Gouverneur', categoria: 'Cultura y Eventos', sede: 'Montalbán', capacidad: '150 personas', tarifaHoraUsd: 100, requiereAcompanantes: true },
  { id: 'esp-04', nombre: 'Cancha de Fútbol Sala / Baloncesto', categoria: 'Deportes', sede: 'Guayana', capacidad: '14 jugadores', tarifaHoraUsd: 25, requiereAcompanantes: true },
  { id: 'esp-05', nombre: 'Auditorio Constanza Verolini', categoria: 'Cultura y Eventos', sede: 'Guayana', capacidad: '120 personas', tarifaHoraUsd: 80, requiereAcompanantes: true },
];

// Historial Inicial de Solicitudes transaccionales (HU-05 / ERE Solicitud_Servicio)
export const MOCK_SOLICITUDES_INICIALES = [
  {
    id: 'SOL-2026-9980',
    nroSolicitud: '9980',
    servicio: 'Alquiler de Cancha de Fútbol Campo',
    categoria: 'Deportes',
    sede: 'Montalbán',
    fechaCreacion: '2026-05-10',
    fechaEjecucion: '2026-05-15 16:00',
    estatusGeneral: 'Aprobado', // Pendiente, Aprobado, En Proceso, Culminado, Rechazado
    montoUsd: 40.00,
    montoBs: 40.00 * TASA_BCV,
    acompanantes: [{ nombre: 'Santiago De Freitas', cedula: 'V-30123456' }, { nombre: 'Joseph Contreras', cedula: 'V-31573231' }],
  },
  {
    id: 'SOL-2026-9981',
    nroSolicitud: '9981',
    servicio: 'Consulta Medicina General - Dra. Rojas',
    categoria: 'Servicios Médicos',
    sede: 'Montalbán',
    fechaCreacion: '2026-05-11',
    fechaEjecucion: '2026-05-16 09:30',
    estatusGeneral: 'Pendiente',
    montoUsd: 15.00,
    montoBs: 15.00 * TASA_BCV,
    acompanantes: [],
  },
  {
    id: 'SOL-2026-9982',
    nroSolicitud: '9982',
    servicio: 'Emisión de Constancia de Estudios Certificada',
    categoria: 'Trámites Académicos',
    sede: 'Montalbán',
    fechaCreacion: '2026-05-12',
    fechaEjecucion: '2026-05-14 00:00',
    estatusGeneral: 'En Proceso',
    montoUsd: 10.00,
    montoBs: 10.00 * TASA_BCV,
    acompanantes: [],
  },
  {
    id: 'SOL-2026-9983',
    nroSolicitud: '9983',
    servicio: 'Reposición de Carnet / TAI con Tecnología NFC',
    categoria: 'Carnetización',
    sede: 'Montalbán',
    fechaCreacion: '2026-04-20',
    fechaEjecucion: '2026-04-25 14:00',
    estatusGeneral: 'Culminado',
    montoUsd: 12.00,
    montoBs: 12.00 * TASA_BCV,
    acompanantes: [],
  },
  {
    id: 'SOL-2026-9984',
    nroSolicitud: '9984',
    servicio: 'Alquiler Auditorio Constanza Verolini',
    categoria: 'Cultura y Eventos',
    sede: 'Guayana',
    fechaCreacion: '2026-04-10',
    fechaEjecucion: '2026-04-18 10:00',
    estatusGeneral: 'Culminado',
    montoUsd: 80.00,
    montoBs: 80.00 * TASA_BCV,
    acompanantes: [{ nombre: 'Nicole Esser', cedula: 'V-31229670' }],
  },
  {
    id: 'SOL-2026-9985',
    nroSolicitud: '9985',
    servicio: 'Inscripción Torneo Interfacultades de Baloncesto',
    categoria: 'Deportes',
    sede: 'Montalbán',
    fechaCreacion: '2026-03-15',
    fechaEjecucion: '2026-03-20 15:00',
    estatusGeneral: 'Rechazado',
    montoUsd: 5.00,
    montoBs: 5.00 * TASA_BCV,
    acompanantes: [],
  },
];