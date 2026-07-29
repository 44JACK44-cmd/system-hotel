package com.hotel.apifds20261.dto.response;

import com.hotel.apifds20261.dto.response.NotificacionResponse;
import lombok.*;
import java.util.List;

@Getter @Setter
@NoArgsConstructor
public class ResponseNotificacion {
    private String outcome = "success";
    private List<NotificacionResponse> listNotificacion;
    private NotificacionResponse notificacion;
    private Long pendientes;

    public void success() { this.outcome = "success"; }
}
