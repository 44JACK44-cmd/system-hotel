package com.hotel.apifds20261.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "parametros")
@Getter @Setter
@NoArgsConstructor
public class EntityParametro {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(length = 100, nullable = false, unique = true)
    private String clave;

    @Column(length = 1000)
    private String valor;

    @Column(length = 255)
    private String descripcion;

    @Column(length = 50)
    private String modulo;

    @Column(nullable = false)
    private Boolean editable = true;
}
