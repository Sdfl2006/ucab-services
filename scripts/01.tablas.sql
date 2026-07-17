-- ============================================================================
-- SCRIPT 01: DDL TABLAS (ESTRUCTURA NORMALIZADA COMPLETA)
-- PROYECTO: UCAB SERVICES
-- ============================================================================

BEGIN;

DROP SCHEMA public CASCADE;
CREATE SCHEMA public;

-- ============================================================================
-- 1. NÚCLEO DE USUARIOS Y ROLES
-- ============================================================================

CREATE TABLE Miembro_comunidad (
    cedula VARCHAR(15) PRIMARY KEY,
    correo VARCHAR(100) UNIQUE NOT NULL,
    nombres VARCHAR(100) NOT NULL,
    telefono VARCHAR(20),
    apellidos VARCHAR(100) NOT NULL,
    sexo CHAR(1) CHECK (sexo IN ('M', 'F')),
    ciudad VARCHAR(50) NOT NULL,
    municipio VARCHAR(50) NOT NULL,
    calle VARCHAR(100) NOT NULL,
    categoria_fidelidad VARCHAR(20) DEFAULT 'Regular' 
    CHECK (categoria_fidelidad IN ('Regular', 'Frecuente', 'Preferencial'))
);

CREATE TABLE Estudiante (
    cedula VARCHAR(15) PRIMARY KEY,
    promedio DECIMAL(4,2),
    facultad VARCHAR(100),
    semestre_actual INT,
    escuela VARCHAR(100),
    uc_aprobadas INT,
    estatus_beca VARCHAR(20),
    FOREIGN KEY (cedula) REFERENCES Miembro_comunidad(cedula) ON DELETE CASCADE
);

CREATE TABLE Profesor (
    cedula VARCHAR(15) PRIMARY KEY,
    escalafon_docente VARCHAR(50),
    carga_semanal INT,
    cod_investigador VARCHAR(50),
    FOREIGN KEY (cedula) REFERENCES Miembro_comunidad(cedula) ON DELETE CASCADE
);

CREATE TABLE Personal_Administrativo (
    cedula VARCHAR(15) PRIMARY KEY,
    cargo_administrativo VARCHAR(100),
    unidad_adscripcion VARCHAR(100),
    carga_semanal INT,
    FOREIGN KEY (cedula) REFERENCES Miembro_comunidad(cedula) ON DELETE CASCADE
);

CREATE TABLE Egresado (
    cedula VARCHAR(15) PRIMARY KEY,
    indice_final DECIMAL(4,2),
    año_graduacion INT,
    titulo_obtenido VARCHAR(100),
    FOREIGN KEY (cedula) REFERENCES Miembro_comunidad(cedula) ON DELETE CASCADE
);

-- TABLA TRANSACCIONAL DE TIEMPO
CREATE TABLE Periodo (
    cedula VARCHAR(15),
    fecha_inicio DATE NOT NULL,
    fecha_fin DATE,
    PRIMARY KEY (cedula, fecha_inicio),
    FOREIGN KEY (cedula) REFERENCES Miembro_comunidad(cedula) ON DELETE CASCADE,
    CHECK (fecha_fin IS NULL OR fecha_fin >= fecha_inicio)
);

-- ============================================================================
-- 2. SUBTIPOS DE ESTUDIANTE Y FAMILIARES
-- ============================================================================

CREATE TABLE Becario (
    cedula VARCHAR(15) PRIMARY KEY,
    tipo_beca VARCHAR(50) CHECK (tipo_beca IN ('ayuda económica', 'excelencia', 'comedor')),
    estatus_beneficio VARCHAR(50),
    indice_mantenimiento DECIMAL(4,2),
    FOREIGN KEY (cedula) REFERENCES Estudiante(cedula) ON DELETE CASCADE
);

CREATE TABLE Preparador (
    cedula VARCHAR(15) PRIMARY KEY,
    horas_ayudantia INT NOT NULL,
    asignatura_asignada VARCHAR(100),
    FOREIGN KEY (cedula) REFERENCES Estudiante(cedula) ON DELETE CASCADE
);

