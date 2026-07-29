package com.hotel.apifds20261.entity;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "caja")
@Getter @Setter
@NoArgsConstructor
public class EntityCaja {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "usuario_id", nullable = false)
    private EntityUsuario usuario;

    @Column(name = "fecha_apertura", nullable = false)
    private LocalDateTime fechaApertura;

    @Column(name = "fecha_cierre")
    private LocalDateTime fechaCierre;

    @Column(name = "monto_inicial", precision = 10, scale = 2)
    private BigDecimal montoInicial = BigDecimal.ZERO;

    @Column(name = "total_ingresos", precision = 10, scale = 2)
    private BigDecimal totalIngresos = BigDecimal.ZERO;

    @Column(name = "total_egresos", precision = 10, scale = 2)
    private BigDecimal totalEgresos = BigDecimal.ZERO;

    @Column(name = "balance_final", precision = 10, scale = 2)
    private BigDecimal balanceFinal = BigDecimal.ZERO;

    @Column(length = 20, nullable = false)
    private String estado = "ABIERTO";

    @Column(length = 500)
    private String observacion;
}
