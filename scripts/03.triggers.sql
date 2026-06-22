-- ============================================================================
-- SCRIPT 03: LÓGICA PROGRAMADA (FUNCIONES Y TRIGGERS EN PL/pgSQL)
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. TRIGGER: ACTUALIZACIÓN AUTOMÁTICA DE FACTURAS (Regla R-21)
-- ----------------------------------------------------------------------------

-- Paso A: Crear la función que hace el cálculo
CREATE OR REPLACE FUNCTION procesar_pago_factura()
RETURNS TRIGGER AS $$
BEGIN
    -- 1. Restar el monto del nuevo pago al saldo de la factura correspondiente
    UPDATE Factura
    SET saldo = saldo - NEW.monto
    WHERE nro_control = NEW.nro_control;

    -- 2. Verificar si la factura ya se pagó por completo para cambiar su estatus
    UPDATE Factura
    SET estatus = 'Pagada'
    WHERE nro_control = NEW.nro_control AND saldo <= 0;

    -- 3. Retornar el pago recién insertado para que termine de guardarse
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Paso B: Crear el Trigger que "escucha" cada vez que se inserta un pago
DROP TRIGGER IF EXISTS trg_procesar_pago ON Pago;
CREATE TRIGGER trg_procesar_pago
AFTER INSERT ON Pago
FOR EACH ROW
EXECUTE FUNCTION procesar_pago_factura();


-- ----------------------------------------------------------------------------
-- 2. TRIGGER: AUDITORÍA DE TIEMPOS EN TRÁMITES (Regla R-24)
-- ----------------------------------------------------------------------------

-- Paso A: Crear la función que estampa la fecha actual
CREATE OR REPLACE FUNCTION registrar_fin_paso()
RETURNS TRIGGER AS $$
BEGIN
    -- Si el estatus está cambiando a 'completado' y antes no lo estaba...
    IF NEW.estatus = 'completado' AND OLD.estatus <> 'completado' THEN
        -- Sobreescribir la fecha de fin con la hora exacta del servidor en este microsegundo
        NEW.fecha_hora_fin := CURRENT_TIMESTAMP;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Paso B: Crear el Trigger que "escucha" las actualizaciones en Paso_Actividad
DROP TRIGGER IF EXISTS trg_registrar_fin_paso ON Paso_Actividad;
CREATE TRIGGER trg_registrar_fin_paso
BEFORE UPDATE ON Paso_Actividad
FOR EACH ROW
EXECUTE FUNCTION registrar_fin_paso();