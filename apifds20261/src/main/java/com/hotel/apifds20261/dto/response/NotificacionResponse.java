package com.hotel.apifds20261.dto.response;

import lombok.*;
import java.time.LocalDateTime;

@Getter @Setter
@NoArgsConstructor
public class NotificacionResponse {
    private Long id;
    private String titulo;
    private String mensaje;
    private String tipo;
    private String prioridad;
    private LocalDateTime fechaCreacion;
    private Boolean leida;
    private Long usuarioDestinoId;
    private String estado;
    private String entidadTipo;
    private Long entidadId;
}
