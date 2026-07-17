-- =============================================================================
-- SCRIPT 06: REPORTES ANALÍTICOS (VISTAS, SEGURIDAD Y PRUEBAS)
-- PROYECTO: UCAB-SERVICES (FASE II)
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. LIMPIEZA DE VISTAS PREVIAS (Garantiza idempotencia del script)
-- -----------------------------------------------------------------------------
DROP VIEW IF EXISTS v_rep_conciliacion_pagos CASCADE;
DROP VIEW IF EXISTS v_rep_ocupacion_espacios CASCADE;
DROP VIEW IF EXISTS v_rep_ingresos CASCADE;
DROP VIEW IF EXISTS v_rep_insercion_laboral CASCADE;
DROP VIEW IF EXISTS v_rep_cuellos_botella CASCADE;
DROP VIEW IF EXISTS v_rep_seguridad_cuentas CASCADE;

-- -----------------------------------------------------------------------------
-- 2. CREACIÓN DE VISTAS ANALÍTICAS (HU)
-- -----------------------------------------------------------------------------

-- [HU-08] Reporte Consolidado de Seguridad de Cuentas (Semáforo de Riesgo)
CREATE OR REPLACE VIEW v_rep_seguridad_cuentas AS
SELECT
    m.cedula,
    m.apellidos || ', ' || m.nombres              AS miembro,
    m.correo,
    c.estado_cuenta,
    CASE WHEN c.estatus = 'habilitado' THEN 'Sí' ELSE 'No' END AS mfa_activo,
    c.intentos_fallidos,
    c.fecha_cambio_clave,
    (CURRENT_DATE - c.fecha_cambio_clave)         AS dias_sin_cambiar_clave,
    c.ultima_conexion,
    COUNT(s.fecha_hora_acceso)                    AS total_sesiones,
    COUNT(DISTINCT s.direccion_ip)                AS ips_distintas,
    COUNT(DISTINCT s.uuid_dispositivo)            AS dispositivos_distintos,
    MAX(s.fecha_hora_acceso)                      AS ultimo_acceso_registrado,
    CASE
        WHEN c.estado_cuenta = 'bloqueada'                          THEN 'CRÍTICO'
        WHEN c.intentos_fallidos >= 3                               THEN 'CRÍTICO'
        WHEN COUNT(DISTINCT s.direccion_ip) >= 3                    THEN 'ALTO'
        WHEN c.estatus <> 'habilitado' 
             AND (CURRENT_DATE - c.fecha_cambio_clave) > 180        THEN 'MEDIO'
        WHEN c.estado_cuenta = 'suspendida'                         THEN 'MEDIO'
        ELSE 'BAJO'
    END                                           AS nivel_riesgo
FROM Cuenta c
JOIN Miembro_comunidad m ON m.cedula = c.cedula
LEFT JOIN Sesion s       ON s.cedula = c.cedula
GROUP BY m.cedula, m.apellidos, m.nombres, m.correo, 
         c.estado_cuenta, c.estatus, c.intentos_fallidos, 
         c.fecha_cambio_clave, c.ultima_conexion;

-- [HU-31] Reporte de Cuellos de Botella Operativos por Dependencia
CREATE OR REPLACE VIEW v_rep_cuellos_botella AS
SELECT
    COALESCE(pa.unidad_adscripcion, 'Sin asignar')     AS dependencia,
    p.descripcion                                      AS paso_actividad,
    COUNT(*)                                           AS total_pasos,
    COUNT(*) FILTER (WHERE p.estatus = 'completado')   AS completados,
    COUNT(*) FILTER (WHERE p.estatus = 'en progreso')  AS en_progreso,
    COUNT(*) FILTER (WHERE p.estatus = 'pendiente')    AS pendientes,
    ROUND(AVG(EXTRACT(EPOCH FROM (p.fecha_hora_fin - p.fecha_hora_inicio)) / 3600) 
          FILTER (WHERE p.fecha_hora_fin IS NOT NULL)::numeric, 2) AS horas_promedio,
    ROUND(MIN(EXTRACT(EPOCH FROM (p.fecha_hora_fin - p.fecha_hora_inicio)) / 3600) 
          FILTER (WHERE p.fecha_hora_fin IS NOT NULL)::numeric, 2) AS horas_minimo,
    ROUND(MAX(EXTRACT(EPOCH FROM (p.fecha_hora_fin - p.fecha_hora_inicio)) / 3600) 
          FILTER (WHERE p.fecha_hora_fin IS NOT NULL)::numeric, 2) AS horas_maximo,
    ROUND(MAX(EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - p.fecha_hora_inicio)) / 3600) 
          FILTER (WHERE p.fecha_hora_fin IS NULL)::numeric, 2)     AS horas_paso_abierto_mas_viejo
