-- ============================================================
-- SISTEMA DE GESTIÓN HOTELERA — Script completo de base de datos
-- Motor: MySQL 8+
-- ============================================================

CREATE DATABASE IF NOT EXISTS system_hotel
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE system_hotel;

-- ============================================================
-- 1. TABLAS PRINCIPALES (sin FK)
-- ============================================================

CREATE TABLE IF NOT EXISTS usuarios (
  id                BIGINT       AUTO_INCREMENT PRIMARY KEY,
  nombre_completo   VARCHAR(150) NOT NULL,
  username          VARCHAR(50)  NOT NULL UNIQUE,
  password          VARCHAR(255) NOT NULL,
  rol               VARCHAR(20)  NOT NULL,
  activo            BOOLEAN      NOT NULL DEFAULT TRUE,
  email             VARCHAR(100),
  telefono          VARCHAR(20),
  foto_perfil       TEXT,
  tema              VARCHAR(5)   DEFAULT 'LIGHT',
  created_at        DATETIME     DEFAULT CURRENT_TIMESTAMP,
  ultimo_acceso     DATETIME,
  intentos_fallidos INT          DEFAULT 0,
  bloqueo_hasta     DATETIME,
  INDEX idx_usuarios_rol (rol),
  INDEX idx_usuarios_activo (activo)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS clientes (
  id                BIGINT       AUTO_INCREMENT PRIMARY KEY,
  nombre_completo   VARCHAR(150) NOT NULL,
  telefono          VARCHAR(20)  NOT NULL,
  documento         VARCHAR(20)  UNIQUE,
  email             VARCHAR(100) UNIQUE,
  activo            BOOLEAN      DEFAULT TRUE,
  created_at        DATETIME     DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_clientes_telefono (telefono),
  INDEX idx_clientes_activo (activo)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS habitaciones (
  id           BIGINT       AUTO_INCREMENT PRIMARY KEY,
  piso         INT          NOT NULL,
  numero       VARCHAR(10)  NOT NULL UNIQUE,
  tipo         VARCHAR(20)  NOT NULL,
  precio_noche DECIMAL(10,2) NOT NULL,
  estado       VARCHAR(20)  NOT NULL DEFAULT 'DISPONIBLE',
  activo       BOOLEAN      NOT NULL DEFAULT TRUE,
  INDEX idx_habitaciones_estado (estado),
  INDEX idx_habitaciones_tipo (tipo)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS parametros (
  id          BIGINT       AUTO_INCREMENT PRIMARY KEY,
  clave       VARCHAR(100) NOT NULL UNIQUE,
  valor       VARCHAR(1000),
  descripcion VARCHAR(255),
  modulo      VARCHAR(50),
  editable    BOOLEAN      NOT NULL DEFAULT TRUE
) ENGINE=InnoDB;

-- ============================================================
-- 2. TABLAS CON FK
-- ============================================================

CREATE TABLE IF NOT EXISTS reservas (
  id               BIGINT       AUTO_INCREMENT PRIMARY KEY,
  cliente_id       BIGINT       NOT NULL,
  habitacion_id    BIGINT       NOT NULL,
  usuario_id       BIGINT       NOT NULL,
  fecha_entrada    DATE         NOT NULL,
  fecha_salida     DATE         NOT NULL,
  fecha_reserva    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  estado           VARCHAR(20)  NOT NULL DEFAULT 'CONFIRMADA',
  monto_total      DECIMAL(10,2) NOT NULL,
  monto_adelanto   DECIMAL(10,2) NOT NULL DEFAULT 0,
  metodo_adelanto  VARCHAR(20),
  referencia_pago  VARCHAR(100),
  observacion      VARCHAR(500),
  INDEX idx_reservas_estado (estado),
  INDEX idx_reservas_fechas (fecha_entrada, fecha_salida),
  CONSTRAINT fk_reservas_cliente    FOREIGN KEY (cliente_id)    REFERENCES clientes(id),
  CONSTRAINT fk_reservas_habitacion FOREIGN KEY (habitacion_id) REFERENCES habitaciones(id),
  CONSTRAINT fk_reservas_usuario    FOREIGN KEY (usuario_id)    REFERENCES usuarios(id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS hospedajes (
  id                      BIGINT       AUTO_INCREMENT PRIMARY KEY,
  cliente_id              BIGINT       NOT NULL,
  habitacion_id           BIGINT       NOT NULL,
  usuario_id              BIGINT       NOT NULL,
  reserva_id              BIGINT,
  fecha_ingreso           DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  fecha_salida_programada DATETIME     NOT NULL,
  fecha_salida_real       DATETIME,
  estado                  VARCHAR(20)  NOT NULL DEFAULT 'ACTIVO',
  total_pagado            DECIMAL(10,2) DEFAULT 0,
  deuda_pendiente         DECIMAL(10,2) DEFAULT 0,
  observacion             VARCHAR(500),
  version                 BIGINT       DEFAULT 0,
  activo_habitacion       BIGINT       GENERATED ALWAYS AS (CASE WHEN estado = 'ACTIVO' THEN habitacion_id ELSE NULL END) STORED,
  activo_cliente          BIGINT       GENERATED ALWAYS AS (CASE WHEN estado = 'ACTIVO' THEN cliente_id ELSE NULL END) STORED,
  UNIQUE KEY uq_hospedaje_activo_habitacion (activo_habitacion),
  UNIQUE KEY uq_hospedaje_activo_cliente (activo_cliente),
  INDEX idx_hospedajes_estado (estado),
  CONSTRAINT fk_hospedajes_cliente    FOREIGN KEY (cliente_id)    REFERENCES clientes(id),
  CONSTRAINT fk_hospedajes_habitacion FOREIGN KEY (habitacion_id) REFERENCES habitaciones(id),
  CONSTRAINT fk_hospedajes_usuario    FOREIGN KEY (usuario_id)    REFERENCES usuarios(id),
  CONSTRAINT fk_hospedajes_reserva    FOREIGN KEY (reserva_id)    REFERENCES reservas(id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS pagos (
  id          BIGINT       AUTO_INCREMENT PRIMARY KEY,
  reserva_id  BIGINT,
  hospedaje_id BIGINT,
  usuario_id  BIGINT       NOT NULL,
  monto       DECIMAL(10,2) NOT NULL,
  metodo      VARCHAR(20)  NOT NULL,
  referencia  VARCHAR(100),
  tipo        VARCHAR(20)  NOT NULL,
  fecha_pago  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  observacion VARCHAR(500),
  INDEX idx_pagos_fecha (fecha_pago),
  CONSTRAINT fk_pagos_reserva    FOREIGN KEY (reserva_id)    REFERENCES reservas(id),
  CONSTRAINT fk_pagos_hospedaje  FOREIGN KEY (hospedaje_id)  REFERENCES hospedajes(id),
  CONSTRAINT fk_pagos_usuario    FOREIGN KEY (usuario_id)    REFERENCES usuarios(id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS tconsumo (
  id              BIGINT       AUTO_INCREMENT PRIMARY KEY,
  id_consumo      VARCHAR(36)  NOT NULL UNIQUE,
  hospedaje_id    BIGINT       NOT NULL,
  usuario_id      BIGINT       NOT NULL,
  tipo_consumo    VARCHAR(20)  NOT NULL,
  descripcion     VARCHAR(200) NOT NULL,
  cantidad        INT          NOT NULL,
  precio_unitario DECIMAL(10,2) NOT NULL,
  subtotal        DECIMAL(10,2) NOT NULL,
  observacion     VARCHAR(500),
  fecha_registro  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_at      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_consumos_hospedaje FOREIGN KEY (hospedaje_id) REFERENCES hospedajes(id),
  CONSTRAINT fk_consumos_usuario   FOREIGN KEY (usuario_id)   REFERENCES usuarios(id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS incidencias_habitacion (
  id            BIGINT       AUTO_INCREMENT PRIMARY KEY,
  habitacion_id BIGINT       NOT NULL,
  usuario_id    BIGINT       NOT NULL,
  tipo          VARCHAR(30)  NOT NULL,
  motivo        VARCHAR(500) NOT NULL,
  fecha_inicio  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  fecha_fin     DATETIME,
  INDEX idx_incidencias_activas (fecha_fin),
  CONSTRAINT fk_incidencias_habitacion FOREIGN KEY (habitacion_id) REFERENCES habitaciones(id),
  CONSTRAINT fk_incidencias_usuario    FOREIGN KEY (usuario_id)    REFERENCES usuarios(id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS egresos (
  id             BIGINT       AUTO_INCREMENT PRIMARY KEY,
  usuario_id     BIGINT       NOT NULL,
  concepto       VARCHAR(200) NOT NULL,
  categoria      VARCHAR(50)  NOT NULL,
  monto          DECIMAL(10,2) NOT NULL,
  fecha_registro DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  observacion    VARCHAR(500),
  INDEX idx_egresos_categoria (categoria),
  CONSTRAINT fk_egresos_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS caja (
  id              BIGINT       AUTO_INCREMENT PRIMARY KEY,
  usuario_id      BIGINT       NOT NULL,
  fecha_apertura  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  fecha_cierre    DATETIME,
  monto_inicial   DECIMAL(10,2),
  total_ingresos  DECIMAL(10,2) DEFAULT 0,
  total_egresos   DECIMAL(10,2) DEFAULT 0,
  balance_final   DECIMAL(10,2),
  estado          VARCHAR(20)  NOT NULL DEFAULT 'ABIERTO',
  observacion     VARCHAR(500),
  CONSTRAINT fk_caja_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS notificaciones (
  id                BIGINT       AUTO_INCREMENT PRIMARY KEY,
  usuario_destino_id BIGINT,
  titulo            VARCHAR(200) NOT NULL,
  mensaje           VARCHAR(1000),
  tipo              VARCHAR(50),
  prioridad         VARCHAR(20)  DEFAULT 'MEDIA',
  fecha_creacion    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  leida             BOOLEAN      NOT NULL DEFAULT FALSE,
  estado            VARCHAR(30)  NOT NULL DEFAULT 'PENDIENTE',
  entidad_tipo      VARCHAR(50),
  entidad_id        BIGINT,
  INDEX idx_notificaciones_destino (usuario_destino_id),
  INDEX idx_notificaciones_leida (leida),
  CONSTRAINT fk_notificaciones_usuario FOREIGN KEY (usuario_destino_id) REFERENCES usuarios(id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS auditoria (
  id         BIGINT       AUTO_INCREMENT PRIMARY KEY,
  usuario_id BIGINT       NOT NULL,
  accion     VARCHAR(255) NOT NULL,
  modulo     VARCHAR(100),
  detalle    TEXT,
  ip         VARCHAR(50),
  fecha      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_auditoria_usuario (usuario_id),
  INDEX idx_auditoria_fecha (fecha),
  INDEX idx_auditoria_modulo (modulo)
) ENGINE=InnoDB;

-- ============================================================
-- 3. MIGRACIÓN: incidencias_habitacion.tipo
--    Valores legacy 'LIMPIEZA' → 'LIMPIEZA_CHECKOUT'
-- ============================================================

UPDATE incidencias_habitacion
SET    tipo = 'LIMPIEZA_CHECKOUT'
WHERE  tipo = 'LIMPIEZA';

-- ============================================================
-- 4. DATOS INICIALES (seed)
-- ============================================================

-- Admin por defecto (password: admin123)
INSERT INTO usuarios (nombre_completo, username, password, email, telefono, rol, activo, tema) VALUES
('Administrador', 'admin', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'admin@hotel.com', '999999999', 'ADMIN', TRUE, 'DARK')
ON DUPLICATE KEY UPDATE username = username;

-- Recepcionista por defecto (password: recep123)
INSERT INTO usuarios (nombre_completo, username, password, email, telefono, rol, activo, tema) VALUES
('Recepcionista', 'recepcionista', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'recepcion@hotel.com', '999999998', 'RECEPCIONISTA', TRUE, 'LIGHT')
ON DUPLICATE KEY UPDATE username = username;

-- Parámetros del sistema
INSERT INTO parametros (clave, valor, descripcion, modulo, editable) VALUES
('checkin_hora_inicio', '14:00', 'Hora de inicio del check-in', 'HOSPEDAJE', TRUE),
('checkout_hora_fin', '12:00', 'Hora máxima de check-out', 'HOSPEDAJE', TRUE),
('tolerancia_minutos_retorno', '30', 'Minutos de tolerancia para retorno', 'HOSPEDAJE', TRUE),
('tolerancia_minutos_no_show', '60', 'Minutos para marcar no-show', 'RESERVA', TRUE),
('multa_no_show_porcentaje', '50', 'Penalidad por no-show (%)', 'RESERVA', TRUE),
('limite_invitados_por_habitacion', '3', 'Máximo de invitados por habitación', 'CONFIG', TRUE)
ON DUPLICATE KEY UPDATE clave = clave;
