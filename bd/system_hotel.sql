-- ==========================================
-- SISTEMA DE GESTIÓN HOTELERA
-- BASE DE DATOS DEFINITIVA
-- 7 TABLAS
-- ==========================================
CREATE DATABASE system_hotel;
USE system_hotel;
-- ==========================================
DROP DATABASE system_hotel
-- 1. USUARIOS
CREATE TABLE usuarios (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    nombre_completo VARCHAR(150) NOT NULL,
    username VARCHAR(50) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    rol ENUM('ADMIN', 'RECEPCIONISTA') NOT NULL,
    activo BOOLEAN DEFAULT TRUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
-- 2. HABITACIONES
CREATE TABLE habitaciones (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    piso INT NOT NULL,
    numero VARCHAR(10) NOT NULL UNIQUE,
    tipo ENUM('SIMPLE', 'MATRIMONIAL', 'DOBLE_CAMA') NOT NULL,
    precio_noche DECIMAL(10,2) NOT NULL,
    estado ENUM('DISPONIBLE', 'OCUPADA', 'LIMPIEZA', 'MANTENIMIENTO') NOT NULL DEFAULT 'DISPONIBLE',
    activo BOOLEAN DEFAULT TRUE
);
-- 3. CLIENTES
CREATE TABLE clientes (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    nombre_completo VARCHAR(150) NOT NULL,
    telefono VARCHAR(20) NOT NULL,
    documento VARCHAR(20),
    email VARCHAR(100),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
-- 4. RESERVAS
CREATE TABLE reservas (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    cliente_id BIGINT NOT NULL,
    habitacion_id BIGINT NOT NULL,
    usuario_id BIGINT NOT NULL,
    fecha_entrada DATE NOT NULL,
    fecha_salida DATE NOT NULL,
    fecha_reserva DATETIME NOT NULL,
    estado ENUM('CONFIRMADA', 'REALIZADA', 'CANCELADA', 'NO_SHOW') NOT NULL,
    monto_total DECIMAL(10,2) NOT NULL,
    monto_adelanto DECIMAL(10,2) NOT NULL,
    metodo_adelanto ENUM('YAPE', 'EFECTIVO') NOT NULL,
    referencia_pago VARCHAR(100),
    observacion VARCHAR(500),
    FOREIGN KEY (cliente_id) REFERENCES clientes(id),
    FOREIGN KEY (habitacion_id) REFERENCES habitaciones(id),
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
);
-- 5. HOSPEDAJES
CREATE TABLE hospedajes (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    cliente_id BIGINT NOT NULL,
    habitacion_id BIGINT NOT NULL,
    reserva_id BIGINT NULL,
    usuario_id BIGINT NOT NULL,
    fecha_ingreso DATETIME NOT NULL,
    fecha_salida_programada DATETIME NOT NULL,
    fecha_salida_real DATETIME NULL,
    estado ENUM('ACTIVO', 'FINALIZADO') DEFAULT 'ACTIVO',
    total_pagado DECIMAL(10,2) DEFAULT 0,
    deuda_pendiente DECIMAL(10,2) DEFAULT 0,
    FOREIGN KEY (cliente_id) REFERENCES clientes(id),
    FOREIGN KEY (habitacion_id) REFERENCES habitaciones(id),
    FOREIGN KEY (reserva_id) REFERENCES reservas(id),
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
);
-- 6. PAGOS
CREATE TABLE pagos (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    reserva_id BIGINT NULL,
    hospedaje_id BIGINT NULL,
    usuario_id BIGINT NOT NULL,
    monto DECIMAL(10,2) NOT NULL,
    metodo ENUM('EFECTIVO', 'YAPE') NOT NULL,
    referencia VARCHAR(100),
    tipo ENUM('ADELANTO', 'SALDO', 'EXTENSION') NOT NULL,
    fecha_pago DATETIME NOT NULL,
    observacion VARCHAR(500),
    FOREIGN KEY (reserva_id) REFERENCES reservas(id),
    FOREIGN KEY (hospedaje_id) REFERENCES hospedajes(id),
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
);
-- 7. INCIDENCIAS HABITACIÓN
CREATE TABLE incidencias_habitacion (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    habitacion_id BIGINT NOT NULL,
    usuario_id BIGINT NOT NULL,
    tipo ENUM('LIMPIEZA', 'MANTENIMIENTO') NOT NULL,
    motivo VARCHAR(500) NOT NULL,
    fecha_inicio DATETIME NOT NULL,
    fecha_fin DATETIME NULL,
    FOREIGN KEY (habitacion_id) REFERENCES habitaciones(id),
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
);
-- ==========================================
-- ÍNDICES
-- ==========================================
CREATE INDEX idx_clientes_telefono ON clientes(telefono);
CREATE INDEX idx_reservas_estado ON reservas(estado);
CREATE INDEX idx_reservas_fecha_entrada ON reservas(fecha_entrada);
CREATE INDEX idx_reservas_habitacion_fechas ON reservas(habitacion_id, fecha_entrada, fecha_salida);
CREATE INDEX idx_hospedajes_estado ON hospedajes(estado);
CREATE INDEX idx_hospedajes_fechas ON hospedajes(fecha_ingreso, fecha_salida_programada);
CREATE INDEX idx_pagos_fecha ON pagos(fecha_pago);
CREATE INDEX idx_incidencias_habitacion ON incidencias_habitacion(habitacion_id, tipo);
-- ==========================================
-- DATOS INICIALES caja
-- ==========================================
-- Usuario admin por defecto (contraseña: admin123)
INSERT INTO usuarios (nombre_completo, username, password, rol) VALUES
('Administrador', 'admin', 'admin123', 'ADMIN');
-- Usuario recepcionista por defecto (contraseña: recep123)
INSERT INTO usuarios (nombre_completo, username, password, rol) VALUES
('Recepcionista', 'recepcionista', 'recep123', 'RECEPCIONISTA');

SELECT * FROM reservas


