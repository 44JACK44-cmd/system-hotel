package com.hotel.apifds20261.dto.response;

import lombok.*;
import java.time.LocalDateTime;

@Getter @Setter
@NoArgsConstructor
public class UsuarioResponse {
    private Long id;
    private String nombreCompleto;
    private String username;
    private String email;
    private String telefono;
    private String fotoPerfil;
    private String rol;
    private boolean activo;
    private String tema;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private Long createdBy;
    private Long updatedBy;
    private LocalDateTime ultimoAcceso;
}
