-- ============================================================================
-- SCRIPT 01: DDL TABLAS (CREACIÓN DE ESTRUCTURA)
-- ============================================================================

-- 1. Tabla Padre: Miembro de la Comunidad
CREATE TABLE Miembro_comunidad (
    cedula VARCHAR(15) PRIMARY KEY,
    correo VARCHAR(100) UNIQUE NOT NULL, -- R-01: Correo único
    nombres VARCHAR(100) NOT NULL,
    apellidos VARCHAR(100) NOT NULL,
    sexo CHAR(1) CHECK (sexo IN ('M', 'F')),
    ciudad VARCHAR(50) NOT NULL,
    municipio VARCHAR(50) NOT NULL,
    calle VARCHAR(100) NOT NULL,
    categoria_fidelidad VARCHAR(20) DEFAULT 'Regular' CHECK (categoria_fidelidad IN ('Regular', 'Frecuente', 'Preferencial')) -- R-26
);

-- 2. Atributo Multivaluado: Teléfono
CREATE TABLE Telefono_Miembro (
    cedula VARCHAR(15),
    telefono VARCHAR(20),
    PRIMARY KEY (cedula, telefono),
    FOREIGN KEY (cedula) REFERENCES Miembro_comunidad(cedula) ON DELETE CASCADE
);

-- 3. Cuenta de Usuario (Relación 1:1)
CREATE TABLE Cuenta (
    id_cuenta SERIAL PRIMARY KEY,
    cedula VARCHAR(15) UNIQUE NOT NULL, -- UNIQUE garantiza que sea 1:1
    fecha_cambio_clave DATE,
    estado_cuenta VARCHAR(15) DEFAULT 'activa' CHECK (estado_cuenta IN ('activa', 'suspendida', 'bloqueada')), -- R-02
    intentos_fallidos INT DEFAULT 0,
    estatus VARCHAR(15) DEFAULT 'deshabilitado' CHECK (estatus IN ('habilitado', 'deshabilitado')), -- R-04 (MFA)
    FOREIGN KEY (cedula) REFERENCES Miembro_comunidad(cedula) ON DELETE CASCADE
);

-- 4. Sesión (Entidad Débil de Cuenta)
CREATE TABLE Sesion (
    id_cuenta INT,
    fecha_hora_acceso TIMESTAMP,
    direccion_ip VARCHAR(45) NOT NULL, -- R-03: Obligatorio
    uuid_dispositivo VARCHAR(100) NOT NULL, -- R-03: Obligatorio
    geolocalizacion VARCHAR(100),
    PRIMARY KEY (id_cuenta, fecha_hora_acceso),
    FOREIGN KEY (id_cuenta) REFERENCES Cuenta(id_cuenta) ON DELETE CASCADE
);

-- 5. Vinculación (Entidad Débil de Miembro_comunidad)
CREATE TABLE Vinculacion (
    cedula VARCHAR(15),
    fecha_inicio DATE,
    fecha_fin DATE,
    PRIMARY KEY (cedula, fecha_inicio),
    FOREIGN KEY (cedula) REFERENCES Miembro_comunidad(cedula) ON DELETE CASCADE,
    CONSTRAINT chk_fechas CHECK (fecha_fin IS NULL OR fecha_fin >= fecha_inicio) -- R-05: Lógica de fechas
);

-- ============================================================================
-- 6. JERARQUÍA PRINCIPAL DE ROLES (Dependen de Vinculación)
-- ============================================================================

CREATE TABLE Estudiante (
    cedula VARCHAR(15),
    fecha_inicio DATE,
    promedio DECIMAL(4,2),
    facultad VARCHAR(100) NOT NULL,
    semestre_actual INT,
    escuela VARCHAR(100) NOT NULL,
    uc_aprobadas INT,
    estatus_beca BOOLEAN DEFAULT FALSE,
    PRIMARY KEY (cedula, fecha_inicio),
    FOREIGN KEY (cedula, fecha_inicio) REFERENCES Vinculacion(cedula, fecha_inicio) ON DELETE CASCADE
);

