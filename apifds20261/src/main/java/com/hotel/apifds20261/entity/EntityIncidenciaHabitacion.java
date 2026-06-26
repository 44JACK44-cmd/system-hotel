package com.hotel.apifds20261.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
import com.hotel.apifds20261.staticdata.*;

@Entity
@Table(name = "incidencias_habitacion")
@Getter @Setter
@NoArgsConstructor
public class EntityIncidenciaHabitacion {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "habitacion_id", nullable = false)
    private EntityHabitacion habitacion;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "usuario_id", nullable = false)
    private EntityUsuario usuario;

    @Enumerated(EnumType.STRING)
    @Column(length = 20, nullable = false)
    private TipoIncidencia tipo;

    @Column(length = 500, nullable = false)
    private String motivo;

    @Column(name = "fecha_inicio", nullable = false)
    private LocalDateTime fechaInicio;

    @Column(name = "fecha_fin")
    private LocalDateTime fechaFin;
}
