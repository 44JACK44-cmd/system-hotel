package com.hotel.apifds20261.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "auditoria")
@Getter @Setter
@NoArgsConstructor
public class EntityAuditoria {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "usuario_id", nullable = false)
    private Long usuarioId;

    @Column(length = 255, nullable = false)
    private String accion;

    @Column(length = 100)
    private String modulo;

    @Column(columnDefinition = "TEXT")
    private String detalle;

    @Column(length = 50)
    private String ip;

    @Column(nullable = false)
    private LocalDateTime fecha = LocalDateTime.now();
}
