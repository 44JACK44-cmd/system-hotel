package com.hotel.apifds20261.dto.response;

import lombok.*;

@Getter @Setter
@NoArgsConstructor
public class ParametroResponse {
    private Long id;
    private String clave;
    private String valor;
    private String descripcion;
    private String modulo;
    private Boolean editable;
}
