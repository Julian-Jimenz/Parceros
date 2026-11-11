# Fase 1 ù Anùlisis y diseùo tùcnico  
## Manizales Epic Race 2026

**Fecha del documento:** 11 de noviembre de 2026  
**Evento:** 13 de diciembre de 2026 ù Manizales, Caldas  
**Estado:** Diseùo para validaciùn (sin despliegue a producciùn)

---

## 1. Resumen ejecutivo

Se propone una aplicaciùn **Next.js (TypeScript)** con **API Routes / Server Actions**, **PostgreSQL** como fuente de verdad, almacenamiento **privado** de archivos y un **panel administrativo** con autenticaciùn por roles. La landing pùblica prioriza inscripciùn gratuita, jersey opcional ($110.000 COP), datos de salud segregados y control transaccional de **300 cupos** sin exposiciùn pùblica del lùmite.

**Activos disponibles en el repositorio:**

| Archivo | Uso propuesto |
|---------|----------------|
| `WhatsApp Image 2026-11-10 at 12.17.09 PM.jpeg` | Logo **PARCEROS** (cadena + montaùa) ? header, favicon derivado, footer aliado |
| `WhatsApp Image 2026-11-10 at 12.17.58 PM.jpeg` | Mockup jersey **01 ù CIUDAD** (naranja) ? secciùn jersey; variante 03 como referencia secundaria |
| `Logo-Fundacion.pdf` | Logo fundaciùn ? secciùn ùSobre el eventoù / patrocinadores (convertir a PNG/SVG en Fase 2) |

La paleta UI se alinea con el jersey naranja (`#FF6B00`) y fondos oscuros del brief.

---

## 2. Mapa de navegaciùn

```mermaid
flowchart TB
  subgraph public [Pùblico]
    HOME[Landing]
    HERO[Hero + countdown]
    ABOUT[Sobre el evento]
    CAT[Categorùas]
    JERSEY[Jersey oficial]
    FORM[Formulario 9 pasos]
    CONF[Confirmaciùn + PDF]
    CLOSED[Inscripciones cerradas]
  end
  subgraph admin [Privado /admin]
    LOGIN[Login]
    DASH[Dashboard]
    REGS[Inscritos]
    PAY[Pagos jersey]
    EXP[Exportaciones]
    CFG[Configuraciùn evento]
  end
  HOME --> HERO & ABOUT & CAT & JERSEY & FORM
  FORM --> CONF
  FORM --> CLOSED
  LOGIN --> DASH --> REGS & PAY & EXP & CFG
```

**Anclas en una sola pùgina:** `#inicio`, `#evento`, `#categorias`, `#jersey`, `#inscripcion`.  
**Query params del formulario:** `?categoria=open-hombres`, `?jersey=1` para conservar selecciùn desde tarjetas y CTA.

---

## 3. Arquitectura de aplicaciùn

```mermaid
flowchart LR
  Browser[Navegador mùvil/desktop]
  Next[Next.js App]
  API[API / Server Actions]
  PG[(PostgreSQL)]
  FS[Almacenamiento privado]
  Browser --> Next
  Next --> API
  API --> PG
  API --> FS
```

| Capa | Tecnologùa | Responsabilidad |
|------|------------|-----------------|
| Presentaciùn | Next.js 15, React, Tailwind, RHF + Zod | Landing, formulario por pasos, admin UI |
| Aplicaciùn | Servicios de dominio en `src/server/` | Cupos, elegibilidad, duplicados, pagos pendientes |
| Persistencia | PostgreSQL 16, migraciones SQL versionadas | Integridad, unicidad documento, transacciones |
| Archivos | Disco privado (dev) / blob con ACL (prod) | Comprobantes, autorizaciùn menores |
| Seguridad | Sesiones admin (cookies httpOnly), rate limit, CSRF en mutaciones | RBAC, auditorùa, sin datos sensibles en logs |

**Zona horaria:** `America/Bogota` para countdown, edad al 13/12/2026 y timestamps legales.

**No incluido en Fase 1 (pendiente infra):** dominio, HTTPS, CDN, pasarela de pago (pago manual Nequi segùn brief).

---

## 4. Estructura de carpetas propuesta

