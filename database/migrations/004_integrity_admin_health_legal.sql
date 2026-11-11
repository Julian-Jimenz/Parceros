-- Manizales Epic Race 2026
-- 004: integridad referencial, salud, legales, pagos
-- Precondicion: 001, 002, 003 aplicados
-- Sin cambios a payment_nequi_key (confirmacion oficial pendiente)

BEGIN;

-- Pagos jersey: revisor debe ser admin existente (o NULL)
ALTER TABLE jersey_payments
  DROP CONSTRAINT IF EXISTS jersey_payments_reviewed_by_fkey;

ALTER TABLE jersey_payments
  ADD CONSTRAINT jersey_payments_reviewed_by_fkey
  FOREIGN KEY (reviewed_by) REFERENCES admin_users(id)
  ON DELETE SET NULL;

ALTER TABLE jersey_payment_audit
  DROP CONSTRAINT IF EXISTS jersey_payment_audit_admin_user_id_fkey;

ALTER TABLE jersey_payment_audit
  ADD CONSTRAINT jersey_payment_audit_admin_user_id_fkey
  FOREIGN KEY (admin_user_id) REFERENCES admin_users(id)
  ON DELETE SET NULL;

-- Salud: timestamp de autorizacion explicita (independiente de legal_acceptances)
CREATE OR REPLACE FUNCTION health_information_authorization_timestamp()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.sensitive_data_authorized IS TRUE THEN
    IF NEW.authorized_at IS NULL OR (
      TG_OP = 'UPDATE' AND OLD.sensitive_data_authorized IS DISTINCT FROM TRUE
    ) THEN
      NEW.authorized_at := NOW();
    END IF;
  ELSE
    NEW.authorized_at := NULL;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_health_information_authorized_at ON health_information;

CREATE TRIGGER trg_health_information_authorized_at
  BEFORE INSERT OR UPDATE OF sensitive_data_authorized ON health_information
  FOR EACH ROW
  EXECUTE FUNCTION health_information_authorization_timestamp();

-- Legales: no registrar aceptacion sobre documentos no publicados
CREATE OR REPLACE FUNCTION check_legal_acceptance_only_published()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_published BOOLEAN;
BEGIN
  SELECT is_published INTO v_published
  FROM legal_documents
  WHERE id = NEW.legal_document_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'LEGAL_DOCUMENT_NOT_FOUND' USING ERRCODE = 'P0006';
  END IF;

  IF NOT v_published THEN
    RAISE EXCEPTION 'LEGAL_DOCUMENT_NOT_PUBLISHED' USING ERRCODE = 'P0007';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_legal_acceptances_published ON legal_acceptances;

CREATE TRIGGER trg_legal_acceptances_published
  BEFORE INSERT OR UPDATE OF legal_document_id ON legal_acceptances
  FOR EACH ROW
  EXECUTE FUNCTION check_legal_acceptance_only_published();

-- Idempotencia: clave opcional en draft, unica cuando presente (001 ya tiene UNIQUE)
CREATE UNIQUE INDEX IF NOT EXISTS registrations_idempotency_key_nonempty
  ON registrations (idempotency_key)
  WHERE idempotency_key IS NOT NULL AND BTRIM(idempotency_key) <> '';

COMMENT ON COLUMN legal_acceptances.authorize_health_data IS
  'Deprecado para consentimiento de salud; usar health_information.sensitive_data_authorized.';

COMMENT ON TABLE health_information IS
  'Datos sensibles segregados; no incluir en exportaciones jersey ni respuestas publicas.';

COMMIT;
