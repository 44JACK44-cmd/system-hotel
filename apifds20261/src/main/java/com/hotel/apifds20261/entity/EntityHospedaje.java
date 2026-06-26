package com.hotel.apifds20261.entity;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import com.hotel.apifds20261.staticdata.*;

@Entity
@Table(name = "hospedajes")
@Getter @Setter
@NoArgsConstructor
public class EntityHospedaje {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "cliente_id", nullable = false)
    private EntityCliente cliente;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "habitacion_id", nullable = false)
    private EntityHabitacion habitacion;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reserva_id")
    private EntityReserva reserva;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "usuario_id", nullable = false)
    private EntityUsuario usuario;

    @Column(name = "fecha_ingreso", nullable = false)
    private LocalDateTime fechaIngreso;

    @Column(name = "fecha_salida_programada", nullable = false)
    private LocalDateTime fechaSalidaProgramada;

    @Column(name = "fecha_salida_real")
    private LocalDateTime fechaSalidaReal;

    @Enumerated(EnumType.STRING)
    @Column(length = 20, nullable = false)
    private EstadoHospedaje estado = EstadoHospedaje.ACTIVO;

    @Column(name = "total_pagado", precision = 10, scale = 2)
    private BigDecimal totalPagado = BigDecimal.ZERO;

    @Column(name = "deuda_pendiente", precision = 10, scale = 2)
    private BigDecimal deudaPendiente = BigDecimal.ZERO;
}
