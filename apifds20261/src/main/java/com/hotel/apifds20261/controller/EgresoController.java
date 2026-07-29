package com.hotel.apifds20261.controller;

import com.hotel.apifds20261.business.BusinessEgreso;
import com.hotel.apifds20261.dto.request.RequestEgresoInsert;
import com.hotel.apifds20261.dto.response.EgresoResponse;
import com.hotel.apifds20261.dto.response.ResponseEgreso;
import com.hotel.apifds20261.exception.BusinessException;
import com.hotel.apifds20261.security.JwtService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/egreso")
@RequiredArgsConstructor
public class EgresoController {

    private final BusinessEgreso egresoBusiness;
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

    @GetMapping("getall")
    public ResponseEntity<ResponseEgreso> actionGetAll() {
        List<EgresoResponse> list = egresoBusiness.listarTodos();
        ResponseEgreso response = new ResponseEgreso();
        response.success();
        response.setListEgreso(list);
        return ResponseEntity.ok(response);
    }

    @PostMapping("insert")
    public ResponseEntity<ResponseEgreso> actionInsert(
            @Valid @RequestBody RequestEgresoInsert request,
            @RequestHeader("Authorization") String authHeader) {
        Long usuarioId = validarToken(authHeader);
        EgresoResponse item = egresoBusiness.registrar(request, usuarioId);
        ResponseEgreso response = new ResponseEgreso();
        response.success();
        response.getListEgreso().add(item);
        response.listMessage.add("Egreso registrado exitosamente");
        return ResponseEntity.ok(response);
    }
}
