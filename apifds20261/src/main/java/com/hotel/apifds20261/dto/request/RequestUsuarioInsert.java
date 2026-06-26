package com.hotel.apifds20261.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;

@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
public class RequestUsuarioInsert {
    @NotBlank(message = "El nombre es obligatorio")
    private String nombreCompleto;

    @NotBlank(message = "El username es obligatorio")
    private String username;

    @NotBlank(message = "La contrasena es obligatoria")
    private String password;

    @NotBlank(message = "El rol es obligatorio")
    private String rol;
}

