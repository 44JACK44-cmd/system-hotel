package com.hotel.apifds20261.controller;

import com.hotel.apifds20261.business.BusinessPago;
import com.hotel.apifds20261.dto.request.RequestPagoInsert;
import com.hotel.apifds20261.dto.response.PagoResponse;
import com.hotel.apifds20261.dto.response.ResponsePage;
import com.hotel.apifds20261.dto.response.ResponsePago;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import com.hotel.apifds20261.exception.BusinessException;
import com.hotel.apifds20261.security.JwtService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/pago")
@RequiredArgsConstructor
public class PagoController {

    private final BusinessPago pagoBusiness;
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
    public ResponseEntity<ResponsePago> actionGetAll() {
        List<PagoResponse> list = pagoBusiness.listarTodos();
        ResponsePago response = new ResponsePago();
        response.success();
        response.setListPago(list);
        return ResponseEntity.ok(response);
    }

    @GetMapping("getallpaginated")
    public ResponseEntity<ResponsePage<PagoResponse>> actionGetAllPaginated(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "id") String sortField,
            @RequestParam(defaultValue = "desc") String sortDir,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String tipo,
            @RequestParam(required = false) String metodo,
            @RequestParam(required = false) @org.springframework.format.annotation.DateTimeFormat(iso = org.springframework.format.annotation.DateTimeFormat.ISO.DATE) java.time.LocalDate inicio,
            @RequestParam(required = false) @org.springframework.format.annotation.DateTimeFormat(iso = org.springframework.format.annotation.DateTimeFormat.ISO.DATE) java.time.LocalDate fin) {
        ResponsePage<PagoResponse> response = pagoBusiness.listarPaginado(search, tipo, metodo, inicio, fin, page, size, sortField, sortDir);
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
        Long usuarioId = validarToken(authHeader);
        PagoResponse item = pagoBusiness.registrar(request, usuarioId);
        ResponsePago response = new ResponsePago();
        response.success();
        response.getListPago().add(item);
        response.listMessage.add("Pago registrado exitosamente");
        return ResponseEntity.ok(response);
    }

    @GetMapping("exportcsv")
    public ResponseEntity<byte[]> exportCsv() {
        var pagos = pagoBusiness.listarTodos();
        StringBuilder csv = new StringBuilder();
        csv.append("ID,Fecha,Usuario,Monto,Metodo,Tipo,Referencia\n");
        for (var p : pagos) {
            csv.append(p.getId()).append(",");
            csv.append(csvSafe(p.getFechaPago() != null ? p.getFechaPago().toString() : "")).append(",");
            csv.append("\"").append(csvSafe(p.getUsuarioNombre() != null ? p.getUsuarioNombre() : "")).append("\",");
            csv.append(p.getMonto() != null ? p.getMonto() : "0").append(",");
            csv.append(csvSafe(p.getMetodo() != null ? p.getMetodo() : "")).append(",");
            csv.append(csvSafe(p.getTipo() != null ? p.getTipo() : "")).append(",");
            csv.append("\"").append(csvSafe(p.getReferencia() != null ? p.getReferencia() : "")).append("\"\n");
        }
        byte[] bytes = csv.toString().getBytes(java.nio.charset.StandardCharsets.UTF_8);
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.parseMediaType("text/csv; charset=UTF-8"));
        headers.set(HttpHeaders.CONTENT_DISPOSITION,
                "attachment; filename=pagos-" + java.time.LocalDateTime.now().format(java.time.format.DateTimeFormatter.ofPattern("yyyyMMdd-HHmmss")) + ".csv");
        return ResponseEntity.ok().headers(headers).body(bytes);
    }

    private static String csvSafe(String valor) {
        if (valor == null) return "";
        String v = valor.replace("\"", "\"\"");
        if (!v.isEmpty() && (v.startsWith("=") || v.startsWith("+") || v.startsWith("-") || v.startsWith("@") || v.startsWith("\t") || v.startsWith("\r"))) {
            v = "'" + v;
        }
        return v;
    }
}

