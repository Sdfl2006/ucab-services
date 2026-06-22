-- ============================================================================
-- SCRIPT 02: DISEÑO DE SEGURIDAD LÓGICA (ROLES Y PRIVILEGIOS)
-- ============================================================================

-- 1. LIMPIEZA PREVIA (Para poder ejecutar el script varias veces sin error)
DROP ROLE IF EXISTS ucab_admin;
DROP ROLE IF EXISTS ucab_cajero;
DROP ROLE IF EXISTS ucab_usuario_web;

-- ============================================================================
-- 2. CREACIÓN DE ROLES (Usuarios del RDBMS)
-- ============================================================================

-- Administrador de Sistemas (Acceso total)
CREATE ROLE ucab_admin WITH LOGIN PASSWORD 'admin123' SUPERUSER;

-- Cajero de Taquilla Presencial (Solo acceso a cobros presenciales y facturación)
CREATE ROLE ucab_cajero WITH LOGIN PASSWORD 'caja123';

-- Usuario del Portal Web (Acceso limitado desde la aplicación frontend)
CREATE ROLE ucab_usuario_web WITH LOGIN PASSWORD 'web123';

-- ============================================================================
-- 3. ASIGNACIÓN DE PRIVILEGIOS DE OBJETOS (Tablas)
-- ============================================================================

-- Otorgar uso del esquema público a todos
GRANT USAGE ON SCHEMA public TO ucab_cajero, ucab_usuario_web;

-- Privilegios del Cajero (Caja física de Montalbán o Guayana)
-- Solo puede ver a los miembros y servicios, pero PUEDE insertar pagos y actualizar facturas
GRANT SELECT ON Miembro_comunidad, Servicio, Tarifa TO ucab_cajero;
GRANT SELECT, INSERT, UPDATE ON Factura, Pago, Pago_presencial, Tarjeta, PagoMovil, Efectivo, BilleteraTAI TO ucab_cajero;

-- Privilegios del Usuario Web (La persona conectada desde React)
-- Puede ver el catálogo de servicios e infraestructura, y puede crear solicitudes y pagos digitales
GRANT SELECT ON Servicio, Sede, Edificacion, Espacio_fisico, Tarifa, Categoria_servicio TO ucab_usuario_web;
GRANT INSERT, SELECT ON Solicitud_Servicio, Acompañante, Pago_digital, Zelle, Criptomoneda TO ucab_usuario_web;
GRANT SELECT, UPDATE ON Cuenta, Miembro_comunidad, Telefono_Miembro TO ucab_usuario_web;

-- Nota: ucab_admin no necesita GRANTs específicos porque se creó con el atributo SUPERUSER.