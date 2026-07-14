package com.hotel.apifds20261.dto.request;

import lombok.*;
import java.math.BigDecimal;

@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
public class RequestCajaAbrir {
    private BigDecimal montoInicial;
}