CREATE TABLE Profesor (
    cedula VARCHAR(15),
    fecha_inicio DATE,
    escalafon_docente VARCHAR(50),
    carga_semanal INT,
    cod_investigador VARCHAR(50), -- Opcional
    PRIMARY KEY (cedula, fecha_inicio),
    FOREIGN KEY (cedula, fecha_inicio) REFERENCES Vinculacion(cedula, fecha_inicio) ON DELETE CASCADE
);

CREATE TABLE Personal_Administrativo (
    cedula VARCHAR(15),
    fecha_inicio DATE,
    cargo_administrativo VARCHAR(100) NOT NULL,
    carga_semanal INT,
    unidad_adscripcion VARCHAR(100),
    PRIMARY KEY (cedula, fecha_inicio),
    FOREIGN KEY (cedula, fecha_inicio) REFERENCES Vinculacion(cedula, fecha_inicio) ON DELETE CASCADE
);

CREATE TABLE Egresado (
    cedula VARCHAR(15),
    fecha_inicio DATE,
    año_graduacion INT NOT NULL,
    titulo_obtenido VARCHAR(150) NOT NULL,
    indice_final DECIMAL(4,2) NOT NULL,
    PRIMARY KEY (cedula, fecha_inicio),
    FOREIGN KEY (cedula, fecha_inicio) REFERENCES Vinculacion(cedula, fecha_inicio) ON DELETE CASCADE
);

-- ============================================================================
-- 7. SUB-ROLES (Dependen de Estudiante)
-- ============================================================================

CREATE TABLE Becario (
    cedula VARCHAR(15),
    fecha_inicio DATE,
    tipo_beca VARCHAR(50) CHECK (tipo_beca IN ('ayuda económica', 'excelencia', 'comedor')), -- R-06
    estatus_beneficio VARCHAR(20) DEFAULT 'Activo',
    indice_mantenimiento DECIMAL(4,2),
    PRIMARY KEY (cedula, fecha_inicio),
    FOREIGN KEY (cedula, fecha_inicio) REFERENCES Estudiante(cedula, fecha_inicio) ON DELETE CASCADE
);

CREATE TABLE Preparador (
    cedula VARCHAR(15),
    fecha_inicio DATE,
    horas_ayudantia INT NOT NULL,
    asignatura_asignada VARCHAR(100) NOT NULL,
    PRIMARY KEY (cedula, fecha_inicio),
    FOREIGN KEY (cedula, fecha_inicio) REFERENCES Estudiante(cedula, fecha_inicio) ON DELETE CASCADE
);

-- ============================================================================
-- 8. BENEFICIARIOS (Vínculo Familiar)
-- ============================================================================

CREATE TABLE Beneficiario (
    cedula_miembro VARCHAR(15),
    cedula_beneficiario VARCHAR(15),
    nombres VARCHAR(100) NOT NULL,
    apellidos VARCHAR(100) NOT NULL,
    parentesco VARCHAR(50) NOT NULL,
    fecha_inicio_cobertura DATE NOT NULL,
    fecha_fin_cobertura DATE,
    beneficios_activos BOOLEAN DEFAULT TRUE,
    fecha_nacimiento DATE NOT NULL,
    PRIMARY KEY (cedula_miembro, cedula_beneficiario),
    FOREIGN KEY (cedula_miembro) REFERENCES Miembro_comunidad(cedula) ON DELETE CASCADE
);

CREATE TABLE Carga_menor (
    cedula_miembro VARCHAR(15),
    cedula_beneficiario VARCHAR(15),
    esquema_vacunacion TEXT,
    centro_educacion_inicial VARCHAR(150),
    PRIMARY KEY (cedula_miembro, cedula_beneficiario),
    FOREIGN KEY (cedula_miembro, cedula_beneficiario) REFERENCES Beneficiario(cedula_miembro, cedula_beneficiario) ON DELETE CASCADE
);

