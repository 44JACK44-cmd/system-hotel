package com.hotel.apifds20261.dto.response;

import lombok.*;

@Getter @Setter
@NoArgsConstructor
public class LoginResponse {
    private String token;
    private String tipo;
    private String username;
    private String nombreCompleto;
    private String rol;
    private Long userId;
}
