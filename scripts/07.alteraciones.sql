-- ============================================================================
-- SCRIPT 07: ALTERACIONES - CORREGIDO CONTRA EL ESQUEMA REAL
-- (version original de Santiago referenciaba columnas de la traduccion vieja
--  que ya no existen: id_entidad, nombre_sede_asignada, etc. Se corrige aqui)
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS btree_gist;

-- ----------------------------------------------------------------------------
-- BRECHA 1: Solapamiento horario de reservaciones (HU-16 / R-21)
-- ----------------------------------------------------------------------------
ALTER TABLE Solicitud_Servicio
ADD COLUMN IF NOT EXISTS hora_inicio TIMESTAMP,
ADD COLUMN IF NOT EXISTS hora_fin    TIMESTAMP;

ALTER TABLE Solicitud_Servicio
DROP CONSTRAINT IF EXISTS no_solapamiento_espacios;

ALTER TABLE Solicitud_Servicio
ADD CONSTRAINT no_solapamiento_espacios
EXCLUDE USING gist (
    nro_identificador_espacio WITH =,
    tsrange(hora_inicio, hora_fin) WITH &&
) WHERE (estatus_general != 'cancelada' AND nro_identificador_espacio IS NOT NULL);

-- ----------------------------------------------------------------------------
-- BRECHA 2: Límite de tarifas por categoría y sede (HU-22 / R-17)
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION fn_verificar_limite_tarifa()
RETURNS TRIGGER AS $$
DECLARE
    v_max_permitido DECIMAL(15,4);
BEGIN
    SELECT MAX(cs.limite_costo_max * sd.ajuste_ubicacion)
    INTO v_max_permitido
    FROM Servicio s
    JOIN Categoria_servicio cs ON s.nombre_categoria = cs.nombre_categoria
    JOIN Servicio_Sede ss      ON s.codigo_servicio = ss.codigo_servicio
    JOIN Sede sd                ON ss.nombre_sede = sd.nombre_sede
    WHERE s.codigo_servicio = NEW.codigo_servicio;

    IF v_max_permitido IS NULL THEN
        -- el servicio no tiene sede asociada en Servicio_Sede: no se puede validar, se deja pasar
        RETURN NEW;
    END IF;

    IF NEW.monto > v_max_permitido THEN
        RAISE EXCEPTION 'Operación rechazada: el monto (%) supera el límite permitido (%) para la sede y categoría del servicio.', NEW.monto, v_max_permitido;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_limite_tarifa ON Tarifa;
CREATE TRIGGER trg_limite_tarifa
BEFORE INSERT OR UPDATE ON Tarifa
FOR EACH ROW
EXECUTE FUNCTION fn_verificar_limite_tarifa();

ALTER TABLE Solicitud_Servicio 
ADD CONSTRAINT chk_estatus_general_solicitud 
CHECK (estatus_general IN ('en_proceso', 'completado'));

CREATE OR REPLACE FUNCTION trg_actualizar_saldo_factura()
RETURNS TRIGGER AS $$
BEGIN
    -- Actualizamos el estatus y el saldo de forma simultánea para no violar el CHECK
    UPDATE Factura
    SET 
        estatus = CASE 
            WHEN (saldo - NEW.monto) <= 0 THEN 'Pagada' 
            ELSE 'Pago_Parcial' 
        END,
        saldo = CASE 
            WHEN (saldo - NEW.monto) < 0 THEN 0 
            ELSE (saldo - NEW.monto) 
        END
    WHERE nro_control = NEW.nro_control_factura;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. Enlazar el trigger a la tabla Pago
DROP TRIGGER IF EXISTS trg_pago_factura ON Pago;
CREATE TRIGGER trg_pago_factura
AFTER INSERT ON Pago
FOR EACH ROW
EXECUTE FUNCTION trg_actualizar_saldo_factura();