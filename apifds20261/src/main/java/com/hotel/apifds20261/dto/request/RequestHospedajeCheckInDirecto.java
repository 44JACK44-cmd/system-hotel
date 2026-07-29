package com.hotel.apifds20261.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.*;
import java.math.BigDecimal;

@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
public class RequestHospedajeCheckInDirecto {
    @NotNull(message = "El cliente es obligatorio")
    private Long clienteId;

    @NotNull(message = "La habitacion es obligatoria")
    private Long habitacionId;

    private Integer noches;

    @NotNull(message = "El monto pagado es obligatorio")
    private BigDecimal montoPago;

    @NotNull(message = "El metodo de pago es obligatorio")
    private String metodo;

    private String referencia;
}

