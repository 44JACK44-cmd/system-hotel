package com.hotel.apifds20261.controller;

import com.hotel.apifds20261.business.BusinessIncidencia;
import com.hotel.apifds20261.dto.request.RequestIncidenciaInsert;
import com.hotel.apifds20261.dto.response.IncidenciaResponse;
import com.hotel.apifds20261.dto.response.ResponsePage;
import com.hotel.apifds20261.dto.response.ResponseIncidencia;
import com.hotel.apifds20261.security.JwtService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/incidencia")
@RequiredArgsConstructor
public class IncidenciaController {

    private final BusinessIncidencia incidenciaBusiness;
    private final JwtService jwtService;

    @GetMapping("getall")
    public ResponseEntity<ResponseIncidencia> actionGetAll() {
        List<IncidenciaResponse> list = incidenciaBusiness.listarTodas();
        ResponseIncidencia response = new ResponseIncidencia();
        response.success();
        response.setListIncidencia(list);
        return ResponseEntity.ok(response);
    }

    @GetMapping("getallpaginated")
    public ResponseEntity<ResponsePage<IncidenciaResponse>> actionGetAllPaginated(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "id") String sortField,
            @RequestParam(defaultValue = "desc") String sortDir,
            @RequestParam(required = false) String search) {
        ResponsePage<IncidenciaResponse> response = incidenciaBusiness.listarPaginado(search, page, size, sortField, sortDir);
        return ResponseEntity.ok(response);
    }

    @GetMapping("getactive")
    public ResponseEntity<ResponseIncidencia> actionGetActive() {
        List<IncidenciaResponse> list = incidenciaBusiness.listarActivas();
        ResponseIncidencia response = new ResponseIncidencia();
        response.success();
        response.setListIncidencia(list);
        return ResponseEntity.ok(response);
    }

    @GetMapping("getbyid/{id}")
    public ResponseEntity<ResponseIncidencia> actionGetById(@PathVariable Long id) {
        IncidenciaResponse item = incidenciaBusiness.obtenerPorId(id);
        ResponseIncidencia response = new ResponseIncidencia();
        response.success();
        response.getListIncidencia().add(item);
        return ResponseEntity.ok(response);
    }

    @PostMapping("insert")
    public ResponseEntity<ResponseIncidencia> actionInsert(
            @Valid @RequestBody RequestIncidenciaInsert request,
            @RequestHeader("Authorization") String authHeader) {
        Long usuarioId = jwtService.getUserIdFromToken(authHeader.substring(7));
        IncidenciaResponse item = incidenciaBusiness.crear(request, usuarioId);
        ResponseIncidencia response = new ResponseIncidencia();
        response.success();
        response.getListIncidencia().add(item);
        response.listMessage.add("Incidencia registrada exitosamente");
        return ResponseEntity.ok(response);
    }

    @PutMapping("finish/{id}")
    public ResponseEntity<ResponseIncidencia> actionFinish(@PathVariable Long id) {
        IncidenciaResponse item = incidenciaBusiness.finalizar(id);
        ResponseIncidencia response = new ResponseIncidencia();
        response.success();
        response.getListIncidencia().add(item);
        response.listMessage.add("Incidencia finalizada exitosamente");
        return ResponseEntity.ok(response);
    }
}

