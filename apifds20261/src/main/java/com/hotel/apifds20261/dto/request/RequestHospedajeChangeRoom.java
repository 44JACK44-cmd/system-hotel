package com.hotel.apifds20261.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.*;

@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
public class RequestHospedajeChangeRoom {

    @NotNull(message = "La nueva habitacion es obligatoria")
    private Long nuevaHabitacionId;
}