```
parceros/                          # raùz del monorepo/app
??? docs/
?   ??? FASE-1-diseno-tecnico.md
??? database/
?   ??? migrations/
?   ?   ??? 001_initial_schema.sql
?   ??? seed/
?   ?   ??? 001_reference_data.sql
?   ??? scripts/
?       ??? create-database.ps1
??? public/
?   ??? images/
?   ?   ??? brand/                 # logos copiados/optimizados
?   ?   ??? hero/                  # fotografùa hero (pendiente oficial)
?   ?   ??? jersey/                # mockup jersey
?   ??? legal/                     # PDFs versionados (solo tras aprobaciùn legal)
??? src/
?   ??? app/
?   ?   ??? (public)/
?   ?   ?   ??? page.tsx           # landing
?   ?   ?   ??? inscripcion/
?   ?   ?   ??? confirmacion/[token]/
?   ?   ??? admin/
?   ?   ?   ??? login/
?   ?   ?   ??? dashboard/
?   ?   ?   ??? inscritos/
?   ?   ?   ??? pagos/
?   ?   ?   ??? exportaciones/
?   ?   ?   ??? configuracion/
?   ?   ??? api/
?   ?       ??? registrations/
?   ?       ??? uploads/
?   ?       ??? admin/
?   ??? components/
?   ?   ??? landing/
?   ?   ??? registration/          # un componente por paso
?   ?   ??? ui/
?   ??? lib/
?   ?   ??? db/                    # cliente pg / Drizzle o Prisma
?   ?   ??? validation/            # esquemas Zod compartidos
?   ?   ??? age.ts                 # edad al EVENT_DATE
?   ?   ??? masking.ts             # documento parcial en resumen
?   ??? server/
?       ??? services/              # registration, quota, payments, exports
?       ??? auth/
?       ??? storage/
??? .env.example
??? package.json                   # Fase 2
```

---

## 5. Modelo de datos (resumen)

Diagrama lùgico (entidades mùnimas del brief):

```mermaid
erDiagram
  participants ||--o{ registrations : has
  categories ||--o{ registrations : ""
  bicycle_types ||--o{ registrations : ""
  registrations ||--o| health_information : ""
  registrations ||--|| emergency_contacts : ""
  registrations ||--o| jersey_orders : ""
  jersey_orders ||--o| jersey_payments : ""
  registrations ||--o{ legal_acceptances : ""
  legal_documents ||--o{ legal_acceptances : ""
  registrations ||--o| guardian_authorizations : ""
  admin_users ||--o{ audit_logs : ""
  category_bicycle_rules }o--|| categories : ""
  category_bicycle_rules }o--|| bicycle_types : ""
```

### Reglas crùticas en base de datos

1. **Unicidad:** `UNIQUE (document_type, document_number)` en `participants` (o en `registrations` segùn si se permite re-inscripciùn histùrica ù por defecto: un participante activo por documento).
2. **Cupos:** contar `registrations.status = 'confirmed'`; tope **300** aplicado en transacciùn con bloqueo (`pg_advisory_xact_lock` o `SELECT ... FOR UPDATE` sobre fila `event_settings`).
3. **Pagos jersey:** estado `pending_verification | approved | rejected`; inscripciùn gratuita vùlida aunque el pago estù pendiente.
4. **Salud:** tabla separada; sin columnas de salud en vistas de exportaciùn jersey.
5. **Auditorùa:** `audit_logs` para cambios admin, verificaciùn de pagos y exportaciones.

El script completo estù en `database/migrations/001_initial_schema.sql`.

---

## 6. Flujo de inscripciùn (backend)

1. Cliente envùa borrador por paso (opcional persistencia sessionStorage + idempotency key).
2. Confirmaciùn final: **una transacciùn** que:
   - Bloquea cupos y verifica `registrations_open` y count &lt; 300.
   - Valida elegibilidad categorùa/bicicleta vùa `category_bicycle_rules`.
   - Rechaza duplicado documento.
   - Inserta participante, registro, salud (si autorizado), emergencia, jersey, archivos metadata, aceptaciones legales con `document_version_id`.
   - Genera `registration_number` (secuencia o prefijo + aùo, formato a definir con organizaciùn).
3. Respuesta: solo datos no sensibles + estado jersey.

**Concurrencia:** prueba de aceptaciùn #14 ù dos requests con 1 cupo ? una confirma, otra recibe error controlado sin sobrepasar 300.

---

## 7. Panel administrativo ù roles (borrador)

| Rol | Dashboard | Inscritos | Pagos | Export aseguradora | Export jersey | Config |
|-----|-----------|-----------|-------|----------------------|---------------|--------|
| `super_admin` | ? | ? | ? | ? | ? | ? |
| `operator` | ? | ? lectura/ediciùn limitada | ? verificar | ? | ? | ? |
| `viewer` | ? | lectura | lectura | ? | ? | ? |

