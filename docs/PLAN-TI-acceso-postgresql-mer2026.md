# Plan TI — Acceso PostgreSQL exclusivo Manizales Epic Race 2026

**Equipo:** JX4ZLK4 | **Usuario:** induma\gestor.desarrollo  
**Proyecto:** `C:\Users\gestor.desarrollo\OneDrive - INDUMA S.A.S\Escritorio\Parceros`  
**Fecha:** 11 de noviembre de 2026  
**Modo:** documentación y solo lectura — **nada ejecutado** en esta elaboración.

---

## 1. Instancia local confirmada (inspección previa + registro)

| Atributo | Valor |
|----------|--------|
| Servicio Windows | `postgresql-x64-16` — **Running** |
| Versión | PostgreSQL **16.15** (registro de instalación) |
| Host / puerto | **127.0.0.1:5432** (escucha verificada; `listen_addresses = *` en servidor) |
| Directorio de datos | `C:\Program Files\PostgreSQL\16\data` |
| Cuenta del servicio | `NT AUTHORITY\NetworkService` |
| Superusuario instalación | `postgres` |
| Autenticación TCP local | **scram-sha-256** (`pg_hba.conf`) |

**Nota:** En el mismo cluster conviven otras bases de desarrollo (Indumapp, Kaizen, etc.). Este plan **no** las modifica.

---

## 2. Requisitos de permisos — migraciones 001 a 004

### 2.1 `001_initial_schema.sql`

| Objeto | Permiso necesario |
|--------|-------------------|
| `CREATE EXTENSION pgcrypto, citext` | Rol con privilegio para crear extensiones en la BD objetivo (típicamente **dueño de la BD** o superusuario) |
| Tipos `ENUM`, ~20 tablas, índices, FK | `CREATE` en esquema `public` |
| `assert_registration_quota()`, `count_confirmed_registrations()`, `set_updated_at()` | `CREATE FUNCTION` |
| Trigger `trg_registrations_updated` | `CREATE TRIGGER` en tabla propia |
| `ALTER TABLE ... ADD CONSTRAINT` (FK deferrable bicicleta) | `ALTER` en `registrations` |

### 2.2 `seed/001_reference_data.sql`

| Operación | Permiso |
|-----------|---------|
| `INSERT` / `UPDATE` / `ON CONFLICT` en tablas de catálogo | `INSERT`, `UPDATE` en tablas afectadas |
| Sin extensiones ni DDL | — |

### 2.3 `002_quota_enforcement.sql`

| Operación | Permiso |
|-----------|---------|
| `CREATE OR REPLACE FUNCTION enforce_registration_quota()` | `CREATE FUNCTION` |
| Trigger `trg_registrations_a_enforce_quota` | `CREATE TRIGGER` |

### 2.4 `003_registration_number.sql`

| Operación | Permiso |
|-----------|---------|
| `allocate_registration_number()`, `assign_registration_fields_on_confirm()` | `CREATE FUNCTION` |
| Trigger `trg_registrations_b_assign_number` | `CREATE TRIGGER` |

### 2.5 `004_integrity_admin_health_legal.sql`

| Operación | Permiso |
|-----------|---------|
| `ALTER TABLE` + `ADD CONSTRAINT` (FK a `admin_users`) | `ALTER` |
| Funciones y triggers salud / legales | `CREATE FUNCTION`, `CREATE TRIGGER` |
| `CREATE UNIQUE INDEX IF NOT EXISTS` | `CREATE` en `registrations` |
| `COMMENT ON` | `COMMENT` (dueño del objeto) |

### Resumen para el rol migrador

El rol **`mer2026_migrator`** debe poder, **solo en `manizales_epic_race_2026`**:

- Ser **dueño** de la base (o del esquema `public`) para aplicar 001–004 sin superusuario.
- Crear extensiones **pgcrypto** y **citext** (una vez).
- Ejecutar todo el DDL/DML de migraciones y seed.

No requiere `SUPERUSER` ni `CREATEDB` si TI crea la BD y transfiere ownership.

---

## 3. Base de datos objetivo (propuesta)

| Parámetro | Valor propuesto |
|-----------|-----------------|
| Nombre | `manizales_epic_race_2026` |
| Encoding | `UTF8` |
| Collation / Ctype | `es_CO.UTF-8` o `Spanish_Colombia.1252` según estándar TI |
| Owner (propuesto) | `mer2026_migrator` |
| Template | `template0` (recomendado si se exige UTF-8 limpio) |

**Aislamiento:** la BD es un contenedor lógico separado; no afecta tablas de otras bases en el mismo cluster.

---

## 4. Roles propuestos

### 4.1 `mer2026_migrator`

**Uso:** aplicar migraciones, seeds de referencia, hotfix DDL en entorno dev (personas autorizadas).

| Privilegio | Alcance |
|------------|---------|
| `CONNECT` | Solo `manizales_epic_race_2026` |
| `CREATE` on DATABASE | Opcional si debe crear extensiones; alternativa: ownership de la BD |
| Ownership | `OWNER` de la BD **o** `OWNER` de `public` |
| Otras bases | **Sin** `CONNECT` explícito (revisar `REVOKE CONNECT ON DATABASE ... FROM PUBLIC` según política TI) |

