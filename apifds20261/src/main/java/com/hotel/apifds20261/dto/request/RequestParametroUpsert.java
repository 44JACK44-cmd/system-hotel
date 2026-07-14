package com.hotel.apifds20261.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
public class RequestParametroUpsert {

    @NotBlank(message = "La clave es obligatoria")
    private String clave;

    private String valor;

    private String descripcion;

    private String modulo;

    private Boolean editable;
}
