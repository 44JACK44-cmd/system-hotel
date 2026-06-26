package com.hotel.apifds20261.entity;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import com.hotel.apifds20261.staticdata.*;

@Entity
@Table(name = "reservas")
@Getter @Setter
@NoArgsConstructor
public class EntityReserva {

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
    @JoinColumn(name = "usuario_id", nullable = false)
    private EntityUsuario usuario;

    @Column(name = "fecha_entrada", nullable = false)
    private LocalDate fechaEntrada;

    @Column(name = "fecha_salida", nullable = false)
    private LocalDate fechaSalida;

    @Column(name = "fecha_reserva", nullable = false)
    private LocalDateTime fechaReserva;

    @Enumerated(EnumType.STRING)
    @Column(length = 20, nullable = false)
    private EstadoReserva estado = EstadoReserva.CONFIRMADA;

    @Column(name = "monto_total", precision = 10, scale = 2, nullable = false)
    private BigDecimal montoTotal;

    @Column(name = "monto_adelanto", precision = 10, scale = 2, nullable = false)
    private BigDecimal montoAdelanto;

    @Enumerated(EnumType.STRING)
    @Column(name = "metodo_adelanto", length = 20, nullable = false)
    private MetodoPago metodoAdelanto;

    @Column(name = "referencia_pago", length = 100)
    private String referenciaPago;

    @Column(length = 500)
    private String observacion;
}
