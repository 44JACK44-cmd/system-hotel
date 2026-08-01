package com.hotel.apifds20261.controller;

import com.hotel.apifds20261.business.BusinessAlertas;
import com.hotel.apifds20261.dto.response.ResponseReporte;
import com.hotel.apifds20261.entity.EntityAlertaConfiguracion;
import com.hotel.apifds20261.repository.RepositoryAlertaConfiguracion;
import com.hotel.apifds20261.security.JwtService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.LinkedHashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/alertas")
@RequiredArgsConstructor
public class AlertaController {

    private final BusinessAlertas alertasBusiness;
    private final RepositoryAlertaConfiguracion configRepository;
    private final JwtService jwtService;

    private Long obtenerUsuarioId(HttpServletRequest request) {
        String auth = request.getHeader("Authorization");
        if (auth != null && auth.startsWith("Bearer ")) {
            return jwtService.getUserIdFromToken(auth.substring(7));
        }
        return null;
    }

    @GetMapping
    public ResponseEntity<ResponseReporte> listarAlertas(HttpServletRequest request) {
        Long usuarioId = obtenerUsuarioId(request);
        if (usuarioId == null) return ResponseEntity.status(401).body(new ResponseReporte());
        ResponseReporte res = new ResponseReporte();
        res.success();
        res.setListReporte(alertasBusiness.generarAlertas(usuarioId));
        return ResponseEntity.ok(res);
    }

    @GetMapping("/resumen")
    public ResponseEntity<ResponseReporte> resumenAlertas(HttpServletRequest request) {
        Long usuarioId = obtenerUsuarioId(request);
        if (usuarioId == null) return ResponseEntity.status(401).body(new ResponseReporte());
        ResponseReporte res = new ResponseReporte();
        res.success();
        Map<String, Object> reporte = new LinkedHashMap<>();
        reporte.put("resumen", alertasBusiness.resumenAlertas(usuarioId));
        res.setReporte(reporte);
        return ResponseEntity.ok(res);
    }

    @GetMapping("/actividad")
    public ResponseEntity<ResponseReporte> actividadReciente(
            HttpServletRequest request,
            @RequestParam(defaultValue = "20") int limite) {
        Long usuarioId = obtenerUsuarioId(request);
        if (usuarioId == null) return ResponseEntity.status(401).body(new ResponseReporte());
        ResponseReporte res = new ResponseReporte();
        res.success();
        res.setListReporte(alertasBusiness.actividadReciente(usuarioId, limite));
        return ResponseEntity.ok(res);
    }

    @PostMapping("/marcarleida")
    public ResponseEntity<ResponseReporte> marcarLeida(
            HttpServletRequest request,
            @RequestBody Map<String, String> body) {
        Long usuarioId = obtenerUsuarioId(request);
        if (usuarioId == null) return ResponseEntity.status(401).body(new ResponseReporte());
        String grupoId = body.get("grupoId");
        if (grupoId != null) alertasBusiness.marcarLeida(usuarioId, grupoId);
        ResponseReporte res = new ResponseReporte();
        res.success();
        return ResponseEntity.ok(res);
    }

    @PostMapping("/marcartodasleidas")
    public ResponseEntity<ResponseReporte> marcarTodasLeidas(HttpServletRequest request) {
        Long usuarioId = obtenerUsuarioId(request);
        if (usuarioId == null) return ResponseEntity.status(401).body(new ResponseReporte());
        alertasBusiness.marcarTodasLeidas(usuarioId);
        ResponseReporte res = new ResponseReporte();
        res.success();
        return ResponseEntity.ok(res);
    }

    @GetMapping("/configuracion")
    public ResponseEntity<ResponseReporte> obtenerConfiguracion(HttpServletRequest request) {
        Long usuarioId = obtenerUsuarioId(request);
        if (usuarioId == null) return ResponseEntity.status(401).body(new ResponseReporte());
        EntityAlertaConfiguracion config = configRepository.findByUsuarioId(usuarioId)
                .orElseGet(() -> {
                    EntityAlertaConfiguracion c = new EntityAlertaConfiguracion();
                    c.setUsuarioId(usuarioId);
                    return configRepository.save(c);
                });

        Map<String, Object> m = new LinkedHashMap<>();
        m.put("sonidoActivado", config.getSonidoActivado());
        m.put("tiempoActualizacionSegundos", config.getTiempoActualizacionSegundos());
        m.put("emergentesActivadas", config.getEmergentesActivadas());
        m.put("duracionInformativasHoras", config.getDuracionInformativasHoras());
        ResponseReporte res = new ResponseReporte();
        res.success();
        res.setReporte(m);
        return ResponseEntity.ok(res);
    }

    @PutMapping("/configuracion")
    public ResponseEntity<ResponseReporte> actualizarConfiguracion(
            HttpServletRequest request,
            @RequestBody Map<String, Object> body) {
        Long usuarioId = obtenerUsuarioId(request);
        if (usuarioId == null) return ResponseEntity.status(401).body(new ResponseReporte());
        EntityAlertaConfiguracion config = configRepository.findByUsuarioId(usuarioId)
                .orElseGet(() -> {
                    EntityAlertaConfiguracion c = new EntityAlertaConfiguracion();
                    c.setUsuarioId(usuarioId);
                    return c;
                });

        if (body.containsKey("sonidoActivado"))
            config.setSonidoActivado((Boolean) body.get("sonidoActivado"));
        if (body.containsKey("tiempoActualizacionSegundos"))
            config.setTiempoActualizacionSegundos((Integer) body.get("tiempoActualizacionSegundos"));
        if (body.containsKey("emergentesActivadas"))
            config.setEmergentesActivadas((Boolean) body.get("emergentesActivadas"));
        if (body.containsKey("duracionInformativasHoras"))
            config.setDuracionInformativasHoras((Integer) body.get("duracionInformativasHoras"));

        configRepository.save(config);
        ResponseReporte res = new ResponseReporte();
        res.success();
        return ResponseEntity.ok(res);
    }
}
