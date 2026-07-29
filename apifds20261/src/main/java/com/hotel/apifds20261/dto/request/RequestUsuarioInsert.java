package com.hotel.apifds20261.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.*;

@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
public class RequestUsuarioInsert {
    @NotBlank(message = "El nombre es obligatorio")
    @Size(max = 150, message = "El nombre no puede exceder 150 caracteres")
    private String nombreCompleto;

    @NotBlank(message = "El username es obligatorio")
    @Size(max = 50, message = "El username no puede exceder 50 caracteres")
    private String username;

    @NotBlank(message = "La contrasena es obligatoria")
    @Size(min = 6, max = 100, message = "La contraseña debe tener entre 6 y 100 caracteres")
    private String password;

    @NotBlank(message = "El rol es obligatorio")
    private String rol;

    @Size(max = 100, message = "El email no puede exceder 100 caracteres")
    private String email;
    @Size(max = 20, message = "El teléfono no puede exceder 20 caracteres")
    private String telefono;
}

