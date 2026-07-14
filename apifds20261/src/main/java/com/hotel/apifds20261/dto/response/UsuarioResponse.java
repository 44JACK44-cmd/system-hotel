package com.hotel.apifds20261.dto.response;

import lombok.*;
import java.time.LocalDateTime;

@Getter @Setter
@NoArgsConstructor
public class UsuarioResponse {
    private Long id;
    private String nombreCompleto;
    private String username;
    private String rol;
    private boolean activo;
    private LocalDateTime createdAt;
    private LocalDateTime ultimoAcceso;
}
