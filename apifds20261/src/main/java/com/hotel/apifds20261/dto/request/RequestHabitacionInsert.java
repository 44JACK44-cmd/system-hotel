package com.hotel.apifds20261.dto.request;

import jakarta.validation.constraints.*;
import lombok.*;
import java.math.BigDecimal;

@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
public class RequestHabitacionInsert {
    @NotNull(message = "El piso es obligatorio")
    @Min(value = 1, message = "El piso debe ser mayor a cero")
    @Max(value = 99, message = "El piso no puede superar 99")
    private Integer piso;

    @NotBlank(message = "El numero es obligatorio")
    @Pattern(regexp = "^\\d{1,4}$", message = "El número de habitación debe contener de 1 a 4 dígitos numéricos")
    private String numero;

    @NotBlank(message = "El tipo es obligatorio")
    private String tipo;

    @NotNull(message = "El precio es obligatorio")
    @DecimalMin(value = "0.01", message = "El precio debe ser mayor a 0")
    @Digits(integer = 8, fraction = 2, message = "El precio debe tener como máximo 2 decimales")
    private BigDecimal precioNoche;
}
