package com.hotel.apifds20261.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
public class RequestAuthLogin {
    @NotBlank(message = "El username es obligatorio")
    private String username;

    @NotBlank(message = "La contrasena es obligatoria")
    private String password;
}

