package com.hotel.apifds20261.dto.response;

import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter @Setter
@NoArgsConstructor
public class ConsumoResponse {
    private Long id;
    private Long hospedajeId;
    private Long usuarioId;
    private String usuarioNombre;
    private String descripcion;
    private Integer cantidad;
    private BigDecimal precioUnitario;
    private BigDecimal subtotal;
    private LocalDateTime fechaRegistro;
}
