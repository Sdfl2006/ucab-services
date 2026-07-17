-- 1. Habilitar extensión para usar operadores escalares con rangos temporales
CREATE EXTENSION IF NOT EXISTS btree_gist;

-- BRECHA 1: Solapamiento Horario de Reservaciones (HU-16 / R-21)
-- Añadimos las marcas de tiempo a la tabla
ALTER TABLE Solicitud_Servicio 
ADD COLUMN hora_inicio TIMESTAMP,
ADD COLUMN hora_fin TIMESTAMP;

-- Constraint mecánico que impedirá choques a nivel de motor
ALTER TABLE Solicitud_Servicio
ADD CONSTRAINT no_solapamiento_espacios
EXCLUDE USING gist (
    nombre_sede_asignada WITH =,
    nombre_edificacion_asignada WITH =,
    nro_identificador_asignado WITH =,
    tstzrange(hora_inicio, hora_fin) WITH &&
) WHERE (estatus_general != 'cancelada'); -- Ignoramos las solicitudes canceladas


-- BRECHA 2: Límite de Tarifas (HU-22 / R-17)
CREATE OR REPLACE FUNCTION fn_verificar_limite_tarifa()
RETURNS TRIGGER AS $$
DECLARE
    v_max_permitido DECIMAL(15,4);
BEGIN
    -- Calculamos el tope cruzando el límite de la categoría y el ajuste de ubicación
    SELECT MAX(cs.limite_costo_max * sd.ajuste_ubicacion)
    INTO v_max_permitido
    FROM Servicio s
    JOIN Entidad_prestadora ep ON s.id_entidad = ep.id_entidad
    JOIN Categoria_servicio cs ON ep.nombre_categoria = cs.nombre_categoria
    JOIN Servicio_Sede ss ON s.codigo_servicio = ss.codigo_servicio
    JOIN Sede sd ON ss.nombre_sede = sd.nombre_sede
    WHERE s.codigo_servicio = NEW.codigo_servicio;

    IF NEW.monto > v_max_permitido THEN
        RAISE EXCEPTION 'Operación rechazada: El monto (%) supera el límite de costo máximo permitido (%) estipulado para su sede y categoría.', NEW.monto, v_max_permitido;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_limite_tarifa
BEFORE INSERT OR UPDATE ON Tarifa
FOR EACH ROW
EXECUTE FUNCTION fn_verificar_limite_tarifa();

