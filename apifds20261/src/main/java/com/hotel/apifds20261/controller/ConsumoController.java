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

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/consumo")
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

    @PutMapping("update/{id}")
    public ResponseEntity<ResponseConsumo> actionUpdate(
            @PathVariable Long id,
            @Valid @RequestBody RequestConsumoInsert request,
            @RequestHeader("Authorization") String authHeader) {
        String token = authHeader.substring(7);
        if (!jwtService.isTokenValid(token)) {
            throw new BusinessException("Token invalido o expirado");
        }
        Long usuarioId = jwtService.getUserIdFromToken(token);
        ConsumoResponse item = consumoBusiness.actualizar(id, request, usuarioId);
        ResponseConsumo response = new ResponseConsumo();
        response.success();
        response.getListConsumo().add(item);
        response.listMessage.add("Consumo actualizado exitosamente");
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("delete/{id}")
    public ResponseEntity<ResponseConsumo> actionDelete(
            @PathVariable Long id,
            @RequestHeader("Authorization") String authHeader) {
        String token = authHeader.substring(7);
        if (!jwtService.isTokenValid(token)) {
            throw new BusinessException("Token invalido o expirado");
        }
        consumoBusiness.eliminar(id);
        ResponseConsumo response = new ResponseConsumo();
        response.success();
        response.listMessage.add("Consumo eliminado exitosamente");
        return ResponseEntity.ok(response);
    }

    @GetMapping("total/{idHospedaje}")
    public ResponseEntity<ResponseConsumo> actionTotal(@PathVariable Long idHospedaje) {
        BigDecimal total = consumoBusiness.obtenerTotal(idHospedaje);
        ResponseConsumo response = new ResponseConsumo();
        response.success();
        response.listMessage.add(total.toString());
        response.listMessage.add("Total de consumos obtenido exitosamente");
        return ResponseEntity.ok(response);
    }
}
