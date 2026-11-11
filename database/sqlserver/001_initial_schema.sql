-- Manizales Epic Race 2026 - SQL Server 2022+
-- Base: manizales_epic_race_2026

SET NOCOUNT ON;
GO

IF OBJECT_ID(N'dbo.event_settings', N'U') IS NULL
BEGIN
  CREATE TABLE dbo.event_settings (
    id                          SMALLINT NOT NULL CONSTRAINT event_settings_pk PRIMARY KEY DEFAULT 1,
    event_name                  NVARCHAR(200) NOT NULL DEFAULT N'MANIZALES EPIC RACE 2026',
    event_date                  DATE NOT NULL DEFAULT '2026-12-13',
    event_city                  NVARCHAR(100) NOT NULL DEFAULT N'Manizales',
    event_department            NVARCHAR(100) NOT NULL DEFAULT N'Caldas',
    timezone                    NVARCHAR(64) NOT NULL DEFAULT N'America/Bogota',
    registrations_open          BIT NOT NULL DEFAULT 0,
    max_confirmed_registrations INT NOT NULL DEFAULT 300,
    jersey_price_cop            INT NOT NULL DEFAULT 110000,
    minors_registration_enabled BIT NOT NULL DEFAULT 0,
    minor_minimum_age           SMALLINT NULL,
    payment_nequi_key           NVARCHAR(32) NOT NULL DEFAULT N'3013131008',
    payment_beneficiary         NVARCHAR(200) NOT NULL DEFAULT N'David Plata',
    upload_max_bytes            BIGINT NOT NULL DEFAULT 5242880,
    allowed_upload_mime         NVARCHAR(500) NOT NULL DEFAULT N'["image/jpeg","image/png","application/pdf"]',
    about_content_json          NVARCHAR(MAX) NOT NULL DEFAULT N'{}',
    hero_image_path             NVARCHAR(500) NULL,
    jersey_mockup_path          NVARCHAR(500) NULL,
    size_chart_image_path       NVARCHAR(500) NULL,
    updated_at                  DATETIMEOFFSET NOT NULL DEFAULT SYSDATETIMEOFFSET(),
    CONSTRAINT event_settings_singleton CHECK (id = 1),
    CONSTRAINT event_settings_max_chk CHECK (max_confirmed_registrations > 0)
  );
END
GO

IF OBJECT_ID(N'dbo.categories', N'U') IS NULL
CREATE TABLE dbo.categories (
  id            INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
  code          NVARCHAR(64) NOT NULL UNIQUE,
  name          NVARCHAR(200) NOT NULL,
  description   NVARCHAR(MAX) NOT NULL DEFAULT N'',
  sort_order    SMALLINT NOT NULL DEFAULT 0,
  is_active     BIT NOT NULL DEFAULT 1,
  created_at    DATETIMEOFFSET NOT NULL DEFAULT SYSDATETIMEOFFSET()
);
GO

IF OBJECT_ID(N'dbo.bicycle_types', N'U') IS NULL
CREATE TABLE dbo.bicycle_types (
  id            INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
  code          NVARCHAR(64) NOT NULL UNIQUE,
  name          NVARCHAR(200) NOT NULL,
  is_active     BIT NOT NULL DEFAULT 1,
  created_at    DATETIMEOFFSET NOT NULL DEFAULT SYSDATETIMEOFFSET()
);
GO

IF OBJECT_ID(N'dbo.category_bicycle_rules', N'U') IS NULL
CREATE TABLE dbo.category_bicycle_rules (
  category_id      INT NOT NULL REFERENCES dbo.categories(id) ON DELETE CASCADE,
  bicycle_type_id  INT NOT NULL REFERENCES dbo.bicycle_types(id) ON DELETE CASCADE,
  PRIMARY KEY (category_id, bicycle_type_id)
);
GO

