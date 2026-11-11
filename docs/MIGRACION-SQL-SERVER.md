# Migracion a SQL Server

## Estado

- **Proveedor activo en `.env`:** `mssql` (servidor remoto configurado localmente, sin commitear secretos).
- **PostgreSQL local:** scripts legacy en `database/migrations/` (no usar para el servidor remoto).
- **Backend Next.js:** aun sin cliente de BD; en Fase 3B-4 usar `mssql` / `tedious` o Prisma con `sqlserver`.

## Pasos para el administrador

1. En el firewall del servidor SQL: permitir **TCP 1433** desde la IP de la PC de desarrollo (o VPN corporativa).
2. Confirmar que el login SQL tiene permiso en `manizales_epic_race_2026` (o `dbcreator` si la base se crea automáticamente).
3. Desde el proyecto: `.\database\scripts\test-sqlserver-connection.ps1` y luego `.\database\scripts\apply-sqlserver.ps1`.
4. Verificar: `SELECT event_name, registrations_open FROM dbo.event_settings;` y `SELECT COUNT(*) FROM dbo.categories;`.

## Seguridad

La contraseña del usuario SQL no debe guardarse en el repositorio. Si se envio por un canal inseguro, **cambiarla** en el servidor.
