package com.hotel.apifds20261.dto.request;

import jakarta.validation.constraints.*;
import lombok.*;
import java.math.BigDecimal;

@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
public class RequestEgresoInsert {

    @NotBlank(message = "El concepto es obligatorio")
    private String concepto;

    @NotBlank(message = "La categoria es obligatoria")
    private String categoria;

    @NotNull(message = "El monto es obligatorio")
    @DecimalMin(value = "0.01", message = "El monto debe ser mayor a cero")
    private BigDecimal monto;

    private String observacion;
}
