package com.hotel.apifds20261.dto.response;

import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Getter @Setter
@NoArgsConstructor
public class ReservaResponse {
    private Long id;
    private Long clienteId;
    private String clienteNombre;
    private String clienteTelefono;
    private Long habitacionId;
    private String habitacionNumero;
    private String habitacionTipo;
    private BigDecimal habitacionPrecio;
    private Long usuarioId;
    private String usuarioNombre;
    private LocalDate fechaEntrada;
    private LocalDate fechaSalida;
    private LocalDateTime fechaReserva;
    private String estado;
    private BigDecimal montoTotal;
    private BigDecimal montoAdelanto;
    private String metodoAdelanto;
    private String referenciaPago;
    private String observacion;
}
