package com.hotel.apifds20261.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.*;
import java.math.BigDecimal;

@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
public class RequestPagoInsert {
    private Long reservaId;
    private Long hospedajeId;

    @NotNull(message = "El monto es obligatorio")
    private BigDecimal monto;

    @NotNull(message = "El metodo es obligatorio")
    private String metodo;

    @NotNull(message = "El tipo es obligatorio")
    private String tipo;

    private String referencia;
    private String observacion;
}

