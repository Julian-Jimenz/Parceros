-- Datos de referencia iniciales (sin textos legales definitivos ni reglas de bicicleta inventadas)

BEGIN;

INSERT INTO event_settings (id) VALUES (1)
ON CONFLICT (id) DO NOTHING;

UPDATE event_settings SET
  jersey_mockup_path = '/images/jersey/jersey-mockup-01-ciudad.jpeg',
  registrations_open = FALSE
WHERE id = 1;

INSERT INTO categories (code, name, description, sort_order) VALUES
  ('open-hombres', 'Open Hombres', 'Categorùa Open Hombres ù descripciùn editable desde administraciùn.', 1),
  ('open-mujeres', 'Open Mujeres', 'Categorùa Open Mujeres ù descripciùn editable desde administraciùn.', 2),
  ('recreativa-hombres', 'Recreativa Hombres', 'Categorùa Recreativa Hombres ù descripciùn editable desde administraciùn.', 3),
  ('recreativa-mujeres', 'Recreativa Mujeres', 'Categorùa Recreativa Mujeres ù descripciùn editable desde administraciùn.', 4)
ON CONFLICT (code) DO NOTHING;

INSERT INTO document_types (code, name, sort_order) VALUES
  ('CC', 'Cùdula de ciudadanùa', 1),
  ('CE', 'Cùdula de extranjerùa', 2),
  ('PA', 'Pasaporte', 3),
  ('TI', 'Tarjeta de identidad', 4)
ON CONFLICT (code) DO NOTHING;

INSERT INTO nationalities (code, name, sort_order) VALUES
  ('CO', 'Colombia', 1)
ON CONFLICT (code) DO NOTHING;

-- Tallas sin medidas corporales (tabla vacùa de measurements hasta carga admin)
INSERT INTO jersey_sizes (code, label, sort_order) VALUES
  ('XS', 'XS', 1),
  ('S', 'S', 2),
  ('M', 'M', 3),
  ('L', 'L', 4),
  ('XL', 'XL', 5),
  ('XXL', 'XXL', 6)
ON CONFLICT (code) DO NOTHING;

INSERT INTO legal_documents (doc_type, version, title, body_markdown, is_published) VALUES
  ('regulation', '0.0-draft', 'Reglamento del evento (borrador)', '**Pendiente de aprobaciùn legal y organizaciùn.**', FALSE),
  ('risk_waiver', '0.0-draft', 'Declaraciùn de riesgos (borrador)', '**Pendiente de aprobaciùn legal.**', FALSE),
  ('privacy', '0.0-draft', 'Polùtica de privacidad (borrador)', '**Pendiente de aprobaciùn legal ù Ley 1581 de 2012.**', FALSE)
ON CONFLICT (doc_type, version) DO NOTHING;

INSERT INTO registration_number_seq (year, last_value) VALUES (2026, 0)
ON CONFLICT (year) DO NOTHING;

COMMIT;
