SET NOCOUNT ON;
GO

IF NOT EXISTS (SELECT 1 FROM dbo.event_settings WHERE id = 1)
  INSERT INTO dbo.event_settings (id) VALUES (1);

UPDATE dbo.event_settings SET
  jersey_mockup_path = N'/images/jersey/jersey-mockup-01-ciudad.jpeg',
  registrations_open = 0
WHERE id = 1;
GO

MERGE dbo.categories AS t
USING (VALUES
  (N'open-hombres', N'Open Hombres', N'Categoria Open Hombres.', 1),
  (N'open-mujeres', N'Open Mujeres', N'Categoria Open Mujeres.', 2),
  (N'recreativa-hombres', N'Recreativa Hombres', N'Categoria Recreativa Hombres.', 3),
  (N'recreativa-mujeres', N'Recreativa Mujeres', N'Categoria Recreativa Mujeres.', 4)
) AS s(code, name, description, sort_order)
ON t.code = s.code
WHEN NOT MATCHED THEN INSERT (code, name, description, sort_order) VALUES (s.code, s.name, s.description, s.sort_order);
GO

MERGE dbo.document_types AS t
USING (VALUES
  (N'CC', N'Cedula de ciudadania', 1),
  (N'CE', N'Cedula de extranjeria', 2),
  (N'PA', N'Pasaporte', 3),
  (N'TI', N'Tarjeta de identidad', 4)
) AS s(code, name, sort_order)
ON t.code = s.code
WHEN NOT MATCHED THEN INSERT (code, name, sort_order) VALUES (s.code, s.name, s.sort_order);
GO

MERGE dbo.nationalities AS t
USING (VALUES (N'CO', N'Colombia', 1)) AS s(code, name, sort_order)
ON t.code = s.code
WHEN NOT MATCHED THEN INSERT (code, name, sort_order) VALUES (s.code, s.name, s.sort_order);
GO

MERGE dbo.jersey_sizes AS t
USING (VALUES
  (N'XS', N'XS', 1), (N'S', N'S', 2), (N'M', N'M', 3),
  (N'L', N'L', 4), (N'XL', N'XL', 5), (N'XXL', N'XXL', 6)
) AS s(code, label, sort_order)
ON t.code = s.code
WHEN NOT MATCHED THEN INSERT (code, label, sort_order) VALUES (s.code, s.label, s.sort_order);
GO

MERGE dbo.legal_documents AS t
USING (VALUES
  (N'regulation', N'0.0-draft', N'Reglamento del evento (borrador)', N'**Pendiente de aprobacion legal.**', 0),
  (N'risk_waiver', N'0.0-draft', N'Declaracion de riesgos (borrador)', N'**Pendiente de aprobacion legal.**', 0),
  (N'privacy', N'0.0-draft', N'Politica de privacidad (borrador)', N'**Pendiente - Ley 1581.**', 0)
) AS s(doc_type, version, title, body_markdown, is_published)
ON t.doc_type = s.doc_type AND t.version = s.version
WHEN NOT MATCHED THEN INSERT (doc_type, version, title, body_markdown, is_published)
  VALUES (s.doc_type, s.version, s.title, s.body_markdown, s.is_published);
GO

IF NOT EXISTS (SELECT 1 FROM dbo.registration_number_seq WHERE [year] = 2026)
  INSERT INTO dbo.registration_number_seq ([year], last_value) VALUES (2026, 0);
GO
