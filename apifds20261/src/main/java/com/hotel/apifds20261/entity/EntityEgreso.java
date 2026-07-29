package com.hotel.apifds20261.entity;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "egresos")
@Getter @Setter
@NoArgsConstructor
public class EntityEgreso {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "usuario_id", nullable = false)
    private EntityUsuario usuario;

    @Column(length = 200, nullable = false)
    private String concepto;

    @Column(length = 50, nullable = false)
    private String categoria;

    @Column(precision = 10, scale = 2, nullable = false)
    private BigDecimal monto;

    @Column(name = "fecha_registro", nullable = false)
    private LocalDateTime fechaRegistro;

    @Column(length = 500)
    private String observacion;
}