IF OBJECT_ID(N'dbo.document_types', N'U') IS NULL
CREATE TABLE dbo.document_types (
  id            INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
  code          NVARCHAR(16) NOT NULL UNIQUE,
  name          NVARCHAR(200) NOT NULL,
  sort_order    SMALLINT NOT NULL DEFAULT 0,
  is_active     BIT NOT NULL DEFAULT 1
);
GO

IF OBJECT_ID(N'dbo.nationalities', N'U') IS NULL
CREATE TABLE dbo.nationalities (
  id            INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
  code          NVARCHAR(16) NOT NULL UNIQUE,
  name          NVARCHAR(200) NOT NULL,
  sort_order    SMALLINT NOT NULL DEFAULT 0,
  is_active     BIT NOT NULL DEFAULT 1
);
GO

IF OBJECT_ID(N'dbo.jersey_sizes', N'U') IS NULL
CREATE TABLE dbo.jersey_sizes (
  id            INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
  code          NVARCHAR(16) NOT NULL UNIQUE,
  label         NVARCHAR(32) NOT NULL,
  sort_order    SMALLINT NOT NULL DEFAULT 0,
  is_active     BIT NOT NULL DEFAULT 1
);
GO

IF OBJECT_ID(N'dbo.jersey_size_measurements', N'U') IS NULL
CREATE TABLE dbo.jersey_size_measurements (
  id              INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
  jersey_size_id  INT NOT NULL REFERENCES dbo.jersey_sizes(id) ON DELETE CASCADE,
  metric_key      NVARCHAR(64) NOT NULL,
  metric_value_cm DECIMAL(6,2) NULL,
  sort_order      SMALLINT NOT NULL DEFAULT 0,
  CONSTRAINT uq_jersey_metric UNIQUE (jersey_size_id, metric_key)
);
GO

IF OBJECT_ID(N'dbo.participants', N'U') IS NULL
CREATE TABLE dbo.participants (
  id                    UNIQUEIDENTIFIER NOT NULL PRIMARY KEY DEFAULT NEWID(),
  first_name            NVARCHAR(200) NOT NULL,
  last_name             NVARCHAR(200) NOT NULL,
  document_type_id      INT NOT NULL REFERENCES dbo.document_types(id),
  document_number       NVARCHAR(64) NOT NULL,
  birth_date            DATE NOT NULL,
  sex                   NVARCHAR(16) NOT NULL,
  nationality_id        INT NULL REFERENCES dbo.nationalities(id),
  residence_department  NVARCHAR(120) NOT NULL,
  residence_municipality NVARCHAR(120) NOT NULL,
  residence_address     NVARCHAR(300) NOT NULL,
  phone                 NVARCHAR(32) NOT NULL,
  email                 NVARCHAR(320) NOT NULL,
  club_or_team          NVARCHAR(200) NULL,
  created_at            DATETIMEOFFSET NOT NULL DEFAULT SYSDATETIMEOFFSET(),
  CONSTRAINT participants_document_unique UNIQUE (document_type_id, document_number),
  CONSTRAINT participants_email_unique UNIQUE (email)
);
GO

IF OBJECT_ID(N'dbo.registrations', N'U') IS NULL
CREATE TABLE dbo.registrations (
  id                    UNIQUEIDENTIFIER NOT NULL PRIMARY KEY DEFAULT NEWID(),
  registration_number   NVARCHAR(32) NULL UNIQUE,
  participant_id        UNIQUEIDENTIFIER NOT NULL REFERENCES dbo.participants(id),
  category_id           INT NOT NULL REFERENCES dbo.categories(id),
  bicycle_type_id       INT NOT NULL REFERENCES dbo.bicycle_types(id),
  status                NVARCHAR(20) NOT NULL DEFAULT N'draft',
  registration_option   NVARCHAR(32) NOT NULL DEFAULT N'free_only',
  idempotency_key       NVARCHAR(128) NULL UNIQUE,
  confirmed_at          DATETIMEOFFSET NULL,
  created_at            DATETIMEOFFSET NOT NULL DEFAULT SYSDATETIMEOFFSET(),
  updated_at            DATETIMEOFFSET NOT NULL DEFAULT SYSDATETIMEOFFSET(),
  CONSTRAINT chk_reg_status CHECK (status IN (N'draft', N'confirmed', N'cancelled')),
  CONSTRAINT chk_reg_option CHECK (registration_option IN (N'free_only', N'free_with_jersey')),
  CONSTRAINT fk_registration_bicycle_rule FOREIGN KEY (category_id, bicycle_type_id)
    REFERENCES dbo.category_bicycle_rules(category_id, bicycle_type_id)
);
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'registrations_one_confirmed_per_participant')
CREATE UNIQUE INDEX registrations_one_confirmed_per_participant
  ON dbo.registrations (participant_id)
  WHERE status = N'confirmed';
