package com.hotel.apifds20261.controller;

import com.hotel.apifds20261.business.BusinessCaja;
import com.hotel.apifds20261.dto.request.RequestCajaAbrir;
import com.hotel.apifds20261.dto.request.RequestCajaCerrar;
import com.hotel.apifds20261.dto.response.CajaResponse;
import com.hotel.apifds20261.dto.response.ResponseCaja;
import com.hotel.apifds20261.exception.BusinessException;
import com.hotel.apifds20261.security.JwtService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/caja")
@RequiredArgsConstructor
public class CajaController {

    private final BusinessCaja cajaBusiness;
    private final JwtService jwtService;

    private Long validarToken(String authHeader) {
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            throw new BusinessException("Token no proporcionado o formato invalido");
        }
        String token = authHeader.substring(7);
        if (!jwtService.isTokenValid(token)) {
            throw new BusinessException("Token invalido o expirado");
        }
        return jwtService.getUserIdFromToken(token);
    }

    @GetMapping("actual")
    public ResponseEntity<ResponseCaja> actionActual(@RequestHeader("Authorization") String authHeader) {
        validarToken(authHeader);
        CajaResponse item = cajaBusiness.obtenerActual();
        ResponseCaja response = new ResponseCaja();
        response.success();
        if (item != null) {
            response.getListCaja().add(item);
        }
        return ResponseEntity.ok(response);
    }

    @GetMapping("historial")
    public ResponseEntity<ResponseCaja> actionHistorial(@RequestHeader("Authorization") String authHeader) {
        validarToken(authHeader);
        List<CajaResponse> list = cajaBusiness.historial();
        ResponseCaja response = new ResponseCaja();
        response.success();
        response.setListCaja(list);
        return ResponseEntity.ok(response);
    }

    @PostMapping("abrir")
    public ResponseEntity<ResponseCaja> actionAbrir(
            @RequestBody(required = false) RequestCajaAbrir request,
            @RequestHeader("Authorization") String authHeader) {
        Long usuarioId = validarToken(authHeader);
        CajaResponse item = cajaBusiness.abrir(usuarioId,
                request != null ? request.getMontoInicial() : null);
        ResponseCaja response = new ResponseCaja();
        response.success();
        response.getListCaja().add(item);
        response.listMessage.add("Caja abierta exitosamente");
        return ResponseEntity.ok(response);
    }

    @PostMapping("cerrar/{id}")
    public ResponseEntity<ResponseCaja> actionCerrar(
            @PathVariable Long id,
            @RequestBody(required = false) RequestCajaCerrar request,
            @RequestHeader("Authorization") String authHeader) {
        Long usuarioId = validarToken(authHeader);
        CajaResponse item = cajaBusiness.cerrar(id,
                request != null ? request.getMontoFisicoEfectivo() : null,
                request != null ? request.getObservacion() : null,
                usuarioId);
        ResponseCaja response = new ResponseCaja();
        response.success();
        response.getListCaja().add(item);
        response.listMessage.add("Caja cerrada exitosamente");
        return ResponseEntity.ok(response);
    }
}
