-- ============================================================================
-- SCRIPT 06: REPORTES (VISTAS)
-- UCAB-Services | PostgreSQL
-- Ejecutar DESPUES de 05.datos.sql
-- ----------------------------------------------------------------------------
-- Cada vista corresponde a una historia de usuario del Product Backlog.
-- Se implementan como VIEW (no como query suelta en el backend) por tres razones
-- defendibles ante el profesor:
--   1. La logica de negocio del reporte vive en el gestor, no en Node.
--   2. Se les puede dar GRANT SELECT a un rol de solo lectura.
--   3. jsreport las consume con un "SELECT * FROM v_..." trivial.
-- ============================================================================


-- ============================================================================
-- HU-08 | Reporte consolidado de seguridad de cuentas
-- "Como administrador de seguridad, quiero un reporte consolidado de usuarios
--  activos, suspendidos y bloqueados con su historial de accesos, para auditar
--  vulnerabilidades."
-- Salida: una fila por cuenta + indicadores de anomalia.
-- ============================================================================
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
    -- Semaforo de riesgo: lo que el auditor mira primero
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

COMMENT ON VIEW v_rep_seguridad_cuentas IS
    'HU-08: auditoría de cuentas y accesos. Una fila por cuenta.';


-- ============================================================================
-- HU-31 | Cuellos de botella por paso de actividad y dependencia
-- "Como administrador, quiero un reporte de los tiempos de respuesta promedio
--  por paso de actividad y dependencia, para identificar cuellos de botella."
-- Salida: una fila por (dependencia, paso).
-- NOTA: la dependencia se obtiene de Personal_Administrativo.unidad_adscripcion,
--       porque el modelo no tiene una entidad Departamento propia.
-- ============================================================================
CREATE OR REPLACE VIEW v_rep_cuellos_botella AS
SELECT
    COALESCE(pa.unidad_adscripcion, 'Sin asignar')     AS dependencia,
    p.descripcion                                      AS paso_actividad,
    COUNT(*)                                           AS total_pasos,
    COUNT(*) FILTER (WHERE p.estatus = 'completado')   AS completados,
    COUNT(*) FILTER (WHERE p.estatus = 'en progreso')  AS en_progreso,
    COUNT(*) FILTER (WHERE p.estatus = 'pendiente')    AS pendientes,
    ROUND(AVG(EXTRACT(EPOCH FROM (p.fecha_hora_fin - p.fecha_hora_inicio)) / 3600)
          FILTER (WHERE p.fecha_hora_fin IS NOT NULL)::numeric, 2)
                                                       AS horas_promedio,
    ROUND(MIN(EXTRACT(EPOCH FROM (p.fecha_hora_fin - p.fecha_hora_inicio)) / 3600)
          FILTER (WHERE p.fecha_hora_fin IS NOT NULL)::numeric, 2)
                                                       AS horas_minimo,
    ROUND(MAX(EXTRACT(EPOCH FROM (p.fecha_hora_fin - p.fecha_hora_inicio)) / 3600)
          FILTER (WHERE p.fecha_hora_fin IS NOT NULL)::numeric, 2)
                                                       AS horas_maximo,
    -- Antigüedad del paso abierto más viejo: el indicador real de atasco
    ROUND(MAX(EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - p.fecha_hora_inicio)) / 3600)
          FILTER (WHERE p.fecha_hora_fin IS NULL)::numeric, 2)
                                                       AS horas_paso_abierto_mas_viejo
FROM Paso_Actividad p
LEFT JOIN Personal_Administrativo pa ON pa.cedula = p.cedula_admin
GROUP BY COALESCE(pa.unidad_adscripcion, 'Sin asignar'), p.descripcion
ORDER BY horas_promedio DESC NULLS LAST;

COMMENT ON VIEW v_rep_cuellos_botella IS
    'HU-31: tiempos de respuesta promedio por dependencia y paso. Ordenado por el más lento.';


-- ============================================================================
-- HU-26 | Efectividad de la bolsa de trabajo (inserción laboral)
-- "Como autoridad universitaria, quiero medir el porcentaje de inserción
--  laboral de los egresados a través de las ofertas de la plataforma."
-- Salida: una fila por aliado externo.
-- ============================================================================
CREATE OR REPLACE VIEW v_rep_insercion_laboral AS
SELECT
    v.nombre_entidad                                          AS aliado_externo,
    e.razon_social,
    COUNT(DISTINCT (v.cargo, v.fecha_oferta))                 AS vacantes_publicadas,
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

COMMENT ON VIEW v_rep_insercion_laboral IS
    'HU-26: efectividad de la bolsa de trabajo por aliado externo.';


