-- Manizales Epic Race 2026
-- 003: numeracion MER{year}-{consecutivo 5 digitos}
-- Precondicion: 001 y 002 aplicados
-- Usa registration_number_seq de 001

BEGIN;

CREATE OR REPLACE FUNCTION allocate_registration_number(p_year SMALLINT DEFAULT NULL)
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  v_year SMALLINT;
  v_next INTEGER;
BEGIN
  IF p_year IS NULL THEN
    SELECT EXTRACT(YEAR FROM event_date)::SMALLINT
    INTO v_year
    FROM event_settings
    WHERE id = 1;

    IF NOT FOUND OR v_year IS NULL THEN
      RAISE EXCEPTION 'EVENT_YEAR_UNAVAILABLE' USING ERRCODE = 'P0004';
    END IF;
  ELSE
    v_year := p_year;
  END IF;

  INSERT INTO registration_number_seq (year, last_value)
  VALUES (v_year, 0)
  ON CONFLICT (year) DO NOTHING;

  UPDATE registration_number_seq
  SET last_value = last_value + 1
  WHERE year = v_year
  RETURNING last_value INTO v_next;

  IF v_next IS NULL THEN
    RAISE EXCEPTION 'REGISTRATION_SEQ_FAILED' USING ERRCODE = 'P0005';
  END IF;

  RETURN 'MER' || v_year::TEXT || '-' || LPAD(v_next::TEXT, 5, '0');
END;
$$;

COMMENT ON FUNCTION allocate_registration_number(SMALLINT) IS
  'Consecutivo atomico por anio. No reutiliza numeros ya asignados. Huecos posibles por ROLLBACK.';

CREATE OR REPLACE FUNCTION assign_registration_fields_on_confirm()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.status = 'confirmed'
     AND (TG_OP = 'INSERT' OR OLD.status IS DISTINCT FROM 'confirmed')
  THEN
  IF NEW.registration_number IS NULL OR BTRIM(NEW.registration_number) = '' THEN
      NEW.registration_number := allocate_registration_number();
    END IF;

    IF NEW.confirmed_at IS NULL THEN
      NEW.confirmed_at := NOW();
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_registrations_b_assign_number ON registrations;
DROP TRIGGER IF EXISTS trg_registrations_assign_number ON registrations;

-- Nombre con prefijo _b_ para ejecutar despues de trg_registrations_a_enforce_quota (orden alfabetico).
CREATE TRIGGER trg_registrations_b_assign_number
  BEFORE INSERT OR UPDATE OF status, registration_number ON registrations
  FOR EACH ROW
  EXECUTE FUNCTION assign_registration_fields_on_confirm();

COMMIT;
