-- ============================================================================
-- SCRIPT 05: DATOS DE PRUEBA (SEED)
-- UCAB-Services | PostgreSQL
-- Ejecutar DESPUES de 01.tablas.sql, 02.seguridad.sql, 03.triggers.sql
-- ----------------------------------------------------------------------------
-- NOTAS IMPORTANTES:
--  * Los Paso_Actividad se insertan con estatus/fechas explicitos. El trigger
--    trg_registrar_fin_paso es BEFORE UPDATE, asi que NO pisa estas fechas
--    historicas. Eso es intencional: los reportes de tiempos necesitan
--    duraciones variadas y realistas.
--  * Las Facturas se insertan con el saldo TOTAL. Los Pagos disparan
--    trg_despues_insertar_pago, que baja el saldo y mueve el estatus.
--    Asi el seed ademas demuestra que el trigger funciona.
--  * nro_solicitud y nro_control son SERIAL: se insertan explicitos y al final
--    se reposicionan las secuencias con setval().
-- ============================================================================

BEGIN;

-- ---------------------------------------------------------------- LIMPIEZA
TRUNCATE TABLE
    Pago_TAI, Pago_Efectivo, Pago_Movil, Pago_Tarjeta,
    Pago_Criptomoneda, Pago_Zelle, Pago_Digital, Pago_Presencial, Pago,
    Factura, Linea_Cargo, Folio_Consumo, Acompanante, Paso_Actividad,
    Solicitud_Servicio, Postulacion, Vacante,
    Servicio_Sede, Servicio_Requisito, Requisito, Tarifa,
    Cargos_adicionales, Servicio,
    Externa, Interna, Entidad_prestadora, Categoria_servicio,
    Espacio_fisico, Edificacion, Sede,
    Carga_mayor, Carga_menor, Beneficiario,
    Preparador, Becario, Egresado, Personal_Administrativo, Profesor, Estudiante,
    Periodo, Sesion, Cuenta, Miembro_comunidad
RESTART IDENTITY CASCADE;

-- ---------------------------------------------------------------- GEOGRAFIA
INSERT INTO Sede (nombre_sede, ajuste_ubicacion) VALUES
    ('Montalbán', 1.00),
    ('Guayana',   0.85);

INSERT INTO Edificacion (nombre_edificacion, nombre_sede) VALUES
    ('Edificio Cincuentenario',   'Montalbán'),
    ('Edificio de Laboratorios',  'Montalbán'),
    ('Edificio Rectorado',        'Montalbán'),
    ('Edificio Aula Magna Guayana','Guayana'),
    ('Complejo Deportivo Guayana','Guayana');

-- nro_identificador es PK GLOBAL en esta implementacion -> se codifica con prefijo
INSERT INTO Espacio_fisico (nro_identificador, nombre_edificacion, capacidad_max,
                            tipo_mobiliario, recursos_tecnologicos,
                            estado_mantenimiento, estatus_disponibilidad) VALUES
    ('MON-CIN-101', 'Edificio Cincuentenario',    40,  'Pupitres',        'Proyector, aire acondicionado', 'operativo',        'disponible'),
    ('MON-CIN-AUD', 'Edificio Cincuentenario',    300, 'Butacas',         'Sonido, proyector, tarima',     'operativo',        'disponible'),
    ('MON-LAB-201', 'Edificio de Laboratorios',   25,  'Mesas técnicas',  'Servidores, 25 PC',             'operativo',        'no disponible'),
    ('MON-LAB-202', 'Edificio de Laboratorios',   25,  'Mesas técnicas',  '25 PC',                         'en mantenimiento', 'no disponible'),
    ('MON-REC-CON', 'Edificio Rectorado',         15,  'Mesa de juntas',  'Videoconferencia',              'operativo',        'disponible'),
    ('GUY-AMG-101', 'Edificio Aula Magna Guayana',60,  'Pupitres',        'Proyector',                     'operativo',        'disponible'),
    ('GUY-AMG-AUD', 'Edificio Aula Magna Guayana',180, 'Butacas',         'Sonido, proyector',             'operativo',        'disponible'),
    ('GUY-DEP-CF1', 'Complejo Deportivo Guayana', 22,  'Gradas',          'Iluminación nocturna',          'operativo',        'disponible');

-- ---------------------------------------------------------------- CATEGORIAS Y PRESTADORAS
INSERT INTO Categoria_servicio (nombre_categoria, limite_costo_max) VALUES
    ('Salud',             500.00),
    ('Educación Continua',1200.00),
    ('Cultura',           800.00),
    ('Deporte',           300.00);

INSERT INTO Entidad_prestadora (nombre_entidad) VALUES
    ('Dirección de Servicios Médicos'),
    ('Secretaría General'),
    ('Dirección de Cultura'),
    ('Eventos Caracas C.A.'),
    ('Deportes Guayana S.A.');

