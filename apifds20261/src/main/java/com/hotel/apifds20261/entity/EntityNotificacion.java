package com.hotel.apifds20261.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
import com.hotel.apifds20261.staticdata.*;

@Entity
@Table(name = "notificaciones")
@Getter @Setter
@NoArgsConstructor
public class EntityNotificacion {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(length = 200, nullable = false)
    private String titulo;

    @Column(length = 1000)
    private String mensaje;

    @Column(length = 50)
    private String tipo;

    @Column(length = 20)
    private String prioridad = "MEDIA";

    @Column(name = "fecha_creacion", nullable = false)
    private LocalDateTime fechaCreacion = LocalDateTime.now();

    @Column(nullable = false)
    private Boolean leida = false;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "usuario_destino_id")
    private EntityUsuario usuarioDestino;

    @Column(length = 30, nullable = false)
    private String estado = "PENDIENTE";

    @Column(name = "entidad_tipo", length = 50)
    private String entidadTipo;

    @Column(name = "entidad_id")
    private Long entidadId;
}