CREATE TABLE Beneficiario (
    cedula_beneficiario VARCHAR(15) PRIMARY KEY,
    cedula_titular VARCHAR(15) NOT NULL,
    nombres VARCHAR(100) NOT NULL,
    apellidos VARCHAR(100) NOT NULL,
    parentesco VARCHAR(50),
    fecha_nacimiento DATE,
    fecha_inicio_cobertura DATE,
    fecha_fin_cobertura DATE,
    beneficios_activos BOOLEAN,
    FOREIGN KEY (cedula_titular) REFERENCES Miembro_comunidad(cedula) ON DELETE CASCADE
);

CREATE TABLE Carga_menor (
    cedula_beneficiario VARCHAR(15) PRIMARY KEY,
    esquema_vacunacion TEXT,
    centro_educacion_inicial VARCHAR(100),
    FOREIGN KEY (cedula_beneficiario) REFERENCES Beneficiario(cedula_beneficiario) ON DELETE CASCADE
);

CREATE TABLE Carga_mayor (
    cedula_beneficiario VARCHAR(15) PRIMARY KEY,
    constancia_estudios VARCHAR(255),
    certificado_solteria VARCHAR(255),
    FOREIGN KEY (cedula_beneficiario) REFERENCES Beneficiario(cedula_beneficiario) ON DELETE CASCADE
);

-- ============================================================================
-- 3. SEGURIDAD Y CUENTAS
-- ============================================================================

CREATE TABLE Cuenta (
    cedula VARCHAR(20) PRIMARY KEY REFERENCES Miembro_comunidad(cedula) ON DELETE CASCADE,
    contrasena VARCHAR(255) NOT NULL DEFAULT '123456',
    fecha_cambio_clave DATE DEFAULT CURRENT_DATE,
    ultima_conexion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    estado_cuenta VARCHAR(20) DEFAULT 'activa' CHECK (estado_cuenta IN ('activa', 'suspendida', 'bloqueada')),
    estatus VARCHAR(20) DEFAULT 'habilitado' CHECK (estatus IN ('habilitado', 'deshabilitado')), -- Control MFA / 2FA
    intentos_fallidos INTEGER DEFAULT 0
);

CREATE TABLE Sesion (
    cedula VARCHAR(15),
    fecha_hora_acceso TIMESTAMP,
    direccion_ip VARCHAR(45) NOT NULL,
    uuid_dispositivo VARCHAR(100) NOT NULL,
    geolocalizacion VARCHAR(100),
    PRIMARY KEY (cedula, fecha_hora_acceso),
    FOREIGN KEY (cedula) REFERENCES Cuenta(cedula) ON DELETE CASCADE
);

-- ============================================================================
-- 4. INFRAESTRUCTURA
-- ============================================================================

CREATE TABLE Sede (
    nombre_sede VARCHAR(100) PRIMARY KEY CHECK (nombre_sede IN ('Montalbán', 'Guayana')),
    ajuste_ubicacion DECIMAL(5,2)
);

CREATE TABLE Edificacion (
    nombre_edificacion VARCHAR(100) PRIMARY KEY,
    nombre_sede VARCHAR(100) NOT NULL,
    FOREIGN KEY (nombre_sede) REFERENCES Sede(nombre_sede)
);

CREATE TABLE Espacio_fisico (
    nro_identificador VARCHAR(50) PRIMARY KEY,
    nombre_edificacion VARCHAR(100) NOT NULL,
    capacidad_max INT,
    tipo_mobiliario VARCHAR(100),
    recursos_tecnologicos TEXT,
    estado_mantenimiento VARCHAR(50),
    estatus_disponibilidad VARCHAR(20),
    FOREIGN KEY (nombre_edificacion) REFERENCES Edificacion(nombre_edificacion)
);

-- ============================================================================
-- 5. ENTIDADES PRESTADORAS Y SERVICIOS
-- ============================================================================

CREATE TABLE Categoria_servicio (
    nombre_categoria VARCHAR(100) PRIMARY KEY,
    limite_costo_max DECIMAL(10,2) NOT NULL
);

CREATE TABLE Entidad_prestadora (
    nombre_entidad VARCHAR(100) PRIMARY KEY
);

CREATE TABLE Interna (
    nombre_entidad VARCHAR(100) PRIMARY KEY,
    codigo_presupuestario VARCHAR(50),
    director_oficina VARCHAR(100),
    FOREIGN KEY (nombre_entidad) REFERENCES Entidad_prestadora(nombre_entidad) ON DELETE CASCADE
);