INSERT INTO Interna (nombre_entidad, codigo_presupuestario, director_oficina) VALUES
    ('Dirección de Servicios Médicos', 'PRES-1001', 'Dr. Andrés Belloso'),
    ('Secretaría General',             'PRES-2002', 'Lic. Carmen Aguilar'),
    ('Dirección de Cultura',           'PRES-3003', 'Lic. Rafael Moreno');

INSERT INTO Externa (nombre_entidad, rif, razon_social, fecha_vencimiento_contrato, contactos_legales) VALUES
    ('Eventos Caracas C.A.',  'J-401234567', 'Eventos Caracas Compañía Anónima', '2027-03-31', 'legal@eventoscaracas.com / 0212-5551234'),
    ('Deportes Guayana S.A.', 'J-409876543', 'Deportes Guayana Sociedad Anónima','2026-12-15', 'contratos@deportesguayana.com / 0286-5559876');

-- ---------------------------------------------------------------- MIEMBROS
INSERT INTO Miembro_comunidad (cedula, correo, nombres, telefono, apellidos, sexo, ciudad, municipio, calle, categoria_fidelidad) VALUES
    ('V-30111222','ana.rivas@ucab.edu.ve',    'Ana Lucía',  '0412-1110001','Rivas Montiel','F','Caracas',      'Libertador','Av. Páez, Res. El Paraíso, Apt 3B','Frecuente'),
    ('V-30222333','luis.perez@ucab.edu.ve',   'Luis Miguel','0414-2220002','Pérez Salazar','M','Caracas',      'Libertador','Calle Real de Antímano, Casa 14',  'Preferencial'),
    ('V-33666777','diego.ramos@ucab.edu.ve',  'Diego',      '0416-3330003','Ramos Ortiz',  'M','Ciudad Guayana','Caroní',    'Urb. Villa Colombia, Calle 5',    'Regular'),
    ('V-29111444','maria.gomez@ucab.edu.ve',  'María José', '0412-4440004','Gómez Ferrer', 'F','Caracas',      'Baruta',    'Urb. Santa Fe, Qta. La Rosa',     'Frecuente'),
    ('V-25999000','rosa.villa@ucab.edu.ve',   'Rosa Elena', '0414-5550005','Villa Andrade','F','Caracas',      'Libertador','Av. Sucre, Edif. Centro, Apt 8A',  'Preferencial'),
    ('V-28555666','carlos.diaz@ucab.edu.ve',  'Carlos',     '0424-6660006','Díaz Herrera', 'M','Caracas',      'Libertador','Montalbán II, Calle 3, Casa 9',    'Regular'),
    ('V-27888999','elena.torres@ucab.edu.ve', 'Elena',      '0412-7770007','Torres Blanco','F','Caracas',      'Libertador','La Vega, Calle Principal, Edif. 2','Regular'),
    ('V-26777888','jorge.salas@ucab.edu.ve',  'Jorge Luis', '0414-8880008','Salas Rincón', 'M','Caracas',      'Sucre',     'Petare Norte, Calle 8, Casa 30',   'Regular'),
    ('V-24111000','marta.ochoa@ucab.edu.ve',  'Marta',      '0416-9990009','Ochoa Peña',   'F','Ciudad Guayana','Caroní',    'Urb. Unare II, Sector 3, Casa 21', 'Frecuente'),
    ('V-31444555','sofia.mendez@ucab.edu.ve', 'Sofía',      '0412-1010010','Méndez Lara',  'F','Caracas',      'Chacao',    'Urb. Bello Campo, Res. Ávila, 5C', 'Frecuente'),
    ('V-32555666','pedro.nunez@ucab.edu.ve',  'Pedro',      '0424-1110011','Núñez Castro', 'M','Ciudad Guayana','Caroní',    'Urb. Los Olivos, Calle 2, Casa 7', 'Regular'),
    ('V-34777888','kevin.mora@ucab.edu.ve',   'Kevin',      '0426-1210012','Mora Vargas',  'M','Caracas',      'Libertador','El Cementerio, Calle 4, Casa 11',  'Regular');

-- Cuenta: estatus = verificacion en dos pasos (MFA) segun el DDL actual
INSERT INTO Cuenta (cedula, fecha_cambio_clave, ultima_conexion, estado_cuenta, estatus, intentos_fallidos) VALUES
    ('V-30111222','2026-05-10','2026-07-15 08:42:11','activa',     'habilitado',    0),
    ('V-30222333','2026-06-01','2026-07-16 07:15:30','activa',     'habilitado',    0),
    ('V-33666777','2025-11-20','2026-07-14 19:03:44','activa',     'deshabilitado', 2),
    ('V-29111444','2026-04-18','2026-07-15 14:20:09','activa',     'habilitado',    0),
    ('V-25999000','2026-02-02','2026-07-13 09:11:52','activa',     'habilitado',    1),
    ('V-28555666','2026-06-25','2026-07-16 06:55:02','activa',     'habilitado',    0),
    ('V-27888999','2026-03-14','2026-07-15 16:48:37','activa',     'habilitado',    0),
    ('V-26777888','2026-01-09','2026-07-10 11:30:00','activa',     'deshabilitado', 0),
    ('V-24111000','2025-08-30','2026-06-28 10:05:14','suspendida', 'deshabilitado', 0),
    ('V-31444555','2026-05-05','2026-07-16 12:00:00','activa',     'habilitado',    0),
    ('V-32555666','2025-09-12','2026-05-19 17:22:41','suspendida', 'deshabilitado', 3),
    ('V-34777888','2025-07-01','2026-04-02 22:14:08','bloqueada',  'deshabilitado', 7);

