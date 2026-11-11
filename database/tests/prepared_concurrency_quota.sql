-- PREPARADO PARA FASE 3B-5 / POST-AUTORIZACION
-- NO EJECUTAR en Fase 3B-3 sin autorizacion explicita.
-- Requiere: BD de prueba, registrations_open = true, datos minimos de catalogo.

-- =============================================================================
-- Escenario A: cupo en 299, dos sesiones confirman en paralelo
-- =============================================================================
-- Sesion 1:
--   BEGIN;
--   UPDATE event_settings SET registrations_open = true WHERE id = 1;
--   INSERT INTO registrations (...) VALUES (..., 'confirmed', ...);
--   -- no COMMIT aun
-- Sesion 2 (otra conexion):
--   BEGIN;
--   INSERT INTO registrations (...) VALUES (..., 'confirmed', ...);
--   -- una debe COMMIT; la otra debe fallar con QUOTA_EXCEEDED (P0002)

-- =============================================================================
-- Escenario B: UPDATE draft -> confirmed no cuenta dos veces
-- =============================================================================
--   INSERT ... status = 'draft';
--   UPDATE registrations SET status = 'confirmed' WHERE id = ...;
--   UPDATE registrations SET registration_option = 'free_with_jersey' WHERE id = ... AND status = 'confirmed';
--   -- no debe lanzar QUOTA_EXCEEDED en el segundo UPDATE si status sigue confirmed

-- =============================================================================
-- Escenario C: cancelled libera cupo logico (no decrementa secuencia)
-- =============================================================================
--   Confirmar hasta max_confirmed_registrations.
--   UPDATE una fila SET status = 'cancelled';
--   Nueva confirmacion debe ser posible si v_count < v_max.

-- =============================================================================
-- Escenario D: numeracion MER2026-XXXXX
-- =============================================================================
--   Dos confirmaciones concurrentes deben obtener numeros distintos.
--   SELECT registration_number FROM registrations WHERE status = 'confirmed' ORDER BY confirmed_at;

-- =============================================================================
-- Escenario E: idempotency_key
-- =============================================================================
--   INSERT con misma idempotency_key en dos intentos: segunda viola UNIQUE
--   o la aplicacion hace SELECT previo y retorna la existente.

-- Herramienta sugerida: pgbench custom script o N clientes psql en PowerShell jobs.
