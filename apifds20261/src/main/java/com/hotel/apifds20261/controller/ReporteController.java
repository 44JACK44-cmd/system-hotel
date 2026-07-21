package com.hotel.apifds20261.controller;

import com.hotel.apifds20261.business.BusinessReporte;
import com.hotel.apifds20261.dto.response.ResponseReporte;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

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
}
