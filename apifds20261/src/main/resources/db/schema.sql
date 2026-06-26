-- ==========================================
-- SISTEMA DE GESTION HOTELERA
-- BASE DE DATOS - SCRIPT COMPLETO
-- ==========================================

CREATE DATABASE IF NOT EXISTS system_hotel;
USE system_hotel;

-- 1. USUARIOS
CREATE TABLE IF NOT EXISTS usuarios (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    nombre_completo VARCHAR(150) NOT NULL,
    username VARCHAR(50) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    rol VARCHAR(20) NOT NULL DEFAULT 'RECEPCIONISTA',
    activo BOOLEAN DEFAULT TRUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 2. HABITACIONES
CREATE TABLE IF NOT EXISTS habitaciones (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    piso INT NOT NULL,
    numero VARCHAR(10) NOT NULL UNIQUE,
    tipo VARCHAR(20) NOT NULL DEFAULT 'SIMPLE',
    precio_noche DECIMAL(10,2) NOT NULL,
    estado VARCHAR(20) NOT NULL DEFAULT 'DISPONIBLE',
    activo BOOLEAN DEFAULT TRUE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 3. CLIENTES
CREATE TABLE IF NOT EXISTS clientes (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    nombre_completo VARCHAR(150) NOT NULL,
    telefono VARCHAR(20) NOT NULL,
    documento VARCHAR(20),
    email VARCHAR(100),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 4. RESERVAS
CREATE TABLE IF NOT EXISTS reservas (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    cliente_id BIGINT NOT NULL,
    habitacion_id BIGINT NOT NULL,
    usuario_id BIGINT NOT NULL,
    fecha_entrada DATE NOT NULL,
    fecha_salida DATE NOT NULL,
    fecha_reserva DATETIME NOT NULL,
    estado VARCHAR(20) NOT NULL DEFAULT 'CONFIRMADA',
    monto_total DECIMAL(10,2) NOT NULL,
    monto_adelanto DECIMAL(10,2) NOT NULL,
    metodo_adelanto VARCHAR(20) NOT NULL,
    referencia_pago VARCHAR(100),
    observacion VARCHAR(500),
    FOREIGN KEY (cliente_id) REFERENCES clientes(id),
    FOREIGN KEY (habitacion_id) REFERENCES habitaciones(id),
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 5. HOSPEDAJES
CREATE TABLE IF NOT EXISTS hospedajes (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    cliente_id BIGINT NOT NULL,
    habitacion_id BIGINT NOT NULL,
    reserva_id BIGINT NULL,
    usuario_id BIGINT NOT NULL,
    fecha_ingreso DATETIME NOT NULL,
    fecha_salida_programada DATETIME NOT NULL,
    fecha_salida_real DATETIME NULL,
    estado VARCHAR(20) DEFAULT 'ACTIVO',
    total_pagado DECIMAL(10,2) DEFAULT 0,
    deuda_pendiente DECIMAL(10,2) DEFAULT 0,
    FOREIGN KEY (cliente_id) REFERENCES clientes(id),
    FOREIGN KEY (habitacion_id) REFERENCES habitaciones(id),
    FOREIGN KEY (reserva_id) REFERENCES reservas(id),
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 6. PAGOS
CREATE TABLE IF NOT EXISTS pagos (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    reserva_id BIGINT NULL,
    hospedaje_id BIGINT NULL,
    usuario_id BIGINT NOT NULL,
    monto DECIMAL(10,2) NOT NULL,
    metodo VARCHAR(20) NOT NULL,
    referencia VARCHAR(100),
    tipo VARCHAR(20) NOT NULL,
    fecha_pago DATETIME NOT NULL,
    observacion VARCHAR(500),
    FOREIGN KEY (reserva_id) REFERENCES reservas(id),
    FOREIGN KEY (hospedaje_id) REFERENCES hospedajes(id),
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 7. INCIDENCIAS HABITACION
CREATE TABLE IF NOT EXISTS incidencias_habitacion (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    habitacion_id BIGINT NOT NULL,
    usuario_id BIGINT NOT NULL,
    tipo VARCHAR(20) NOT NULL,
    motivo VARCHAR(500) NOT NULL,
    fecha_inicio DATETIME NOT NULL,
    fecha_fin DATETIME NULL,
    FOREIGN KEY (habitacion_id) REFERENCES habitaciones(id),
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ==========================================
-- INDICES
-- ==========================================
CREATE INDEX IF NOT EXISTS idx_clientes_telefono ON clientes(telefono);
CREATE INDEX IF NOT EXISTS idx_reservas_estado ON reservas(estado);
CREATE INDEX IF NOT EXISTS idx_reservas_fecha_entrada ON reservas(fecha_entrada);
CREATE INDEX IF NOT EXISTS idx_reservas_habitacion_fechas ON reservas(habitacion_id, fecha_entrada, fecha_salida);
CREATE INDEX IF NOT EXISTS idx_hospedajes_estado ON hospedajes(estado);
CREATE INDEX IF NOT EXISTS idx_hospedajes_fechas ON hospedajes(fecha_ingreso, fecha_salida_programada);
CREATE INDEX IF NOT EXISTS idx_pagos_fecha ON pagos(fecha_pago);
CREATE INDEX IF NOT EXISTS idx_incidencias_habitacion ON incidencias_habitacion(habitacion_id, tipo);

-- ==========================================
-- DATOS INICIALES
-- ==========================================
-- Usuario admin por defecto (password: admin123 - BCrypt hash)
INSERT INTO usuarios (nombre_completo, username, password, rol) VALUES
('Administrador', 'admin', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'ADMIN');

-- Usuario recepcionista por defecto (password: recep123)
INSERT INTO usuarios (nombre_completo, username, password, rol) VALUES
('Recepcionista', 'recepcionista', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'RECEPCIONISTA');
