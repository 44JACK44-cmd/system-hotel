package com.hotel.apifds20261.dto.request;

import jakarta.validation.constraints.*;
import lombok.*;
import java.math.BigDecimal;

@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
public class RequestHabitacionInsert {
    @NotNull(message = "El piso es obligatorio")
    private Integer piso;

    @NotBlank(message = "El numero es obligatorio")
    private String numero;

    @NotBlank(message = "El tipo es obligatorio")
    private String tipo;

    @NotNull(message = "El precio es obligatorio")
    @DecimalMin(value = "0.01", message = "El precio debe ser mayor a 0")
    private BigDecimal precioNoche;
}