INSERT INTO Sesion (cedula, fecha_hora_acceso, direccion_ip, uuid_dispositivo, geolocalizacion) VALUES
    ('V-30111222','2026-07-15 08:42:11','190.202.14.55',  'a1b2c3d4-0001-4aaa-9000-000000000001','Caracas, VE'),
    ('V-30111222','2026-07-12 20:10:03','190.202.14.55',  'a1b2c3d4-0001-4aaa-9000-000000000001','Caracas, VE'),
    ('V-30222333','2026-07-16 07:15:30','186.90.33.101',  'a1b2c3d4-0002-4aaa-9000-000000000002','Caracas, VE'),
    ('V-30222333','2026-07-09 13:44:19','186.90.33.101',  'a1b2c3d4-0002-4aaa-9000-000000000002','Caracas, VE'),
    ('V-33666777','2026-07-14 19:03:44','200.44.190.12',  'a1b2c3d4-0003-4aaa-9000-000000000003','Ciudad Guayana, VE'),
    ('V-29111444','2026-07-15 14:20:09','190.202.14.90',  'a1b2c3d4-0004-4aaa-9000-000000000004','Caracas, VE'),
    ('V-25999000','2026-07-13 09:11:52','186.90.77.203',  'a1b2c3d4-0005-4aaa-9000-000000000005','Caracas, VE'),
    ('V-28555666','2026-07-16 06:55:02','10.10.1.44',     'a1b2c3d4-0006-4aaa-9000-000000000006','Caracas, VE (red interna)'),
    ('V-27888999','2026-07-15 16:48:37','10.10.1.51',     'a1b2c3d4-0007-4aaa-9000-000000000007','Caracas, VE (red interna)'),
    ('V-26777888','2026-07-10 11:30:00','10.10.1.60',     'a1b2c3d4-0008-4aaa-9000-000000000008','Caracas, VE (red interna)'),
    ('V-24111000','2026-06-28 10:05:14','200.44.190.77',  'a1b2c3d4-0009-4aaa-9000-000000000009','Ciudad Guayana, VE'),
    ('V-31444555','2026-07-16 12:00:00','190.36.22.140',  'a1b2c3d4-0010-4aaa-9000-000000000010','Caracas, VE'),
    ('V-32555666','2026-05-19 17:22:41','200.44.190.15',  'a1b2c3d4-0011-4aaa-9000-000000000011','Ciudad Guayana, VE'),
    -- accesos anomalos de la cuenta bloqueada: 3 IPs y 2 dispositivos distintos
    ('V-34777888','2026-04-02 22:14:08','45.229.10.7',    'a1b2c3d4-0012-4aaa-9000-000000000012','Desconocida'),
    ('V-34777888','2026-04-02 22:16:55','91.108.20.44',   'a1b2c3d4-0013-4aaa-9000-000000000013','Desconocida'),
    ('V-34777888','2026-04-02 22:19:31','103.75.11.88',   'a1b2c3d4-0013-4aaa-9000-000000000013','Desconocida');

-- ---------------------------------------------------------------- PERIODOS
-- OJO: Periodo no tiene columna de rol en esta implementacion.
INSERT INTO Periodo (cedula, fecha_inicio, fecha_fin) VALUES
    ('V-30111222','2023-09-15', NULL),
    ('V-30222333','2022-09-19', NULL),
    ('V-33666777','2024-09-16', NULL),
    ('V-29111444','2019-01-14', NULL),
    ('V-25999000','2006-09-18','2011-07-29'),  -- estudio pregrado
    ('V-25999000','2015-02-02', NULL),         -- volvio como profesora
    ('V-28555666','2018-03-05', NULL),
    ('V-27888999','2016-08-22', NULL),
    ('V-26777888','2012-01-16', NULL),
    ('V-24111000','2010-05-03','2026-06-30'),  -- sin vinculacion vigente -> cuenta suspendida
    ('V-31444555','2019-09-16','2024-07-26'),
    ('V-32555666','2018-09-17','2023-12-15'),
    ('V-34777888','2021-09-20','2023-02-10');

-- ---------------------------------------------------------------- ROLES
INSERT INTO Estudiante (cedula, promedio, facultad, semestre_actual, escuela, uc_aprobadas, estatus_beca) VALUES
    ('V-30111222',17.85,'Ingeniería',7,'Ingeniería Informática',132,'activa'),
    ('V-30222333',18.40,'Ingeniería',9,'Ingeniería Informática',168,'ninguna'),
    ('V-33666777',13.20,'Ciencias Económicas',3,'Administración',48,'ninguna');

