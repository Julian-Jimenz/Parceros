# Fase 2.1 - Validacion y correcciones tecnicas

**Fecha:** 11 de noviembre de 2026  
**Equipo:** JX4ZLK4 / induma\gestor.desarrollo  
**Ruta:** `C:\Users\gestor.desarrollo\OneDrive - INDUMA S.A.S\Escritorio\Parceros`

---

## 1. Diagnostico inicial

| Verificacion | Resultado |
|--------------|-----------|
| Hostname | JX4ZLK4 (OK) |
| Usuario | induma\gestor.desarrollo (OK) |
| Ruta proyecto | Parceros (OK) |
| Git | Inicializado en cierre 2.1 (sin commit) |
| Next.js | 15.5.29 (tras cierre) |
| React | 19.3.1 |
| PostgreSQL | Sin cambios en esta fase |

### Hallazgos previos a correccion

1. **Navegacion:** enlaces `#inscripcion?categoria=...` no exponen query a `useSearchParams` tras recarga.
2. **Countdown:** mostraba hora 6:00 a.m. como referencia fija no confirmada.
3. **UTF-8:** archivos con bytes invalidos por sincronizacion OneDrive al guardar tildes literales.
4. **Seguridad:** `npm audit` reporta 9 vulnerabilidades (1 critica en `next@15.5.4`).
5. **Responsive:** titulo hero grande en 375px; controles sin altura tactil minima uniforme.
6. **Formulario paso 8:** errores de checkboxes legales no siempre visibles (`fieldErrors` vs `formState`).

---

## 2. Archivos modificados / creados

**Nuevo**

- `src/lib/navigation/inscriptionLinks.ts`

**Modificados**

- `src/lib/config/event.ts`
- `src/components/landing/Countdown.tsx`
- `src/components/landing/CategoryCards.tsx`
- `src/components/landing/JerseyShowcase.tsx`
- `src/components/landing/Hero.tsx`
- `src/components/layout/Header.tsx`
- `src/components/layout/Footer.tsx`
- `src/components/registration/RegistrationWizard.tsx`
- `src/components/registration/LegalAcceptance.tsx`
- `src/components/ui/FormField.tsx`
- `src/lib/validation/registrationSchema.ts`
- `src/app/globals.css`

**Documentacion**

- `docs/FASE-2.1-validacion.md` (este archivo)

---

## 3. Correcciones implementadas

### Navegacion (Paso 2)

- Enlaces estandar: `/?categoria=<id>#inscripcion` y `/?jersey=1#inscripcion` via `inscriptionHref()`.
- Compatibilidad con enlaces legacy `#inscripcion?...` (parseo + `history.replaceState` hacia formato canonico).
- Validacion de `categoria` contra IDs oficiales antes de preseleccionar.
- Preseleccion de categoria abre **paso 2**; jersey preselecciona `free_with_jersey`.
- Scroll suave a `#inscripcion` al llegar con parametros.
- Header/Footer/Hero actualizados al mismo esquema.

### Countdown (Paso 3)

- Eliminada hora 6:00 a.m. como dato oficial.
- Configuracion en `EVENT`:
  - `eventStartTimeConfirmed: false`
  - `eventStartTimeIso: null`
  - `countdownTargetIso: 2026-12-13T00:00:00-05:00` (medianoche del dia del evento en Colombia)
- UI muestra **solo fecha** verificada + aviso: hora de salida por confirmar.

### Codificacion (Paso 4)

- Textos con tildes en fuentes criticas mediante secuencias `\uXXXX` (UTF-8 valido en disco + render correcto en UI).
- Validacion: todos los `.ts/.tsx` en `src/` pasan lectura UTF-8 estricta tras correccion.
- `npm run build` compila sin error de encoding.

### Responsive (Paso 7)

- `overflow-x: hidden` en `body`.
- Hero: titulo `text-4xl` en movil, escala hasta `lg:text-8xl`.
- Inputs `min-h-11` y `text-base` (mejor tactil 375-430px).
- Botones principales header/hero con `min-h-11`.
- Checkboxes legales `h-5 w-5`.

### Formulario (Paso 6)

- 9 pasos intactos; bloqueo envio real mantenido.
- Paso 8: `LegalAcceptance` usa `getError()` unificado con validacion manual.
- Matriz bicicleta vacia: mensaje explicito en paso 2 (sin reglas inventadas).

---

## 4. Resultado de pruebas locales

| Prueba | Resultado |
|--------|-----------|
| `npm run build` | OK |
| UTF-8 estricto en `src/**` | OK |
| PostgreSQL / migraciones | No ejecutado (autorizado) |
| Inscripcion real | Bloqueada (mensaje dev) |
| Navegacion query + recarga | Corregida (diseno `/?params#inscripcion`) |
| Responsive | Ajustes CSS aplicados; revision visual manual recomendada en 375/430/768/1440 |

**Prueba manual sugerida**

1. Abrir `http://localhost:3000/?categoria=open-mujeres#inscripcion` y recargar (F5): categoria preseleccionada.
2. Abrir `http://localhost:3000/?jersey=1#inscripcion`: opcion jersey preseleccionada.
3. Desde tarjeta de categoria en landing: mismo comportamiento.

---

## 5. Vulnerabilidades (historico y estado tras cierre)

