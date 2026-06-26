package com.hotel.apifds20261.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
public class RequestHabitacionCambioEstado {
    @NotBlank(message = "El estado es obligatorio")
    private String estado;
}

