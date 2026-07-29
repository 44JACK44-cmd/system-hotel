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
    private LocalDate fechaEntrada;

    @NotNull(message = "La fecha de salida es obligatoria")
    private LocalDate fechaSalida;

    @NotNull(message = "El monto de adelanto es obligatorio")
    @DecimalMin(value = "0.01", message = "El adelanto debe ser mayor a 0")
    private BigDecimal montoAdelanto;

    @NotBlank(message = "El metodo de adelanto es obligatorio")
    private String metodoAdelanto;

    @Size(max = 100, message = "La referencia no puede exceder 100 caracteres")
    private String referenciaPago;
    @Size(max = 500, message = "La observación no puede exceder 500 caracteres")
    private String observacion;
}

