# Fase 3B-3A — Verificación PostgreSQL y preparación de migraciones

**Fecha:** 11 de noviembre de 2026  
**Equipo:** JX4ZLK4 — `induma\gestor.desarrollo`  
**Proyecto:** `C:\Users\gestor.desarrollo\OneDrive - INDUMA S.A.S\Escritorio\Parceros`

---

## 1. Identidad del equipo

| Verificación | Esperado | Resultado |
|--------------|----------|-----------|
| Hostname | JX4ZLK4 | OK |
| Usuario | induma\gestor.desarrollo | OK |
| Directorio | Parceros (ruta autorizada) | OK |
| Rama Git | master | OK |
| Último commit | — | `f94c621` feat: initial Manizales Epic Race landing and registration UI |
| Remoto origin | github.com/Julian-Jimenz/Parceros.git | OK |

---

## 2. Estado PostgreSQL local (sin conexión autenticada)

| Ítem | Hallazgo |
|------|----------|
| Servicio Windows | `postgresql-x64-16` — **Running** |
| Instancias en `Program Files\PostgreSQL` | Solo carpeta **16** |
| Versión cliente | **psql 16.15**, **pg_dump 16.15** |
| Escucha | **TCP 0.0.0.0:5432** y **[::]:5432** LISTENING |
| Instancia esperada | PostgreSQL **16**, puerto **5432** — **coherente** con inspección de red |
| `.env` en proyecto | **No existe** (solo `.env.example`) |
| Credenciales autorizadas en entorno | **No disponibles** para el agente sin solicitar contraseña |

### Paso 3 — Acceso de solo lectura a catálogo

**No ejecutado:** sin mecanismo seguro de credenciales (no hay `.env`; no se solicitan contraseñas).

Por tanto **no se pudo confirmar** si existe la base `manizales_epic_race_2026` ni metadatos de tablas/migraciones aplicadas.

**Suposición operativa para 3B-3B:** tratar como **base aún no verificada**; en 3B-3B, comprobar con `SELECT 1 FROM pg_database WHERE datname = 'manizales_epic_race_2026'` usando credenciales que proporcione el operador de forma local (no en chat).

---

## 3. Revisión estática de migraciones (sin ejecución)

### Orden y dependencias

| Orden | Archivo | Depende de |
|-------|---------|------------|
| 1 | `001_initial_schema.sql` | — |
| 2 | `seed/001_reference_data.sql` | 001 |
| 3 | `002_quota_enforcement.sql` | 001 (`registrations`, `event_settings`) |
| 4 | `003_registration_number.sql` | 001–002 (`registration_number_seq`) |
| 5 | `004_integrity_admin_health_legal.sql` | 001–003 (tablas referenciadas) |

`prepared_concurrency_quota.sql` — solo documentación de pruebas, no es migración.

### Compatibilidad PostgreSQL 16

- Extensiones `pgcrypto`, `citext`: compatibles.
- `EXECUTE FUNCTION` en triggers: sintaxis PG 14+ (válida en 16).
- Pl/pgSQL y `ERRCODE` personalizado: válido.

### Funciones y triggers (revisión lógica)

| Componente | Evaluación |
|------------|------------|
| `enforce_registration_quota` | INSERT/UPDATE → `confirmed` bloquea cupo; `FOR UPDATE` en `event_settings`; **no** re-cuenta en UPDATE ya `confirmed` |
| Cancelación | `cancelled` no entra al COUNT; libera cupo lógico al cambiar desde `confirmed` |
| `allocate_registration_number` | UPDATE atómico en `registration_number_seq`; formato MER{year}-##### |
| `assign_registration_fields_on_confirm` | Se ejecuta **después** de `_a_enforce_quota` (prefijo alfabético) |
| Salud / legales / FK admin | Sin DROP TABLE; FK opcionales con `SET NULL` |

### Riesgos (estáticos)

| Riesgo | Severidad | Notas |
|--------|-----------|-------|
| Deadlock | Baja | Cupo bloquea solo `event_settings`; numeración lee settings sin lock exclusivo prolongado |
| Consecutivo + ROLLBACK | Media | Huecos en numeración aceptados por diseño |
| Migración parcial de un archivo | Baja | Cada 002–004 usa `BEGIN`/`COMMIT`; fallo → rollback del archivo |
| Migración parcial entre archivos | Media | Ej.: 002 OK, 003 no aplicado — estado inconsistente; documentar checklist |
| `001` local ≠ `f94c621` | Media | Diff: `payment_nequi_key` `3013361008` → `3013131008` (1 línea) |
| Codificación UTF-8 en `001` | Media | Comentarios con caracteres corruptos en disco; revisar antes de `psql -f` |
| UNIQUE `idempotency_key` (001) + índice parcial (004) | Baja | Redundante en valores no nulos |
| Indentación en trigger 003 | Baja | SQL válido; cosmetico |

