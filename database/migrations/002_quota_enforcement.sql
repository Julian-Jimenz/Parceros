-- Manizales Epic Race 2026
-- 002: enforcement obligatorio de cupos (max_confirmed_registrations)
-- Precondicion: 001_initial_schema.sql aplicado
-- Idempotente en objetos propios (CREATE OR REPLACE / DROP IF EXISTS)

BEGIN;

-- Refuerza assert_registration_quota(): el cupo no puede omitirse sin pasar por el trigger.
CREATE OR REPLACE FUNCTION enforce_registration_quota()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_open    BOOLEAN;
  v_max     INTEGER;
  v_count   INTEGER;
  v_becoming_confirmed BOOLEAN;
BEGIN
  v_becoming_confirmed := (
    (TG_OP = 'INSERT' AND NEW.status = 'confirmed')
    OR (
      TG_OP = 'UPDATE'
      AND NEW.status = 'confirmed'
      AND (OLD.status IS DISTINCT FROM 'confirmed')
    )
  );

  IF NOT v_becoming_confirmed THEN
    RETURN NEW;
  END IF;

  SELECT registrations_open, max_confirmed_registrations
  INTO v_open, v_max
  FROM event_settings
  WHERE id = 1
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'EVENT_SETTINGS_MISSING' USING ERRCODE = 'P0003';
  END IF;

  IF NOT v_open THEN
    RAISE EXCEPTION 'REGISTRATIONS_CLOSED' USING ERRCODE = 'P0001';
  END IF;

  SELECT COUNT(*)::INTEGER
  INTO v_count
  FROM registrations
  WHERE status = 'confirmed';

  -- Solo filas que pasan a confirmed cuentan contra el cupo; cancelled no cuenta.
  IF v_count >= v_max THEN
    RAISE EXCEPTION 'QUOTA_EXCEEDED' USING ERRCODE = 'P0002';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_registrations_a_enforce_quota ON registrations;
DROP TRIGGER IF EXISTS trg_registrations_enforce_quota ON registrations;

CREATE TRIGGER trg_registrations_a_enforce_quota
  BEFORE INSERT OR UPDATE OF status ON registrations
  FOR EACH ROW
  EXECUTE FUNCTION enforce_registration_quota();

COMMENT ON FUNCTION enforce_registration_quota() IS
  'Bloquea INSERT/UPDATE a status=confirmed si inscripciones cerradas o cupo lleno. '
  'Serializa via FOR UPDATE en event_settings. Re-ejecutar UPDATE sin cambio de status no consume cupo extra.';

COMMIT;
