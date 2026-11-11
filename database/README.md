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

**Migraciones incrementales (Fase 3B-2):** aplicar en orden **después** del seed, solo cuando esté autorizado:

1. `migrations/002_quota_enforcement.sql`
2. `migrations/003_registration_number.sql`
3. `migrations/004_integrity_admin_health_legal.sql`

El script `create-database.ps1` **no** aplica 002+ automáticamente (pendiente actualización en fase 3B-3).

## Creación manual

```powershell
$env:PGPASSWORD = "TU_CLAVE"
& "C:\Program Files\PostgreSQL\16\bin\createdb.exe" -U postgres manizales_epic_race_2026
& "C:\Program Files\PostgreSQL\16\bin\psql.exe" -U postgres -d manizales_epic_race_2026 -f database\migrations\001_initial_schema.sql
& "C:\Program Files\PostgreSQL\16\bin\psql.exe" -U postgres -d manizales_epic_race_2026 -f database\seed\001_reference_data.sql
```

Luego, cuando est� autorizado:

```powershell
& "C:\Program Files\PostgreSQL\16\bin\psql.exe" -U postgres -d manizales_epic_race_2026 -f database\migrations\002_quota_enforcement.sql
& "C:\Program Files\PostgreSQL\16\bin\psql.exe" -U postgres -d manizales_epic_race_2026 -f database\migrations\003_registration_number.sql
& "C:\Program Files\PostgreSQL\16\bin\psql.exe" -U postgres -d manizales_epic_race_2026 -f database\migrations\004_integrity_admin_health_legal.sql
```

## Verificaci�n

```sql
SELECT event_name, event_date, max_confirmed_registrations FROM event_settings;
SELECT code, name FROM categories ORDER BY sort_order;
```

## Antes de abrir inscripciones

1. Configurar `category_bicycle_rules` (matriz categor�a ? tipo de bicicleta).
2. Publicar versiones legales en `legal_documents` (`is_published = true`).
3. Cargar tabla de tallas en `jersey_size_measurements`.
4. Activar `registrations_open` solo tras pruebas y validaci�n legal.

## Pruebas preparadas (no ejecutadas en 3B-2)

- `tests/prepared_concurrency_quota.sql` � escenarios de cupo, numeraci�n e idempotencia (Fase 3B-5).

## Compatibilidad con el formulario (9 pasos)

| Frontend | Tabla / columna |
|----------|-----------------|
| `bicycleType` (c�digo) | `bicycle_types.code` + `category_bicycle_rules` |
| Salud + `authorizeHealthData` | `health_information.*`, `sensitive_data_authorized` |
| Pago jersey | `jersey_payments`: `payer_name`, `payment_date`, `transaction_reference`, `receipt_file_id` |
| Legales (si publicados) | `legal_acceptances` + trigger `LEGAL_DOCUMENT_NOT_PUBLISHED` |
| Confirmaci�n | `registrations.status = confirmed`, `registration_number`, cupo en trigger |
