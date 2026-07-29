package com.hotel.apifds20261.controller;

import com.hotel.apifds20261.business.BusinessNotificacion;
import com.hotel.apifds20261.dto.response.ResponseNotificacion;
import com.hotel.apifds20261.security.JwtService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/notificacion")
@RequiredArgsConstructor
public class NotificacionController {

    private final BusinessNotificacion notificacionBusiness;
    private final JwtService jwtService;

    private Long obtenerUsuarioId(HttpServletRequest request) {
        String auth = request.getHeader("Authorization");
        if (auth != null && auth.startsWith("Bearer ")) {
            String token = auth.substring(7);
            return jwtService.getUserIdFromToken(token);
        }
        return null;
    }

    @GetMapping("/pendientes")
    public ResponseEntity<ResponseNotificacion> listarPendientes(HttpServletRequest request) {
        Long usuarioId = obtenerUsuarioId(request);
        if (usuarioId == null) return ResponseEntity.status(401).body(new ResponseNotificacion());
        ResponseNotificacion res = new ResponseNotificacion();
        res.success();
        res.setListNotificacion(notificacionBusiness.listarPendientes(usuarioId));
        return ResponseEntity.ok(res);
    }

    @GetMapping("/todas")
    public ResponseEntity<ResponseNotificacion> listarTodas(HttpServletRequest request) {
        Long usuarioId = obtenerUsuarioId(request);
        if (usuarioId == null) return ResponseEntity.status(401).body(new ResponseNotificacion());
        ResponseNotificacion res = new ResponseNotificacion();
        res.success();
        res.setListNotificacion(notificacionBusiness.listarPorUsuario(usuarioId));
        return ResponseEntity.ok(res);
    }

    @GetMapping("/contar")
    public ResponseEntity<ResponseNotificacion> contarPendientes(HttpServletRequest request) {
        Long usuarioId = obtenerUsuarioId(request);
        if (usuarioId == null) return ResponseEntity.status(401).body(new ResponseNotificacion());
        ResponseNotificacion res = new ResponseNotificacion();
        res.success();
        res.setPendientes(notificacionBusiness.contarPendientes(usuarioId));
        return ResponseEntity.ok(res);
    }

    @PostMapping("/marcarleida/{id}")
    public ResponseEntity<ResponseNotificacion> marcarLeida(@PathVariable Long id) {
        ResponseNotificacion res = new ResponseNotificacion();
        res.success();
        res.setNotificacion(notificacionBusiness.marcarLeida(id));
        return ResponseEntity.ok(res);
    }

    @PostMapping("/marcartodasleidas")
    public ResponseEntity<ResponseNotificacion> marcarTodasLeidas(HttpServletRequest request) {
        Long usuarioId = obtenerUsuarioId(request);
        if (usuarioId == null) return ResponseEntity.status(401).body(new ResponseNotificacion());
        notificacionBusiness.marcarTodasLeidas(usuarioId);
        ResponseNotificacion res = new ResponseNotificacion();
        res.success();
        return ResponseEntity.ok(res);
    }
}
