package com.hotel.apifds20261.controller;

import com.hotel.apifds20261.business.BusinessReserva;
import com.hotel.apifds20261.dto.request.RequestReservaInsert;
import com.hotel.apifds20261.dto.response.ReservaResponse;
import com.hotel.apifds20261.dto.response.ResponseReserva;
import com.hotel.apifds20261.security.JwtService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("reserva")
@RequiredArgsConstructor
public class ReservaController {

    private final BusinessReserva reservaBusiness;
    private final JwtService jwtService;

    @GetMapping("getall")
    public ResponseEntity<ResponseReserva> actionGetAll() {
        List<ReservaResponse> list = reservaBusiness.listarTodas();
        ResponseReserva response = new ResponseReserva();
        response.success();
        response.setListReserva(list);
        return ResponseEntity.ok(response);
    }

    @GetMapping("getbydate")
    public ResponseEntity<ResponseReserva> actionGetByDate() {
        List<ReservaResponse> list = reservaBusiness.listarDelDia();
        ResponseReserva response = new ResponseReserva();
        response.success();
        response.setListReserva(list);
        return ResponseEntity.ok(response);
    }

    @GetMapping("getbystate/{estado}")
    public ResponseEntity<ResponseReserva> actionGetByState(@PathVariable String estado) {
        List<ReservaResponse> list = reservaBusiness.listarPorEstado(estado);
        ResponseReserva response = new ResponseReserva();
        response.success();
        response.setListReserva(list);
        return ResponseEntity.ok(response);
    }

    @GetMapping("getbyid/{id}")
    public ResponseEntity<ResponseReserva> actionGetById(@PathVariable Long id) {
        ReservaResponse item = reservaBusiness.obtenerPorId(id);
        ResponseReserva response = new ResponseReserva();
        response.success();
        response.getListReserva().add(item);
        return ResponseEntity.ok(response);
    }

    @PostMapping("insert")
    public ResponseEntity<ResponseReserva> actionInsert(
            @Valid @RequestBody RequestReservaInsert request,
            @RequestHeader("Authorization") String authHeader) {
        Long usuarioId = jwtService.getUserIdFromToken(authHeader.substring(7));
        ReservaResponse item = reservaBusiness.crear(request, usuarioId);
        ResponseReserva response = new ResponseReserva();
        response.success();
        response.getListReserva().add(item);
        response.listMessage.add("Reserva creada exitosamente");
        return ResponseEntity.ok(response);
    }

    @PostMapping("cancel/{id}")
    public ResponseEntity<ResponseReserva> actionCancel(
            @PathVariable Long id,
            @RequestHeader("Authorization") String authHeader) {
        String rol = jwtService.getRolFromToken(authHeader.substring(7));
        if (!"ADMIN".equals(rol)) {
            ResponseReserva response = new ResponseReserva();
            response.listMessage.add("Solo el administrador puede cancelar reservas");
            return ResponseEntity.status(403).body(response);
        }
        reservaBusiness.cancelar(id);
        ResponseReserva response = new ResponseReserva();
        response.success();
        response.listMessage.add("Reserva cancelada exitosamente");
        return ResponseEntity.ok(response);
    }

    @GetMapping("checkavailability")
    public ResponseEntity<ResponseReserva> actionCheckAvailability(
            @RequestParam Long habitacionId,
            @RequestParam String fechaEntrada,
            @RequestParam String fechaSalida) {
        boolean disponible = reservaBusiness.verificarDisponibilidad(
                habitacionId, LocalDate.parse(fechaEntrada), LocalDate.parse(fechaSalida));
        ResponseReserva response = new ResponseReserva();
        response.success();
        response.listMessage.add(String.valueOf(disponible));
        return ResponseEntity.ok(response);
    }
}