CREATE TABLE Carga_mayor (
    cedula_miembro VARCHAR(15),
    cedula_beneficiario VARCHAR(15),
    constancia_estudios BOOLEAN DEFAULT FALSE,
    certificado_solteria BOOLEAN DEFAULT FALSE,
    PRIMARY KEY (cedula_miembro, cedula_beneficiario),
    FOREIGN KEY (cedula_miembro, cedula_beneficiario) REFERENCES Beneficiario(cedula_miembro, cedula_beneficiario) ON DELETE CASCADE
);

-- ============================================================================
-- 9. INFRAESTRUCTURA GEOGRÁFICA
-- ============================================================================

CREATE TABLE Sede (
    nombre_sede VARCHAR(50) PRIMARY KEY CHECK (nombre_sede IN ('Montalbán', 'Guayana')), -- R-08: Nombres limitados
    ajuste_ubicacion DECIMAL(4,2) DEFAULT 1.00 -- Multiplicador financiero (Ej. 1.00 = 100%, 0.80 = 80%)
);

CREATE TABLE Edificacion (
    nombre_sede VARCHAR(50),
    nombre_edificacion VARCHAR(100),
    PRIMARY KEY (nombre_sede, nombre_edificacion),
    FOREIGN KEY (nombre_sede) REFERENCES Sede(nombre_sede) ON DELETE CASCADE
);

CREATE TABLE Espacio_fisico (
    nombre_sede VARCHAR(50),
    nombre_edificacion VARCHAR(100),
    nro_identificador VARCHAR(20),
    capacidad_max INT NOT NULL,
    tipo_mobiliario VARCHAR(100),
    recursos_tecnologicos TEXT,
    estado_mantenimiento VARCHAR(50) DEFAULT 'Operativo',
    estatus_disponibilidad VARCHAR(50) DEFAULT 'Disponible',
    PRIMARY KEY (nombre_sede, nombre_edificacion, nro_identificador),
    FOREIGN KEY (nombre_sede, nombre_edificacion) REFERENCES Edificacion(nombre_sede, nombre_edificacion) ON DELETE CASCADE
);

-- ============================================================================
-- 10. REQUISITOS GENERALES
-- ============================================================================

CREATE TABLE Requisito (
    nombre_requisito VARCHAR(100) PRIMARY KEY,
    tipo_acreditacion VARCHAR(50) NOT NULL
);

-- ============================================================================
-- 11. ENTIDADES PRESTADORAS Y SERVICIOS
-- ============================================================================

CREATE TABLE Categoria_servicio (
    nombre_categoria VARCHAR(100) PRIMARY KEY,
    limite_costo_max DECIMAL(10,2) NOT NULL
);

CREATE TABLE Entidad_prestadora (
    id_entidad SERIAL PRIMARY KEY,
    nombre VARCHAR(150) NOT NULL,
    nombre_categoria VARCHAR(100) NOT NULL,
    FOREIGN KEY (nombre_categoria) REFERENCES Categoria_servicio(nombre_categoria) ON DELETE RESTRICT
);

CREATE TABLE Interna (
    id_entidad INT PRIMARY KEY,
    codigo_presupuestario VARCHAR(50) NOT NULL,
    director_oficina VARCHAR(100) NOT NULL,
    FOREIGN KEY (id_entidad) REFERENCES Entidad_prestadora(id_entidad) ON DELETE CASCADE
);

CREATE TABLE Externa (
    id_entidad INT PRIMARY KEY,
    rif VARCHAR(20) NOT NULL,
    razon_social VARCHAR(150) NOT NULL,
    contactos_legales TEXT,
    fecha_vencimiento_contrato DATE NOT NULL,
    FOREIGN KEY (id_entidad) REFERENCES Entidad_prestadora(id_entidad) ON DELETE CASCADE
);

-- Bolsa de Trabajo (Solo para Externas)
CREATE TABLE Vacante (
    id_vacante SERIAL PRIMARY KEY,
    cargo VARCHAR(100) NOT NULL,
    estatus_vacante VARCHAR(20) DEFAULT 'disponible' CHECK (estatus_vacante IN ('disponible', 'finalizada')), -- R-11
    fecha_oferta DATE NOT NULL,
    perfil_buscado TEXT,
    beneficios TEXT,
    responsabilidades TEXT,
    id_entidad INT NOT NULL,
    FOREIGN KEY (id_entidad) REFERENCES Externa(id_entidad) ON DELETE CASCADE
);

