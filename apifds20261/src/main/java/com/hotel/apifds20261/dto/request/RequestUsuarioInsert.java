package com.hotel.apifds20261.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.*;

@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
public class RequestUsuarioInsert {

    @NotBlank(message = "El nombre es obligatorio")
    @Size(min = 2, max = 60, message = "El nombre debe tener entre 2 y 60 caracteres")
    @Pattern(
            regexp = "^[A-Za-zÁÉÍÓÚÜáéíóúüÑñ]+(?:\\s[A-Za-zÁÉÍÓÚÜáéíóúüÑñ]+)*$",
            message = "El nombre solo puede contener letras (incluye tildes y Ñ) con un espacio simple entre palabras."
    )
    private String nombreCompleto;

    @NotBlank(message = "El username es obligatorio")
    @Pattern(regexp = "^[A-Za-z0-9._-]{4,30}$",
            message = "El username debe tener entre 4 y 30 caracteres (letras, números, punto, guión o guión bajo) sin espacios")
    private String username;

    @NotBlank(message = "La contrasena es obligatoria")
    @Pattern(regexp = "^(?=.*[A-Z])(?=.*[a-z])(?=.*\\d)(?=.*[^A-Za-z0-9]).{8,100}$",
            message = "La contraseña debe tener al menos 8 caracteres e incluir una mayúscula, una minúscula, un número y un carácter especial")
    private String password;

    @NotBlank(message = "El rol es obligatorio")
    private String rol;

    @Size(max = 100, message = "El email no puede exceder 100 caracteres")
    @Email(message = "El correo electrónico no tiene un formato válido")
    private String email;

    @Pattern(regexp = "^\\d{6,12}$", message = "El teléfono debe contener solo números (6 a 12 dígitos)")
    private String telefono;
}
