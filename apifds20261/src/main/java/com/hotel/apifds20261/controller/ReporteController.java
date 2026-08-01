package com.hotel.apifds20261.controller;

import com.hotel.apifds20261.business.BusinessReporte;
import com.hotel.apifds20261.dto.response.ResponseReporte;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/reporte")
@RequiredArgsConstructor
public class ReporteController {

    private final BusinessReporte reporteBusiness;

    @GetMapping("ingresos")
    public ResponseEntity<ResponseReporte> actionIngresos(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate inicio,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fin) {
        Map<String, Object> data = reporteBusiness.ingresos(inicio, fin);
        ResponseReporte response = new ResponseReporte();
        response.success();
        response.setReporte(data);
        return ResponseEntity.ok(response);
    }

    @GetMapping("ingresosbymethod")
    public ResponseEntity<ResponseReporte> actionIngresosByMethod(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate inicio,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fin) {
        Map<String, Object> data = reporteBusiness.ingresosPorMetodo(inicio, fin);
        ResponseReporte response = new ResponseReporte();
        response.success();
        response.setReporte(data);
        return ResponseEntity.ok(response);
    }

    @GetMapping("ocupacion")
    public ResponseEntity<ResponseReporte> actionOcupacion(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fecha) {
        if (fecha == null) fecha = LocalDate.now();
        Map<String, Object> data = reporteBusiness.ocupacion(fecha);
        ResponseReporte response = new ResponseReporte();
        response.success();
        response.setReporte(data);
        return ResponseEntity.ok(response);
    }

    @GetMapping("tendencia-ocupacion")
    public ResponseEntity<ResponseReporte> actionTendenciaOcupacion(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate inicio,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fin) {
        List<Map<String, Object>> data = reporteBusiness.tendenciaOcupacion(inicio, fin);
        ResponseReporte response = new ResponseReporte();
        response.success();
        response.setListReporte(data);
        return ResponseEntity.ok(response);
    }

    @GetMapping("reservasnoconcretadas")
    public ResponseEntity<ResponseReporte> actionReservasNoConcretadas(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate inicio,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fin) {
        Map<String, Object> data = reporteBusiness.reservasNoConcretadas(inicio, fin);
        ResponseReporte response = new ResponseReporte();
        response.success();
        response.setReporte(data);
        return ResponseEntity.ok(response);
    }

    @GetMapping("incidencias")
    public ResponseEntity<ResponseReporte> actionIncidencias() {
        List<Map<String, Object>> data = reporteBusiness.historialIncidencias();
        ResponseReporte response = new ResponseReporte();
        response.success();
        response.setListReporte(data);
        return ResponseEntity.ok(response);
    }

    @GetMapping("rankinghabitaciones")
    public ResponseEntity<ResponseReporte> actionRankingHabitaciones() {
        List<Map<String, Object>> data = reporteBusiness.rankingHabitaciones();
        ResponseReporte response = new ResponseReporte();
        response.success();
        response.setListReporte(data);
        return ResponseEntity.ok(response);
    }

    @GetMapping("exportcsv")
    public ResponseEntity<byte[]> exportCsv(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate inicio,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fin) {
        Map<String, Object> reporte = reporteBusiness.ingresos(inicio, fin);
        StringBuilder csv = new StringBuilder();
        csv.append("Fecha,Habitacion,Cliente,Monto,Metodo,Tipo\n");
        @SuppressWarnings("unchecked")
        List<Map<String, Object>> detalles = (List<Map<String, Object>>) reporte.getOrDefault("detalles", List.of());
        for (Map<String, Object> row : detalles) {
            csv.append(csvSafe(String.valueOf(row.getOrDefault("fecha", "")))).append(",");
            csv.append(csvSafe(String.valueOf(row.getOrDefault("habitacion", "")))).append(",");
            csv.append("\"").append(csvSafe(String.valueOf(row.getOrDefault("cliente", "")))).append("\",");
            csv.append(csvSafe(String.valueOf(row.getOrDefault("monto", "0")))).append(",");
            csv.append(csvSafe(String.valueOf(row.getOrDefault("metodo", "")))).append(",");
            csv.append(csvSafe(String.valueOf(row.getOrDefault("tipo", "")))).append("\n");
        }
        byte[] bytes = csv.toString().getBytes(java.nio.charset.StandardCharsets.UTF_8);
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.parseMediaType("text/csv; charset=UTF-8"));
        headers.set(HttpHeaders.CONTENT_DISPOSITION,
                "attachment; filename=reporte-ingresos-" + LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd-HHmmss")) + ".csv");
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
