package com.hotel.apifds20261.dto.request;

import jakarta.validation.constraints.*;
import lombok.*;
import java.math.BigDecimal;

@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
public class RequestHospedajeCheckIn {
    @NotNull(message = "La reserva es obligatoria")
    private Long reservaId;

    @DecimalMin(value = "0.00", message = "El monto de saldo no puede ser negativo")
    @Digits(integer = 10, fraction = 2, message = "El monto debe tener como máximo 2 decimales")
    private BigDecimal montoSaldo;

    @Pattern(regexp = "^(EFECTIVO|YAPE)$", message = "El método de pago debe ser EFECTIVO o YAPE")
    private String metodoSaldo;

    @Size(max = 100, message = "La referencia no puede exceder 100 caracteres")
    private String referencia;
}
