-- ============================================================================
-- SCRIPT 01: DDL TABLAS (ESTRUCTURA NORMALIZADA)
-- PROYECTO: UCAB SERVICES
-- ============================================================================

BEGIN;

-- LIMPIEZA ABSOLUTA 
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;

-- ============================================================================
-- 1. NÚCLEO DE USUARIOS Y ROLES (Herencia Corregida)
-- ============================================================================

CREATE TABLE Miembro_comunidad (
    cedula VARCHAR(15) PRIMARY KEY,
    correo VARCHAR(100) UNIQUE NOT NULL,
    nombres VARCHAR(100) NOT NULL,
    apellidos VARCHAR(100) NOT NULL,
    sexo CHAR(1) CHECK (sexo IN ('M', 'F')),
    ciudad VARCHAR(50) NOT NULL,
    municipio VARCHAR(50) NOT NULL,
    calle VARCHAR(100) NOT NULL,
    categoria_fidelidad VARCHAR(20) DEFAULT 'Regular' CHECK (categoria_fidelidad IN ('Regular', 'Frecuente', 'Preferencial'))
);

CREATE TABLE Telefono_Miembro (
    cedula VARCHAR(15),
    telefono VARCHAR(20),
    PRIMARY KEY (cedula, telefono),
    FOREIGN KEY (cedula) REFERENCES Miembro_comunidad(cedula) ON DELETE CASCADE
);

-- ROLES FUERTES (Heredan de Miembro_comunidad)
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

-- TABLA TRANSACCIONAL DE TIEMPO (Antes "Vinculación")
CREATE TABLE Periodo (
    cedula VARCHAR(15),
    fecha_inicio DATE NOT NULL,
    fecha_fin DATE,
    PRIMARY KEY (cedula, fecha_inicio),
    FOREIGN KEY (cedula) REFERENCES Miembro_comunidad(cedula) ON DELETE CASCADE
);

-- ============================================================================
-- 2. SEGURIDAD Y CUENTAS (Entidades Débiles 1:1 y 1:N)
-- ============================================================================

-- Cuenta (Débil, clave heredada de Miembro)
CREATE TABLE Cuenta (
    cedula VARCHAR(15) PRIMARY KEY,
    fecha_cambio_clave DATE,
    estado_cuenta VARCHAR(15) DEFAULT 'activa',
    estatus VARCHAR(15) DEFAULT 'deshabilitado',
    intentos_fallidos INT DEFAULT 0,
    FOREIGN KEY (cedula) REFERENCES Miembro_comunidad(cedula) ON DELETE CASCADE
);

-- Sesion (Débil de Cuenta, clave compuesta)
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
-- 3. INFRAESTRUCTURA (Entidades Fuertes e Independientes)
-- ============================================================================

CREATE TABLE Sede (
    nombre_sede VARCHAR(100) PRIMARY KEY,
    ajuste_ubicacion DECIMAL(5,2)
);

-- Fuerte con clave natural
CREATE TABLE Edificacion (
    nombre_edificacion VARCHAR(100) PRIMARY KEY,
    nombre_sede VARCHAR(100) NOT NULL,
    FOREIGN KEY (nombre_sede) REFERENCES Sede(nombre_sede)
);

-- Fuerte con código propio
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
-- 4. ENTIDADES PRESTADORAS Y SERVICIOS (Claves Naturales)
-- ============================================================================

-- Categoria general
CREATE TABLE Categoria_servicio (
    nombre_categoria VARCHAR(100) PRIMARY KEY,
    limite_costo_max DECIMAL(10,2)
);

-- Padre Entidad Prestadora (Sin ID artificial)
CREATE TABLE Entidad_prestadora (
    nombre_entidad VARCHAR(100) PRIMARY KEY
);

-- Hijas de Entidad Prestadora
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