CREATE TABLE Se_postula (
    cedula VARCHAR(15),
    fecha_inicio DATE,
    id_vacante INT,
    fecha_postulacion DATE NOT NULL,
    estatus_seleccion VARCHAR(30) DEFAULT 'en revisión' CHECK (estatus_seleccion IN ('en revisión', 'entrevistado', 'contratado', 'rechazado')), -- R-18
    PRIMARY KEY (cedula, fecha_inicio, id_vacante),
    FOREIGN KEY (cedula, fecha_inicio) REFERENCES Egresado(cedula, fecha_inicio) ON DELETE CASCADE,
    FOREIGN KEY (id_vacante) REFERENCES Vacante(id_vacante) ON DELETE CASCADE
);

CREATE TABLE Servicio (
    codigo_servicio VARCHAR(50) PRIMARY KEY,
    descripcion_detallada TEXT NOT NULL,
    precio_base DECIMAL(10,2) NOT NULL,
    requisitos_acceso TEXT,
    id_entidad INT NOT NULL,
    FOREIGN KEY (id_entidad) REFERENCES Entidad_prestadora(id_entidad) ON DELETE RESTRICT
);

CREATE TABLE Cargos_Adicionales_Servicio (
    codigo_servicio VARCHAR(50),
    concepto VARCHAR(100),
    costo DECIMAL(10,2) NOT NULL,
    PRIMARY KEY (codigo_servicio, concepto),
    FOREIGN KEY (codigo_servicio) REFERENCES Servicio(codigo_servicio) ON DELETE CASCADE
);

CREATE TABLE Servicio_Requisito (
    codigo_servicio VARCHAR(50),
    nombre_requisito VARCHAR(100),
    PRIMARY KEY (codigo_servicio, nombre_requisito),
    FOREIGN KEY (codigo_servicio) REFERENCES Servicio(codigo_servicio) ON DELETE CASCADE,
    FOREIGN KEY (nombre_requisito) REFERENCES Requisito(nombre_requisito) ON DELETE CASCADE
);

CREATE TABLE Tarifa (
    codigo_servicio VARCHAR(50),
    id_tarifa SERIAL,
    perfil_solicitante VARCHAR(50) CHECK (perfil_solicitante IN ('miembro activo', 'egresado', 'público externo')), -- R-10
    fecha_inicio_vigencia DATE NOT NULL,
    monto DECIMAL(10,2) NOT NULL,
    PRIMARY KEY (codigo_servicio, id_tarifa),
    FOREIGN KEY (codigo_servicio) REFERENCES Servicio(codigo_servicio) ON DELETE CASCADE
);

CREATE TABLE Servicio_Sede (
    codigo_servicio VARCHAR(50),
    nombre_sede VARCHAR(50),
    PRIMARY KEY (codigo_servicio, nombre_sede),
    FOREIGN KEY (codigo_servicio) REFERENCES Servicio(codigo_servicio) ON DELETE CASCADE,
    FOREIGN KEY (nombre_sede) REFERENCES Sede(nombre_sede) ON DELETE CASCADE
);

-- ============================================================================
-- 12. GESTIÓN DE TRÁMITES Y SOLICITUDES
-- ============================================================================

CREATE TABLE Solicitud_Servicio (
    cedula_miembro VARCHAR(15),
    nro_solicitud SERIAL,
    fecha_creacion DATE NOT NULL,
    estatus_general VARCHAR(50) DEFAULT 'Abierta',
    fecha_cierre DATE,
    codigo_servicio VARCHAR(50) NOT NULL,
    nombre_sede_asignada VARCHAR(50),
    nombre_edificacion_asignada VARCHAR(100),
    nro_identificador_asignado VARCHAR(20),
    PRIMARY KEY (cedula_miembro, nro_solicitud),
    FOREIGN KEY (cedula_miembro) REFERENCES Miembro_comunidad(cedula) ON DELETE CASCADE,
    FOREIGN KEY (codigo_servicio) REFERENCES Servicio(codigo_servicio) ON DELETE RESTRICT,
    FOREIGN KEY (nombre_sede_asignada, nombre_edificacion_asignada, nro_identificador_asignado) REFERENCES Espacio_fisico(nombre_sede, nombre_edificacion, nro_identificador) ON DELETE SET NULL,
    CONSTRAINT chk_fechas_solicitud CHECK (fecha_cierre IS NULL OR fecha_cierre >= fecha_creacion) -- R-25
);

