USE [manizales_epic_race_2026];
GO

IF OBJECT_ID(N'dbo.jersey_size_measurements', N'U') IS NULL
CREATE TABLE dbo.jersey_size_measurements (
  id INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
  jersey_size_id INT NOT NULL REFERENCES dbo.jersey_sizes(id) ON DELETE CASCADE,
  metric_key NVARCHAR(100) NOT NULL,
  metric_value_cm DECIMAL(6,2) NULL,
  sort_order SMALLINT NOT NULL DEFAULT 0,
  CONSTRAINT UQ_jersey_size_metric UNIQUE (jersey_size_id, metric_key)
);
GO

IF OBJECT_ID(N'dbo.guardian_authorizations', N'U') IS NULL
CREATE TABLE dbo.guardian_authorizations (
  registration_id UNIQUEIDENTIFIER NOT NULL PRIMARY KEY REFERENCES dbo.registrations(id) ON DELETE CASCADE,
  guardian_full_name NVARCHAR(200) NOT NULL,
  guardian_document_type_id INT NOT NULL REFERENCES dbo.document_types(id),
  guardian_document_number NVARCHAR(50) NOT NULL,
  guardian_phone NVARCHAR(30) NOT NULL,
  guardian_email NVARCHAR(320) NOT NULL,
  authorization_file_id UNIQUEIDENTIFIER NOT NULL REFERENCES dbo.stored_files(id),
  representative_accepted BIT NOT NULL DEFAULT 0,
  created_at DATETIMEOFFSET NOT NULL DEFAULT SYSDATETIMEOFFSET()
);
GO

IF OBJECT_ID(N'dbo.jersey_payment_audit', N'U') IS NULL
CREATE TABLE dbo.jersey_payment_audit (
  id BIGINT IDENTITY(1,1) NOT NULL PRIMARY KEY,
  jersey_payment_id UNIQUEIDENTIFIER NOT NULL REFERENCES dbo.jersey_payments(id) ON DELETE CASCADE,
  previous_status NVARCHAR(30) NULL,
  new_status NVARCHAR(30) NOT NULL,
  admin_user_id UNIQUEIDENTIFIER NULL REFERENCES dbo.admin_users(id),
  notes NVARCHAR(MAX) NULL,
  created_at DATETIMEOFFSET NOT NULL DEFAULT SYSDATETIMEOFFSET()
);
GO

IF OBJECT_ID(N'dbo.export_logs', N'U') IS NULL
CREATE TABLE dbo.export_logs (
  id BIGINT IDENTITY(1,1) NOT NULL PRIMARY KEY,
  admin_user_id UNIQUEIDENTIFIER NOT NULL REFERENCES dbo.admin_users(id),
  export_type NVARCHAR(100) NOT NULL,
  filter_json NVARCHAR(MAX) NOT NULL DEFAULT N'{}',
  row_count INT NULL,
  created_at DATETIMEOFFSET NOT NULL DEFAULT SYSDATETIMEOFFSET()
);
GO

IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = N'FK_jersey_payments_reviewed_by')
ALTER TABLE dbo.jersey_payments
  ADD CONSTRAINT FK_jersey_payments_reviewed_by
  FOREIGN KEY (reviewed_by) REFERENCES dbo.admin_users(id);
GO

CREATE OR ALTER PROCEDURE dbo.allocate_registration_number
  @p_year SMALLINT = NULL,
  @out_number NVARCHAR(32) OUTPUT
AS
BEGIN
  SET NOCOUNT ON;
  DECLARE @v_year SMALLINT;
  DECLARE @v_next INT;

  IF @p_year IS NULL
    SELECT @v_year = YEAR(event_date) FROM dbo.event_settings WHERE id = 1;
  ELSE
    SET @v_year = @p_year;

  IF @v_year IS NULL
    THROW 50004, N'EVENT_YEAR_UNAVAILABLE', 1;

  IF NOT EXISTS (SELECT 1 FROM dbo.registration_number_seq WHERE [year] = @v_year)
    INSERT INTO dbo.registration_number_seq ([year], last_value) VALUES (@v_year, 0);

  UPDATE dbo.registration_number_seq
  SET last_value = last_value + 1
  WHERE [year] = @v_year;

  SELECT @v_next = last_value FROM dbo.registration_number_seq WHERE [year] = @v_year;

  SET @out_number = CONCAT(N'MER', @v_year, N'-', RIGHT(CONCAT(N'00000', CAST(@v_next AS NVARCHAR(10))), 5));
END;
GO

CREATE OR ALTER TRIGGER dbo.trg_registrations_enforce_quota
ON dbo.registrations
AFTER INSERT, UPDATE
AS
BEGIN
  SET NOCOUNT ON;
  IF NOT EXISTS (
    SELECT 1
    FROM inserted i
    LEFT JOIN deleted d ON i.id = d.id
    WHERE i.status = N'confirmed' AND (d.id IS NULL OR d.status <> N'confirmed')
  )
    RETURN;

  DECLARE @open BIT, @max INT;
  SELECT @open = registrations_open, @max = max_confirmed_registrations
  FROM dbo.event_settings WITH (UPDLOCK, ROWLOCK)
  WHERE id = 1;

  IF @open = 0
  BEGIN
    RAISERROR(N'REGISTRATIONS_CLOSED', 16, 1);
    ROLLBACK TRANSACTION;
    RETURN;
  END

  IF (SELECT COUNT(*) FROM dbo.registrations WHERE status = N'confirmed') > @max
  BEGIN
    RAISERROR(N'QUOTA_EXCEEDED', 16, 1);
    ROLLBACK TRANSACTION;
  END
END;
GO

CREATE OR ALTER TRIGGER dbo.trg_registrations_assign_number
ON dbo.registrations
AFTER INSERT, UPDATE
AS
BEGIN
  SET NOCOUNT ON;

  DECLARE @id UNIQUEIDENTIFIER;
  DECLARE @num NVARCHAR(32);

  DECLARE cur CURSOR LOCAL FAST_FORWARD FOR
    SELECT i.id
    FROM inserted i
    LEFT JOIN deleted d ON i.id = d.id
    INNER JOIN dbo.registrations r ON r.id = i.id
    WHERE i.status = N'confirmed'
      AND (d.id IS NULL OR d.status <> N'confirmed')
      AND (r.registration_number IS NULL OR LTRIM(RTRIM(r.registration_number)) = N'');

  OPEN cur;
  FETCH NEXT FROM cur INTO @id;
  WHILE @@FETCH_STATUS = 0
  BEGIN
    EXEC dbo.allocate_registration_number @p_year = NULL, @out_number = @num OUTPUT;
    UPDATE dbo.registrations
    SET registration_number = @num,
        confirmed_at = COALESCE(confirmed_at, SYSDATETIMEOFFSET()),
        updated_at = SYSDATETIMEOFFSET()
    WHERE id = @id;
    FETCH NEXT FROM cur INTO @id;
  END
  CLOSE cur;
  DEALLOCATE cur;
END;
GO
