package com.hotel.apifds20261.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.*;
import java.math.BigDecimal;

@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
public class RequestHospedajeCheckIn {
    @NotNull(message = "La reserva es obligatoria")
    private Long reservaId;

    private BigDecimal montoSaldo;
    private String metodoSaldo;
    private String referencia;
}