CREATE TABLE Externa (
    nombre_entidad VARCHAR(100) PRIMARY KEY,
    rif VARCHAR(20) UNIQUE NOT NULL,
    razon_social VARCHAR(150),
    fecha_vencimiento_contrato DATE,
    contactos_legales TEXT,
    FOREIGN KEY (nombre_entidad) REFERENCES Entidad_prestadora(nombre_entidad) ON DELETE CASCADE
);

CREATE TABLE Vacante (
    nombre_entidad VARCHAR(100),
    cargo VARCHAR(100),
    fecha_oferta DATE,
    responsabilidades TEXT,
    beneficios TEXT,
    perfil_buscado TEXT,
    estatus_vacante VARCHAR(20) CHECK (estatus_vacante IN ('disponible', 'finalizada')),
    PRIMARY KEY (nombre_entidad, cargo, fecha_oferta),
    FOREIGN KEY (nombre_entidad) REFERENCES Externa(nombre_entidad) ON DELETE CASCADE
);

CREATE TABLE Postulacion (
    cedula VARCHAR(15),
    nombre_entidad VARCHAR(100),
    cargo VARCHAR(100),
    fecha_oferta DATE,
    fecha_postulacion DATE DEFAULT CURRENT_DATE,
    estatus_seleccion VARCHAR(50) DEFAULT 'en revisión' CHECK (estatus_seleccion IN ('en revisión', 'entrevistado', 'contratado', 'rechazado')),
    PRIMARY KEY (cedula, nombre_entidad, cargo, fecha_oferta),
    FOREIGN KEY (cedula) REFERENCES Egresado(cedula) ON DELETE CASCADE,
    FOREIGN KEY (nombre_entidad, cargo, fecha_oferta) REFERENCES Vacante(nombre_entidad, cargo, fecha_oferta) ON DELETE CASCADE
);

CREATE TABLE Servicio (
    codigo_servicio VARCHAR(20) PRIMARY KEY,
    nombre_entidad VARCHAR(100) NOT NULL,
    nombre_categoria VARCHAR(100) NOT NULL,
    descripcion_detallada TEXT,
    precio_base DECIMAL(10,2) NOT NULL,
    FOREIGN KEY (nombre_entidad) REFERENCES Entidad_prestadora(nombre_entidad),
    FOREIGN KEY (nombre_categoria) REFERENCES Categoria_servicio(nombre_categoria)
);

CREATE TABLE Cargos_adicionales (
    codigo_servicio VARCHAR(20),
    concepto VARCHAR(100),
    costo DECIMAL(10,2) NOT NULL,
    PRIMARY KEY (codigo_servicio, concepto),
    FOREIGN KEY (codigo_servicio) REFERENCES Servicio(codigo_servicio) ON DELETE CASCADE
);

CREATE TABLE Tarifa (
    codigo_servicio VARCHAR(20),
    id INT,
    fecha_inicio_vigencia DATE,
    perfil_solicitante VARCHAR(50) CHECK (perfil_solicitante IN ('miembro activo', 'egresado', 'público externo')),
    monto DECIMAL(10,2) NOT NULL,
    PRIMARY KEY (codigo_servicio, id),
    FOREIGN KEY (codigo_servicio) REFERENCES Servicio(codigo_servicio) ON DELETE CASCADE
);

CREATE TABLE Requisito (
    nombre_requisito VARCHAR(100) PRIMARY KEY,
    tipo_acreditacion VARCHAR(50)
);

CREATE TABLE Servicio_Requisito (
    codigo_servicio VARCHAR(20),
    nombre_requisito VARCHAR(100),
    PRIMARY KEY (codigo_servicio, nombre_requisito),
    FOREIGN KEY (codigo_servicio) REFERENCES Servicio(codigo_servicio) ON DELETE CASCADE,
    FOREIGN KEY (nombre_requisito) REFERENCES Requisito(nombre_requisito) ON DELETE CASCADE
);

CREATE TABLE Servicio_Sede (
    codigo_servicio VARCHAR(20),
    nombre_sede VARCHAR(100),
    PRIMARY KEY (codigo_servicio, nombre_sede),
    FOREIGN KEY (codigo_servicio) REFERENCES Servicio(codigo_servicio) ON DELETE CASCADE,
    FOREIGN KEY (nombre_sede) REFERENCES Sede(nombre_sede) ON DELETE CASCADE
);

