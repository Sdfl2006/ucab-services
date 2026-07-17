-- ============================================================================
-- SCRIPT 02: DCL Y SEGURIDAD
-- ============================================================================

-- 1. Creación de Roles
CREATE ROLE ucab_admin WITH LOGIN PASSWORD 'Admin123$';
CREATE ROLE ucab_cajero WITH LOGIN PASSWORD 'Cajero2026*';
CREATE ROLE ucab_usuario_web WITH LOGIN PASSWORD 'WebUser!99';

-- 2. Permisos para el Administrador (Tiene control total sobre todo)
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO ucab_admin;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO ucab_admin;

-- 3. Permisos para el Cajero (Solo gestiona pagos, facturas y consumos)
GRANT SELECT, INSERT, UPDATE ON Factura, Pago, Pago_Presencial, Pago_Digital, Pago_Zelle, 
    Pago_Criptomoneda, Pago_Tarjeta, Pago_Movil, Pago_Efectivo, Pago_TAI, 
    Folio_Consumo, Linea_Cargo, Solicitud_Servicio TO ucab_cajero;

-- El cajero necesita poder leer los servicios para saber qué está cobrando
GRANT SELECT ON Servicio, Cargos_adicionales, Miembro_comunidad TO ucab_cajero;

-- 4. Permisos para el Usuario Web (Solo lectura de catálogos, no puede borrar ni alterar)
GRANT SELECT ON Sede, Edificacion, Espacio_fisico, Categoria_servicio, Entidad_prestadora, 
    Interna, Externa, Servicio, Tarifa, Requisito, Servicio_Requisito, Servicio_Sede, 
    Vacante TO ucab_usuario_web;

-- AGREGAR ESTAS DOS LÍNEAS PARA LA HU-27:
GRANT INSERT, SELECT ON Solicitud_Servicio TO ucab_usuario_web;
GRANT USAGE, SELECT ON SEQUENCE solicitud_servicio_id_seq TO ucab_usuario_web;
