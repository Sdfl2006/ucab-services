-- ============================================================================
-- SCRIPT 04: ÍNDICES (OPTIMIZACIÓN DE CONSULTAS Y REPORTES)
-- ============================================================================
-- Nota: No se indexan explícitamente las columnas PRIMARY KEY (ej. cedula, id_cuenta) 
-- ni las UNIQUE (ej. correo) porque PostgreSQL les asigna un índice B-Tree automáticamente.

-- 1. Índices para el Módulo de Seguridad y Accesos
-- Agiliza la búsqueda de intentos de hackeo o auditoría de IP
CREATE INDEX idx_sesion_ip ON Sesion(direccion_ip);
CREATE INDEX idx_cuenta_estado ON Cuenta(estado_cuenta);

-- 2. Índices para el Flujo de Trámites y Solicitudes
-- Súper necesarios porque la tabla Solicitud_Servicio será la más consultada del sistema
CREATE INDEX idx_solicitud_cedula ON Solicitud_Servicio(cedula_miembro);
CREATE INDEX idx_solicitud_servicio ON Solicitud_Servicio(codigo_servicio);
CREATE INDEX idx_solicitud_estatus ON Solicitud_Servicio(estatus_general);
CREATE INDEX idx_paso_estatus ON Paso_Actividad(estatus);

-- 3. Índices para Infraestructura y Servicios (Filtros del Frontend)
-- Vitales para cuando el usuario filtre "Ver servicios en Guayana" en la página web
CREATE INDEX idx_espacio_sede ON Espacio_fisico(nombre_sede);
CREATE INDEX idx_servicio_entidad ON Servicio(id_entidad);
CREATE INDEX idx_tarifa_perfil ON Tarifa(perfil_solicitante);

-- 4. Índices para el Módulo Financiero
-- Garantizan que los "cierres masivos" mensuales y la suma de deudas sean instantáneos
CREATE INDEX idx_factura_titular ON Factura(cedula_titular);
CREATE INDEX idx_factura_estatus ON Factura(estatus);
CREATE INDEX idx_pago_control ON Pago(nro_control);
CREATE INDEX idx_linea_concepto ON Linea_Cargo(concepto);