-- ============================================================================
-- 6. FLUJO DE TRÁMITES
-- ============================================================================

CREATE TABLE Solicitud_Servicio (
    nro_solicitud SERIAL PRIMARY KEY,
    cedula_miembro VARCHAR(15) NOT NULL,
    codigo_servicio VARCHAR(20) NOT NULL,
    nro_identificador_espacio VARCHAR(50), 
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_cierre TIMESTAMP,
    estatus_general VARCHAR(20) DEFAULT 'en_proceso',
    FOREIGN KEY (cedula_miembro) REFERENCES Miembro_comunidad(cedula),
    FOREIGN KEY (codigo_servicio) REFERENCES Servicio(codigo_servicio),
    FOREIGN KEY (nro_identificador_espacio) REFERENCES Espacio_fisico(nro_identificador),
    CHECK (fecha_cierre IS NULL OR fecha_cierre >= fecha_creacion)
);

CREATE TABLE Paso_Actividad (
    nro_solicitud INT,
    nro_paso INT,
    descripcion VARCHAR(255) NOT NULL,
    estatus VARCHAR(20) DEFAULT 'pendiente' CHECK (estatus IN ('pendiente', 'en progreso', 'completado')),
    cedula_admin VARCHAR(15), 
    fecha_hora_inicio TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_hora_fin TIMESTAMP,
    PRIMARY KEY (nro_solicitud, nro_paso),
    FOREIGN KEY (nro_solicitud) REFERENCES Solicitud_Servicio(nro_solicitud) ON DELETE CASCADE,
    FOREIGN KEY (cedula_admin) REFERENCES Personal_Administrativo(cedula),
    CHECK (fecha_hora_fin IS NULL OR fecha_hora_fin >= fecha_hora_inicio)
);

CREATE TABLE Acompanante (
    cedula_acompanante VARCHAR(15) PRIMARY KEY,
    nro_solicitud INT NOT NULL,
    nombre VARCHAR(150) NOT NULL,
    FOREIGN KEY (nro_solicitud) REFERENCES Solicitud_Servicio(nro_solicitud) ON DELETE CASCADE
);

-- ============================================================================
-- 7. FACTURACIÓN Y PAGOS 
-- ============================================================================

CREATE TABLE Folio_Consumo (
    nro_solicitud INT,
    fecha_apertura TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (nro_solicitud, fecha_apertura),
    FOREIGN KEY (nro_solicitud) REFERENCES Solicitud_Servicio(nro_solicitud) ON DELETE CASCADE
);

CREATE TABLE Linea_Cargo (
    nro_solicitud INT,
    fecha_apertura_folio TIMESTAMP,
    nro_linea INT,
    concepto VARCHAR(150) NOT NULL,
    cantidad INT NOT NULL,
    impuestos DECIMAL(10,2) DEFAULT 0,
    precio_unitario DECIMAL(10,2) NOT NULL,
    PRIMARY KEY (nro_solicitud, fecha_apertura_folio, nro_linea),
    FOREIGN KEY (nro_solicitud, fecha_apertura_folio) REFERENCES Folio_Consumo(nro_solicitud, fecha_apertura) ON DELETE CASCADE
);

CREATE TABLE Factura (
    nro_control SERIAL PRIMARY KEY,
    nro_solicitud INT NOT NULL,
    fecha_apertura_folio TIMESTAMP NOT NULL,
    fecha_emision TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    saldo DECIMAL(10,2) NOT NULL CHECK (saldo >= 0),
    estatus VARCHAR(20) DEFAULT 'Pendiente',
    cedula_titular VARCHAR(15) NOT NULL,
    rif_corporativo VARCHAR(20),
    razon_social_corporativa VARCHAR(150),
    FOREIGN KEY (nro_solicitud, fecha_apertura_folio) REFERENCES Folio_Consumo(nro_solicitud, fecha_apertura),
    FOREIGN KEY (cedula_titular) REFERENCES Miembro_comunidad(cedula)
);

CREATE TABLE Pago (
    nro_control_factura INT,
    fecha_pago TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    monto DECIMAL(10,2) NOT NULL CHECK (monto > 0),
    PRIMARY KEY (nro_control_factura, fecha_pago),
    FOREIGN KEY (nro_control_factura) REFERENCES Factura(nro_control) ON DELETE CASCADE
);