GO

IF OBJECT_ID(N'dbo.registration_number_seq', N'U') IS NULL
CREATE TABLE dbo.registration_number_seq (
  [year] SMALLINT NOT NULL PRIMARY KEY,
  last_value INT NOT NULL DEFAULT 0
);
GO

IF OBJECT_ID(N'dbo.health_information', N'U') IS NULL
CREATE TABLE dbo.health_information (
  registration_id           UNIQUEIDENTIFIER NOT NULL PRIMARY KEY REFERENCES dbo.registrations(id) ON DELETE CASCADE,
  eps_name                  NVARCHAR(200) NULL,
  blood_type                NVARCHAR(16) NULL,
  has_health_condition      BIT NOT NULL DEFAULT 0,
  health_condition_detail   NVARCHAR(MAX) NULL,
  has_allergies             BIT NOT NULL DEFAULT 0,
  allergies_detail          NVARCHAR(MAX) NULL,
  takes_medication          BIT NOT NULL DEFAULT 0,
  medication_detail         NVARCHAR(MAX) NULL,
  sensitive_data_authorized BIT NOT NULL DEFAULT 0,
  authorized_at             DATETIMEOFFSET NULL
);
GO

IF OBJECT_ID(N'dbo.emergency_contacts', N'U') IS NULL
CREATE TABLE dbo.emergency_contacts (
  registration_id     UNIQUEIDENTIFIER NOT NULL PRIMARY KEY REFERENCES dbo.registrations(id) ON DELETE CASCADE,
  full_name           NVARCHAR(200) NOT NULL,
  relationship        NVARCHAR(120) NOT NULL,
  primary_phone       NVARCHAR(32) NOT NULL,
  secondary_phone     NVARCHAR(32) NULL
);
GO

IF OBJECT_ID(N'dbo.jersey_orders', N'U') IS NULL
CREATE TABLE dbo.jersey_orders (
  id                UNIQUEIDENTIFIER NOT NULL PRIMARY KEY DEFAULT NEWID(),
  registration_id   UNIQUEIDENTIFIER NOT NULL UNIQUE REFERENCES dbo.registrations(id) ON DELETE CASCADE,
  jersey_size_id    INT NOT NULL REFERENCES dbo.jersey_sizes(id),
  sleeve_type       NVARCHAR(16) NOT NULL,
  jersey_cut        NVARCHAR(16) NOT NULL,
  color             NVARCHAR(32) NOT NULL DEFAULT N'naranja',
  unit_price_cop    INT NOT NULL,
  created_at        DATETIMEOFFSET NOT NULL DEFAULT SYSDATETIMEOFFSET(),
  CONSTRAINT chk_sleeve CHECK (sleeve_type IN (N'short', N'long')),
  CONSTRAINT chk_jersey_cut CHECK (jersey_cut IN (N'road', N'mtb'))
);
GO

IF OBJECT_ID(N'dbo.stored_files', N'U') IS NULL
CREATE TABLE dbo.stored_files (
  id                UNIQUEIDENTIFIER NOT NULL PRIMARY KEY DEFAULT NEWID(),
  storage_key       NVARCHAR(500) NOT NULL UNIQUE,
  original_name     NVARCHAR(260) NOT NULL,
  mime_type         NVARCHAR(128) NOT NULL,
  byte_size         BIGINT NOT NULL,
  checksum_sha256   NVARCHAR(64) NULL,
  created_at        DATETIMEOFFSET NOT NULL DEFAULT SYSDATETIMEOFFSET()
);
GO

