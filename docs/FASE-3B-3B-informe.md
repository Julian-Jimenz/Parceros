# Fase 3B-3B — Verificación autenticada y preparación de base

**Fecha:** 11 de noviembre de 2026  
**Equipo:** JX4ZLK4 — `induma\gestor.desarrollo`  
**Proyecto:** `C:\Users\gestor.desarrollo\OneDrive - INDUMA S.A.S\Escritorio\Parceros`

---

## 1. Validación de entorno

| Verificación | Resultado |
|--------------|-----------|
| Hostname | JX4ZLK4 — OK |
| Usuario OS | induma\gestor.desarrollo — OK |
| Ruta proyecto | Parceros — OK |
| Rama Git | master |
| HEAD | f94c621 |
| Servicio PG | postgresql-x64-16 (inspección previa: Running) |
| Puerto 5432 | En escucha (inspección previa) |

**No se realizó commit ni push.**

---

## 2. Conexión autenticada (solo lectura)

### Intento realizado

- Cliente: `psql` 16.15  
- Host: `127.0.0.1`, puerto `5432`  
- Usuario probado: `postgres`  
- Base: `postgres`  
- Modo: `-w` (sin solicitar contraseña en terminal no interactiva)

### Resultado

**Conexión rechazada:** `fe_sendauth: no password supplied` (método **scram-sha-256** según `pg_hba.conf`).

### Mecanismos locales comprobados (sin leer secretos)

| Mecanismo | Estado |
|-----------|--------|
| Archivo `.env` en proyecto | No existe |
| `%APPDATA%\postgresql\pgpass.conf` | No encontrado |
| `%USERPROFILE%\.pgpass` | No encontrado |

**Conclusión:** en esta sesión automatizada **no hay credencial autorizada disponible** sin introducir contraseña en el chat ni en argumentos de comando.

### Pasos 3 y 4 (catálogo / base objetivo)

**No ejecutados** (dependen de conexión autenticada):

- `SELECT version()`, `current_database()`, `current_user`, `inet_server_addr()`, `inet_server_port()`
- Existencia de `manizales_epic_race_2026`
- Metadatos, tablas, extensiones, conteos

**Estado de la base objetivo:** **desconocido** hasta que el operador ejecute las consultas de lectura de forma local e interactiva o configure `%APPDATA%\postgresql\pgpass.conf` (permisos restrictivos) y reautorice una nueva subfase.

### Consultas de lectura sugeridas (operador local)

Ejecutar en PowerShell **de forma interactiva** (sin pegar contraseñas en el chat):

```text
psql -h 127.0.0.1 -p 5432 -U postgres -d postgres
```

Dentro de `psql`:

```sql
SELECT version();
SELECT current_database(), current_user, inet_server_addr(), inet_server_port();
SELECT rolcreatedb FROM pg_roles WHERE rolname = current_user;
SELECT datname FROM pg_database WHERE datname = 'manizales_epic_race_2026';
```

Si la base existe, conectarse a ella y:

```sql
SELECT extname FROM pg_extension ORDER BY 1;
SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY 1;
SELECT proname FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid
  WHERE n.nspname = 'public' AND proname IN (
    'enforce_registration_quota', 'allocate_registration_number', 'assert_registration_quota'
  );
SELECT (SELECT COUNT(*) FROM event_settings) AS event_settings_rows,
       (SELECT COUNT(*) FROM registrations) AS registrations_rows
  -- solo si las tablas existen;
```

---

## 3. Identidad de la instancia (inferida sin sesión SQL)

| Atributo | Valor |
|----------|--------|
| Instalación | PostgreSQL **16** (`C:\Program Files\PostgreSQL\16`) |
| Puerto configurado | **5432** (`postgresql.conf`) |
| `listen_addresses` | **`*`** (acepta conexiones en todas las interfaces) |
| Autenticación TCP local | **scram-sha-256** para `127.0.0.1/32` y `::1/128` |
| Autenticación socket local (Unix en Windows: local) | scram-sha-256 |

Coincide con instancia **local PostgreSQL 16 en 5432**.

---

## 4. Seguridad de conexiones (solo lectura de configuración)

| Tema | Hallazgo | Riesgo |
|------|----------|--------|
| `listen_addresses = '*'` | El servidor escucha en todas las interfaces | **Medio** si existieran reglas `pg_hba` amplias hacia redes remotas |
| `pg_hba.conf` efectivo (reglas activas) | Solo **localhost** IPv4/IPv6 para `host all all` | **Bajo** para acceso remoto no autorizado desde la red |
| Firewall Windows | Sin reglas obvias con nombre PostgreSQL/5432 en búsqueda rápida | **Incierto**; el puerto puede quedar expuesto a la LAN si el firewall permite 5432 genérico |
| Contraseña obligatoria | scram-sha-256 en loopback | **Adecuado** para dev |

