# Base de datos — Manizales Epic Race 2026

## Requisitos

- PostgreSQL 14+ (detectado: **16** en este equipo)
- Usuario con permiso `CREATEDB` (típicamente `postgres`)

## Creación automática (Windows)

Desde PowerShell, en la raíz del proyecto:

```powershell
cd database\scripts
.\create-database.ps1 -PgUser postgres -PgPassword "TU_CLAVE_POSTGRES"
```

Esto crea la base `manizales_epic_race_2026`, aplica `migrations/001_initial_schema.sql` y `seed/001_reference_data.sql`.

## Creación manual

```powershell
$env:PGPASSWORD = "TU_CLAVE"
& "C:\Program Files\PostgreSQL\16\bin\createdb.exe" -U postgres manizales_epic_race_2026
& "C:\Program Files\PostgreSQL\16\bin\psql.exe" -U postgres -d manizales_epic_race_2026 -f database\migrations\001_initial_schema.sql
& "C:\Program Files\PostgreSQL\16\bin\psql.exe" -U postgres -d manizales_epic_race_2026 -f database\seed\001_reference_data.sql
```

## Verificación

```sql
SELECT event_name, event_date, max_confirmed_registrations FROM event_settings;
SELECT code, name FROM categories ORDER BY sort_order;
```

## Antes de abrir inscripciones

1. Configurar `category_bicycle_rules` (matriz categoría ? tipo de bicicleta).
2. Publicar versiones legales en `legal_documents` (`is_published = true`).
3. Cargar tabla de tallas en `jersey_size_measurements`.
4. Activar `registrations_open` solo tras pruebas y validación legal.