Hash de contraseùas: **argon2** o **bcrypt** (coste configurable).

---

## 8. Seguridad y privacidad (diseùo)

- Validaciùn **Zod** en cliente y servidor; mensajes de error por campo (accesibilidad).
- Archivos: validaciùn MIME real, tamaùo mùximo vùa `event_settings`, rutas fuera de `public/`.
- Rate limiting en `POST /api/registrations` y login admin.
- Ley 1581: consentimientos granulares, versiùn de polùtica, registro de timestamp; **textos legales placeholder** hasta revisiùn jurùdica.
- Menores: feature flag `minors_registration_enabled` en `event_settings` ù **desactivado por defecto** hasta aprobaciùn aseguradora/legal.
- Campos de salud: paso con aviso previo; checkbox de autorizaciùn de datos sensibles independiente.

---

## 9. UX / UI (propuesta)

- **Mobile-first**, tipografùa display para tùtulos (ej. variable de Google Fonts: *Bebas Neue* + *Inter*).
- Hero: imagen deportiva + overlay; countdown Colombia; CTAs naranja.
- Formulario: stepper sticky en mùvil; guardado local entre pasos; no avanzar con errores.
- Jersey: mockup existente + tabla de tallas **administrable** (sin medidas inventadas en seed).
- Estados: skeleton loaders, botùn confirmar deshabilitado tras envùo (anti doble clic).

---

## 10. Informaciùn pendiente de la organizaciùn

| Tema | Impacto | Acciùn hasta recibir dato |
|------|---------|---------------------------|
| Textos reglamento, riesgos, privacidad | Paso 8 | Placeholder + versionado en BD; no publicar textos definitivos |
| Reglas menores (edad mùnima, documentos) | Paso 7 | `minors_registration_enabled = false` |
| Distancias, rutas, horarios, premios | Secciùn 2 | Contenido editable en admin (`event_settings.content_json`) |
| Tipos de bicicleta por categorùa | Paso 2 | Seed vacùo de reglas ? admin configura antes de abrir inscripciones |
| Tabla de tallas proveedor | Paso 5 | Registro sin filas de medidas; solo estructura |
| Foto hero oficial | Hero | Usar imagen genùrica o jersey mockup temporal |
| Logo fundaciùn en web | PDF actual | Rasterizar en Fase 2 |
| Formato `registration_number` | Confirmaciùn | Secuencia `MER2026-00001` propuesta ù confirmar |
| Credenciales PostgreSQL producciùn | Despliegue | Solo `.env` local documentado |

---

## 11. Base de datos PostgreSQL

**Nombre propuesto:** `manizales_epic_race_2026`  
**Charset:** UTF8  
**Migraciones:** ejecutar en orden `001_initial_schema.sql` luego `001_reference_data.sql`.

Script de creaciùn: `database/scripts/create-database.ps1` (requiere usuario con permisos `CREATEDB`).

Variables en `.env.example`:

```
DATABASE_URL=postgresql://postgres:****@localhost:5432/manizales_epic_race_2026
STORAGE_ROOT=./storage/private
SESSION_SECRET=generar-en-produccion
MAX_REGISTRATIONS=300
EVENT_DATE=2026-12-13
TZ=America/Bogota
```

---

## 12. Plan de fases siguientes (checklist maestro)

- [x] **Fase 1** ù Arquitectura, modelo, carpetas, SQL, decisiones pendientes  
- [ ] **Fase 2** ù Scaffold Next.js, landing, assets optimizados  
- [ ] **Fase 3** ù Servicios de cupos, API inscripciùn  
- [ ] **Fase 4** ù Formulario completo + archivos  
- [ ] **Fase 5** ù Admin + exportaciones  
- [ ] **Fase 6** ù Pruebas (lista ù9 del brief) + revisiùn legal  
- [ ] **Fase 7** ù Despliegue autorizado  

---

## 13. Criterio de validaciùn de esta fase

Antes de implementar la aplicaciùn completa, confirmar con la organizaciùn:

1. Modelo de datos y unicidad de documento.  
2. Formato de nùmero de inscripciùn.  
3. Reglas categorùa ? bicicleta (matriz en admin).  
4. Polùtica de menores y textos legales.  
5. Credenciales y entorno PostgreSQL (desarrollo vs producciùn).  

Tras validaciùn ? iniciar **Fase 2** (landing visual + init Next.js).