### Configuración inicial

- Seed: `registrations_open = FALSE` — **inscripciones cerradas** tras seed.
- Sin operaciones destructivas en 002–004.

### Compatibilidad formulario 9 pasos

Alineado con informes 3B-1 y 3B-2 (bicicleta, salud, pago, legales publicados).

---

## 4. Estrategia de respaldo y recuperación (no ejecutada)

### Si la base **no existe** (escenario probable tras 3B-3B)

1. `createdb` exclusivo: `manizales_epic_race_2026`.
2. Aplicar 001 → seed → 002 → 003 → 004.
3. Sin tocar otras bases del cluster.

### Si la base **existe**

1. **No sobrescribir** sin inventario previo.
2. Respaldo autorizado en 3B-3B:  
   `pg_dump -Fc -d manizales_epic_race_2026 -f backup_pre_3B3B_<fecha>.dump`  
   (ruta fuera del repo; sin contraseñas en línea de comandos versionadas).
3. Inventario: `\dt`, `\df`, consulta `pg_trigger`, conteo por tabla sin exportar PII.
4. Si ya tiene 001 sin 002–004: solo aplicar 002–004.
5. Si estado desconocido o corrupto: restaurar dump o crear BD nueva con sufijo `_dev2` (requiere decisión).

**Recuperación:** `pg_restore` sobre BD vacía o `DROP DATABASE` solo con autorización explícita.

---

## 5. Estado de Git

### Sin commit (respecto a `f94c621`)

**Base de datos / docs**

- `M` `database/README.md`
- `M` `database/migrations/001_initial_schema.sql` (1 línea: Nequi)
- `??` `002`, `003`, `004`, `database/tests/`
- `??` `docs/FASE-3B-1-informe.md`, `docs/FASE-3B-2-informe.md`, este informe

**Frontend (3B-1 y anteriores)**

- `M` landing (3 archivos), registro (3), `event.ts`, `registrationSchema.ts`
- **Nota:** `visibleSteps.ts` y `LegalAcceptance` pueden estar en estado recuperado sin aparecer como `M` si coinciden con índice; verificar con `git status` completo antes de commit.

### Commit local propuesto (no ejecutado)

```
feat(db-ui): Fase 3B - formulario 9 pasos y migraciones 002-004

- Frontend: bicicleta, pago, salud, legales, 9 pasos
- SQL: cupo trigger, numeracion MER, integridad FK/salud/legales
- Docs: informes 3B-1, 3B-2, 3B-3A
```

**Sin push** hasta autorización.

---

## 6. Plan Fase 3B-3B — Creación y migraciones autorizadas

| # | Acción |
|---|--------|
| 1 | **Base:** `manizales_epic_race_2026` (crear solo si no existe tras consulta catalogo) |
| 2 | **Host/puerto:** `localhost:5432` (verificado en escucha; confirmar en conexión) |
| 3 | **Usuario:** rol con `CREATEDB` y derechos en la BD (típicamente `postgres` en dev) — credencial **solo local**, archivo `.env` gitignored |
| 4 | **SQL en orden:** 001 → `seed/001_reference_data.sql` → 002 → 003 → 004 |
| 5 | **Pre-checks:** servicio Running; `psql --version` 16.x; backup si BD existe; encoding UTF-8 de archivos |
| 6 | **Ejecución:** `psql -d manizales_epic_race_2026 -f <archivo>` por cada paso; revisar exit code |
| 7 | **Post-checks:** `\df enforce_registration_quota`, `\df allocate_registration_number`, triggers en `registrations`; `SELECT registrations_open FROM event_settings`; `SELECT COUNT(*) FROM categories` |
| 8 | **Recuperación:** conservar dump; anotar versión de archivos SQL aplicados en bitácora |
| 9 | **Riesgos:** matriz bicicleta vacía; 001 con encoding; divergencia Git/remoto |

### Acciones que requieren autorización explícita en 3B-3B

- Crear base de datos.
- Ejecutar cualquier `psql -f`.
- Crear `.env` con `DATABASE_URL`.
- `pg_dump` / `pg_restore`.
- Commit o push.

---

## 7. Confirmaciones de esta subfase

- **No** se creó ni modificó ninguna base de datos.
- **No** se ejecutaron migraciones, seeds ni tests SQL.
- **No** se mostraron ni almacenaron contraseñas.
- **No** commit ni push.

---

**Fase 3B-3A finalizada.** Detenido antes de cualquier operación de escritura en PostgreSQL.
