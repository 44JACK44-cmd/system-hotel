package com.hotel.apifds20261.entity;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import com.hotel.apifds20261.staticdata.*;

@Entity
@Table(name = "habitaciones")
@Getter @Setter
@NoArgsConstructor
public class EntityHabitacion {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Integer piso;

    @Column(length = 10, nullable = false, unique = true)
    private String numero;

    @Enumerated(EnumType.STRING)
    @Column(length = 20, nullable = false)
    private TipoHabitacion tipo;

    @Column(name = "precio_noche", precision = 10, scale = 2, nullable = false)
    private BigDecimal precioNoche;

    @Enumerated(EnumType.STRING)
    @Column(length = 20, nullable = false)
    private EstadoHabitacion estado = EstadoHabitacion.DISPONIBLE;

    @Column(nullable = false)
    private Boolean activo = true;
}