CREATE TABLE Acompañante (
    cedula_miembro VARCHAR(15),
    nro_solicitud INT,
    cedula_acompañante VARCHAR(15),
    nombre VARCHAR(150) NOT NULL,
    PRIMARY KEY (cedula_miembro, nro_solicitud, cedula_acompañante),
    FOREIGN KEY (cedula_miembro, nro_solicitud) REFERENCES Solicitud_Servicio(cedula_miembro, nro_solicitud) ON DELETE CASCADE
);

CREATE TABLE Paso_Actividad (
    cedula_miembro VARCHAR(15),
    nro_solicitud INT,
    nro_paso INT,
    descripcion TEXT NOT NULL,
    fecha_hora_inicio TIMESTAMP NOT NULL,
    fecha_hora_fin TIMESTAMP,
    estatus VARCHAR(20) DEFAULT 'pendiente' CHECK (estatus IN ('pendiente', 'en progreso', 'completado')), -- R-13
    cedula_admin VARCHAR(15),
    fecha_inicio_admin DATE,
    PRIMARY KEY (cedula_miembro, nro_solicitud, nro_paso),
    FOREIGN KEY (cedula_miembro, nro_solicitud) REFERENCES Solicitud_Servicio(cedula_miembro, nro_solicitud) ON DELETE CASCADE,
    FOREIGN KEY (cedula_admin, fecha_inicio_admin) REFERENCES Personal_Administrativo(cedula, fecha_inicio) ON DELETE SET NULL,
    CONSTRAINT chk_tiempos_paso CHECK (fecha_hora_fin IS NULL OR fecha_hora_fin >= fecha_hora_inicio) -- R-12
);

-- ============================================================================
-- 13. GESTIÓN FINANCIERA Y PAGOS
-- ============================================================================

CREATE TABLE Folio_Consumo (
    cedula_miembro VARCHAR(15),
    nro_solicitud INT,
    nro_folio SERIAL,
    fecha_apertura DATE NOT NULL,
    PRIMARY KEY (cedula_miembro, nro_solicitud, nro_folio),
    FOREIGN KEY (cedula_miembro, nro_solicitud) REFERENCES Solicitud_Servicio(cedula_miembro, nro_solicitud) ON DELETE CASCADE
);

CREATE TABLE Linea_Cargo (
    cedula_miembro VARCHAR(15),
    nro_solicitud INT,
    nro_folio INT,
    nro_linea INT,
    concepto VARCHAR(150) NOT NULL,
    cantidad INT NOT NULL,
    precio_unitario DECIMAL(10,2) NOT NULL,
    impuestos DECIMAL(10,2) DEFAULT 0.00,
    PRIMARY KEY (cedula_miembro, nro_solicitud, nro_folio, nro_linea),
    FOREIGN KEY (cedula_miembro, nro_solicitud, nro_folio) REFERENCES Folio_Consumo(cedula_miembro, nro_solicitud, nro_folio) ON DELETE CASCADE
);

CREATE TABLE Factura (
    nro_control SERIAL PRIMARY KEY,
    fecha_emision DATE NOT NULL,
    saldo DECIMAL(12,2) NOT NULL CHECK (saldo >= 0), -- R-14
    estatus VARCHAR(30) DEFAULT 'Pendiente',
    rif VARCHAR(20),
    razon_social VARCHAR(150),
    cedula_titular VARCHAR(15) NOT NULL,
    cedula_miembro_folio VARCHAR(15) NOT NULL,
    nro_solicitud_folio INT NOT NULL,
    nro_folio INT NOT NULL,
    FOREIGN KEY (cedula_titular) REFERENCES Miembro_comunidad(cedula) ON DELETE RESTRICT,
    FOREIGN KEY (cedula_miembro_folio, nro_solicitud_folio, nro_folio) REFERENCES Folio_Consumo(cedula_miembro, nro_solicitud, nro_folio) ON DELETE RESTRICT
);

