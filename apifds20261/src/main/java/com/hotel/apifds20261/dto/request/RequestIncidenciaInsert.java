package com.hotel.apifds20261.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;

@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
public class RequestIncidenciaInsert {
    @NotNull(message = "La habitacion es obligatoria")
    private Long habitacionId;

    @NotBlank(message = "El tipo es obligatorio")
    private String tipo;

    @NotBlank(message = "El motivo es obligatorio")
    private String motivo;
}

