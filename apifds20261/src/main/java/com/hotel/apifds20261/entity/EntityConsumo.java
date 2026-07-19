package com.hotel.apifds20261.entity;

import com.hotel.apifds20261.staticdata.TipoConsumo;
import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "tconsumo")
@Getter @Setter
@NoArgsConstructor
public class EntityConsumo {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "id_consumo", length = 36, unique = true, nullable = false)
    private String idConsumo;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "hospedaje_id", nullable = false)
    private EntityHospedaje hospedaje;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "usuario_id", nullable = false)
    private EntityUsuario usuario;

    @Enumerated(EnumType.STRING)
    @Column(name = "tipo_consumo", length = 20, nullable = false)
    private TipoConsumo tipoConsumo = TipoConsumo.OTROS;

    @Column(length = 200, nullable = false)
    private String descripcion;

    @Column(nullable = false)
    private Integer cantidad;

    @Column(name = "precio_unitario", precision = 10, scale = 2, nullable = false)
    private BigDecimal precioUnitario;

    @Column(precision = 10, scale = 2, nullable = false)
    private BigDecimal subtotal;

    @Column(length = 500)
    private String observacion;

    @Column(name = "fecha_registro", nullable = false)
    private LocalDateTime fechaRegistro;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        if (idConsumo == null) {
            idConsumo = UUID.randomUUID().toString();
        }
        LocalDateTime now = LocalDateTime.now();
        if (createdAt == null) {
            createdAt = now;
        }
        if (updatedAt == null) {
            updatedAt = now;
        }
        if (fechaRegistro == null) {
            fechaRegistro = now;
        }
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