CREATE TABLE Pago_Presencial (
    nro_control_factura INT,
    fecha_pago TIMESTAMP,
    tasa_bcv DECIMAL(10,4),
    PRIMARY KEY (nro_control_factura, fecha_pago),
    FOREIGN KEY (nro_control_factura, fecha_pago) REFERENCES Pago(nro_control_factura, fecha_pago) ON DELETE CASCADE
);

CREATE TABLE Pago_Digital (
    nro_control_factura INT,
    fecha_pago TIMESTAMP,
    PRIMARY KEY (nro_control_factura, fecha_pago),
    FOREIGN KEY (nro_control_factura, fecha_pago) REFERENCES Pago(nro_control_factura, fecha_pago) ON DELETE CASCADE
);

CREATE TABLE Pago_Zelle (
    nro_control_factura INT,
    fecha_pago TIMESTAMP,
    correo_origen VARCHAR(100) NOT NULL,
    nombre_titular VARCHAR(150) NOT NULL,
    codigo_transaccion VARCHAR(50) UNIQUE NOT NULL,
    PRIMARY KEY (nro_control_factura, fecha_pago),
    FOREIGN KEY (nro_control_factura, fecha_pago) REFERENCES Pago_Digital(nro_control_factura, fecha_pago) ON DELETE CASCADE
);

CREATE TABLE Pago_Criptomoneda (
    nro_control_factura INT,
    fecha_pago TIMESTAMP,
    hash_txid VARCHAR(100) UNIQUE NOT NULL,
    red_utilizada VARCHAR(20) NOT NULL,
    billetera_origen VARCHAR(100) NOT NULL,
    tasa_conversion DECIMAL(10,4) NOT NULL,
    PRIMARY KEY (nro_control_factura, fecha_pago),
    FOREIGN KEY (nro_control_factura, fecha_pago) REFERENCES Pago_Digital(nro_control_factura, fecha_pago) ON DELETE CASCADE
);

CREATE TABLE Pago_Tarjeta (
    nro_control_factura INT,
    fecha_pago TIMESTAMP,
    nro_tarjeta VARCHAR(20) NOT NULL,
    fecha_vencimiento VARCHAR(5) NOT NULL,
    compania_emisora VARCHAR(50) NOT NULL,
    tipo_red VARCHAR(20) NOT NULL CHECK (tipo_red IN ('Nacional', 'Internacional')),
    PRIMARY KEY (nro_control_factura, fecha_pago),
    FOREIGN KEY (nro_control_factura, fecha_pago) REFERENCES Pago_Presencial(nro_control_factura, fecha_pago) ON DELETE CASCADE
);

CREATE TABLE Pago_Movil (
    nro_control_factura INT,
    fecha_pago TIMESTAMP,
    nro_telefono VARCHAR(20) NOT NULL,
    fecha_movimiento TIMESTAMP,
    banco_origen VARCHAR(50) NOT NULL,
    nro_referencia VARCHAR(50) UNIQUE NOT NULL,
    PRIMARY KEY (nro_control_factura, fecha_pago),
    FOREIGN KEY (nro_control_factura, fecha_pago) REFERENCES Pago_Presencial(nro_control_factura, fecha_pago) ON DELETE CASCADE
);

CREATE TABLE Pago_Efectivo (
    nro_control_factura INT,
    fecha_pago TIMESTAMP,
    moneda_curso VARCHAR(20) NOT NULL CHECK (moneda_curso IN ('bolívares', 'divisas')),
    monto_recibido DECIMAL(10,2) NOT NULL,
    desgloce_denominaciones TEXT,
    PRIMARY KEY (nro_control_factura, fecha_pago),
    FOREIGN KEY (nro_control_factura, fecha_pago) REFERENCES Pago_Presencial(nro_control_factura, fecha_pago) ON DELETE CASCADE
);

CREATE TABLE Pago_TAI (
    nro_control_factura INT,
    fecha_pago TIMESTAMP,
    uid_chip VARCHAR(50) NOT NULL,
    codigo_terminal_pos VARCHAR(50) NOT NULL,
    PRIMARY KEY (nro_control_factura, fecha_pago),
    FOREIGN KEY (nro_control_factura, fecha_pago) REFERENCES Pago_Presencial(nro_control_factura, fecha_pago) ON DELETE CASCADE
);

COMMIT;