-- Vacante (Débil de Externa)
CREATE TABLE Vacante (
    nombre_entidad VARCHAR(100),
    cargo VARCHAR(100),
    fecha_oferta DATE,
    responsabilidades TEXT,
    beneficios TEXT,
    perfil_buscado TEXT,
    estatus_vacante VARCHAR(20),
    PRIMARY KEY (nombre_entidad, cargo, fecha_oferta),
    FOREIGN KEY (nombre_entidad) REFERENCES Externa(nombre_entidad) ON DELETE CASCADE
);

-- Catálogo de Servicios
CREATE TABLE Servicio (
    codigo_servicio VARCHAR(20) PRIMARY KEY,
    nombre_entidad VARCHAR(100) NOT NULL,
    descripcion_detallada TEXT,
    precio_base DECIMAL(10,2) NOT NULL,
    requisitos_acceso TEXT,
    FOREIGN KEY (nombre_entidad) REFERENCES Entidad_prestadora(nombre_entidad)
);

-- NUEVA TABLA: Cargos Adicionales (Resolviendo el "¿Cómo se calcula?")
CREATE TABLE Cargos_adicionales (
    codigo_servicio VARCHAR(20),
    concepto VARCHAR(100),
    costo DECIMAL(10,2) NOT NULL,
    PRIMARY KEY (codigo_servicio, concepto),
    FOREIGN KEY (codigo_servicio) REFERENCES Servicio(codigo_servicio) ON DELETE CASCADE
);

-- ============================================================================
-- 5. FLUJO DE TRÁMITES Y FINANZAS (Débiles por Existencia)
-- ============================================================================

CREATE TABLE Solicitud_Servicio (
    nro_solicitud SERIAL PRIMARY KEY,
    cedula_miembro VARCHAR(15) NOT NULL,
    codigo_servicio VARCHAR(20) NOT NULL,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_cierre TIMESTAMP,
    estatus_general VARCHAR(20) DEFAULT 'en_proceso',
    FOREIGN KEY (cedula_miembro) REFERENCES Miembro_comunidad(cedula),
    FOREIGN KEY (codigo_servicio) REFERENCES Servicio(codigo_servicio)
);

CREATE TABLE Paso_Actividad (
    nro_paso SERIAL,
    nro_solicitud INT,
    descripcion VARCHAR(255) NOT NULL,
    estatus VARCHAR(20) DEFAULT 'pendiente',
    fecha_hora_inicio TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_hora_fin TIMESTAMP,
    PRIMARY KEY (nro_solicitud, nro_paso),
    FOREIGN KEY (nro_solicitud) REFERENCES Solicitud_Servicio(nro_solicitud) ON DELETE CASCADE
);

-- Folio Consumo (Débil de Solicitud sin ID artificial)
CREATE TABLE Folio_Consumo (
    nro_solicitud INT,
    fecha_apertura TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (nro_solicitud, fecha_apertura),
    FOREIGN KEY (nro_solicitud) REFERENCES Solicitud_Servicio(nro_solicitud) ON DELETE CASCADE
);

CREATE TABLE Factura (
    nro_control SERIAL PRIMARY KEY,
    nro_solicitud INT NOT NULL,
    fecha_apertura_folio TIMESTAMP NOT NULL,
    fecha_emision TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    saldo DECIMAL(10,2) NOT NULL,
    estatus VARCHAR(20) DEFAULT 'Pendiente',
    datos_corporativos TEXT,
    FOREIGN KEY (nro_solicitud, fecha_apertura_folio) REFERENCES Folio_Consumo(nro_solicitud, fecha_apertura)
);

-- Pago (Débil de Factura, identificada por el número de control + su fecha)
CREATE TABLE Pago (
    nro_control INT,
    fecha_pago TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    monto DECIMAL(10,2) NOT NULL,
    PRIMARY KEY (nro_control, fecha_pago),
    FOREIGN KEY (nro_control) REFERENCES Factura(nro_control) ON DELETE CASCADE
);

COMMIT;