INSERT INTO Becario (cedula, tipo_beca, estatus_beneficio, indice_mantenimiento) VALUES
    ('V-30111222','excelencia','vigente',16.00);

INSERT INTO Preparador (cedula, horas_ayudantia, asignatura_asignada) VALUES
    ('V-30222333',10,'Base de Datos I');

INSERT INTO Profesor (cedula, escalafon_docente, carga_semanal, cod_investigador) VALUES
    ('V-29111444','Agregado',   18,'INV-2019-041'),
    ('V-25999000','Asociado',   12,'INV-2015-007');

INSERT INTO Personal_Administrativo (cedula, cargo_administrativo, unidad_adscripcion, carga_semanal) VALUES
    ('V-28555666','Cajero principal',       'Caja',                  40),
    ('V-27888999','Analista de expedientes','Secretaría Académica',  40),
    ('V-26777888','Coordinador de emisión', 'Rectorado',             40),
    ('V-24111000','Asistente administrativo','Dirección de Cultura', 30);

-- Rosa Villa: egresada Y profesora a la vez (el caso del enunciado)
INSERT INTO Egresado (cedula, indice_final, año_graduacion, titulo_obtenido) VALUES
    ('V-25999000',16.90,2011,'Licenciada en Educación'),
    ('V-31444555',17.60,2024,'Ingeniera Informática'),
    ('V-32555666',15.30,2023,'Ingeniero Industrial'),
    ('V-34777888',12.80,2023,'Técnico Superior en Informática');

-- ---------------------------------------------------------------- BENEFICIARIOS
INSERT INTO Beneficiario (cedula_beneficiario, cedula_titular, nombres, apellidos, parentesco,
                          fecha_nacimiento, fecha_inicio_cobertura, fecha_fin_cobertura, beneficios_activos) VALUES
    ('V-38111222','V-29111444','Sebastián','Gómez Rojas','hijo','2017-04-11','2017-04-11', NULL, TRUE),
    ('V-36222333','V-28555666','Valentina','Díaz Suárez','hija','2013-08-02','2013-08-02', NULL, TRUE),
    ('V-31333444','V-27888999','Andrea',   'Torres Gil', 'hija','2006-01-30','2006-01-30', NULL, TRUE),
    ('V-30444555','V-24111000','Ricardo',  'Ochoa Silva','hijo','2005-06-14','2005-06-14','2026-06-30', FALSE);

INSERT INTO Carga_menor (cedula_beneficiario, esquema_vacunacion, centro_educacion_inicial) VALUES
    ('V-38111222','Completo (pentavalente, MMR, refuerzo 2023)','Preescolar Andrés Bello'),
    ('V-36222333','Completo (esquema al día 2025)',             'U.E. Colegio La Salle');

INSERT INTO Carga_mayor (cedula_beneficiario, constancia_estudios, certificado_solteria) VALUES
    ('V-31333444','constancia_ucv_2026_andrea_torres.pdf','solteria_andrea_torres_2026.pdf'),
    ('V-30444555', NULL, NULL);

-- ---------------------------------------------------------------- SERVICIOS
INSERT INTO Servicio (codigo_servicio, nombre_entidad, nombre_categoria, descripcion_detallada, precio_base) VALUES
    ('SRV-001','Dirección de Servicios Médicos','Salud',             'Consulta médica general en el servicio médico del campus. Incluye evaluación y récipe.', 30.00),
    ('SRV-002','Secretaría General',            'Educación Continua','Solicitud y emisión de Título de Grado. Incluye verificación de solvencia, validación de créditos y emisión por Rectorado.', 150.00),
    ('SRV-003','Eventos Caracas C.A.',          'Cultura',           'Alquiler de auditorio para eventos corporativos o culturales. Bloque de 4 horas.', 400.00),
    ('SRV-004','Deportes Guayana S.A.',         'Deporte',           'Alquiler de cancha de fútbol con iluminación. Bloque de 2 horas.', 80.00),
    ('SRV-005','Secretaría General',            'Educación Continua','Diplomado en Gerencia de Proyectos. 120 horas académicas.', 900.00),
    ('SRV-006','Dirección de Cultura',          'Cultura',           'Inscripción en taller de teatro del Centro Cultural. Trimestral.', 120.00);

INSERT INTO Cargos_adicionales (codigo_servicio, concepto, costo) VALUES
    ('SRV-002','Toga y birrete',              25.00),
    ('SRV-002','Paquete fotográfico',         45.00),
    ('SRV-003','Sonido profesional',          50.00),
    ('SRV-003','Soporte técnico especializado',35.00),
    ('SRV-004','Alquiler de balones',          8.00),
    ('SRV-001','Materiales de laboratorio',   12.00);

