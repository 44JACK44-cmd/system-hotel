-- ============================================================
-- MIGRACIÓN: Integridad de concurrencia a nivel de base de datos
-- Motor: MySQL 8+
--
-- Garantiza a nivel de BD que NUNCA existan dos hospedajes ACTIVOS
-- para la misma habitación ni para el mismo cliente, incluso si
-- dos solicitudes concurrentes llegaran a la base de datos.
--
-- Implementación: columnas generadas + índice único.
--   activo_habitacion = habitacion_id cuando estado='ACTIVO', NULL en otro caso
--   activo_cliente    = cliente_id     cuando estado='ACTIVO', NULL en otro caso
-- Un índice único en MySQL permite múltiples NULL, por lo que solo
-- se impide UN registro ACTIVO por habitación / por cliente.
-- ============================================================

USE system_hotel;

-- PASO 1: Agregar columnas generadas (idempotente)
SET @existe_col1 := (SELECT COUNT(*) FROM information_schema.columns
  WHERE table_schema = 'system_hotel' AND table_name = 'hospedajes'
  AND column_name = 'activo_habitacion');
SET @sql := IF(@existe_col1 = 0,
  'ALTER TABLE hospedajes ADD COLUMN activo_habitacion BIGINT GENERATED ALWAYS AS (CASE WHEN estado = ''ACTIVO'' THEN habitacion_id ELSE NULL END) STORED',
  'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @existe_col2 := (SELECT COUNT(*) FROM information_schema.columns
  WHERE table_schema = 'system_hotel' AND table_name = 'hospedajes'
  AND column_name = 'activo_cliente');
SET @sql2 := IF(@existe_col2 = 0,
  'ALTER TABLE hospedajes ADD COLUMN activo_cliente BIGINT GENERATED ALWAYS AS (CASE WHEN estado = ''ACTIVO'' THEN cliente_id ELSE NULL END) STORED',
  'SELECT 1');
PREPARE stmt2 FROM @sql2; EXECUTE stmt2; DEALLOCATE PREPARE stmt2;

-- PASO 2: Índices únicos (idempotente)
CREATE UNIQUE INDEX IF NOT EXISTS uq_hospedaje_activo_habitacion ON hospedajes (activo_habitacion);
CREATE UNIQUE INDEX IF NOT EXISTS uq_hospedaje_activo_cliente ON hospedajes (activo_cliente);

-- PASO 3: Diagnóstico de datos existentes que violarían la regla
SELECT 'Duplicados por habitacion' AS tipo, habitacion_id, COUNT(*) AS total
FROM hospedajes WHERE estado = 'ACTIVO'
GROUP BY habitacion_id HAVING COUNT(*) > 1;

SELECT 'Duplicados por cliente' AS tipo, cliente_id, COUNT(*) AS total
FROM hospedajes WHERE estado = 'ACTIVO'
GROUP BY cliente_id HAVING COUNT(*) > 1;
