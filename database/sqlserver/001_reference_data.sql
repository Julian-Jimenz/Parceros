USE [manizales_epic_race_2026];
GO

MERGE dbo.event_settings AS t
USING (SELECT 1 AS id) AS s ON t.id = s.id
WHEN NOT MATCHED THEN
  INSERT (id) VALUES (1);

UPDATE dbo.event_settings SET
  jersey_mockup_path = N'/images/jersey/jersey-mockup-01-ciudad.jpeg',
  registrations_open = 0
WHERE id = 1;
GO

IF NOT EXISTS (SELECT 1 FROM dbo.categories WHERE code = N'open-hombres')
INSERT INTO dbo.categories (code, name, description, sort_order) VALUES
  (N'open-hombres', N'Open Hombres', N'Categoria Open Hombres.', 1),
  (N'open-mujeres', N'Open Mujeres', N'Categoria Open Mujeres.', 2),
  (N'recreativa-hombres', N'Recreativa Hombres', N'Categoria Recreativa Hombres.', 3),
  (N'recreativa-mujeres', N'Recreativa Mujeres', N'Categoria Recreativa Mujeres.', 4);
GO

IF NOT EXISTS (SELECT 1 FROM dbo.document_types WHERE code = N'CC')
INSERT INTO dbo.document_types (code, name, sort_order) VALUES
  (N'CC', N'Cedula de ciudadania', 1),
  (N'CE', N'Cedula de extranjeria', 2),
  (N'PA', N'Pasaporte', 3),
  (N'TI', N'Tarjeta de identidad', 4);
GO

IF NOT EXISTS (SELECT 1 FROM dbo.nationalities WHERE code = N'CO')
INSERT INTO dbo.nationalities (code, name, sort_order) VALUES (N'CO', N'Colombia', 1);
GO

IF NOT EXISTS (SELECT 1 FROM dbo.jersey_sizes WHERE code = N'XS')
INSERT INTO dbo.jersey_sizes (code, label, sort_order) VALUES
  (N'XS', N'XS', 1), (N'S', N'S', 2), (N'M', N'M', 3),
  (N'L', N'L', 4), (N'XL', N'XL', 5), (N'XXL', N'XXL', 6);
GO

IF NOT EXISTS (SELECT 1 FROM dbo.legal_documents WHERE doc_type = N'regulation')
INSERT INTO dbo.legal_documents (doc_type, version, title, body_markdown, is_published) VALUES
  (N'regulation', N'0.0-draft', N'Reglamento (borrador)', N'**Pendiente de aprobacion.**', 0),
  (N'risk_waiver', N'0.0-draft', N'Declaracion de riesgos (borrador)', N'**Pendiente.**', 0),
  (N'privacy', N'0.0-draft', N'Politica de privacidad (borrador)', N'**Pendiente.**', 0);
GO

IF NOT EXISTS (SELECT 1 FROM dbo.registration_number_seq WHERE [year] = 2026)
INSERT INTO dbo.registration_number_seq ([year], last_value) VALUES (2026, 0);
GO