-- Tarifas diferenciadas por perfil (PK: codigo_servicio, id)
INSERT INTO Tarifa (codigo_servicio, id, fecha_inicio_vigencia, perfil_solicitante, monto) VALUES
    ('SRV-001',1,'2026-01-01','miembro activo',   25.00),
    ('SRV-001',2,'2026-01-01','egresado',         30.00),
    ('SRV-001',3,'2026-01-01','público externo',  45.00),
    ('SRV-002',1,'2026-01-01','miembro activo',  150.00),
    ('SRV-002',2,'2026-01-01','egresado',        180.00),
    ('SRV-003',1,'2025-06-01','público externo', 380.00),  -- tarifa historica
    ('SRV-003',2,'2026-01-01','público externo', 450.00),  -- tarifa vigente
    ('SRV-003',3,'2026-01-01','miembro activo',  300.00),
    ('SRV-004',1,'2026-01-01','miembro activo',   60.00),
    ('SRV-004',2,'2026-01-01','público externo',  95.00),
    ('SRV-005',1,'2026-01-01','miembro activo',  750.00),
    ('SRV-005',2,'2026-01-01','egresado',        850.00),
    ('SRV-005',3,'2026-01-01','público externo',1100.00),
    ('SRV-006',1,'2026-01-01','miembro activo',  100.00),
    ('SRV-006',2,'2026-01-01','público externo', 140.00);

INSERT INTO Requisito (nombre_requisito, tipo_acreditacion) VALUES
    ('Solvencia administrativa','documento'),
    ('Constancia de estudios',  'documento'),
    ('Cédula de identidad vigente','documento'),
    ('Índice académico mínimo', 'condición'),
    ('Contrato de concesión vigente','documento');

INSERT INTO Servicio_Requisito (codigo_servicio, nombre_requisito) VALUES
    ('SRV-002','Solvencia administrativa'),
    ('SRV-002','Cédula de identidad vigente'),
    ('SRV-002','Índice académico mínimo'),
    ('SRV-005','Solvencia administrativa'),
    ('SRV-005','Constancia de estudios'),
    ('SRV-003','Contrato de concesión vigente'),
    ('SRV-001','Cédula de identidad vigente'),
    ('SRV-006','Cédula de identidad vigente');

INSERT INTO Servicio_Sede (codigo_servicio, nombre_sede) VALUES
    ('SRV-001','Montalbán'), ('SRV-001','Guayana'),
    ('SRV-002','Montalbán'),
    ('SRV-003','Montalbán'), ('SRV-003','Guayana'),
    ('SRV-004','Guayana'),
    ('SRV-005','Montalbán'), ('SRV-005','Guayana'),
    ('SRV-006','Montalbán');

-- ---------------------------------------------------------------- BOLSA DE TRABAJO
INSERT INTO Vacante (nombre_entidad, cargo, fecha_oferta, responsabilidades, beneficios, perfil_buscado, estatus_vacante) VALUES
    ('Eventos Caracas C.A.', 'Ingeniero de Sistemas Junior','2026-03-10','Mantenimiento de plataforma web y soporte a eventos','HCM, bono de alimentación, horario flexible','Ingeniero recién graduado, promedio superior a 15','finalizada'),
    ('Eventos Caracas C.A.', 'Coordinador de Producción',   '2026-05-02','Coordinación logística de eventos culturales','HCM, comisiones por evento','Egresado en áreas administrativas o afines','disponible'),
    ('Deportes Guayana S.A.','Analista de Operaciones',     '2026-04-18','Análisis de ocupación y programación de canchas','HCM, seguro de vida','Ingeniero industrial o informático','finalizada'),
    ('Deportes Guayana S.A.','Pasante de Sistemas',         '2026-06-20','Apoyo al equipo de TI','Beca-salario','Estudiante de últimos semestres','disponible');

INSERT INTO Postulacion (cedula, nombre_entidad, cargo, fecha_oferta, fecha_postulacion, estatus_seleccion) VALUES
    ('V-31444555','Eventos Caracas C.A.', 'Ingeniero de Sistemas Junior','2026-03-10','2026-03-14','contratado'),
    ('V-32555666','Eventos Caracas C.A.', 'Ingeniero de Sistemas Junior','2026-03-10','2026-03-16','rechazado'),
    ('V-34777888','Eventos Caracas C.A.', 'Ingeniero de Sistemas Junior','2026-03-10','2026-03-20','rechazado'),
    ('V-32555666','Deportes Guayana S.A.','Analista de Operaciones',     '2026-04-18','2026-04-25','contratado'),
    ('V-34777888','Deportes Guayana S.A.','Analista de Operaciones',     '2026-04-18','2026-04-27','entrevistado'),
    ('V-25999000','Eventos Caracas C.A.', 'Coordinador de Producción',   '2026-05-02','2026-05-10','en revisión'),
    ('V-31444555','Eventos Caracas C.A.', 'Coordinador de Producción',   '2026-05-02','2026-05-12','entrevistado');