FROM Paso_Actividad p
LEFT JOIN Personal_Administrativo pa ON pa.cedula = p.cedula_admin
GROUP BY COALESCE(pa.unidad_adscripcion, 'Sin asignar'), p.descripcion
ORDER BY horas_promedio DESC NULLS LAST;

-- [HU-26] Reporte de Inserción Laboral y Efectividad de la Bolsa de Trabajo
CREATE OR REPLACE VIEW v_rep_insercion_laboral AS
SELECT
    v.nombre_entidad                                          AS aliado_externo,
    e.razon_social,
    COUNT(DISTINCT (v.cargo, v.fecha_oferta))                  AS vacantes_publicadas,
    COUNT(p.cedula)                                           AS total_postulaciones,
    COUNT(DISTINCT p.cedula)                                  AS egresados_distintos,
    COUNT(*) FILTER (WHERE p.estatus_seleccion = 'contratado')  AS contratados,
    COUNT(*) FILTER (WHERE p.estatus_seleccion = 'entrevistado')AS entrevistados,
    COUNT(*) FILTER (WHERE p.estatus_seleccion = 'rechazado')   AS rechazados,
    COUNT(*) FILTER (WHERE p.estatus_seleccion = 'en revisión') AS en_revision,
    ROUND(100.0 * COUNT(*) FILTER (WHERE p.estatus_seleccion = 'contratado') 
          / NULLIF(COUNT(p.cedula), 0), 2)                    AS tasa_insercion_pct,
    ROUND(AVG(eg.indice_final) FILTER (WHERE p.estatus_seleccion = 'contratado'), 2) 
                                                              AS indice_promedio_contratados
FROM Vacante v
JOIN Externa e      ON e.nombre_entidad = v.nombre_entidad
LEFT JOIN Postulacion p ON p.nombre_entidad = v.nombre_entidad 
                       AND p.cargo         = v.cargo 
                       AND p.fecha_oferta  = v.fecha_oferta
LEFT JOIN Egresado eg   ON eg.cedula = p.cedula
GROUP BY v.nombre_entidad, e.razon_social
ORDER BY tasa_insercion_pct DESC NULLS LAST;

-- [HU-35] Reporte de Ingresos Consolidados por Sede, Categoría y Servicio
CREATE OR REPLACE VIEW v_rep_ingresos AS
WITH facturado AS (
    SELECT lc.nro_solicitud, lc.fecha_apertura_folio,
           SUM(lc.cantidad * lc.precio_unitario + lc.impuestos) AS total_linea
    FROM Linea_Cargo lc
    GROUP BY lc.nro_solicitud, lc.fecha_apertura_folio
),
cobrado AS (
    SELECT pg.nro_control_factura, SUM(pg.monto) AS total_pagado
    FROM Pago pg
    GROUP BY pg.nro_control_factura
)
SELECT
    COALESCE(ed.nombre_sede, 'Sin sede asignada')  AS sede,
    s.nombre_categoria                             AS categoria,
    s.codigo_servicio,
    LEFT(s.descripcion_detallada, 60)              AS servicio,
    CASE WHEN ext.nombre_entidad IS NOT NULL 
         THEN 'Concesionario externo' ELSE 'Unidad interna' END AS tipo_prestador,
    COUNT(DISTINCT f.nro_control)                  AS facturas_emitidas,
    COALESCE(SUM(fa.total_linea), 0)               AS total_facturado,
    COALESCE(SUM(co.total_pagado), 0)              AS total_cobrado,
    COALESCE(SUM(f.saldo), 0)                      AS saldo_por_cobrar,
    ROUND(100.0 * COALESCE(SUM(co.total_pagado), 0) 
          / NULLIF(SUM(fa.total_linea), 0), 2)     AS pct_cobrado
FROM Factura f
JOIN Solicitud_Servicio ss ON ss.nro_solicitud = f.nro_solicitud
JOIN Servicio s            ON s.codigo_servicio = ss.codigo_servicio
LEFT JOIN Externa ext      ON ext.nombre_entidad = s.nombre_entidad
LEFT JOIN Espacio_fisico ef ON ef.nro_identificador = ss.nro_identificador_espacio
LEFT JOIN Edificacion ed    ON ed.nombre_edificacion = ef.nombre_edificacion
LEFT JOIN facturado fa      ON fa.nro_solicitud = f.nro_solicitud 
                           AND fa.fecha_apertura_folio = f.fecha_apertura_folio
