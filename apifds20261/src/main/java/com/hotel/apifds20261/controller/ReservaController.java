package com.hotel.apifds20261.controller;

import com.hotel.apifds20261.business.BusinessReserva;
import com.hotel.apifds20261.dto.request.RequestReservaInsert;
import com.hotel.apifds20261.dto.request.RequestReservaUpdate;
import com.hotel.apifds20261.dto.response.ReservaResponse;
import com.hotel.apifds20261.dto.response.ResponsePage;
import com.hotel.apifds20261.dto.response.ResponseReserva;
import com.hotel.apifds20261.security.JwtService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/reserva")
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

    @GetMapping("getallpaginated")
    public ResponseEntity<ResponsePage<ReservaResponse>> actionGetAllPaginated(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "id") String sortField,
            @RequestParam(defaultValue = "asc") String sortDir,
            @RequestParam(required = false) String search) {
        ResponsePage<ReservaResponse> response = reservaBusiness.listarPaginado(search, page, size, sortField, sortDir);
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

    @PutMapping("update/{id}")
    public ResponseEntity<ResponseReserva> actionUpdate(
            @PathVariable Long id,
            @Valid @RequestBody RequestReservaUpdate request,
            @RequestHeader("Authorization") String authHeader) {
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            ResponseReserva response = new ResponseReserva();
            response.listMessage.add("Token no proporcionado o formato invalido");
            return ResponseEntity.status(401).body(response);
        }
        String token = authHeader.substring(7);
        if (!jwtService.isTokenValid(token)) {
            ResponseReserva response = new ResponseReserva();
            response.listMessage.add("Token invalido o expirado");
            return ResponseEntity.status(401).body(response);
        }
        Long usuarioId = jwtService.getUserIdFromToken(token);
        ReservaResponse item = reservaBusiness.actualizar(id, request, usuarioId);
        ResponseReserva response = new ResponseReserva();
        response.success();
        response.getListReserva().add(item);
        response.listMessage.add("Reserva actualizada exitosamente");
        return ResponseEntity.ok(response);
    }

    @PostMapping("cancel/{id}")
    public ResponseEntity<ResponseReserva> actionCancel(
            @PathVariable Long id,
            @RequestHeader("Authorization") String authHeader) {
        try {
            if (authHeader == null || !authHeader.startsWith("Bearer ")) {
                ResponseReserva response = new ResponseReserva();
                response.listMessage.add("Token no proporcionado o formato invalido");
                return ResponseEntity.status(401).body(response);
            }
            String token = authHeader.substring(7);
            if (!jwtService.isTokenValid(token)) {
                ResponseReserva response = new ResponseReserva();
                response.listMessage.add("Token invalido o expirado");
                return ResponseEntity.status(401).body(response);
            }
            String rol = jwtService.getRolFromToken(token);
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
        } catch (Exception e) {
            ResponseReserva response = new ResponseReserva();
            response.listMessage.add("Error al procesar la solicitud");
            return ResponseEntity.status(500).body(response);
        }
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
        response.setDisponible(disponible);
        return ResponseEntity.ok(response);
    }
}

