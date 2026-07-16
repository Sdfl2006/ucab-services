-- ============================================================================
-- SCRIPT 04: ÍNDICES (B-TREE) PARA OPTIMIZACIÓN DE RENDIMIENTO
-- ============================================================================

-- Índices para búsquedas rápidas de Miembros
CREATE INDEX idx_miembro_apellidos ON Miembro_comunidad(apellidos);
CREATE INDEX idx_beneficiario_titular ON Beneficiario(cedula_titular);

-- Índices en claves foráneas (Acelera los JOINs de roles y sesiones)
CREATE INDEX idx_fk_estudiante_miembro ON Estudiante(cedula);
CREATE INDEX idx_fk_profesor_miembro ON Profesor(cedula);
CREATE INDEX idx_fk_admin_miembro ON Personal_Administrativo(cedula);
CREATE INDEX idx_fk_egresado_miembro ON Egresado(cedula);
CREATE INDEX idx_fk_sesion_cuenta ON Sesion(cedula);

-- Índices de Infraestructura
CREATE INDEX idx_fk_edificacion_sede ON Edificacion(nombre_sede);
CREATE INDEX idx_fk_espacio_edificacion ON Espacio_fisico(nombre_edificacion);

-- Índices de Postulaciones (Crucial para revisar vacantes)
CREATE INDEX idx_postulacion_vacante ON Postulacion(nombre_entidad, cargo, fecha_oferta);

-- Índices de Trámites y Facturación (Cruciales para el backend)
CREATE INDEX idx_solicitud_miembro ON Solicitud_Servicio(cedula_miembro);
CREATE INDEX idx_solicitud_servicio ON Solicitud_Servicio(codigo_servicio);
CREATE INDEX idx_acompanante_solicitud ON Acompanante(nro_solicitud);

-- Índices para jerarquía de Consumos y Pagos
CREATE INDEX idx_folio_solicitud ON Folio_Consumo(nro_solicitud);
CREATE INDEX idx_lineacargo_folio ON Linea_Cargo(nro_solicitud, fecha_apertura_folio);
CREATE INDEX idx_factura_folio ON Factura(nro_solicitud, fecha_apertura_folio);
CREATE INDEX idx_pago_factura ON Pago(nro_control_factura);