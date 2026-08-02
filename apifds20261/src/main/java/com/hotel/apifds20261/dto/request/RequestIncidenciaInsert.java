package com.hotel.apifds20261.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.*;

@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
public class RequestIncidenciaInsert {
    @NotNull(message = "La habitacion es obligatoria")
    private Long habitacionId;

    @NotBlank(message = "El tipo es obligatorio")
    @Pattern(regexp = "^(LIMPIEZA_CHECKOUT|LIMPIEZA|SERVICIO_LIMPIEZA_HUESPED|MANTENIMIENTO)$",
            message = "El tipo de incidencia no es válido")
    private String tipo;

    @NotBlank(message = "El motivo es obligatorio")
    @Size(min = 5, max = 300, message = "El motivo debe tener entre 5 y 300 caracteres")
    @Pattern(regexp = ".*\\S.*", message = "El motivo no puede contener solo espacios")
    private String motivo;

    // Foto / evidencia en formato data-URI base64 (imagen). Opcional.
    private String foto;
}
