package com.hotel.apifds20261.dto.request;

import jakarta.validation.constraints.Future;
import jakarta.validation.constraints.NotNull;
import lombok.*;
import java.time.LocalDateTime;

@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
public class RequestHospedajeExtend {

    @NotNull(message = "La nueva fecha de salida es obligatoria")
    @Future(message = "La nueva fecha de salida debe ser posterior a hoy")
    private LocalDateTime nuevaFechaSalida;
}