-- Raíz de Pagos
CREATE TABLE Pago (
    id_pago SERIAL PRIMARY KEY,
    fecha_pago TIMESTAMP NOT NULL,
    monto DECIMAL(12,2) NOT NULL CHECK (monto > 0), -- R-15
    nro_control INT NOT NULL,
    FOREIGN KEY (nro_control) REFERENCES Factura(nro_control) ON DELETE RESTRICT
);

-- Nivel 1: Presencial vs Digital
CREATE TABLE Pago_presencial (
    id_pago INT PRIMARY KEY,
    tasa_bcv DECIMAL(10,2) NOT NULL,
    FOREIGN KEY (id_pago) REFERENCES Pago(id_pago) ON DELETE CASCADE
);

CREATE TABLE Pago_digital (
    id_pago INT PRIMARY KEY,
    FOREIGN KEY (id_pago) REFERENCES Pago(id_pago) ON DELETE CASCADE
);

-- Nivel 2: Métodos Digitales
CREATE TABLE Criptomoneda (
    id_pago INT PRIMARY KEY,
    tasa_conversion DECIMAL(15,4) NOT NULL,
    hash_txid VARCHAR(255) NOT NULL,
    red_utilizada VARCHAR(50) NOT NULL,
    billetera_origen VARCHAR(255) NOT NULL,
    FOREIGN KEY (id_pago) REFERENCES Pago_digital(id_pago) ON DELETE CASCADE
);

CREATE TABLE Zelle (
    id_pago INT PRIMARY KEY,
    correo_origen VARCHAR(100) NOT NULL,
    nombre_titular VARCHAR(150) NOT NULL,
    codigo_transaccion VARCHAR(100) NOT NULL,
    FOREIGN KEY (id_pago) REFERENCES Pago_digital(id_pago) ON DELETE CASCADE
);

-- Nivel 2: Métodos Presenciales
CREATE TABLE Tarjeta (
    id_pago INT PRIMARY KEY,
    nro_tarjeta VARCHAR(20) NOT NULL,
    fecha_vencimiento VARCHAR(5) NOT NULL,
    compania_emisora VARCHAR(50) NOT NULL,
    tipo_red VARCHAR(50) CHECK (tipo_red IN ('Nacional', 'Internacional')), -- R-16
    FOREIGN KEY (id_pago) REFERENCES Pago_presencial(id_pago) ON DELETE CASCADE
);

CREATE TABLE PagoMovil (
    id_pago INT PRIMARY KEY,
    nro_telefono VARCHAR(20) NOT NULL,
    fecha_movimiento DATE NOT NULL,
    banco_origen VARCHAR(50) NOT NULL,
    nro_referencia VARCHAR(100) NOT NULL,
    FOREIGN KEY (id_pago) REFERENCES Pago_presencial(id_pago) ON DELETE CASCADE
);

CREATE TABLE Efectivo (
    id_pago INT PRIMARY KEY,
    moneda_curso VARCHAR(20) CHECK (moneda_curso IN ('bolívares', 'divisas')), -- R-17
    monto_recibido DECIMAL(12,2) NOT NULL,
    desglose_denominaciones TEXT,
    FOREIGN KEY (id_pago) REFERENCES Pago_presencial(id_pago) ON DELETE CASCADE
);

CREATE TABLE BilleteraTAI (
    id_pago INT PRIMARY KEY,
    uid_chip VARCHAR(100) NOT NULL,
    codigo_terminal_pos VARCHAR(50) NOT NULL,
    FOREIGN KEY (id_pago) REFERENCES Pago_presencial(id_pago) ON DELETE CASCADE
);