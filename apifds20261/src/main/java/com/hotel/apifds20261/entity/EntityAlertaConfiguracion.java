package com.hotel.apifds20261.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "alertas_configuracion")
@Getter @Setter
@NoArgsConstructor
public class EntityAlertaConfiguracion {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "usuario_id", nullable = false, unique = true)
    private Long usuarioId;

    @Column(name = "sonido_activado", nullable = false)
    private Boolean sonidoActivado = true;

    @Column(name = "tiempo_actualizacion", nullable = false)
    private Integer tiempoActualizacionSegundos = 60;

    @Column(name = "emergentes_activadas", nullable = false)
    private Boolean emergentesActivadas = true;

    @Column(name = "duracion_informativas_horas", nullable = false)
    private Integer duracionInformativasHoras = 24;
}