IF OBJECT_ID(N'dbo.jersey_payments', N'U') IS NULL
CREATE TABLE dbo.jersey_payments (
  id                    UNIQUEIDENTIFIER NOT NULL PRIMARY KEY DEFAULT NEWID(),
  jersey_order_id       UNIQUEIDENTIFIER NOT NULL UNIQUE REFERENCES dbo.jersey_orders(id) ON DELETE CASCADE,
  status                NVARCHAR(32) NOT NULL DEFAULT N'pending_verification',
  payer_name            NVARCHAR(200) NOT NULL,
  payment_date          DATE NOT NULL,
  transaction_reference NVARCHAR(200) NOT NULL,
  receipt_file_id       UNIQUEIDENTIFIER NOT NULL REFERENCES dbo.stored_files(id),
  reviewed_by           UNIQUEIDENTIFIER NULL,
  reviewed_at           DATETIMEOFFSET NULL,
  review_notes          NVARCHAR(MAX) NULL,
  created_at            DATETIMEOFFSET NOT NULL DEFAULT SYSDATETIMEOFFSET(),
  CONSTRAINT chk_jersey_payment_status CHECK (status IN (N'pending_verification', N'approved', N'rejected'))
);
GO

IF OBJECT_ID(N'dbo.jersey_payment_audit', N'U') IS NULL
CREATE TABLE dbo.jersey_payment_audit (
  id                BIGINT IDENTITY(1,1) NOT NULL PRIMARY KEY,
  jersey_payment_id UNIQUEIDENTIFIER NOT NULL REFERENCES dbo.jersey_payments(id) ON DELETE CASCADE,
  previous_status   NVARCHAR(32) NULL,
  new_status        NVARCHAR(32) NOT NULL,
  admin_user_id     UNIQUEIDENTIFIER NULL,
  notes             NVARCHAR(MAX) NULL,
  created_at        DATETIMEOFFSET NOT NULL DEFAULT SYSDATETIMEOFFSET()
);
GO

IF OBJECT_ID(N'dbo.legal_documents', N'U') IS NULL
CREATE TABLE dbo.legal_documents (
  id            INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
  doc_type      NVARCHAR(64) NOT NULL,
  version       NVARCHAR(32) NOT NULL,
  title         NVARCHAR(300) NOT NULL,
  body_markdown NVARCHAR(MAX) NOT NULL DEFAULT N'',
  is_published  BIT NOT NULL DEFAULT 0,
  published_at  DATETIMEOFFSET NULL,
  created_at    DATETIMEOFFSET NOT NULL DEFAULT SYSDATETIMEOFFSET(),
  CONSTRAINT uq_legal_doc UNIQUE (doc_type, version)
);
GO

IF OBJECT_ID(N'dbo.legal_acceptances', N'U') IS NULL
CREATE TABLE dbo.legal_acceptances (
  id                    BIGINT IDENTITY(1,1) NOT NULL PRIMARY KEY,
  registration_id       UNIQUEIDENTIFIER NOT NULL REFERENCES dbo.registrations(id) ON DELETE CASCADE,
  legal_document_id     INT NOT NULL REFERENCES dbo.legal_documents(id),
  accepted_at           DATETIMEOFFSET NOT NULL DEFAULT SYSDATETIMEOFFSET(),
  ip_address            NVARCHAR(45) NULL,
  user_agent            NVARCHAR(512) NULL,
  info_correct          BIT NOT NULL DEFAULT 0,
  accept_regulation     BIT NOT NULL DEFAULT 0,
  accept_risk_waiver    BIT NOT NULL DEFAULT 0,
  accept_privacy        BIT NOT NULL DEFAULT 0,
  authorize_health_data BIT NULL,
  authorize_image_use   BIT NOT NULL DEFAULT 0,
  subscribe_events      BIT NOT NULL DEFAULT 0,
  CONSTRAINT uq_legal_accept UNIQUE (registration_id, legal_document_id)
);
GO

