package com.hotel.apifds20261.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.*;

@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
public class RequestClienteInsert {

    @NotBlank(message = "El nombre es obligatorio")
    @Size(min = 2, max = 60, message = "El nombre debe tener entre 2 y 60 caracteres")
    @Pattern(
            regexp = "^[A-Za-zÁÉÍÓÚÜáéíóúüÑñ]+(?:\\s[A-Za-zÁÉÍÓÚÜáéíóúüÑñ]+)*$",
            message = "El nombre solo puede contener letras (incluye tildes y Ñ) con un espacio simple entre palabras. Sin números, símbolos ni espacios dobles."
    )
    private String nombreCompleto;

    private String tipoDocumento;

    @Size(max = 20, message = "El documento no puede exceder 20 caracteres")
    private String documento;

    @NotBlank(message = "El telefono es obligatorio")
    @Pattern(regexp = "^\\d{6,12}$", message = "El teléfono debe contener solo números (6 a 12 dígitos)")
    private String telefono;

    @Pattern(regexp = "^\\+?[0-9]{1,4}$", message = "El código de país no es válido")
    private String codigoPais;

    @Size(max = 100, message = "El email no puede exceder 100 caracteres")
    @Email(message = "El correo electrónico no tiene un formato válido")
    private String email;
}
