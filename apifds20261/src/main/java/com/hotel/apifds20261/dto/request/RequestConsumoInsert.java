package com.hotel.apifds20261.dto.request;

import jakarta.validation.constraints.*;
import lombok.*;
import java.math.BigDecimal;

@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
public class RequestConsumoInsert {

    @NotNull(message = "El hospedaje es obligatorio")
    private Long hospedajeId;

    @NotBlank(message = "El tipo de consumo es obligatorio")
    private String tipoConsumo;

    @NotBlank(message = "La descripcion es obligatoria")
    @Size(max = 200, message = "La descripción no puede exceder 200 caracteres")
    private String descripcion;

    @NotNull(message = "La cantidad es obligatoria")
    @Min(value = 1, message = "La cantidad debe ser mayor a cero")
    @Max(value = 9999, message = "La cantidad no puede superar 9999")
    private Integer cantidad;

    @NotNull(message = "El precio unitario es obligatorio")
    @DecimalMin(value = "0.01", message = "El precio unitario debe ser mayor a cero")
    @Digits(integer = 8, fraction = 2, message = "El precio debe tener como máximo 2 decimales")
    private BigDecimal precioUnitario;

    @Size(max = 500, message = "La observación no puede exceder 500 caracteres")
    private String observacion;
}
