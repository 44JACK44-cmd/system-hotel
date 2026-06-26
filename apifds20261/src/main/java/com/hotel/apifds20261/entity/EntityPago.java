package com.hotel.apifds20261.entity;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import com.hotel.apifds20261.staticdata.*;

@Entity
@Table(name = "pagos")
@Getter @Setter
@NoArgsConstructor
public class EntityPago {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reserva_id")
    private EntityReserva reserva;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "hospedaje_id")
    private EntityHospedaje hospedaje;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "usuario_id", nullable = false)
    private EntityUsuario usuario;

    @Column(precision = 10, scale = 2, nullable = false)
    private BigDecimal monto;

    @Enumerated(EnumType.STRING)
    @Column(length = 20, nullable = false)
    private MetodoPago metodo;

    @Column(length = 100)
    private String referencia;

    @Enumerated(EnumType.STRING)
    @Column(length = 20, nullable = false)
    private TipoPago tipo;

    @Column(name = "fecha_pago", nullable = false)
    private LocalDateTime fechaPago;

    @Column(length = 500)
    private String observacion;
}
