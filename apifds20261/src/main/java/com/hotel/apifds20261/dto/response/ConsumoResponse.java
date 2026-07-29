package com.hotel.apifds20261.dto.response;

import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter @Setter
@NoArgsConstructor
public class ConsumoResponse {
    private Long id;
    private String idConsumo;
    private Long hospedajeId;
    private Long usuarioId;
    private String usuarioNombre;
    private String tipoConsumo;
    private String descripcion;
    private Integer cantidad;
    private BigDecimal precioUnitario;
    private BigDecimal subtotal;
    private String observacion;
    private LocalDateTime fechaRegistro;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
