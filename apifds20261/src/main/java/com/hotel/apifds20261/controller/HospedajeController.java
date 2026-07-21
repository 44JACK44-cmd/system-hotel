package com.hotel.apifds20261.controller;

import com.hotel.apifds20261.business.BusinessHospedaje;
import com.hotel.apifds20261.dto.request.RequestHospedajeCheckInDirecto;
import com.hotel.apifds20261.dto.request.RequestHospedajeCheckIn;
import com.hotel.apifds20261.dto.request.RequestHospedajeCheckOut;
import com.hotel.apifds20261.dto.request.RequestHospedajeExtend;
import com.hotel.apifds20261.dto.request.RequestHospedajeChangeRoom;
import com.hotel.apifds20261.dto.response.HospedajeResponse;
import com.hotel.apifds20261.dto.response.ResponseHospedaje;
import com.hotel.apifds20261.exception.BusinessException;
import com.hotel.apifds20261.security.JwtService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/hospedaje")
@RequiredArgsConstructor
public class HospedajeController {

    private final BusinessHospedaje hospedajeBusiness;
    private final JwtService jwtService;

    @GetMapping("getactive")
    public ResponseEntity<ResponseHospedaje> actionGetActive() {
        List<HospedajeResponse> list = hospedajeBusiness.listarActivos();
        ResponseHospedaje response = new ResponseHospedaje();
        response.success();
        response.setListHospedaje(list);
        return ResponseEntity.ok(response);
    }

    @GetMapping("getall")
    public ResponseEntity<ResponseHospedaje> actionGetAll() {
        List<HospedajeResponse> list = hospedajeBusiness.listarTodos();
        ResponseHospedaje response = new ResponseHospedaje();
        response.success();
        response.setListHospedaje(list);
        return ResponseEntity.ok(response);
    }

    @GetMapping("getbyid/{id}")
    public ResponseEntity<ResponseHospedaje> actionGetById(@PathVariable Long id) {
        HospedajeResponse item = hospedajeBusiness.obtenerPorId(id);
        ResponseHospedaje response = new ResponseHospedaje();
        response.success();
        response.getListHospedaje().add(item);
        return ResponseEntity.ok(response);
    }

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

    @PostMapping("checkin")
    public ResponseEntity<ResponseHospedaje> actionCheckIn(
            @Valid @RequestBody RequestHospedajeCheckIn request,
            @RequestHeader("Authorization") String authHeader) {
        Long usuarioId = validarToken(authHeader);
        HospedajeResponse item = hospedajeBusiness.checkInDesdeReserva(request, usuarioId);
        ResponseHospedaje response = new ResponseHospedaje();
        response.success();
        response.getListHospedaje().add(item);
        response.listMessage.add("Check-in realizado exitosamente");
        return ResponseEntity.ok(response);
    }

    @PostMapping("checkindirect")
    public ResponseEntity<ResponseHospedaje> actionCheckInDirect(
            @Valid @RequestBody RequestHospedajeCheckInDirecto request,
            @RequestHeader("Authorization") String authHeader) {
        Long usuarioId = validarToken(authHeader);
        HospedajeResponse item = hospedajeBusiness.checkInDirecto(request, usuarioId);
        ResponseHospedaje response = new ResponseHospedaje();
        response.success();
        response.getListHospedaje().add(item);
        response.listMessage.add("Check-in directo realizado exitosamente");
        return ResponseEntity.ok(response);
    }

    @PostMapping("checkout/{id}")
    public ResponseEntity<ResponseHospedaje> actionCheckOut(
            @PathVariable Long id,
            @Valid @RequestBody RequestHospedajeCheckOut request,
            @RequestHeader("Authorization") String authHeader) {
        Long usuarioId = validarToken(authHeader);
        request.setHospedajeId(id);
        HospedajeResponse item = hospedajeBusiness.checkOut(request, usuarioId);
        ResponseHospedaje response = new ResponseHospedaje();
        response.success();
        response.getListHospedaje().add(item);
        response.listMessage.add("Check-out realizado exitosamente");
        return ResponseEntity.ok(response);
    }

    @PutMapping("extend/{id}")
    public ResponseEntity<ResponseHospedaje> actionExtend(
            @PathVariable Long id,
            @RequestBody RequestHospedajeExtend request,
            @RequestHeader("Authorization") String authHeader) {
        Long usuarioId = validarToken(authHeader);
        HospedajeResponse item = hospedajeBusiness.extenderEstadia(id, request.getNuevaFechaSalida(), usuarioId);
        ResponseHospedaje response = new ResponseHospedaje();
        response.success();
        response.getListHospedaje().add(item);
        response.listMessage.add("Estadia extendida exitosamente");
        return ResponseEntity.ok(response);
    }

    @PutMapping("change-room/{id}")
    public ResponseEntity<ResponseHospedaje> actionChangeRoom(
            @PathVariable Long id,
            @RequestBody RequestHospedajeChangeRoom request,
            @RequestHeader("Authorization") String authHeader) {
        Long usuarioId = validarToken(authHeader);
        HospedajeResponse item = hospedajeBusiness.cambiarHabitacion(id, request.getNuevaHabitacionId(), usuarioId);
        ResponseHospedaje response = new ResponseHospedaje();
        response.success();
        response.getListHospedaje().add(item);
        response.listMessage.add("Habitacion cambiada exitosamente");
        return ResponseEntity.ok(response);
    }
}

