-- Cupo y numeracion MER{year}-#####

CREATE OR ALTER PROCEDURE dbo.sp_allocate_registration_number
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
  SET @out_number = N'MER' + CAST(@v_year AS NVARCHAR(8)) + N'-' + RIGHT(N'00000' + CAST(@v_next AS NVARCHAR(8)), 5);
END;
GO

CREATE OR ALTER TRIGGER dbo.trg_registrations_enforce_quota
ON dbo.registrations
AFTER INSERT, UPDATE
AS
BEGIN
  SET NOCOUNT ON;
  IF NOT EXISTS (
    SELECT 1 FROM inserted i
    WHERE i.status = N'confirmed'
      AND NOT EXISTS (SELECT 1 FROM deleted d WHERE d.id = i.id AND d.status = N'confirmed')
  )
    RETURN;

  DECLARE @open BIT, @max INT, @count INT;

  SELECT @open = registrations_open, @max = max_confirmed_registrations
  FROM dbo.event_settings WITH (UPDLOCK, ROWLOCK)
  WHERE id = 1;

  IF @open IS NULL OR @open = 0
    THROW 50001, N'REGISTRATIONS_CLOSED', 1;

  SELECT @count = COUNT(*) FROM dbo.registrations WHERE status = N'confirmed';

  IF @count > @max
    THROW 50002, N'QUOTA_EXCEEDED', 1;
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
    WHERE i.status = N'confirmed'
      AND NOT EXISTS (SELECT 1 FROM deleted d WHERE d.id = i.id AND d.status = N'confirmed');

  OPEN cur;
  FETCH NEXT FROM cur INTO @id;
  WHILE @@FETCH_STATUS = 0
  BEGIN
    IF EXISTS (
      SELECT 1 FROM dbo.registrations
      WHERE id = @id AND (registration_number IS NULL OR LTRIM(RTRIM(registration_number)) = N'')
    )
    BEGIN
      EXEC dbo.sp_allocate_registration_number NULL, @num OUTPUT;
      UPDATE dbo.registrations
      SET registration_number = @num,
          confirmed_at = COALESCE(confirmed_at, SYSDATETIMEOFFSET())
      WHERE id = @id;
    END
    ELSE
    BEGIN
      UPDATE dbo.registrations
      SET confirmed_at = COALESCE(confirmed_at, SYSDATETIMEOFFSET())
      WHERE id = @id AND confirmed_at IS NULL;
    END
    FETCH NEXT FROM cur INTO @id;
  END
  CLOSE cur;
  DEALLOCATE cur;
END;
GO