**No se modificó** firewall ni PostgreSQL.

**Recomendación (futura, con autorización):** valorar `listen_addresses = 'localhost'` en entornos de desarrollo si no se requiere acceso LAN.

---

## 5. Revisión SQL estática (sin ejecución)

Orden confirmado: **001 → seed → 002 → 003 → 004**.

| Archivo | Compatibilidad PG 16 | Notas |
|---------|----------------------|--------|
| 001_initial_schema.sql | Sí | Diff local vs Git: solo `payment_nequi_key` 3013131008; comentarios con encoding degradado |
| 001_reference_data.sql | Sí | `registrations_open = false`; legales no publicados |
| 002_quota_enforcement.sql | Sí | Idempotente (DROP TRIGGER IF EXISTS) |
| 003_registration_number.sql | Sí | Orden triggers `_a_` / `_b_` |
| 004_integrity_admin_health_legal.sql | Sí | ADD CONSTRAINT IF DROP; índice parcial idempotency |

### Duplicación de objetos

- Re-ejecutar 002–004 en BD ya migrada: en general **reemplaza funciones** y recrea triggers (diseñado idempotente).
- Re-ejecutar **001** sobre BD poblada: **destructivo / fallará** (CREATE TYPE/TABLE duplicados) — **no hacer**.

### Matriz de decisión según estado (cuando exista conexión)

| Estado detectado | Migraciones a aplicar |
|------------------|------------------------|
| Base no existe | Escenario A completo |
| Base vacía solo con 001+seed del commit antiguo | 002 → 003 → 004 |
| Base con 001–004 ya aplicadas | Ninguna; solo verificación |
| Base con datos de prueba mezclados | Escenario B + respaldo obligatorio |

---

## 6. Plan de ejecución (NO ejecutado)

### Escenario A — Base no existe

1. `CREATE DATABASE manizales_epic_race_2026` (encoding UTF8).
2. `psql -d manizales_epic_race_2026 -f 001_initial_schema.sql`
3. `psql -d ... -f seed/001_reference_data.sql`
4. `psql -f 002_quota_enforcement.sql`
5. `psql -f 003_registration_number.sql`
6. `psql -f 004_integrity_admin_health_legal.sql`
7. Verificar funciones/triggers y `registrations_open = false`.
8. Bitácora: fecha + hashes de archivos SQL.
9. `pg_dump -Fc` respaldo inicial (fuera del repo).

### Escenario B — Base existe

1. Inventario tablas + funciones (`enforce_registration_quota`, `allocate_registration_number`).
2. Conteos por tabla (sin exportar filas).
3. **pg_dump -Fc** obligatorio antes de cualquier `psql -f`.
4. Aplicar solo migraciones faltantes (típicamente 002–004).
5. Verificación post-migración.
6. Plan de rollback: restaurar dump en BD alternativa.

---

## 7. Riesgos

| ID | Riesgo | Severidad |
|----|--------|-----------|
| R1 | Sin verificación catálogo — plan A/B no confirmado | Alta (bloqueante operativo) |
| R2 | `listen_addresses = '*'` | Media |
| R3 | 001 con encoding en comentarios | Media al aplicar |
| R4 | 001 local ≠ remoto (Nequi) | Baja |
| R5 | Aplicar 001 dos veces | Alta |

---

## 8. Acciones que requieren autorización específica

1. **Credencial local:** uso interactivo de `psql` o creación de `pgpass.conf` por el operador (fuera del chat).
2. **Repetir 3B-3B** con mecanismo de autenticación disponible para completar pasos 3–4.
3. **Fase siguiente (escritura):** CREATE DATABASE, ejecutar migraciones/seeds, `pg_dump`.
4. **Commit** del working tree (SQL + frontend + docs).

---

## 9. Confirmaciones

- **No** se creó ni alteró ninguna base.
- **No** se ejecutaron migraciones ni seeds.
- **No** se incluyeron contraseñas en comandos, informes ni logs.
- **No** commit ni push.

---

**Fase 3B-3B detenida** antes de cualquier escritura en PostgreSQL.

**Siguiente paso recomendado:** el operador ejecuta las consultas de lectura del apartado 2 en una consola interactiva y comunica únicamente: *base existe sí/no*, *tablas presentes*, *si existen funciones 002/003* (sin datos personales). Con eso se autoriza la subfase de **creación/migración con escritura**.