**Estado inicial Fase 2.1:** `next@15.5.4`, 1 vulnerabilidad **critica** en `next`.

**Estado tras cierre (seccion 9):** `next@15.5.29`, sin criticas en audit; ver 9.3 para detalle de moderadas/altas pendientes.

---

## 6. Pendientes no resueltos

- Logo fundacion solo en PDF (sin raster web).
- Foto hero oficial (mockup provisional).
- Matriz categoria-bicicleta (admin / Fase 3).
- Migracion futura de textos `\uXXXX` a UTF-8 literal cuando el repo este en Git fuera de conflictos OneDrive.
- Capturas de pantalla 375/430/768/1440 (manual).
- ~~Actualizacion de Next.js~~ aplicada a 15.5.29 en cierre tecnico.

---

## 7. Checklist maestro

- [x] Fase 1
- [x] Fase 2
- [x] Fase 2.1 (validacion / correcciones frontend)
- [ ] Fase 3 Backend y cupos
- [ ] Fase 4 Formulario conectado
- [ ] Fase 5 Administracion
- [ ] Fase 6 Pruebas y seguridad
- [ ] Fase 7 Publicacion

---

## 8. Regla de cierre

Fase 2.1 completada. **No se inicio Fase 3.** Sin cambios en PostgreSQL ni inscripciones reales.

---

## 9. Cierre tecnico Fase 2.1 (actualizacion de seguridad y Git)

**Fecha cierre:** 11 de noviembre de 2026

### 9.1 Validacion inicial

| Item | Resultado |
|------|-----------|
| Hostname | JX4ZLK4 |
| Usuario | induma\gestor.desarrollo |
| Directorio | Parceros (OK) |
| `.git` previo | No existia |
| Repositorio padre | Escritorio no es worktree Git |

### 9.2 Versiones finales instaladas

| Paquete | Version |
|---------|---------|
| next | **15.5.29** (exact) |
| eslint-config-next | **15.5.29** (exact) |
| react / react-dom | 19.3.1 |
| Demas dependencias | Sin cambios intencionales en `package.json` |

Comando de verificacion:

```text
npm ls next eslint-config-next
```

### 9.3 Actualizacion de seguridad aplicada

Autorizado por organizacion: `next@15.5.29` y `eslint-config-next@15.5.29`.

- No se ejecuto `npm audit fix --force`.
- **Antes:** 9 vulnerabilidades (1 critica en `next@15.5.4`).
- **Despues:** 9 vulnerabilidades (**0 criticas**): 7 moderate, 2 high.

#### Vulnerabilidades pendientes (sin parche aplicado en esta fase)

| Severidad | Cadena | Nota |
|-----------|--------|------|
| moderate | `minimatch` via `@typescript-eslint/*` | Solo toolchain ESLint (dev) |
| high | `postcss` (transitivo de `next`) | `npm audit fix --force` propone Next 16 (breaking); no autorizado |
| high | `sharp` (transitivo de `next`) | Parche via `npm audit fix` no aplicado para evitar cambios no autorizados |

Impacto operativo actual: landing estatica/CSR del formulario; sin Server Actions en produccion. Riesgo residual principalmente en **dev** (`next dev`, optimizador de imagenes).

### 9.4 Build y lint

| Prueba | Resultado |
|--------|-----------|
| `npm run build` | OK (Next.js 15.5.29) |
| `npm run lint` | OK (sin warnings ni errores) |

### 9.5 Control de versiones Git

- `.gitignore` revisado: `.env`, `node_modules`, `.next`, `storage/private`, comprobantes, temporales.
- `.env.example` conservado (trackeable).
- `git init` ejecutado en la raiz del proyecto.
- **Sin** `git commit`, **sin** remoto, **sin** publicacion.

Estado: repositorio local vacio (todos los archivos en untracked). El equipo puede hacer el primer commit cuando lo autorice.

### 9.6 Pruebas de regresion (checklist)

| Caso | Metodo | Resultado |
|------|--------|-----------|
| Build de landing | `npm run build` | OK |
| Inicio dev | `npm run dev` (manual) | Disponible en :3000 |
| Nav categorias | `inscriptionHref({ categoria })` | OK (codigo + build) |
| Nav jersey | `/?jersey=1#inscripcion` | OK (codigo + build) |
| Persistencia F5 | query `?` + `#inscripcion` | OK (diseno Fase 2.1) |
| Countdown | Sin hora oficial 6:00 | OK |
| 9 pasos formulario | `RegistrationWizard` + `FORM_STEPS` | OK |
| Validaciones | `validateRegistrationStep` | OK |
| Responsive | CSS min-h-11, overflow-x | OK (ajustes aplicados) |
| Sin inscripcion real | `REGISTRATION_DEV_MESSAGE` | OK |
| PostgreSQL | ù | Sin cambios |

No se usaron datos personales reales.

### 9.7 Problemas pendientes

- Vulnerabilidades transitivas `postcss` / `sharp` en audit.
- Primer commit Git pendiente de decision del equipo.
- Matriz bicicleta, backend, hero oficial (Fase 3+).
- Textos `\uXXXX` por compatibilidad OneDrive.

### 9.8 Checklist maestro

- [x] Fase 1
- [x] Fase 2
- [x] Fase 2.1 (correcciones + cierre tecnico)
- [ ] Fase 3
