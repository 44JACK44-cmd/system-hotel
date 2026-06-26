package com.hotel.apifds20261.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "clientes")
@Getter @Setter
@NoArgsConstructor
public class EntityCliente {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "nombre_completo", length = 150, nullable = false)
    private String nombreCompleto;

    @Column(length = 20, nullable = false)
    private String telefono;

    @Column(length = 20)
    private String documento;

    @Column(length = 100)
    private String email;

    @Column(name = "created_at")
    private LocalDateTime createdAt = LocalDateTime.now();
}