IF OBJECT_ID(N'dbo.guardian_authorizations', N'U') IS NULL
CREATE TABLE dbo.guardian_authorizations (
  registration_id           UNIQUEIDENTIFIER NOT NULL PRIMARY KEY REFERENCES dbo.registrations(id) ON DELETE CASCADE,
  guardian_full_name        NVARCHAR(200) NOT NULL,
  guardian_document_type_id INT NOT NULL REFERENCES dbo.document_types(id),
  guardian_document_number  NVARCHAR(64) NOT NULL,
  guardian_phone            NVARCHAR(32) NOT NULL,
  guardian_email            NVARCHAR(320) NOT NULL,
  authorization_file_id     UNIQUEIDENTIFIER NOT NULL REFERENCES dbo.stored_files(id),
  representative_accepted   BIT NOT NULL DEFAULT 0,
  created_at                DATETIMEOFFSET NOT NULL DEFAULT SYSDATETIMEOFFSET()
);
GO

IF OBJECT_ID(N'dbo.admin_users', N'U') IS NULL
CREATE TABLE dbo.admin_users (
  id              UNIQUEIDENTIFIER NOT NULL PRIMARY KEY DEFAULT NEWID(),
  email           NVARCHAR(320) NOT NULL UNIQUE,
  password_hash   NVARCHAR(256) NOT NULL,
  full_name       NVARCHAR(200) NOT NULL,
  role            NVARCHAR(32) NOT NULL DEFAULT N'viewer',
  is_active       BIT NOT NULL DEFAULT 1,
  last_login_at   DATETIMEOFFSET NULL,
  created_at      DATETIMEOFFSET NOT NULL DEFAULT SYSDATETIMEOFFSET(),
  CONSTRAINT chk_admin_role CHECK (role IN (N'super_admin', N'operator', N'viewer'))
);
GO

IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = N'jersey_payments_reviewed_by_fkey')
ALTER TABLE dbo.jersey_payments
  ADD CONSTRAINT jersey_payments_reviewed_by_fkey
  FOREIGN KEY (reviewed_by) REFERENCES dbo.admin_users(id);
GO

IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = N'jersey_payment_audit_admin_user_id_fkey')
ALTER TABLE dbo.jersey_payment_audit
  ADD CONSTRAINT jersey_payment_audit_admin_user_id_fkey
  FOREIGN KEY (admin_user_id) REFERENCES dbo.admin_users(id);
GO

IF OBJECT_ID(N'dbo.audit_logs', N'U') IS NULL
CREATE TABLE dbo.audit_logs (
  id              BIGINT IDENTITY(1,1) NOT NULL PRIMARY KEY,
  admin_user_id   UNIQUEIDENTIFIER NULL REFERENCES dbo.admin_users(id),
  action          NVARCHAR(128) NOT NULL,
  entity_type     NVARCHAR(64) NULL,
  entity_id       NVARCHAR(64) NULL,
  metadata_json   NVARCHAR(MAX) NOT NULL DEFAULT N'{}',
  created_at      DATETIMEOFFSET NOT NULL DEFAULT SYSDATETIMEOFFSET()
);
GO

IF OBJECT_ID(N'dbo.export_logs', N'U') IS NULL
CREATE TABLE dbo.export_logs (
  id              BIGINT IDENTITY(1,1) NOT NULL PRIMARY KEY,
  admin_user_id   UNIQUEIDENTIFIER NOT NULL REFERENCES dbo.admin_users(id),
  export_type     NVARCHAR(64) NOT NULL,
  filter_json     NVARCHAR(MAX) NOT NULL DEFAULT N'{}',
  row_count       INT NULL,
  created_at      DATETIMEOFFSET NOT NULL DEFAULT SYSDATETIMEOFFSET()
);
GO
