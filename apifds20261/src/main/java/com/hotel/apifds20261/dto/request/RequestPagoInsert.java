package com.hotel.apifds20261.dto.request;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
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

    @Size(max = 100, message = "La referencia no puede exceder 100 caracteres")
    private String referencia;
    @Size(max = 500, message = "La observación no puede exceder 500 caracteres")
    private String observacion;
}