-- ---------------------------------------------------------------- SOLICITUDES
INSERT INTO Solicitud_Servicio (nro_solicitud, cedula_miembro, codigo_servicio, nro_identificador_espacio,
                                fecha_creacion, fecha_cierre, estatus_general) VALUES
    (1,'V-30222333','SRV-002', NULL,          '2026-05-04 09:00:00','2026-05-19 15:40:00','cerrada'),
    (2,'V-31444555','SRV-002', NULL,          '2026-06-01 10:30:00','2026-06-25 11:15:00','cerrada'),
    (3,'V-30111222','SRV-001','MON-CIN-101',  '2026-06-10 08:15:00','2026-06-10 09:05:00','cerrada'),
    (4,'V-29111444','SRV-003','MON-CIN-AUD',  '2026-06-15 11:00:00','2026-06-30 17:00:00','cerrada'),
    (5,'V-33666777','SRV-004','GUY-DEP-CF1',  '2026-07-01 16:00:00','2026-07-02 18:30:00','cerrada'),
    (6,'V-25999000','SRV-005','MON-CIN-101',  '2026-07-05 09:45:00', NULL,                'en_proceso'),
    (7,'V-30111222','SRV-006','MON-REC-CON',  '2026-07-08 14:00:00', NULL,                'en_proceso'),
    (8,'V-32555666','SRV-005','GUY-AMG-101',  '2026-07-10 08:30:00', NULL,                'en_proceso'),
    (9,'V-30222333','SRV-003','GUY-AMG-AUD',  '2026-07-12 10:00:00', NULL,                'en_proceso');

INSERT INTO Acompanante (cedula_acompanante, nro_solicitud, nombre) VALUES
    ('E-84112233',4,'Roberto Salcedo Peña'),
    ('E-84556677',4,'Lucía Ferrer Ortega'),
    ('V-19887766',5,'Miguel Ángel Ruiz'),
    ('V-21334455',9,'Patricia Alvarado');

-- ---------------------------------------------------------------- PASOS DE ACTIVIDAD
-- Solicitud 1 y 2 = "Solicitud de Titulo de Grado": Caja -> Secretaria -> Rectorado.
-- Duraciones deliberadamente desiguales para que el reporte de cuellos de botella
-- muestre a Secretaria Academica como el paso lento.
INSERT INTO Paso_Actividad (nro_solicitud, nro_paso, descripcion, estatus, cedula_admin, fecha_hora_inicio, fecha_hora_fin) VALUES
    (1,1,'Verificación de solvencia',      'completado','V-28555666','2026-05-04 09:00:00','2026-05-04 11:20:00'),
    (1,2,'Validación de créditos',         'completado','V-27888999','2026-05-04 11:20:00','2026-05-18 10:05:00'),
    (1,3,'Emisión de documento',           'completado','V-26777888','2026-05-18 10:05:00','2026-05-19 15:40:00'),

    (2,1,'Verificación de solvencia',      'completado','V-28555666','2026-06-01 10:30:00','2026-06-01 14:45:00'),
    (2,2,'Validación de créditos',         'completado','V-27888999','2026-06-01 14:45:00','2026-06-22 09:30:00'),
    (2,3,'Emisión de documento',           'completado','V-26777888','2026-06-22 09:30:00','2026-06-25 11:15:00'),

    (3,1,'Verificación de solvencia',      'completado','V-28555666','2026-06-10 08:15:00','2026-06-10 08:35:00'),
    (3,2,'Asignación de consultorio',      'completado','V-27888999','2026-06-10 08:35:00','2026-06-10 09:05:00'),

    (4,1,'Verificación de solvencia',      'completado','V-28555666','2026-06-15 11:00:00','2026-06-15 13:10:00'),
    (4,2,'Asignación de espacio físico',   'completado','V-24111000','2026-06-15 13:10:00','2026-06-18 16:00:00'),
    (4,3,'Firma digital de contrato',      'completado','V-26777888','2026-06-18 16:00:00','2026-06-30 17:00:00'),

    (5,1,'Verificación de solvencia',      'completado','V-28555666','2026-07-01 16:00:00','2026-07-01 17:30:00'),
    (5,2,'Asignación de espacio físico',   'completado','V-24111000','2026-07-01 17:30:00','2026-07-02 18:30:00'),

    (6,1,'Verificación de solvencia',      'completado','V-28555666','2026-07-05 09:45:00','2026-07-05 12:00:00'),
    (6,2,'Validación de créditos',         'en progreso','V-27888999','2026-07-05 12:00:00', NULL),
    (6,3,'Emisión de documento',           'pendiente', 'V-26777888','2026-07-05 12:00:00', NULL),

    (7,1,'Verificación de solvencia',      'completado','V-28555666','2026-07-08 14:00:00','2026-07-08 15:10:00'),
    (7,2,'Asignación de espacio físico',   'pendiente', 'V-24111000','2026-07-08 15:10:00', NULL),

    (8,1,'Verificación de solvencia',      'en progreso','V-28555666','2026-07-10 08:30:00', NULL),
    (8,2,'Validación de créditos',         'pendiente', 'V-27888999','2026-07-10 08:30:00', NULL),

    (9,1,'Verificación de solvencia',      'completado','V-28555666','2026-07-12 10:00:00','2026-07-12 11:05:00'),
    (9,2,'Asignación de espacio físico',   'pendiente', 'V-24111000','2026-07-12 11:05:00', NULL);

