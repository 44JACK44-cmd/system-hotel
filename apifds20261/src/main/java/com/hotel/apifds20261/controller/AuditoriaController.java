package com.hotel.apifds20261.controller;

import com.hotel.apifds20261.business.BusinessAuditoria;
import com.hotel.apifds20261.dto.response.AuditoriaResponse;
import com.hotel.apifds20261.dto.response.ResponseAuditoria;
import com.hotel.apifds20261.dto.response.ResponsePage;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;

@RestController
@RequestMapping("/api/auditoria")
@RequiredArgsConstructor
public class AuditoriaController {

    private final BusinessAuditoria auditoriaBusiness;

    @GetMapping("getallpaginated")
    public ResponseEntity<ResponsePage<AuditoriaResponse>> actionGetAllPaginated(
            @RequestParam(required = false) Long usuarioId,
            @RequestParam(required = false) String modulo,
            @RequestParam(required = false) LocalDate fechaDesde,
            @RequestParam(required = false) LocalDate fechaHasta,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "fecha") String sortField,
            @RequestParam(defaultValue = "desc") String sortDir) {
        ResponsePage<AuditoriaResponse> response = auditoriaBusiness.listarPaginado(
                usuarioId, modulo, fechaDesde, fechaHasta, page, size, sortField, sortDir);
        return ResponseEntity.ok(response);
    }

    @PostMapping("registrar")
    public ResponseEntity<ResponseAuditoria> actionRegistrar(
            @RequestParam Long usuarioId,
            @RequestParam String accion,
            @RequestParam(required = false) String modulo,
            @RequestParam(required = false) String detalle,
            @RequestParam(required = false) String ip) {
        auditoriaBusiness.registrar(usuarioId, accion, modulo, detalle, ip);
        ResponseAuditoria response = new ResponseAuditoria();
        response.success();
        response.listMessage.add("Actividad registrada");
        return ResponseEntity.ok(response);
    }
}