**No debe:** `SUPERUSER`, `CREATEDB` (salvo política que obligue a postgres a crear la BD), acceso a `indumapps`, `induma_kaizen`, etc.

### 4.2 `mer2026_app`

**Uso:** aplicación Next.js (futuro `DATABASE_URL` solo lectura/escritura operativa).

| Privilegio | Alcance |
|------------|---------|
| `CONNECT` | Solo `manizales_epic_race_2026` |
| `USAGE` | Esquema `public` |
| `SELECT, INSERT, UPDATE, DELETE` | Tablas operativas (participants, registrations, health_information, jersey_*, stored_files metadata, etc.) |
| `USAGE, SELECT, UPDATE` | Secuencias vinculadas (`registration_number_seq` vía tabla; serials si aplica) |
| `EXECUTE` | Funciones invocadas por la app (p. ej. `assert_registration_quota` si se llama desde servicio; triggers no requieren GRANT EXECUTE al app) |
| Admin | **Sin** escritura arbitraria en `admin_users` hasta definir panel; lectura limitada si se requiere login |

**Sin:** `CREATE`, `DROP`, `TRUNCATE` global, `ALTER`, derechos sobre otras bases.

### 4.3 Principio de mínimo privilegio

Los roles son globales al cluster, pero **sin `CONNECT`** en otras bases **no** acceden a ellas. TI debe **no** otorgar `CONNECT ON DATABASE` masivo ni membresía en `pg_read_all_data`.

---

## 5. Procedimiento para administrador autorizado (revisión previa)

### Fase A — Comprobar existencia (solo lectura)

Conectar como `postgres` o rol de auditoría (interactivo local; **no** documentar contraseñas):

```sql
SELECT datname, pg_encoding_to_char(encoding) AS encoding, datdba::regrole AS owner
FROM pg_database
WHERE datname = 'manizales_epic_race_2026';
```

**Si no hay filas:** continuar con Fase B (creación).  
**Si hay filas:** Fase C obligatoria antes de cualquier cambio.

### Fase C — Base ya existe (inventario + respaldo)

**Inventario (metadatos, sin exportar PII):**

```sql
\c manizales_epic_race_2026

SELECT extname FROM pg_extension ORDER BY 1;

SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY 1;

SELECT p.proname
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND p.proname IN (
    'enforce_registration_quota',
    'allocate_registration_number',
    'assert_registration_quota'
  );

SELECT tgname, relname
FROM pg_trigger t
JOIN pg_class c ON t.tgrelid = c.oid
JOIN pg_namespace n ON c.relnamespace = n.oid
WHERE n.nspname = 'public' AND NOT t.tgisinternal
ORDER BY relname, tgname;
```

**Conteos (sin leer filas sensibles):**

```sql
SELECT relname AS table_name, n_live_tup AS approx_rows
FROM pg_stat_user_tables
ORDER BY relname;
```

**Respaldo (ejecutar fuera del repo, ruta acordada por TI):**

```powershell
# El administrador define ruta y ejecuta localmente (sin commitear dumps).
pg_dump -h 127.0.0.1 -p 5432 -U postgres -Fc -d manizales_epic_race_2026 -f "backup_mer2026_PRE_<fecha>.dump"
```

**Decisión:**

| Estado detectado | Acción |
|----------------|--------|
| BD no existe | Fase B |
| BD vacía / solo 001 sin 002–004 | Aplicar solo migraciones faltantes con `mer2026_migrator` |
| BD con datos o estado desconocido | Restaurar dump en entorno de prueba o coordinar con negocio; **no** sobrescribir |

---

## 6. Fase B — Creación propuesta (ejecutar solo TI autorizado)

**Orden recomendado.** Sustituir `***` por contraseñas generadas en gestor corporativo (nunca en git ni chat).

```sql
-- Ejecutar conectado a postgres (u otro superusuario autorizado)

-- Roles (login, sin superusuario)
CREATE ROLE mer2026_migrator WITH LOGIN PASSWORD '***' NOSUPERUSER NOCREATEDB NOCREATEROLE NOINHERIT;
CREATE ROLE mer2026_app       WITH LOGIN PASSWORD '***' NOSUPERUSER NOCREATEDB NOCREATEROLE NOINHERIT;

-- Base dedicada
CREATE DATABASE manizales_epic_race_2026
  OWNER mer2026_migrator
  ENCODING 'UTF8'
  TEMPLATE template0;

-- Aislamiento: solo estos roles conectan a esta BD (ajustar según política)
REVOKE ALL ON DATABASE manizales_epic_race_2026 FROM PUBLIC;
GRANT CONNECT ON DATABASE manizales_epic_race_2026 TO mer2026_migrator;
GRANT CONNECT ON DATABASE manizales_epic_race_2026 TO mer2026_app;
```

**Migraciones (como `mer2026_migrator`):**

