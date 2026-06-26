package com.hotel.apifds20261.dto.response;

import lombok.*;
import java.math.BigDecimal;

@Getter @Setter
@NoArgsConstructor
public class HabitacionResponse {
    private Long id;
    private Integer piso;
    private String numero;
    private String tipo;
    private BigDecimal precioNoche;
    private String estado;
    private boolean activo;
}
