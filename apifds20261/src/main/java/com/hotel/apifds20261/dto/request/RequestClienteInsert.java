package com.hotel.apifds20261.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.*;

@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
public class RequestClienteInsert {
    @NotBlank(message = "El nombre es obligatorio")
    @Size(max = 150, message = "El nombre no puede exceder 150 caracteres")
    private String nombreCompleto;

    @NotBlank(message = "El telefono es obligatorio")
    @Pattern(regexp = "^\\+?[0-9]{7,15}$", message = "Teléfono inválido. Ej: +51987654321")
    private String telefono;

    @Size(max = 20, message = "El documento no puede exceder 20 caracteres")
    private String documento;
    @Size(max = 100, message = "El email no puede exceder 100 caracteres")
    private String email;
}
