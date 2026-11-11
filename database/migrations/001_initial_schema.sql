-- Manizales Epic Race 2026  esquema inicial
-- PostgreSQL 14+
-- Ejecutar sobre base de datos: manizales_epic_race_2026

BEGIN;

CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "citext";

-- Tipos enumerados
CREATE TYPE registration_status AS ENUM (
  'draft',
  'confirmed',
  'cancelled'
);

CREATE TYPE jersey_payment_status AS ENUM (
  'pending_verification',
  'approved',
  'rejected'
);

CREATE TYPE admin_role AS ENUM (
  'super_admin',
  'operator',
  'viewer'
);

CREATE TYPE registration_option AS ENUM (
  'free_only',
  'free_with_jersey'
);

CREATE TYPE sleeve_type AS ENUM ('short', 'long');
CREATE TYPE jersey_cut AS ENUM ('road', 'mtb');

-- Configuracin del evento (fila singleton id=1)
CREATE TABLE event_settings (
  id                          SMALLINT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  event_name                  TEXT NOT NULL DEFAULT 'MANIZALES EPIC RACE 2026',
  event_date                  DATE NOT NULL DEFAULT '2026-12-13',
  event_city                  TEXT NOT NULL DEFAULT 'Manizales',
  event_department            TEXT NOT NULL DEFAULT 'Caldas',
  timezone                    TEXT NOT NULL DEFAULT 'America/Bogota',
  registrations_open          BOOLEAN NOT NULL DEFAULT FALSE,
  max_confirmed_registrations INTEGER NOT NULL DEFAULT 300 CHECK (max_confirmed_registrations > 0),
  jersey_price_cop            INTEGER NOT NULL DEFAULT 110000 CHECK (jersey_price_cop >= 0),
  minors_registration_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  minor_minimum_age           SMALLINT,
  payment_nequi_key           TEXT NOT NULL DEFAULT '3013361008',
  payment_beneficiary         TEXT NOT NULL DEFAULT 'David Plata',
  upload_max_bytes            BIGINT NOT NULL DEFAULT 5242880,
  allowed_upload_mime         TEXT[] NOT NULL DEFAULT ARRAY['image/jpeg','image/png','application/pdf'],
  about_content_json          JSONB NOT NULL DEFAULT '{}',
  hero_image_path             TEXT,
  jersey_mockup_path          TEXT,
  size_chart_image_path       TEXT,
  updated_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE categories (
  id            SERIAL PRIMARY KEY,
  code          TEXT NOT NULL UNIQUE,
  name          TEXT NOT NULL,
  description   TEXT NOT NULL DEFAULT '',
  sort_order    SMALLINT NOT NULL DEFAULT 0,
  is_active     BOOLEAN NOT NULL DEFAULT TRUE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE bicycle_types (
  id            SERIAL PRIMARY KEY,
  code          TEXT NOT NULL UNIQUE,
  name          TEXT NOT NULL,
  is_active     BOOLEAN NOT NULL DEFAULT TRUE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE category_bicycle_rules (
  category_id      INTEGER NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  bicycle_type_id  INTEGER NOT NULL REFERENCES bicycle_types(id) ON DELETE CASCADE,
  PRIMARY KEY (category_id, bicycle_type_id)
);

CREATE TABLE document_types (
  id            SERIAL PRIMARY KEY,
  code          TEXT NOT NULL UNIQUE,
  name          TEXT NOT NULL,
  sort_order    SMALLINT NOT NULL DEFAULT 0,
  is_active     BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE nationalities (
  id            SERIAL PRIMARY KEY,
  code          TEXT NOT NULL UNIQUE,
  name          TEXT NOT NULL,
  sort_order    SMALLINT NOT NULL DEFAULT 0,
  is_active     BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE jersey_sizes (
  id            SERIAL PRIMARY KEY,
  code          TEXT NOT NULL UNIQUE,
  label         TEXT NOT NULL,
  sort_order    SMALLINT NOT NULL DEFAULT 0,
  is_active     BOOLEAN NOT NULL DEFAULT TRUE
);

-- Medidas administrables (sin datos inventados en seed)
CREATE TABLE jersey_size_measurements (
  id              SERIAL PRIMARY KEY,
  jersey_size_id  INTEGER NOT NULL REFERENCES jersey_sizes(id) ON DELETE CASCADE,
  metric_key      TEXT NOT NULL,
  metric_value_cm NUMERIC(6,2),
  sort_order      SMALLINT NOT NULL DEFAULT 0,
  UNIQUE (jersey_size_id, metric_key)
);

CREATE TABLE participants (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name            TEXT NOT NULL,
  last_name             TEXT NOT NULL,
  document_type_id      INTEGER NOT NULL REFERENCES document_types(id),
  document_number       TEXT NOT NULL,
  birth_date            DATE NOT NULL,
  sex                   TEXT NOT NULL,
  nationality_id        INTEGER REFERENCES nationalities(id),
  residence_department  TEXT NOT NULL,
  residence_municipality TEXT NOT NULL,
  residence_address     TEXT NOT NULL,
  phone                 TEXT NOT NULL,
  email                 CITEXT NOT NULL,
  club_or_team          TEXT,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT participants_document_unique UNIQUE (document_type_id, document_number),
  CONSTRAINT participants_email_unique UNIQUE (email)
);

CREATE TABLE registrations (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  registration_number   TEXT UNIQUE,
  participant_id        UUID NOT NULL REFERENCES participants(id),
  category_id           INTEGER NOT NULL REFERENCES categories(id),
  bicycle_type_id       INTEGER NOT NULL REFERENCES bicycle_types(id),
  status                registration_status NOT NULL DEFAULT 'draft',
  registration_option     registration_option NOT NULL DEFAULT 'free_only',
  idempotency_key       TEXT UNIQUE,
  confirmed_at          TIMESTAMPTZ,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX registrations_one_confirmed_per_participant
  ON registrations (participant_id)
  WHERE status = 'confirmed';

CREATE INDEX idx_registrations_status ON registrations(status);
CREATE INDEX idx_registrations_category ON registrations(category_id);
CREATE INDEX idx_registrations_confirmed_at ON registrations(confirmed_at);

CREATE TABLE registration_number_seq (
  year SMALLINT PRIMARY KEY,
  last_value INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE health_information (
  registration_id           UUID PRIMARY KEY REFERENCES registrations(id) ON DELETE CASCADE,
  eps_name                  TEXT,
  blood_type                TEXT,
  has_health_condition      BOOLEAN NOT NULL DEFAULT FALSE,
  health_condition_detail   TEXT,
  has_allergies             BOOLEAN NOT NULL DEFAULT FALSE,
  allergies_detail          TEXT,
  takes_medication          BOOLEAN NOT NULL DEFAULT FALSE,
  medication_detail         TEXT,
  sensitive_data_authorized BOOLEAN NOT NULL DEFAULT FALSE,
  authorized_at             TIMESTAMPTZ
);

CREATE TABLE emergency_contacts (
  registration_id     UUID PRIMARY KEY REFERENCES registrations(id) ON DELETE CASCADE,
  full_name           TEXT NOT NULL,
  relationship        TEXT NOT NULL,
  primary_phone       TEXT NOT NULL,
  secondary_phone     TEXT
);

CREATE TABLE jersey_orders (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  registration_id   UUID NOT NULL UNIQUE REFERENCES registrations(id) ON DELETE CASCADE,
  jersey_size_id    INTEGER NOT NULL REFERENCES jersey_sizes(id),
  sleeve_type       sleeve_type NOT NULL,
  jersey_cut        jersey_cut NOT NULL,
  color             TEXT NOT NULL DEFAULT 'naranja',
  unit_price_cop    INTEGER NOT NULL,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE stored_files (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  storage_key       TEXT NOT NULL UNIQUE,
  original_name     TEXT NOT NULL,
  mime_type         TEXT NOT NULL,
  byte_size         BIGINT NOT NULL,
  checksum_sha256   TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE jersey_payments (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  jersey_order_id       UUID NOT NULL UNIQUE REFERENCES jersey_orders(id) ON DELETE CASCADE,
  status                jersey_payment_status NOT NULL DEFAULT 'pending_verification',
  payer_name            TEXT NOT NULL,
  payment_date          DATE NOT NULL,
  transaction_reference TEXT NOT NULL,
  receipt_file_id       UUID NOT NULL REFERENCES stored_files(id),
  reviewed_by           UUID,
  reviewed_at           TIMESTAMPTZ,
  review_notes          TEXT,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE jersey_payment_audit (
  id                BIGSERIAL PRIMARY KEY,
  jersey_payment_id UUID NOT NULL REFERENCES jersey_payments(id) ON DELETE CASCADE,
  previous_status   jersey_payment_status,
  new_status        jersey_payment_status NOT NULL,
  admin_user_id     UUID,
  notes             TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE legal_documents (
  id            SERIAL PRIMARY KEY,
  doc_type      TEXT NOT NULL,
  version       TEXT NOT NULL,
  title         TEXT NOT NULL,
  body_markdown TEXT NOT NULL DEFAULT '',
  is_published  BOOLEAN NOT NULL DEFAULT FALSE,
  published_at  TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (doc_type, version)
);

CREATE TABLE legal_acceptances (
  id                    BIGSERIAL PRIMARY KEY,
  registration_id         UUID NOT NULL REFERENCES registrations(id) ON DELETE CASCADE,
  legal_document_id       INTEGER NOT NULL REFERENCES legal_documents(id),
  accepted_at             TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ip_address              INET,
  user_agent              TEXT,
  info_correct            BOOLEAN NOT NULL DEFAULT FALSE,
  accept_regulation       BOOLEAN NOT NULL DEFAULT FALSE,
  accept_risk_waiver      BOOLEAN NOT NULL DEFAULT FALSE,
  accept_privacy          BOOLEAN NOT NULL DEFAULT FALSE,
  authorize_health_data   BOOLEAN,
  authorize_image_use     BOOLEAN NOT NULL DEFAULT FALSE,
  subscribe_events        BOOLEAN NOT NULL DEFAULT FALSE,
  UNIQUE (registration_id, legal_document_id)
);

CREATE TABLE guardian_authorizations (
  registration_id       UUID PRIMARY KEY REFERENCES registrations(id) ON DELETE CASCADE,
  guardian_full_name      TEXT NOT NULL,
  guardian_document_type_id INTEGER NOT NULL REFERENCES document_types(id),
  guardian_document_number  TEXT NOT NULL,
  guardian_phone          TEXT NOT NULL,
  guardian_email          CITEXT NOT NULL,
  authorization_file_id   UUID NOT NULL REFERENCES stored_files(id),
  representative_accepted BOOLEAN NOT NULL DEFAULT FALSE,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE admin_users (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email           CITEXT NOT NULL UNIQUE,
  password_hash   TEXT NOT NULL,
  full_name       TEXT NOT NULL,
  role            admin_role NOT NULL DEFAULT 'viewer',
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  last_login_at   TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE audit_logs (
  id              BIGSERIAL PRIMARY KEY,
  admin_user_id   UUID REFERENCES admin_users(id),
  action          TEXT NOT NULL,
  entity_type     TEXT,
  entity_id       TEXT,
  metadata_json   JSONB NOT NULL DEFAULT '{}',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE export_logs (
  id              BIGSERIAL PRIMARY KEY,
  admin_user_id   UUID NOT NULL REFERENCES admin_users(id),
  export_type     TEXT NOT NULL,
  filter_json     JSONB NOT NULL DEFAULT '{}',
  row_count       INTEGER,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Integridad categora + bicicleta
ALTER TABLE registrations ADD CONSTRAINT fk_registration_bicycle_rule
  FOREIGN KEY (category_id, bicycle_type_id)
  REFERENCES category_bicycle_rules(category_id, bicycle_type_id)
  DEFERRABLE INITIALLY DEFERRED;

-- Funcin: contar inscripciones confirmadas
CREATE OR REPLACE FUNCTION count_confirmed_registrations()
RETURNS INTEGER
LANGUAGE sql
STABLE
AS $$
  SELECT COUNT(*)::INTEGER FROM registrations WHERE status = 'confirmed';
$$;

-- Funcin: reservar cupo y confirmar (invocada desde aplicacin en transaccin)
CREATE OR REPLACE FUNCTION assert_registration_quota()
RETURNS VOID
LANGUAGE plpgsql
AS $$
DECLARE
  v_open BOOLEAN;
  v_max INTEGER;
  v_count INTEGER;
BEGIN
  SELECT registrations_open, max_confirmed_registrations
  INTO v_open, v_max FROM event_settings WHERE id = 1 FOR UPDATE;

  IF NOT v_open THEN
    RAISE EXCEPTION 'REGISTRATIONS_CLOSED' USING ERRCODE = 'P0001';
  END IF;

  SELECT count_confirmed_registrations() INTO v_count;

  IF v_count >= v_max THEN
    RAISE EXCEPTION 'QUOTA_EXCEEDED' USING ERRCODE = 'P0002';
  END IF;
END;
$$;

-- Trigger updated_at en registrations
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_registrations_updated
  BEFORE UPDATE ON registrations
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

COMMIT;
