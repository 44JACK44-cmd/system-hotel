package com.hotel.apifds20261.controller;

import com.hotel.apifds20261.business.BusinessConsistencia;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/consistencia")
@RequiredArgsConstructor
public class ConsistenciaController {

    private final BusinessConsistencia consistenciaBusiness;

    @GetMapping("auditar")
    public ResponseEntity<Map<String, Object>> actionAuditar() {
        return ResponseEntity.ok(consistenciaBusiness.auditar());
    }
}
