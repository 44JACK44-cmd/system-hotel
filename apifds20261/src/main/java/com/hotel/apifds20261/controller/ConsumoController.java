package com.hotel.apifds20261.controller;

import com.hotel.apifds20261.business.BusinessConsumo;
import com.hotel.apifds20261.dto.request.RequestConsumoInsert;
import com.hotel.apifds20261.dto.response.ConsumoResponse;
import com.hotel.apifds20261.dto.response.ResponseConsumo;
import com.hotel.apifds20261.exception.BusinessException;
import com.hotel.apifds20261.security.JwtService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("consumo")
@RequiredArgsConstructor
public class ConsumoController {

    private final BusinessConsumo consumoBusiness;
    private final JwtService jwtService;

    @GetMapping("getbyhospedaje/{hospedajeId}")
    public ResponseEntity<ResponseConsumo> actionGetByHospedaje(@PathVariable Long hospedajeId) {
        List<ConsumoResponse> list = consumoBusiness.listarPorHospedaje(hospedajeId);
        ResponseConsumo response = new ResponseConsumo();
        response.success();
        response.setListConsumo(list);
        return ResponseEntity.ok(response);
    }

    @PostMapping("insert")
    public ResponseEntity<ResponseConsumo> actionInsert(
            @Valid @RequestBody RequestConsumoInsert request,
            @RequestHeader("Authorization") String authHeader) {
        String token = authHeader.substring(7);
        if (!jwtService.isTokenValid(token)) {
            throw new BusinessException("Token invalido o expirado");
        }
        Long usuarioId = jwtService.getUserIdFromToken(token);
        ConsumoResponse item = consumoBusiness.registrar(request, usuarioId);
        ResponseConsumo response = new ResponseConsumo();
        response.success();
        response.getListConsumo().add(item);
        response.listMessage.add("Consumo registrado exitosamente");
        return ResponseEntity.ok(response);
    }
}
