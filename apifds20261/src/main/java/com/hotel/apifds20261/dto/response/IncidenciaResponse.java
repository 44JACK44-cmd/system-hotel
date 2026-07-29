package com.hotel.apifds20261.dto.response;

import lombok.*;
import java.time.LocalDateTime;

@Getter @Setter
@NoArgsConstructor
public class IncidenciaResponse {
    private Long id;
    private Long habitacionId;
    private String habitacionNumero;
    private Integer habitacionPiso;
    private Long usuarioId;
    private String usuarioNombre;
    private String tipo;
    private String motivo;
    private LocalDateTime fechaInicio;
    private LocalDateTime fechaFin;
    private String estado;
}
