package com.hotel.apifds20261.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
public class RequestClienteInsert {
    @NotBlank(message = "El nombre es obligatorio")
    private String nombreCompleto;

    @NotBlank(message = "El telefono es obligatorio")
    private String telefono;

    private String documento;
    private String email;
}

