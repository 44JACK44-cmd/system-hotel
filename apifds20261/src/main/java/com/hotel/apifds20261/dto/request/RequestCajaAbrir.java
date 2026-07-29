package com.hotel.apifds20261.dto.request;

import jakarta.validation.constraints.PositiveOrZero;
import lombok.*;
import java.math.BigDecimal;

@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
public class RequestCajaAbrir {
    @PositiveOrZero(message = "El monto inicial no puede ser negativo")
    private BigDecimal montoInicial;
}
