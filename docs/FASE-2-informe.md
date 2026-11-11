# Fase 2 - Informe de entrega

**Fecha:** 11 de noviembre de 2026  
**Equipo:** JX4ZLK4 / induma\gestor.desarrollo  
**Directorio:** `C:\Users\gestor.desarrollo\OneDrive - INDUMA S.A.S\Escritorio\Parceros`

## Verificacion de entorno

| Item | Resultado |
|------|-----------|
| Hostname | JX4ZLK4 |
| Usuario | induma\gestor.desarrollo |
| Node.js | v22.23.2 |
| npm | 10.9.8 |
| PostgreSQL | No modificado en Fase 2 |
| Produccion / despliegue | No realizado |

## URL local

```
http://localhost:3000
```

Comando: `npm run dev` en la raiz del proyecto.

## Dependencias principales

- next 15.5.4, react 19, typescript
- tailwindcss 3, postcss, autoprefixer
- react-hook-form, zod, @hookform/resolvers, clsx

## Estructura creada (frontend)

```
src/
  app/           layout.tsx, page.tsx, globals.css
  components/
    layout/      Header, Footer
    landing/     Hero, Countdown, EventOverview, CategoryCards, JerseyShowcase, EventConditions
    registration/ RegistrationWizard, FormStep, ProgressIndicator, LegalAcceptance, RegistrationReview
    ui/          FormField
  lib/
    config/      event.ts
    validation/  registrationSchema.ts, fileRefine.ts
    registration/ visibleSteps.ts
    age.ts, masking.ts
public/images/   brand/, jersey/, hero/
```

## Componentes implementados (checklist brief)

- [x] Header
- [x] Hero
- [x] Countdown (America/Bogota, 2026-12-13T06:00:00-05:00)
- [x] EventOverview
- [x] CategoryCards (4 categorias + deep link)
- [x] JerseyShowcase ($110.000 COP)
- [x] RegistrationWizard (9 pasos visuales)
- [x] FormStep, FormField, ProgressIndicator
- [x] LegalAcceptance (borradores marcados)
- [x] RegistrationReview (sin datos sensibles)
- [x] Footer

## Pruebas Fase 2

| Prueba | Estado |
|--------|--------|
| `npm run build` exitoso | OK |
| Secciones landing visibles | OK (revision manual en navegador) |
| Navegacion anclas / menu movil | OK |
| Countdown fecha evento | OK |
| 4 categorias | OK |
| Precio jersey | OK |
| Campos condicionales salud / jersey / pago | OK |
| Edad al 13/12/2026 en paso 1 | OK |
| Validacion por paso | OK |
| Confirmar inscripcion | Muestra mensaje dev, sin registro real |
| PostgreSQL | Sin cambios |
| Capturas escritorio/movil | Pendiente captura manual por el usuario |

## Comportamiento formulario

- Sin envio a API ni persistencia.
- Boton **Confirmar inscripcion gratuita** muestra: *Formulario en desarrollo. Las inscripciones aun no estan habilitadas.*
- Matriz bicicleta vacia: paso 2 bloqueado con mensaje (sin reglas inventadas).
- Menores: `minorsEnabled: false`.
- Textos legales: BORRADOR visible.

## Pendientes / limitaciones

- Fotografia hero oficial (usa mockup provisional en `public/images/hero/`).
- Rasterizar logo fundacion PDF para footer.
- Matriz categoria-bicicleta (Fase 3 + admin).
- Tabla de tallas proveedor (admin).
- Algunos textos sin tildes en UI por estabilidad UTF-8 en OneDrive (mejorable en Fase 3).
- Actualizar Next.js a version parcheada (aviso CVE en 15.5.4).

## Checklist maestro

- [x] Fase 1
- [x] Fase 2
- [ ] Fase 3 Backend y cupos
- [ ] Fase 4 Formulario conectado
- [ ] Fase 5 Administracion
- [ ] Fase 6 Pruebas y seguridad
- [ ] Fase 7 Publicacion
