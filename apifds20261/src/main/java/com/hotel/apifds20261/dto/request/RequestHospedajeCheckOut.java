package com.hotel.apifds20261.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
public class RequestHospedajeCheckOut {
    private Long hospedajeId;

    @NotNull(message = "La fecha de salida real es obligatoria")
    private LocalDateTime fechaSalidaReal;

    private BigDecimal montoExtension;
    private String metodoExtension;
    private String referenciaExtension;

    private BigDecimal montoPago;
    private String metodoPago;
    private String referencia;
}

