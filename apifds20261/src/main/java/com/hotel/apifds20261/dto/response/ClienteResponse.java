package com.hotel.apifds20261.dto.response;

import lombok.*;
import java.time.LocalDateTime;

@Getter @Setter
@NoArgsConstructor
public class ClienteResponse {
    private Long id;
    private String nombreCompleto;
    private String telefono;
    private String documento;
    private String email;
    private LocalDateTime createdAt;
}
