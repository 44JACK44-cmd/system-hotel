package com.hotel.apifds20261.dto.request;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.*;
import java.math.BigDecimal;

@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
public class RequestPagoInsert {
    private Long reservaId;
    private Long hospedajeId;

    @NotNull(message = "El monto es obligatorio")
    @DecimalMin(value = "0.01", message = "El monto debe ser mayor a cero")
    @Digits(integer = 10, fraction = 2, message = "El monto debe tener como máximo 2 decimales")
    private BigDecimal monto;

    @NotBlank(message = "El metodo es obligatorio")
    @Pattern(regexp = "^(EFECTIVO|YAPE)$", message = "El método de pago debe ser EFECTIVO o YAPE")
    private String metodo;

    @NotBlank(message = "El tipo es obligatorio")
    @Pattern(regexp = "^(ADELANTO|SALDO|EXTENSION)$", message = "El tipo de pago no es válido")
    private String tipo;

    @Size(max = 100, message = "La referencia no puede exceder 100 caracteres")
    private String referencia;
    @Size(max = 500, message = "La observación no puede exceder 500 caracteres")
    private String observacion;
}
