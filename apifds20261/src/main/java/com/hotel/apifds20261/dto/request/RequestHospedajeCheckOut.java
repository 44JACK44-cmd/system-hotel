package com.hotel.apifds20261.dto.request;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
public class RequestHospedajeCheckOut {
    private Long hospedajeId;

    @NotNull(message = "La fecha de salida real es obligatoria")
    private LocalDateTime fechaSalidaReal;

    @DecimalMin(value = "0.00", message = "El monto de extensión no puede ser negativo")
    @Digits(integer = 10, fraction = 2, message = "El monto debe tener como máximo 2 decimales")
    private BigDecimal montoExtension;

    @Pattern(regexp = "^(EFECTIVO|YAPE)$", message = "El método de pago debe ser EFECTIVO o YAPE")
    private String metodoExtension;

    @Size(max = 100, message = "La referencia no puede exceder 100 caracteres")
    private String referenciaExtension;

    @DecimalMin(value = "0.00", message = "El monto de pago no puede ser negativo")
    @Digits(integer = 10, fraction = 2, message = "El monto debe tener como máximo 2 decimales")
    private BigDecimal montoPago;

    @Pattern(regexp = "^(EFECTIVO|YAPE)$", message = "El método de pago debe ser EFECTIVO o YAPE")
    private String metodoPago;

    @Size(max = 100, message = "La referencia no puede exceder 100 caracteres")
    private String referencia;

    @Size(max = 500, message = "La observación no puede exceder 500 caracteres")
    private String observacion;
}
