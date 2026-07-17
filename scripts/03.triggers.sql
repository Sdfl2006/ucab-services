-- ============================================================================
-- SCRIPT 03: PL/pgSQL FUNCIONES Y TRIGGERS (LÓGICA AUTOMATIZADA)
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. TRIGGER: ACTUALIZACIÓN AUTOMÁTICA DE FACTURAS (Optimizado y Seguro)
-- ----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION fn_procesar_pago_factura()
RETURNS TRIGGER AS $$
DECLARE
    saldo_actual DECIMAL(10,2);
BEGIN
    -- Buscamos el saldo actual de la factura a la que se le está haciendo el pago
    SELECT saldo INTO saldo_actual 
    FROM Factura 
    WHERE nro_control = NEW.nro_control_factura;

    -- SEGURO: Validamos que el pago no sea mayor al saldo deudor
    IF NEW.monto > saldo_actual THEN
        RAISE EXCEPTION 'El monto del pago (%) no puede ser mayor al saldo de la factura (%)', NEW.monto, saldo_actual;
    END IF;

    -- UPDATE ÚNICO: Actualizamos saldo y estatus en la misma transacción
    UPDATE Factura
    SET saldo = saldo - NEW.monto,
        estatus = CASE 
                    WHEN (saldo - NEW.monto) = 0 THEN 'Pagada' 
                    ELSE 'Pago_Parcial' 
                  END
    WHERE nro_control = NEW.nro_control_factura;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_despues_insertar_pago ON Pago;
CREATE TRIGGER trg_despues_insertar_pago
AFTER INSERT ON Pago
FOR EACH ROW
EXECUTE FUNCTION fn_procesar_pago_factura();

-- ----------------------------------------------------------------------------
-- 2. TRIGGER: AUDITORÍA DE TIEMPOS EN TRÁMITES
-- ----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION registrar_fin_paso()
RETURNS TRIGGER AS $$
BEGIN
    -- Si el estatus está cambiando a 'completado' y antes no lo estaba...
    IF NEW.estatus = 'completado' AND OLD.estatus <> 'completado' THEN
        -- Sobreescribir la fecha de fin con la hora exacta
        NEW.fecha_hora_fin := CURRENT_TIMESTAMP;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_registrar_fin_paso ON Paso_Actividad;
CREATE TRIGGER trg_registrar_fin_paso
BEFORE UPDATE ON Paso_Actividad
FOR EACH ROW
EXECUTE FUNCTION registrar_fin_paso();
