package com.hotel.apifds20261.dto.request;

import jakarta.validation.constraints.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDate;

@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
public class RequestReservaInsert {
    @NotNull(message = "El cliente es obligatorio")
    private Long clienteId;

    @NotNull(message = "La habitacion es obligatoria")
    private Long habitacionId;

    @NotNull(message = "La fecha de entrada es obligatoria")
    @FutureOrPresent(message = "La fecha de entrada no puede estar en el pasado")
    private LocalDate fechaEntrada;

    @NotNull(message = "La fecha de salida es obligatoria")
    @Future(message = "La fecha de salida debe ser posterior a hoy")
    private LocalDate fechaSalida;

    @NotNull(message = "El monto de adelanto es obligatorio")
    @DecimalMin(value = "0.01", message = "El adelanto debe ser mayor a 0")
    @Digits(integer = 10, fraction = 2, message = "El adelanto debe tener como máximo 2 decimales")
    private BigDecimal montoAdelanto;

    @NotBlank(message = "El metodo de adelanto es obligatorio")
    @Pattern(regexp = "^(EFECTIVO|YAPE)$", message = "El método de pago debe ser EFECTIVO o YAPE")
    private String metodoAdelanto;

    @Size(max = 100, message = "La referencia no puede exceder 100 caracteres")
    private String referenciaPago;
    @Size(max = 500, message = "La observación no puede exceder 500 caracteres")
    private String observacion;
}
