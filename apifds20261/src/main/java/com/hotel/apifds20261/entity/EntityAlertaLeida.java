package com.hotel.apifds20261.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "alertas_leidas", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"usuario_id", "grupo_id"})
})
@Getter @Setter
@NoArgsConstructor
public class EntityAlertaLeida {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "usuario_id", nullable = false)
    private Long usuarioId;

    @Column(name = "grupo_id", length = 100, nullable = false)
    private String grupoId;

    @Column(name = "fecha_lectura", nullable = false)
    private LocalDateTime fechaLectura = LocalDateTime.now();
}
