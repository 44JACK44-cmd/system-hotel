-- ============================================================
-- MIGRACIÓN: Fix columna tipo en incidencias_habitacion
-- NOTA: Esta migración ya está incluida en system_hotel.sql
--       (sección 3 del script completo).
-- Solo ejecutar este archivo si ya tienes la BD y necesitas
-- migrar datos existentes sin recrear todo.
-- ============================================================

USE system_hotel;

-- PASO 1: Ver registros legacy (diagnóstico)
SELECT id, habitacion_id, tipo, motivo, fecha_inicio
FROM incidencias_habitacion
WHERE tipo NOT IN ('LIMPIEZA_CHECKOUT', 'SERVICIO_LIMPIEZA_HUESPED', 'MANTENIMIENTO');

-- PASO 2: Migrar valor antiguo 'LIMPIEZA' → 'LIMPIEZA_CHECKOUT'
UPDATE incidencias_habitacion
SET tipo = 'LIMPIEZA_CHECKOUT'
WHERE tipo = 'LIMPIEZA';

-- PASO 3: Verificar que no quedan valores incompatibles
SELECT DISTINCT tipo FROM incidencias_habitacion;
