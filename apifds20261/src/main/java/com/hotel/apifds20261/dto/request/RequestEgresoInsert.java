package com.hotel.apifds20261.dto.request;

import jakarta.validation.constraints.*;
import lombok.*;
import java.math.BigDecimal;

@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
public class RequestEgresoInsert {

    @NotBlank(message = "El concepto es obligatorio")
    @Size(max = 200, message = "El concepto no puede exceder 200 caracteres")
    private String concepto;

    @NotBlank(message = "La categoria es obligatoria")
    @Size(max = 50, message = "La categoría no puede exceder 50 caracteres")
    private String categoria;

    @NotNull(message = "El monto es obligatorio")
    @DecimalMin(value = "0.01", message = "El monto debe ser mayor a cero")
    private BigDecimal monto;

    @Size(max = 500, message = "La observación no puede exceder 500 caracteres")
    private String observacion;
}
