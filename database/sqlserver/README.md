# SQL Server — Manizales Epic Race 2026

Motor objetivo del proyecto (remoto). Las migraciones PostgreSQL en `database/migrations/` quedan como referencia legacy local.

## Aplicar esquema

Variables en `.env` (gitignored): `MSSQL_SERVER`, `MSSQL_DATABASE`, `MSSQL_USER`, `MSSQL_PASSWORD`.

```powershell
cd database\sqlserver
.\Apply-Migrations.ps1
```

Orden: `001_initial_schema.sql` → `002_triggers_quota_number.sql` → `003_seed_reference_data.sql`.

## Conexion

- Servidor: ver `MSSQL_SERVER` (puerto 1433)
- Base: `manizales_epic_race_2026`
- `registrations_open = 0` tras el seed
