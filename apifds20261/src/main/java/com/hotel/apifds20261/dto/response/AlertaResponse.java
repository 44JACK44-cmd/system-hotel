package com.hotel.apifds20261.dto.response;

import lombok.*;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Getter @Setter
@NoArgsConstructor
public class AlertaResponse {
    private String grupoId;
    private String tipo;
    private String titulo;
    private String descripcion;
    private String icono;
    private String modulo;
    private LocalDateTime timestamp;
    private String fecha;
    private String hora;
    private String accion;
    private String accionLabel;
    private Boolean leida = false;
    private Integer cantidad = 1;
    private String entidadTipo;
    private Long entidadId;
    private String expiracion;
    private String categoria;
    private List<Map<String, Object>> acciones = new ArrayList<>();

    public void addAccion(String label, String accion, String entidadTipo, Long entidadId) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("label", label);
        m.put("accion", accion);
        m.put("entidadTipo", entidadTipo);
        m.put("entidadId", entidadId);
        acciones.add(m);
        if (this.accion == null) {
            this.accion = accion;
            this.accionLabel = label;
        }
    }

    public Map<String, Object> toMap() {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("grupoId", grupoId);
        m.put("tipo", tipo);
        m.put("titulo", titulo);
        m.put("descripcion", descripcion);
        m.put("icono", icono);
        m.put("modulo", modulo);
        m.put("timestamp", timestamp != null ? timestamp.toString() : null);
        m.put("fecha", fecha);
        m.put("hora", hora);
        m.put("accion", accion);
        m.put("accionLabel", accionLabel);
        m.put("leida", leida);
        m.put("cantidad", cantidad);
        m.put("entidadTipo", entidadTipo);
        m.put("entidadId", entidadId);
        m.put("expiracion", expiracion);
        m.put("categoria", categoria);
        m.put("acciones", acciones);
        return m;
    }

    public static AlertaResponse urgente(String grupoId, String titulo, String descripcion, String icono, String modulo, LocalDateTime ts) {
        AlertaResponse a = base(grupoId, titulo, descripcion, icono, modulo, ts, null, null);
        a.setTipo("URGENTE");
        return a;
    }

    public static AlertaResponse critica(String grupoId, String titulo, String descripcion, String icono, String modulo, LocalDateTime ts) {
        AlertaResponse a = base(grupoId, titulo, descripcion, icono, modulo, ts, null, null);
        a.setTipo("CRITICA");
        return a;
    }

    public static AlertaResponse importante(String grupoId, String titulo, String descripcion, String icono, String modulo, LocalDateTime ts) {
        AlertaResponse a = base(grupoId, titulo, descripcion, icono, modulo, ts, null, null);
        a.setTipo("IMPORTANTE");
        return a;
    }

    public static AlertaResponse aviso(String grupoId, String titulo, String descripcion, String icono, String modulo, LocalDateTime ts) {
        AlertaResponse a = base(grupoId, titulo, descripcion, icono, modulo, ts, null, null);
        a.setTipo("AVISO");
        return a;
    }

    public static AlertaResponse informativa(String grupoId, String titulo, String descripcion, String icono, String modulo, LocalDateTime ts) {
        AlertaResponse a = base(grupoId, titulo, descripcion, icono, modulo, ts, null, null);
        a.setTipo("INFORMATIVA");
        return a;
    }

    public static AlertaResponse exito(String grupoId, String titulo, String descripcion, String icono, String modulo, LocalDateTime ts) {
        AlertaResponse a = base(grupoId, titulo, descripcion, icono, modulo, ts, null, null);
        a.setTipo("EXITO");
        return a;
    }

    private static AlertaResponse base(String grupoId, String titulo, String descripcion, String icono, String modulo, LocalDateTime ts, String accion, String accionLabel) {
        AlertaResponse a = new AlertaResponse();
        a.setGrupoId(grupoId);
        a.setTitulo(titulo);
        a.setDescripcion(descripcion);
        a.setIcono(icono);
        a.setModulo(modulo);
        a.setTimestamp(ts);
        a.setFecha(ts.format(DateTimeFormatter.ofPattern("dd/MM/yyyy")));
        a.setHora(ts.format(DateTimeFormatter.ofPattern("HH:mm")));
        a.setAccion(accion);
        a.setAccionLabel(accionLabel);
        return a;
    }
}
