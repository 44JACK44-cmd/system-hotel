package com.hotel.apifds20261.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.*;

@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
public class RequestAuthLogin {
    @NotBlank(message = "El username es obligatorio")
    @Size(max = 50, message = "El username no puede exceder 50 caracteres")
    private String username;

    @NotBlank(message = "La contrasena es obligatoria")
    @Size(max = 100, message = "La contraseña no puede exceder 100 caracteres")
    private String password;
}

