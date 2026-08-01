package com.hotel.apifds20261.dto.request;

import jakarta.validation.constraints.*;
import lombok.*;
import java.time.LocalDate;

@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
public class RequestReservaUpdate {
    @NotNull(message = "La habitacion es obligatoria")
    private Long habitacionId;

    @NotNull(message = "La fecha de entrada es obligatoria")
    @FutureOrPresent(message = "La fecha de entrada no puede estar en el pasado")
    private LocalDate fechaEntrada;

    @NotNull(message = "La fecha de salida es obligatoria")
    @Future(message = "La fecha de salida debe ser posterior a hoy")
    private LocalDate fechaSalida;

    @Size(max = 500, message = "La observación no puede exceder 500 caracteres")
    private String observacion;
}
