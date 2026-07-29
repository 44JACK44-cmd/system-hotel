package com.hotel.apifds20261.dto.response;

import lombok.*;
import java.time.LocalDateTime;

@Getter @Setter
@NoArgsConstructor
public class AuditoriaResponse {
    private Long id;
    private Long usuarioId;
    private String nombreUsuario;
    private String accion;
    private String modulo;
    private String detalle;
    private String ip;
    private LocalDateTime fecha;
}
