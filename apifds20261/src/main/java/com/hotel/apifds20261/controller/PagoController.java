package com.hotel.apifds20261.controller;

import com.hotel.apifds20261.business.BusinessPago;
import com.hotel.apifds20261.dto.request.RequestPagoInsert;
import com.hotel.apifds20261.dto.response.PagoResponse;
import com.hotel.apifds20261.dto.response.ResponsePago;
import com.hotel.apifds20261.security.JwtService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("pago")
@RequiredArgsConstructor
public class PagoController {

    private final BusinessPago pagoBusiness;
    private final JwtService jwtService;

    @GetMapping("getall")
    public ResponseEntity<ResponsePago> actionGetAll() {
        List<PagoResponse> list = pagoBusiness.listarTodos();
        ResponsePago response = new ResponsePago();
        response.success();
        response.setListPago(list);
        return ResponseEntity.ok(response);
    }

    @GetMapping("getbyid/{id}")
    public ResponseEntity<ResponsePago> actionGetById(@PathVariable Long id) {
        PagoResponse item = pagoBusiness.obtenerPorId(id);
        ResponsePago response = new ResponsePago();
        response.success();
        response.getListPago().add(item);
        return ResponseEntity.ok(response);
    }

    @GetMapping("getbyreserva/{reservaId}")
    public ResponseEntity<ResponsePago> actionGetByReserva(@PathVariable Long reservaId) {
        List<PagoResponse> list = pagoBusiness.listarPorReserva(reservaId);
        ResponsePago response = new ResponsePago();
        response.success();
        response.setListPago(list);
        return ResponseEntity.ok(response);
    }

    @GetMapping("getbyhospedaje/{hospedajeId}")
    public ResponseEntity<ResponsePago> actionGetByHospedaje(@PathVariable Long hospedajeId) {
        List<PagoResponse> list = pagoBusiness.listarPorHospedaje(hospedajeId);
        ResponsePago response = new ResponsePago();
        response.success();
        response.setListPago(list);
        return ResponseEntity.ok(response);
    }

    @PostMapping("insert")
    public ResponseEntity<ResponsePago> actionInsert(
            @Valid @RequestBody RequestPagoInsert request,
            @RequestHeader("Authorization") String authHeader) {
        Long usuarioId = jwtService.getUserIdFromToken(authHeader.substring(7));
        PagoResponse item = pagoBusiness.registrar(request, usuarioId);
        ResponsePago response = new ResponsePago();
        response.success();
        response.getListPago().add(item);
        response.listMessage.add("Pago registrado exitosamente");
        return ResponseEntity.ok(response);
    }
}

