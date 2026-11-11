# Fase 3B-1 — Alineación del frontend

**Fecha:** 11 de noviembre de 2026  
**Equipo:** JX4ZLK4 — `induma\gestor.desarrollo`  
**Proyecto:** `C:\Users\gestor.desarrollo\OneDrive - INDUMA S.A.S\Escritorio\Parceros`

## 1. Validación previa

| Ítem | Estado |
|------|--------|
| Hostname | JX4ZLK4 |
| Usuario | induma\gestor.desarrollo |
| Rama Git | master |
| Next.js | 15.5.29 |

## 2. Archivos modificados

| Archivo | Cambio |
|---------|--------|
| `src/lib/config/event.ts` | 9 pasos en `FORM_STEPS`; flags `paymentDestinationConfirmed`, `legalDocumentsPublished`; helpers bicicleta |
| `src/lib/validation/registrationSchema.ts` | Campos Fase 1 restaurados; salud obligatoria + autorización; pago; legales condicionales |
| `src/lib/registration/visibleSteps.ts` | Pasos 8 (legales) y 9 (revisión) |
| `src/components/registration/RegistrationWizard.tsx` | UI 9 pasos, bicicleta, salud, pago, legales |
| `src/components/registration/RegistrationReview.tsx` | Bicicleta, pago, autorización salud, aviso legales |
| `src/components/registration/LegalAcceptance.tsx` | **Recuperado** con documentos pendientes |
| `docs/FASE-3B-1-informe.md` | Este informe |

**Sin cambios en esta subfase (pero modificados localmente desde antes):** landing (`Hero`, `EventOverview`, `EventConditions`), `database/migrations/001_initial_schema.sql`.

## 3. Componentes recuperados

- `LegalAcceptance.tsx` — paso 8 con obligatorias deshabilitadas hasta `legalDocumentsPublished: true` y opcionales imagen/newsletter activas.

## 4. Nueve pasos

| Paso | Título | Condicional |
|------|--------|-------------|
| 1 | Datos personales | No |
| 2 | Categoría y bicicleta | No |
| 3 | Salud (+ autorización datos) | No |
| 4 | Emergencia | No |
| 5 | Inscripción y jersey | No |
| 6 | Pago jersey | Solo `free_with_jersey` |
| 7 | Representante legal | Solo menores si `minorsEnabled` |
| 8 | Aceptaciones legales | Siempre visible |
| 9 | Revisión y confirmación | Siempre visible |

Navegación Fase 2.1 conservada: deep links `?categoria=` y `?jersey=1`, hash `#inscripcion`.

## 5. Validaciones implementadas

| Área | Regla |
|------|--------|
| Bicicleta | Obligatoria por categoría si hay tipos en matriz; si matriz vacía → mensaje oficial y error en paso 2; **confirmación bloqueada** con `validateBicycleConfiguration` |
| Salud | EPS, grupo sanguíneo, tres bloques sí/no; `authorizeHealthData` obligatorio en paso 3 |
| Pago jersey | `payerName`, `paymentDate`, `paymentReference`, comprobante (JPG/PNG/PDF) |
| Legales | Obligatorias solo si `EVENT.legalDocumentsPublished === true`; hoy **false** → paso informativo sin validación estricta |
| Confirmación | Sigue mostrando `REGISTRATION_DEV_MESSAGE` (inscripciones reales deshabilitadas) |

## 6. Lint y build

```
npm run lint  → Sin advertencias ni errores
npm run build → Compilación exitosa (Next.js 15.5.29)
```

## 7. Problemas pendientes

- Matriz `BICYCLE_TYPES_BY_CATEGORY` vacía → no se puede completar inscripción hasta configuración oficial.
- `paymentDestinationConfirmed: false` → aviso en paso de pago (número Nequi/Llave sin cambiar).
- `legalDocumentsPublished: false` → aceptaciones definitivas deshabilitadas.
- Menores deshabilitados (`minorsEnabled: false`).
- Cambios sin commit; SQL y landing aún divergentes del remoto.
- Backend / PostgreSQL sin tocar en esta fase.

## 8. Estado de Git

```
## master...origin/master
 M database/migrations/001_initial_schema.sql
 M src/components/landing/...
 M src/components/registration/LegalAcceptance.tsx
 M src/components/registration/RegistrationReview.tsx
 M src/components/registration/RegistrationWizard.tsx
 M src/lib/config/event.ts
 M src/lib/validation/registrationSchema.ts
 + docs/FASE-3B-1-informe.md
```

HEAD remoto: `f94c621`. **No se realizó commit ni push.**

## 9. PostgreSQL

**Sin modificaciones:** no se ejecutaron migraciones, seeds ni scripts de base de datos.

---

**Fase 3B-1 finalizada.** No se inició Fase 3B-2.