-- ============================================================================
-- HU-35 | Ingresos consolidados por sede, categoría y servicio
-- "Como administrador financiero, quiero visualizar un reporte de los ingresos
--  consolidados clasificados por sede, categoría y tipo de servicio."
-- ----------------------------------------------------------------------------
-- DECISION DE DISEÑO A DEFENDER:
--   La sede de una factura NO está en el modelo. Servicio_Sede es N:M, así que
--   un servicio ofrecido en ambas sedes no dice dónde se consumió. La única vía
--   trazable es el espacio físico asignado a la solicitud:
--       Solicitud -> Espacio_fisico -> Edificacion -> Sede
--   Las solicitudes sin espacio (ej. trámites de secretaría) se agrupan
--   explícitamente como 'Sin sede asignada' en vez de descartarlas.
-- ============================================================================
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

COMMENT ON VIEW v_rep_ingresos IS
    'HU-35: ingresos por sede, categoría y servicio. Sede derivada del espacio asignado.';


-- ============================================================================
-- HU-17 | Ocupación y rentabilidad de espacios por sede
-- "Como administrador de infraestructura, quiero un reporte que compare la tasa
--  de ocupación y rentabilidad de los espacios por sede (uso académico interno
--  vs. alquiler a aliados externos)."
-- ----------------------------------------------------------------------------
-- LIMITACION CONOCIDA (declararla en la defensa, no esconderla):
--   El modelo no almacena bloque horario de reservación. No existe hora de
--   inicio/fin de uso, así que NO se puede calcular ocupación como
--   (horas usadas / horas disponibles). Esta vista aproxima la ocupación por
--   CONTEO de asignaciones y mide la rentabilidad con lo efectivamente
--   facturado. Es una métrica de intensidad de uso, no de ocupación horaria.
-- ============================================================================
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

COMMENT ON VIEW v_rep_ocupacion_espacios IS
    'HU-17: intensidad de uso y rentabilidad por espacio. Aproximación por conteo: el modelo no guarda bloque horario.';


-- ============================================================================
-- HU-44 | Insumo de conciliación financiera diaria
-- "Como administrador financiero, quiero generar un reporte diario que cruce
--  los extractos de los bancos y redes blockchain contra las facturas marcadas
--  como pagadas en el sistema, para detectar inconsistencias."
-- ----------------------------------------------------------------------------
-- LIMITACION CONOCIDA:
--   El modelo NO tiene los extractos bancarios ni las transacciones de la
--   blockchain. No hay contra qué cruzar. Esta vista entrega el lado del
--   sistema con la referencia externa de cada operación (código Zelle, TXID,
--   nro de referencia de Pago Móvil, UID del chip), que es exactamente lo que
--   el operador necesita para cotejar manualmente contra el extracto.
--   Preséntenlo como "insumo de conciliación", no como conciliación cerrada.
-- ============================================================================
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
    -- Referencia externa: la llave para cotejar contra el extracto
    COALESCE(z.codigo_transaccion, cr.hash_txid, pm.nro_referencia,
             t.nro_tarjeta, tai.uid_chip, ef.desgloce_denominaciones)
                                                   AS referencia_externa,
    COALESCE(cr.red_utilizada, pm.banco_origen, t.compania_emisora,
             ef.moneda_curso, tai.codigo_terminal_pos)
                                                   AS origen_o_red,
    COALESCE(pp.tasa_bcv, cr.tasa_conversion)      AS tasa_aplicada,
    -- Banderas de inconsistencia
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

COMMENT ON VIEW v_rep_conciliacion_pagos IS
    'HU-44: insumo de conciliación. El modelo no almacena extractos bancarios; se entrega el lado del sistema con su referencia externa.';


-- Resumen diario por método (el encabezado del reporte de conciliación)
CREATE OR REPLACE VIEW v_rep_conciliacion_resumen AS
SELECT
    fecha_operacion,
    canal,
    metodo_pago,
    COUNT(*)                                       AS operaciones,
    SUM(monto)                                     AS monto_total,
    COUNT(*) FILTER (WHERE observacion <> 'OK')    AS operaciones_con_observacion
FROM v_rep_conciliacion_pagos
GROUP BY fecha_operacion, canal, metodo_pago
ORDER BY fecha_operacion DESC, monto_total DESC;


-- ============================================================================
-- PERMISOS
-- Rol de solo lectura para la herramienta de reportes.
-- Si el rol ya existe, comentar el CREATE ROLE.
-- ============================================================================
-- CREATE ROLE ucab_reportes WITH LOGIN PASSWORD 'Reportes2026#';

GRANT SELECT ON v_rep_seguridad_cuentas,
                v_rep_cuellos_botella,
                v_rep_insercion_laboral,
                v_rep_ingresos,
                v_rep_ocupacion_espacios,
                v_rep_conciliacion_pagos,
                v_rep_conciliacion_resumen
       TO ucab_admin;


-- ============================================================================
-- PRUEBA RAPIDA: las seis deben devolver filas
-- ============================================================================
-- SELECT * FROM v_rep_seguridad_cuentas   ORDER BY nivel_riesgo;
-- SELECT * FROM v_rep_cuellos_botella;
-- SELECT * FROM v_rep_insercion_laboral;
-- SELECT * FROM v_rep_ingresos;
-- SELECT * FROM v_rep_ocupacion_espacios;
-- SELECT * FROM v_rep_conciliacion_resumen;