-- ---------------------------------------------------------------- FOLIOS Y CARGOS
INSERT INTO Folio_Consumo (nro_solicitud, fecha_apertura) VALUES
    (1,'2026-05-04 09:05:00'),
    (2,'2026-06-01 10:35:00'),
    (3,'2026-06-10 08:20:00'),
    (4,'2026-06-15 11:05:00'),
    (5,'2026-07-01 16:05:00'),
    (6,'2026-07-05 09:50:00'),
    (7,'2026-07-08 14:05:00'),
    (9,'2026-07-12 10:05:00');

INSERT INTO Linea_Cargo (nro_solicitud, fecha_apertura_folio, nro_linea, concepto, cantidad, precio_unitario, impuestos) VALUES
    -- Solicitud 1: titulo (miembro activo) + toga + fotos = 150 + 25 + 45 = 220 + IVA
    (1,'2026-05-04 09:05:00',1,'Derechos de secretaría - Título de Grado',1,150.00,24.00),
    (1,'2026-05-04 09:05:00',2,'Toga y birrete',                          1, 25.00, 4.00),
    (1,'2026-05-04 09:05:00',3,'Paquete fotográfico',                     1, 45.00, 7.20),
    -- Solicitud 2: titulo (egresado) = 180
    (2,'2026-06-01 10:35:00',1,'Derechos de secretaría - Título de Grado',1,180.00,28.80),
    (2,'2026-06-01 10:35:00',2,'Toga y birrete',                          1, 25.00, 4.00),
    -- Solicitud 3: consulta medica (miembro activo) 25 + materiales 12
    (3,'2026-06-10 08:20:00',1,'Consulta médica general',                 1, 25.00, 4.00),
    (3,'2026-06-10 08:20:00',2,'Materiales de laboratorio',               1, 12.00, 1.92),
    -- Solicitud 4: auditorio (miembro activo) 300 + sonido 50 + soporte 35
    (4,'2026-06-15 11:05:00',1,'Alquiler de auditorio - bloque 4h',       1,300.00,48.00),
    (4,'2026-06-15 11:05:00',2,'Sonido profesional',                      1, 50.00, 8.00),
    (4,'2026-06-15 11:05:00',3,'Soporte técnico especializado',           1, 35.00, 5.60),
    -- Solicitud 5: cancha (miembro activo) 60 x 2 bloques + balones
    (5,'2026-07-01 16:05:00',1,'Alquiler de cancha - bloque 2h',          2, 60.00,19.20),
    (5,'2026-07-01 16:05:00',2,'Alquiler de balones',                     1,  8.00, 1.28),
    -- Solicitud 6: diplomado (miembro activo) 750
    (6,'2026-07-05 09:50:00',1,'Diplomado en Gerencia de Proyectos',      1,750.00,120.00),
    -- Solicitud 7: taller de teatro (miembro activo) 100
    (7,'2026-07-08 14:05:00',1,'Taller de teatro - trimestre',            1,100.00,16.00),
    -- Solicitud 9: auditorio Guayana (miembro activo) 300 -- folio abierto, aun sin facturar
    (9,'2026-07-12 10:05:00',1,'Alquiler de auditorio - bloque 4h',       1,300.00,48.00);

-- ---------------------------------------------------------------- FACTURAS
-- El saldo inicial es el TOTAL de la factura. Los pagos (abajo) lo bajan via trigger.
INSERT INTO Factura (nro_control, nro_solicitud, fecha_apertura_folio, fecha_emision, saldo, estatus, cedula_titular, rif_corporativo, razon_social_corporativa) VALUES
    (1,1,'2026-05-04 09:05:00','2026-05-19 15:45:00',255.20,'Pendiente','V-30222333',NULL,NULL),
    (2,2,'2026-06-01 10:35:00','2026-06-25 11:20:00',237.80,'Pendiente','V-31444555',NULL,NULL),
    (3,3,'2026-06-10 08:20:00','2026-06-10 09:10:00', 42.92,'Pendiente','V-30111222',NULL,NULL),
    (4,4,'2026-06-15 11:05:00','2026-06-30 17:05:00',446.60,'Pendiente','V-29111444','J-401234567','Eventos Caracas Compañía Anónima'),
    (5,5,'2026-07-01 16:05:00','2026-07-02 18:35:00',149.48,'Pendiente','V-33666777',NULL,NULL),
    (6,6,'2026-07-05 09:50:00','2026-07-05 10:00:00',870.00,'Pendiente','V-25999000',NULL,NULL),
    (7,7,'2026-07-08 14:05:00','2026-07-08 14:10:00',116.00,'Pendiente','V-30111222',NULL,NULL);

