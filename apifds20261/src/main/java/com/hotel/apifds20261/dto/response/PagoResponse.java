package com.hotel.apifds20261.dto.response;

import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter @Setter
@NoArgsConstructor
public class PagoResponse {
    private Long id;
    private Long reservaId;
    private Long hospedajeId;
    private Long usuarioId;
    private String usuarioNombre;
    private BigDecimal monto;
    private String metodo;
    private String referencia;
    private String tipo;
    private LocalDateTime fechaPago;
    private String observacion;
}
