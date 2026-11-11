# Fase 3B-2 — Preparación del modelo PostgreSQL

**Fecha:** 11 de noviembre de 2026  
**Equipo:** JX4ZLK4 — `induma\gestor.desarrollo`  
**Proyecto:** `C:\Users\gestor.desarrollo\OneDrive - INDUMA S.A.S\Escritorio\Parceros`

## 1. Validación de entorno

| Verificación | Resultado |
|--------------|-----------|
| Hostname | JX4ZLK4 |
| Usuario | induma\gestor.desarrollo |
| Rama | master |
| PostgreSQL en ejecución | **No consultado / sin cambios** (sin conexión ni migraciones) |

**Git (local):** cambios previos en frontend, `001` modificado localmente, nuevos archivos 002–004 y este informe. **Sin commit ni push.**

## 2. Política sobre `001_initial_schema.sql`

- **No se reescribió** `001_initial_schema.sql` en esta fase (instrucción explícita).
- La copia local sigue distinta del commit `f94c621` (p. ej. `payment_nequi_key`); al aplicar en 3B-3, decidir si usar el archivo local o el remoto antes del primer `psql -f`.
- `assert_registration_quota()` permanece en 001; **002 añade enforcement por trigger** para que el cupo no dependa solo de la aplicación.

## 3. Archivos SQL creados

| Archivo | Contenido |
|---------|-----------|
| `database/migrations/002_quota_enforcement.sql` | Función `enforce_registration_quota()` + trigger `trg_registrations_a_enforce_quota` |
| `database/migrations/003_registration_number.sql` | `allocate_registration_number()`, `assign_registration_fields_on_confirm()`, trigger `_b_assign_number` |
| `database/migrations/004_integrity_admin_health_legal.sql` | FK `reviewed_by`, salud `authorized_at`, legales solo publicados, comentarios |
| `database/tests/prepared_concurrency_quota.sql` | Escenarios A–E documentados (**no ejecutados**) |
| `database/README.md` | Orden 001 → seed → 002–004, compatibilidad formulario |

## 4. Control transaccional de cupos (300)

**Diseño:**

1. Antes de `INSERT` con `status = 'confirmed'` o `UPDATE` que **transiciona** a `confirmed`, el trigger bloquea `event_settings` con `FOR UPDATE`.
2. Verifica `registrations_open` y `COUNT(*)` de `status = 'confirmed'`.
3. Si `count >= max_confirmed_registrations` → `QUOTA_EXCEEDED` (SQLSTATE `P0002`).
4. `UPDATE` que deja `confirmed` sin cambiar estado **no** vuelve a consumir cupo.
5. `cancelled` no cuenta en el cupo; cancelar una confirmada **libera** capacidad lógica sin borrar historial.

**Condiciones de carrera:** la serialización sobre `event_settings` obliga a que las confirmaciones concurrentes vean el conteo tras commits previos.

## 5. Consecutivos MER2026-XXXXX

**Función `allocate_registration_number(p_year)`:**

- Año por defecto desde `event_settings.event_date`.
- `UPDATE registration_number_seq SET last_value = last_value + 1 ... RETURNING`.
- Formato: `MER` + año + `-` + 5 dígitos (`MER2026-00001`).
- Huecos posibles si la transacción hace ROLLBACK después de asignar número (aceptable).

**Trigger `trg_registrations_b_assign_number`:** asigna número y `confirmed_at` al confirmar si `registration_number` está vacío.

**Orden de triggers:** prefijos `_a_` (cupo) y `_b_` (número) para ejecución alfabética correcta.

## 6. Idempotencia y duplicados

| Mecanismo | Origen | Regla propuesta (aplicación + BD) |
|-----------|--------|-----------------------------------|
| Documento | `participants` UNIQUE (tipo, número) | Un participante por documento; upsert controlado en servicio |
| Una confirmada / participante | Índice parcial 001 | Impide dos `confirmed` mismo `participant_id` |
| `idempotency_key` | UNIQUE en 001; índice parcial en 004 | Reintentos HTTP: misma clave → leer registro existente, no segundo INSERT |
| Doble clic | App + idempotency | Header obligatorio en POST confirmación |
| Cancelación → nueva inscripción | **No definida** | Sin política de reinscripción hasta autorización explícita |