```powershell
cd "C:\Users\gestor.desarrollo\OneDrive - INDUMA S.A.S\Escritorio\Parceros"
$env:PGPASSWORD = '***'   # Solo sesión local del operador; no guardar en scripts versionados

& "C:\Program Files\PostgreSQL\16\bin\psql.exe" -h 127.0.0.1 -p 5432 -U mer2026_migrator -d manizales_epic_race_2026 -f database\migrations\001_initial_schema.sql
& "C:\Program Files\PostgreSQL\16\bin\psql.exe" -h 127.0.0.1 -p 5432 -U mer2026_migrator -d manizales_epic_race_2026 -f database\seed\001_reference_data.sql
& "C:\Program Files\PostgreSQL\16\bin\psql.exe" -h 127.0.0.1 -p 5432 -U mer2026_migrator -d manizales_epic_race_2026 -f database\migrations\002_quota_enforcement.sql
& "C:\Program Files\PostgreSQL\16\bin\psql.exe" -h 127.0.0.1 -p 5432 -U mer2026_migrator -d manizales_epic_race_2026 -f database\migrations\003_registration_number.sql
& "C:\Program Files\PostgreSQL\16\bin\psql.exe" -h 127.0.0.1 -p 5432 -U mer2026_migrator -d manizales_epic_race_2026 -f database\migrations\004_integrity_admin_health_legal.sql
```

**Permisos aplicación (como owner o postgres):**

```sql
\c manizales_epic_race_2026

GRANT USAGE ON SCHEMA public TO mer2026_app;

GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO mer2026_app;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO mer2026_app;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO mer2026_app;

ALTER DEFAULT PRIVILEGES FOR ROLE mer2026_migrator IN SCHEMA public
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO mer2026_app;
ALTER DEFAULT PRIVILEGES FOR ROLE mer2026_migrator IN SCHEMA public
  GRANT USAGE, SELECT ON SEQUENCES TO mer2026_app;
ALTER DEFAULT PRIVILEGES FOR ROLE mer2026_migrator IN SCHEMA public
  GRANT EXECUTE ON FUNCTIONS TO mer2026_app;
```

**Endurecimiento opcional (post-MVP):** revocar `DELETE` en tablas de auditoría; restringir `admin_users` a rol admin separado.

---

## 7. Validación de conexión y permisos (solo lectura)

### Migrador

```sql
\c manizales_epic_race_2026 mer2026_migrator
SELECT current_user, current_database();
SELECT COUNT(*) FROM event_settings;
SELECT proname FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public' AND proname LIKE '%registration%';
```

### Aplicación

```sql
\c manizales_epic_race_2026 mer2026_app
SELECT current_user;
-- Debe fallar:
CREATE TABLE mer_test (id int);
-- Debe funcionar (tras datos de prueba autorizados):
SELECT registrations_open FROM event_settings;
```

### Desarrollo local (sin commitear secretos)

Archivo `.env` en `.gitignore`:

```env
DATABASE_URL=postgresql://mer2026_app:***@127.0.0.1:5432/manizales_epic_race_2026
```

Opcional `pgpass.conf` con permisos NTFS restrictivos (solo cuenta del desarrollador).

---

## 8. Autorizaciones solicitadas a TI

| # | Acción | Responsable |
|---|--------|-------------|
| 1 | Confirmar contraseña o flujo de acceso `postgres` (bitácora corporativa) | TI |
| 2 | Ejecutar Fase A (catálogo) | Admin BD |
| 3 | Si BD existe: respaldo `pg_dump -Fc` + inventario | Admin BD |
| 4 | Crear roles `mer2026_migrator` y `mer2026_app` con contraseñas en bóveda | TI |
| 5 | Crear BD `manizales_epic_race_2026` OWNER migrator | TI |
| 6 | Autorizar a desarrollo a ejecutar 001–004 + seed **solo** en esa BD | TI + gestor proyecto |
| 7 | Entregar `DATABASE_URL` de **app** al equipo dev (canal seguro, no email plano) | TI |
| 8 | Registrar en CMDB / inventario: BD dedicada MER 2026, sin mezclar con Indumapp/Kaizen | TI |

**Explícitamente fuera de alcance sin ticket aparte:** reset global de `postgres`, cambios en `pg_hba.conf`, reinicio del servicio, uso de credenciales de otros proyectos.

---

## 9. Riesgos y mitigaciones

| Riesgo | Mitigación |
|--------|------------|
| Misma instancia, muchas BDs | Roles sin `CONNECT` en otras bases |
| Encoding corrupto en SQL 001 | Validar UTF-8 de archivos antes de `psql -f` |
| Re-ejecutar 001 sobre BD poblada | Solo migraciones incrementales 002–004 |
| `listen_addresses = *` | Mantener hba localhost; firewall según política TI |

---

## 10. Confirmación de esta entrega

- No se crearon roles ni bases.
- No se ejecutó SQL de escritura.
- No se modificaron servicios, `pg_hba`, contraseñas ni migraciones en el servidor.
- No commit ni push.

**Documento para revisión de TI y autorización de ejecución en fase posterior.**
