package com.hotel.apifds20261.dto.request;

import jakarta.validation.constraints.*;
import lombok.*;
import java.math.BigDecimal;

@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
public class RequestHospedajeCheckInDirecto {
    @NotNull(message = "El cliente es obligatorio")
    private Long clienteId;

    @NotNull(message = "La habitacion es obligatoria")
    private Long habitacionId;

    @NotNull(message = "La cantidad de noches es obligatoria")
    @Min(value = 1, message = "La cantidad de noches debe ser al menos 1")
    @Max(value = 30, message = "El número máximo permitido de noches es 30")
    private Integer noches;

    @NotNull(message = "El monto pagado es obligatorio")
    @DecimalMin(value = "0.00", message = "El monto pagado no puede ser negativo")
    @Digits(integer = 10, fraction = 2, message = "El monto debe tener como máximo 2 decimales")
    private BigDecimal montoPago;

    @NotBlank(message = "El metodo de pago es obligatorio")
    @Pattern(regexp = "^(EFECTIVO|YAPE)$", message = "El método de pago debe ser EFECTIVO o YAPE")
    private String metodo;

    @Size(max = 100, message = "La referencia no puede exceder 100 caracteres")
    private String referencia;
}