LEFT JOIN cobrado co        ON co.nro_control_factura = f.nro_control
GROUP BY COALESCE(ed.nombre_sede, 'Sin sede asignada'), s.nombre_categoria, 
         s.codigo_servicio, LEFT(s.descripcion_detallada, 60),
         CASE WHEN ext.nombre_entidad IS NOT NULL 
              THEN 'Concesionario externo' ELSE 'Unidad interna' END
ORDER BY sede, categoria, total_facturado DESC;

-- [HU-17] Reporte de Ocupación e Intensidad de Uso de Espacios Físicos
CREATE OR REPLACE VIEW v_rep_ocupacion_espacios AS
WITH facturado_por_solicitud AS (
    SELECT lc.nro_solicitud, 
           SUM(lc.cantidad * lc.precio_unitario + lc.impuestos) AS monto
    FROM Linea_Cargo lc
    GROUP BY lc.nro_solicitud
)
SELECT
    ed.nombre_sede                                 AS sede,
    ef.nombre_edificacion,
    ef.nro_identificador                           AS espacio,
    ef.capacidad_max,
    ef.estado_mantenimiento,
    ef.estatus_disponibilidad,
    COUNT(ss.nro_solicitud)                        AS asignaciones_totales,
    COUNT(*) FILTER (WHERE ext.nombre_entidad IS NOT NULL) AS usos_aliado_externo,
    COUNT(*) FILTER (WHERE ext.nombre_entidad IS NULL 
                       AND ss.nro_solicitud IS NOT NULL)   AS usos_internos,
    COALESCE(SUM(fp.monto), 0)                     AS ingreso_generado,
    COALESCE(SUM(fp.monto) FILTER (WHERE ext.nombre_entidad IS NOT NULL), 0) 
                                                   AS ingreso_por_externos,
    ROUND(COALESCE(SUM(fp.monto), 0) 
          / NULLIF(COUNT(ss.nro_solicitud), 0), 2) AS ingreso_promedio_por_uso
FROM Espacio_fisico ef
JOIN Edificacion ed        ON ed.nombre_edificacion = ef.nombre_edificacion
LEFT JOIN Solicitud_Servicio ss ON ss.nro_identificador_espacio = ef.nro_identificador
LEFT JOIN Servicio s       ON s.codigo_servicio = ss.codigo_servicio
LEFT JOIN Externa ext      ON ext.nombre_entidad = s.nombre_entidad
LEFT JOIN facturado_por_solicitud fp ON fp.nro_solicitud = ss.nro_solicitud
GROUP BY ed.nombre_sede, ef.nombre_edificacion, ef.nro_identificador, 
         ef.capacidad_max, ef.estado_mantenimiento, ef.estatus_disponibilidad
ORDER BY sede, asignaciones_totales DESC;

-- [HU-44] Reporte Detallado de Conciliación de Pagos y Auditoría
CREATE OR REPLACE VIEW v_rep_conciliacion_pagos AS
SELECT
    DATE(p.fecha_pago)                             AS fecha_operacion,
    p.fecha_pago,
    p.nro_control_factura,
    f.estatus                                      AS estatus_factura,
    f.saldo                                        AS saldo_pendiente,
    m.apellidos || ', ' || m.nombres               AS titular,
    p.monto,
    CASE
        WHEN z.nro_control_factura  IS NOT NULL THEN 'Zelle'
        WHEN cr.nro_control_factura IS NOT NULL THEN 'Criptomoneda'
        WHEN t.nro_control_factura  IS NOT NULL THEN 'Tarjeta'
        WHEN pm.nro_control_factura IS NOT NULL THEN 'Pago Móvil'
        WHEN ef.nro_control_factura IS NOT NULL THEN 'Efectivo'
        WHEN tai.nro_control_factura IS NOT NULL THEN 'Billetera TAI'
        ELSE 'SIN CLASIFICAR'
    END                                            AS metodo_pago,
    CASE
        WHEN pd.nro_control_factura IS NOT NULL THEN 'Digital'
        WHEN pp.nro_control_factura IS NOT NULL THEN 'Presencial'
        ELSE 'SIN CLASIFICAR'
    END                                            AS canal,
    COALESCE(z.codigo_transaccion, cr.hash_txid, pm.nro_referencia, 
             t.nro_tarjeta, tai.uid_chip, ef.desglose_denominaciones) 
                                                   AS referencia_externa,
    COALESCE(cr.red_utilizada, pm.banco_origen, t.compania_emisora, 
             ef.moneda_curso, tai.codigo_terminal_pos) 
                                                   AS origen_o_red,
    COALESCE(pp.tasa_bcv, cr.tasa_conversion)      AS tasa_aplicada,
    CASE
        WHEN pp.nro_control_factura IS NULL AND pd.nro_control_factura IS NULL 
             THEN 'Pago sin subtipo presencial/digital'
        WHEN pd.nro_control_factura IS NOT NULL 
             AND z.nro_control_factura IS NULL AND cr.nro_control_factura IS NULL 
             THEN 'Pago digital sin método concreto'
        WHEN pp.nro_control_factura IS NOT NULL 
             AND t.nro_control_factura IS NULL AND pm.nro_control_factura IS NULL 
             AND ef.nro_control_factura IS NULL AND tai.nro_control_factura IS NULL 
             THEN 'Pago presencial sin método concreto'
        ELSE 'OK'
    END                                            AS observacion