-- ---------------------------------------------------------------- PAGOS
-- Factura 1: pagada completa en efectivo
INSERT INTO Pago (nro_control_factura, fecha_pago, monto) VALUES (1,'2026-05-19 16:00:00',255.20);
INSERT INTO Pago_Presencial (nro_control_factura, fecha_pago, tasa_bcv) VALUES (1,'2026-05-19 16:00:00',36.5420);
INSERT INTO Pago_Efectivo (nro_control_factura, fecha_pago, moneda_curso, monto_recibido, desgloce_denominaciones)
    VALUES (1,'2026-05-19 16:00:00','divisas',260.00,'2x100, 1x50, 1x10');

-- Factura 2: pagada completa por Zelle
INSERT INTO Pago (nro_control_factura, fecha_pago, monto) VALUES (2,'2026-06-25 12:00:00',237.80);
INSERT INTO Pago_Digital (nro_control_factura, fecha_pago) VALUES (2,'2026-06-25 12:00:00');
INSERT INTO Pago_Zelle (nro_control_factura, fecha_pago, correo_origen, nombre_titular, codigo_transaccion)
    VALUES (2,'2026-06-25 12:00:00','sofia.mendez@gmail.com','Sofia Mendez Lara','ZL-88231145');

-- Factura 3: pagada con billetera TAI
INSERT INTO Pago (nro_control_factura, fecha_pago, monto) VALUES (3,'2026-06-10 09:12:00',42.92);
INSERT INTO Pago_Presencial (nro_control_factura, fecha_pago, tasa_bcv) VALUES (3,'2026-06-10 09:12:00',36.8100);
INSERT INTO Pago_TAI (nro_control_factura, fecha_pago, uid_chip, codigo_terminal_pos)
    VALUES (3,'2026-06-10 09:12:00','04A3B2C1D5E6F7','POS-MON-CAJA-02');

-- Factura 4: ABONOS PARCIALES (tarjeta + criptomoneda) -> queda en Pago_Parcial
INSERT INTO Pago (nro_control_factura, fecha_pago, monto) VALUES (4,'2026-06-30 17:30:00',200.00);
INSERT INTO Pago_Presencial (nro_control_factura, fecha_pago, tasa_bcv) VALUES (4,'2026-06-30 17:30:00',37.0250);
INSERT INTO Pago_Tarjeta (nro_control_factura, fecha_pago, nro_tarjeta, fecha_vencimiento, compania_emisora, tipo_red)
    VALUES (4,'2026-06-30 17:30:00','4111111111111111','09/28','Visa','Internacional');

INSERT INTO Pago (nro_control_factura, fecha_pago, monto) VALUES (4,'2026-07-03 09:15:00',150.00);
INSERT INTO Pago_Digital (nro_control_factura, fecha_pago) VALUES (4,'2026-07-03 09:15:00');
INSERT INTO Pago_Criptomoneda (nro_control_factura, fecha_pago, hash_txid, red_utilizada, billetera_origen, tasa_conversion)
    VALUES (4,'2026-07-03 09:15:00','0x9f2b7a41c8de503bb17e2a6d4c8f1093','TRC20','TXk9aBcD3fGhJkLmNpQrStUvWxYz1234',1.0000);

-- Factura 5: pagada con Pago Movil
INSERT INTO Pago (nro_control_factura, fecha_pago, monto) VALUES (5,'2026-07-02 19:00:00',149.48);
INSERT INTO Pago_Presencial (nro_control_factura, fecha_pago, tasa_bcv) VALUES (5,'2026-07-02 19:00:00',37.1900);
INSERT INTO Pago_Movil (nro_control_factura, fecha_pago, nro_telefono, fecha_movimiento, banco_origen, nro_referencia)
    VALUES (5,'2026-07-02 19:00:00','0416-3330003','2026-07-02 18:58:00','Banesco','PM-20260702-77412');

-- Factura 6: abono parcial unico
INSERT INTO Pago (nro_control_factura, fecha_pago, monto) VALUES (6,'2026-07-06 10:20:00',400.00);
INSERT INTO Pago_Digital (nro_control_factura, fecha_pago) VALUES (6,'2026-07-06 10:20:00');
INSERT INTO Pago_Zelle (nro_control_factura, fecha_pago, correo_origen, nombre_titular, codigo_transaccion)
    VALUES (6,'2026-07-06 10:20:00','rosa.villa@gmail.com','Rosa Villa Andrade','ZL-90114522');

-- Factura 7: SIN PAGOS (queda Pendiente, saldo completo) -> alimenta el reporte de morosidad

-- ---------------------------------------------------------------- SECUENCIAS
SELECT setval(pg_get_serial_sequence('solicitud_servicio','nro_solicitud'),
              (SELECT MAX(nro_solicitud) FROM Solicitud_Servicio));
SELECT setval(pg_get_serial_sequence('factura','nro_control'),
              (SELECT MAX(nro_control) FROM Factura));

COMMIT;

-- ---------------------------------------------------------------- VERIFICACION
-- Debe mostrar: factura 1,2,3,5 = Pagada (saldo 0) | 4,6 = Pago_Parcial | 7 = Pendiente
SELECT nro_control, saldo, estatus FROM Factura ORDER BY nro_control;