## 7. Datos sensibles (`health_information`)

- Segregación 1:1 con `registrations` (sin columnas de salud en `participants`).
- `sensitive_data_authorized` + trigger `authorized_at` al autorizar (alineado con paso 3 del formulario).
- `legal_acceptances.authorize_health_data`: comentario de deprecación; consentimiento de salud vive en `health_information`.
- Campos médicos nullable en BD; obligatoriedad en UI validada en servidor (flexible frente a revisión jurídica).
- **No** se crearon vistas públicas con salud; las exportaciones deben filtrar en servicio (Fase 3B-4).

## 8. Pagos de jersey

- Se mantienen `payer_name`, `payment_date`, `transaction_reference`, `receipt_file_id`.
- Estado inicial `pending_verification` sin cambios.
- **No** se modificó `payment_nequi_key` en SQL.
- FK `jersey_payments.reviewed_by` → `admin_users(id) ON DELETE SET NULL`.
- FK `jersey_payment_audit.admin_user_id` → `admin_users(id)` (opcional en auditoría).

## 9. Documentos legales

- Trigger impide `INSERT` en `legal_acceptances` si `legal_documents.is_published = false` (`LEGAL_DOCUMENT_NOT_PUBLISHED`).
- Coherente con frontend `legalDocumentsPublished: false` y seed con borradores no publicados.
- Sin textos legales inventados en migraciones.

## 10. Estrategia de migraciones

**Instalación limpia recomendada:**

```
001_initial_schema.sql
seed/001_reference_data.sql
002_quota_enforcement.sql
003_registration_number.sql
004_integrity_admin_health_legal.sql
```

**Conflictos posibles:**

- BD creada solo con 001: aplicar 002–004 en orden.
- Si alguien aplicó un `001` distinto (Nequi, etc.): 002–004 siguen siendo compatibles (no tocan `event_settings` salvo lectura).
- Duplicar triggers: scripts usan `DROP IF EXISTS` antes de crear.

**No destructivo:** sin `DROP TABLE`, sin cambio de tipos enum.

## 11. Compatibilidad con formulario (9 pasos, Fase 3B-1)

| Paso | BD |
|------|-----|
| 2 Categoría + bicicleta | `registrations.category_id`, `bicycle_type_id` + matriz (pendiente seed) |
| 3 Salud + autorización | `health_information`, `sensitive_data_authorized` |
| 6 Pago | `jersey_payments` (1:1 `jersey_orders`) |
| 8 Legales | Solo si `is_published`; si no, app no inserta aceptaciones |
| 9 Confirmación | `confirmed` + número + cupo |

## 12. Riesgos detectados

| Riesgo | Severidad | Mitigación |
|--------|-----------|------------|
| 001 local ≠ remoto | Media | Congelar baseline antes de 3B-3 |
| Matriz bicicleta vacía | Alta | Admin/seed antes de abrir inscripciones |
| Trigger + app omiten TX única | Media | Servicio debe usar una transacción por confirmación |
| Numeración en ROLLBACK deja huecos | Baja | Aceptado en diseño |
| Doble UNIQUE idempotency_key (001 + 004) | Baja | Redundante, sin efecto negativo |

## 13. Pruebas preparadas (no ejecutadas)

Archivo: `database/tests/prepared_concurrency_quota.sql`  
Escenarios: cupo paralelo, update sin re-conteo, cancelación, numeración, idempotency.

## 14. Acciones para Fase 3B-3 (requieren autorización)

1. Conectar a PostgreSQL de desarrollo (sin exponer contraseñas en repo).
2. Crear BD y aplicar 001 + seed + 002–004.
3. Actualizar `create-database.ps1` para encadenar migraciones.
4. Verificar extensiones y encoding UTF-8 en archivos SQL.
5. Ejecutar pruebas de concurrencia (3B-5).

## 15. Confirmaciones

- **PostgreSQL:** sin creación, alteración ni ejecución de scripts contra instancia.
- **`.env`:** sin modificaciones.
- **Dependencias npm:** sin cambios.
- **Inscripciones reales:** siguen deshabilitadas en frontend.

---

**Fase 3B-2 finalizada.** No se inició Fase 3B-3.
