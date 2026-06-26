package com.hotel.apifds20261.dto.response;

import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter @Setter
@NoArgsConstructor
public class HospedajeResponse {
    private Long id;
    private Long clienteId;
    private String clienteNombre;
    private String clienteTelefono;
    private Long habitacionId;
    private String habitacionNumero;
    private String habitacionTipo;
    private Integer habitacionPiso;
    private BigDecimal habitacionPrecio;
    private Long reservaId;
    private Long usuarioId;
    private String usuarioNombre;
    private LocalDateTime fechaIngreso;
    private LocalDateTime fechaSalidaProgramada;
    private LocalDateTime fechaSalidaReal;
    private String estado;
    private BigDecimal totalPagado;
    private BigDecimal deudaPendiente;
}
