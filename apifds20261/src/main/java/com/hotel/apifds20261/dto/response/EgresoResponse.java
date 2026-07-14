package com.hotel.apifds20261.dto.response;

import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter @Setter
@NoArgsConstructor
public class EgresoResponse {
    private Long id;
    private Long usuarioId;
    private String usuarioNombre;
    private String concepto;
    private String categoria;
    private BigDecimal monto;
    private LocalDateTime fechaRegistro;
    private String observacion;
}