FROM Pago p
JOIN Factura f            ON f.nro_control = p.nro_control_factura
JOIN Miembro_comunidad m  ON m.cedula = f.cedula_titular
LEFT JOIN Pago_Presencial pp ON (pp.nro_control_factura, pp.fecha_pago) = (p.nro_control_factura, p.fecha_pago)
LEFT JOIN Pago_Digital pd    ON (pd.nro_control_factura, pd.fecha_pago) = (p.nro_control_factura, p.fecha_pago)
LEFT JOIN Pago_Zelle z       ON (z.nro_control_factura,  z.fecha_pago)  = (p.nro_control_factura, p.fecha_pago)
LEFT JOIN Pago_Criptomoneda cr ON (cr.nro_control_factura, cr.fecha_pago) = (p.nro_control_factura, p.fecha_pago)
LEFT JOIN Pago_Tarjeta t     ON (t.nro_control_factura,  t.fecha_pago)  = (p.nro_control_factura, p.fecha_pago)
LEFT JOIN Pago_Movil pm      ON (pm.nro_control_factura, pm.fecha_pago) = (p.nro_control_factura, p.fecha_pago)
LEFT JOIN Pago_Efectivo ef   ON (ef.nro_control_factura, ef.fecha_pago) = (p.nro_control_factura, p.fecha_pago)
LEFT JOIN Pago_TAI tai       ON (tai.nro_control_factura, tai.fecha_pago) = (p.nro_control_factura, p.fecha_pago)
ORDER BY p.fecha_pago DESC;

-- -----------------------------------------------------------------------------
-- 3. SEGURIDAD: CREACIÓN DE ROL DE REPORTES Y ASIGNACIÓN DE PERMISOS
-- -----------------------------------------------------------------------------
-- Bloque anónimo de ejecución segura para evitar errores si el rol ya existe
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'ucab_reportes') THEN
        CREATE ROLE ucab_reportes WITH LOGIN PASSWORD 'Reportes2026#';
    END IF;
END
$$;

-- Concesión de privilegios únicamente de lectura para la herramienta analítica
GRANT SELECT ON v_rep_seguridad_cuentas TO ucab_reportes;
GRANT SELECT ON v_rep_cuellos_botella TO ucab_reportes;
GRANT SELECT ON v_rep_insercion_laboral TO ucab_reportes;
GRANT SELECT ON v_rep_ingresos TO ucab_reportes;
GRANT SELECT ON v_rep_ocupacion_espacios TO ucab_reportes;
GRANT SELECT ON v_rep_conciliacion_pagos TO ucab_reportes;

-- -----------------------------------------------------------------------------
-- 4. CONSULTAS DE PRUEBA (Comentadas para el evaluador)
-- -----------------------------------------------------------------------------
-- SELECT * FROM v_rep_seguridad_cuentas;
-- SELECT * FROM v_rep_cuellos_botella;
-- SELECT * FROM v_rep_insercion_laboral;
-- SELECT * FROM v_rep_ingresos;
-- SELECT * FROM v_rep_ocupacion_espacios;
-- SELECT * FROM v_rep_conciliacion_pagos;
