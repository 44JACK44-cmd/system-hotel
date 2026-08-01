package com.hotel.apifds20261.business;

import com.hotel.apifds20261.dto.response.AlertaResponse;
import com.hotel.apifds20261.entity.*;
import com.hotel.apifds20261.repository.*;
import com.hotel.apifds20261.staticdata.EstadoHabitacion;
import com.hotel.apifds20261.staticdata.EstadoHospedaje;
import com.hotel.apifds20261.staticdata.EstadoReserva;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class BusinessAlertas {

    private final RepositoryHospedaje hospedajeRepository;
    private final RepositoryHabitacion habitacionRepository;
    private final RepositoryReserva reservaRepository;
    private final RepositoryIncidencia incidenciaRepository;
    private final RepositoryCaja cajaRepository;
    private final RepositoryPago pagoRepository;
    private final RepositoryCliente clienteRepository;
    private final RepositoryAlertaLeida alertaLeidaRepository;
    private final RepositoryAuditoria auditoriaRepository;

    @Transactional
    public List<Map<String, Object>> generarAlertas(Long usuarioId) {
        LocalDateTime ahora = LocalDateTime.now();
        LocalDate hoy = LocalDate.now();

        Set<String> leidas = new HashSet<>(alertaLeidaRepository.findGrupoIdsByUsuarioId(usuarioId));

        List<AlertaResponse> todas = new ArrayList<>();
        todas.addAll(generarCheckOutVencidos(ahora, leidas));
        todas.addAll(generarDeudasPendientes(leidas));
        todas.addAll(generarIncidenciasActivas(leidas));
        todas.addAll(generarMantenimiento(leidas));
        todas.addAll(generarCheckInHoy(hoy, leidas));
        todas.addAll(generarCajaAbierta(leidas));
        todas.addAll(generarPagosAgrupados(ahora, leidas));
        todas.addAll(generarClientesAgrupados(hoy, leidas));
        todas.addAll(generarDisponibilidadBaja(leidas));

        todas.removeIf(a -> a.getExpiracion() != null && LocalDateTime.parse(a.getExpiracion()).isBefore(ahora));

        todas.sort((a, b) -> {
            int cmp = ordenTipo(a.getTipo()).compareTo(ordenTipo(b.getTipo()));
            if (cmp != 0) return cmp;
            return b.getTimestamp().compareTo(a.getTimestamp());
        });

        return todas.stream().map(AlertaResponse::toMap).collect(Collectors.toList());
    }

    @Transactional
    public Map<String, Object> resumenAlertas(Long usuarioId) {
        List<Map<String, Object>> alertas = generarAlertas(usuarioId);
        long urgentes = alertas.stream().filter(a -> "URGENTE".equals(a.get("tipo"))).count();
        long criticas = alertas.stream().filter(a -> "CRITICA".equals(a.get("tipo"))).count();
        long importantes = alertas.stream().filter(a -> "IMPORTANTE".equals(a.get("tipo"))).count();
        long avisos = alertas.stream().filter(a -> "AVISO".equals(a.get("tipo"))).count();
        long informativas = alertas.stream().filter(a -> "INFORMATIVA".equals(a.get("tipo"))).count();
        long exitos = alertas.stream().filter(a -> "EXITO".equals(a.get("tipo"))).count();
        long noLeidas = alertas.stream().filter(a -> !(Boolean) a.get("leida")).count();
        long completadasHoy = alertas.stream().filter(a -> {
            if (!"EXITO".equals(a.get("tipo"))) return false;
            String ts = (String) a.get("timestamp");
            if (ts == null) return false;
            return LocalDate.parse(ts.substring(0, 10)).equals(LocalDate.now());
        }).count();

        Map<String, Object> res = new LinkedHashMap<>();
        res.put("urgentes", urgentes);
        res.put("criticas", criticas);
        res.put("importantes", importantes);
        res.put("avisos", avisos);
        res.put("informativas", informativas);
        res.put("exitos", exitos);
        res.put("total", alertas.size());
        res.put("noLeidas", noLeidas);
        res.put("pendientes", noLeidas);
        res.put("completadasHoy", completadasHoy);
        return res;
    }

    public List<Map<String, Object>> actividadReciente(Long usuarioId, int limite) {
        List<EntityAuditoria> entries = auditoriaRepository.findAllFiltered(
            usuarioId, null, LocalDateTime.now().minusDays(7), LocalDateTime.now(),
            org.springframework.data.domain.PageRequest.of(0, limite, org.springframework.data.domain.Sort.by(org.springframework.data.domain.Sort.Direction.DESC, "fecha"))
        ).getContent();

        List<Map<String, Object>> result = new ArrayList<>();
        for (EntityAuditoria a : entries) {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("id", a.getId());
            m.put("accion", a.getAccion());
            m.put("modulo", a.getModulo());
            m.put("detalle", a.getDetalle());
            m.put("fecha", a.getFecha() != null ? a.getFecha().toString() : null);
            m.put("usuarioId", a.getUsuarioId());
            result.add(m);
        }
        return result;
    }

    @Transactional
    public void marcarLeida(Long usuarioId, String grupoId) {
        if (!alertaLeidaRepository.existsByUsuarioIdAndGrupoId(usuarioId, grupoId)) {
            EntityAlertaLeida e = new EntityAlertaLeida();
            e.setUsuarioId(usuarioId);
            e.setGrupoId(grupoId);
            e.setFechaLectura(LocalDateTime.now());
            alertaLeidaRepository.save(e);
        }
    }

    @Transactional
    public void marcarTodasLeidas(Long usuarioId) {
        List<Map<String, Object>> alertas = generarAlertas(usuarioId);
        for (Map<String, Object> a : alertas) {
            String grupoId = (String) a.get("grupoId");
            if (!alertaLeidaRepository.existsByUsuarioIdAndGrupoId(usuarioId, grupoId)) {
                EntityAlertaLeida e = new EntityAlertaLeida();
                e.setUsuarioId(usuarioId);
                e.setGrupoId(grupoId);
                e.setFechaLectura(LocalDateTime.now());
                alertaLeidaRepository.save(e);
            }
        }
    }

    private Integer ordenTipo(String tipo) {
        return switch (tipo) {
            case "URGENTE" -> 0;
            case "CRITICA" -> 1;
            case "IMPORTANTE" -> 2;
            case "AVISO" -> 3;
            case "INFORMATIVA" -> 4;
            case "EXITO" -> 5;
            default -> 6;
        };
    }

    private String hash(String input) {
        try {
            MessageDigest md = MessageDigest.getInstance("MD5");
            byte[] hash = md.digest(input.getBytes(StandardCharsets.UTF_8));
            StringBuilder sb = new StringBuilder();
            for (byte b : hash) sb.append(String.format("%02x", b));
            return sb.substring(0, 12);
        } catch (NoSuchAlgorithmException e) {
            return Integer.toHexString(input.hashCode());
        }
    }

    private String expiraEn(LocalDateTime desde, long horas) {
        return desde.plusHours(horas).toString();
    }

    private List<AlertaResponse> marcarLeidas(List<AlertaResponse> list, Set<String> leidas) {
        for (AlertaResponse a : list) {
            if (leidas.contains(a.getGrupoId())) a.setLeida(true);
        }
        return list;
    }

    private List<AlertaResponse> generarCheckOutVencidos(LocalDateTime ahora, Set<String> leidas) {
        List<AlertaResponse> list = new ArrayList<>();
        List<EntityHospedaje> activos = hospedajeRepository.findByEstadoOrderByFechaIngresoDesc(EstadoHospedaje.ACTIVO);
        for (EntityHospedaje h : activos) {
            LocalDateTime salida = h.getFechaSalidaProgramada();
            if (salida == null) continue;
            String cliente = h.getCliente() != null ? h.getCliente().getNombreCompleto() : "N/A";
            String hab = h.getHabitacion() != null ? h.getHabitacion().getNumero() : "N/A";
            String gid = hash("CHECKOUT_VENCIDO_" + h.getId());

            if (salida.isBefore(ahora)) {
                AlertaResponse a = AlertaResponse.urgente(gid,
                    "Check-out vencido — Hab " + hab,
                    cliente + " debió salir a las " + salida.format(java.time.format.DateTimeFormatter.ofPattern("HH:mm")),
                    "logout", "HOSPEDAJE", salida);
                a.setCategoria("CHECKOUT");
                a.setEntidadTipo("HOSPEDAJE");
                a.setEntidadId(h.getId());
                a.addAccion("Abrir Check-Out", "/recepcion/hospedajes", "HOSPEDAJE", h.getId());
                a.addAccion("Ver Hospedaje", "/recepcion/hospedajes", "HOSPEDAJE", h.getId());
                a.addAccion("Ver Cliente", "/recepcion/clientes", "CLIENTE", h.getCliente() != null ? h.getCliente().getId() : null);
                list.add(a);
            } else if (salida.isBefore(ahora.plusHours(2))) {
                AlertaResponse a = AlertaResponse.aviso(gid,
                    "Check-out próximo — Hab " + hab,
                    cliente + " — Salida programada: " + salida.format(java.time.format.DateTimeFormatter.ofPattern("HH:mm")),
                    "logout", "HOSPEDAJE", salida);
                a.setCategoria("CHECKOUT");
                a.setEntidadTipo("HOSPEDAJE");
                a.setEntidadId(h.getId());
                a.addAccion("Ver Hospedaje", "/recepcion/hospedajes", "HOSPEDAJE", h.getId());
                a.addAccion("Ver Cliente", "/recepcion/clientes", "CLIENTE", h.getCliente() != null ? h.getCliente().getId() : null);
                list.add(a);
            }
        }
        return marcarLeidas(list, leidas);
    }

    private List<AlertaResponse> generarDeudasPendientes(Set<String> leidas) {
        List<AlertaResponse> list = new ArrayList<>();
        List<EntityHospedaje> activos = hospedajeRepository.findByEstadoOrderByFechaIngresoDesc(EstadoHospedaje.ACTIVO);
        for (EntityHospedaje h : activos) {
            if (h.getDeudaPendiente() != null && h.getDeudaPendiente().compareTo(BigDecimal.ZERO) > 0) {
                String cliente = h.getCliente() != null ? h.getCliente().getNombreCompleto() : "N/A";
                String hab = h.getHabitacion() != null ? h.getHabitacion().getNumero() : "N/A";
                String gid = hash("DEUDA_" + h.getId());
                AlertaResponse a = AlertaResponse.importante(gid,
                    "Deuda: S/ " + h.getDeudaPendiente() + " — Hab " + hab,
                    "Cliente: " + cliente,
                    "payments", "HOSPEDAJE", h.getFechaIngreso());
                a.setCategoria("DEUDA");
                a.setEntidadTipo("HOSPEDAJE");
                a.setEntidadId(h.getId());
                a.addAccion("Registrar Pago", "/recepcion/pagos", "PAGO", h.getId());
                a.addAccion("Ver Hospedaje", "/recepcion/hospedajes", "HOSPEDAJE", h.getId());
                a.addAccion("Ver Cliente", "/recepcion/clientes", "CLIENTE", h.getCliente() != null ? h.getCliente().getId() : null);
                list.add(a);
            }
        }
        return marcarLeidas(list, leidas);
    }

    private List<AlertaResponse> generarIncidenciasActivas(Set<String> leidas) {
        List<AlertaResponse> list = new ArrayList<>();
        List<EntityIncidenciaHabitacion> activas = incidenciaRepository.findByFechaFinIsNullOrderByFechaInicioDesc();
        for (EntityIncidenciaHabitacion i : activas) {
            String hab = i.getHabitacion() != null ? i.getHabitacion().getNumero() : "N/A";
            String gid = hash("INCIDENCIA_" + i.getId());
            AlertaResponse a = AlertaResponse.critica(gid,
                "Incidencia: " + i.getTipo() + " — Hab " + hab,
                i.getMotivo(),
                "report", "INCIDENCIA", i.getFechaInicio());
            a.setCategoria("INCIDENCIA");
            a.setEntidadTipo("INCIDENCIA");
            a.setEntidadId(i.getId());
            a.addAccion("Resolver incidencia", "/recepcion/incidencias", "INCIDENCIA", i.getId());
            a.addAccion("Ver detalle", "/recepcion/incidencias", "INCIDENCIA", i.getId());
            list.add(a);
        }
        return marcarLeidas(list, leidas);
    }

    private List<AlertaResponse> generarMantenimiento(Set<String> leidas) {
        List<AlertaResponse> list = new ArrayList<>();
        List<EntityHabitacion> mantenimiento = habitacionRepository.findByEstadoAndActivoTrue(EstadoHabitacion.MANTENIMIENTO);
        for (EntityHabitacion h : mantenimiento) {
            String gid = hash("MANTENIMIENTO_" + h.getId());
            AlertaResponse a = AlertaResponse.importante(gid,
                "Fuera de servicio — Hab " + h.getNumero(),
                "Piso " + h.getPiso() + " (" + h.getTipo() + ")",
                "build", "HABITACION", LocalDateTime.now());
            a.setCategoria("MANTENIMIENTO");
            a.setEntidadTipo("HABITACION");
            a.setEntidadId(h.getId());
            a.addAccion("Ver Habitación", "/admin/habitaciones", "HABITACION", h.getId());
            a.addAccion("Finalizar mantenimiento", "/admin/habitaciones", "HABITACION", h.getId());
            list.add(a);
        }
        return marcarLeidas(list, leidas);
    }

    private List<AlertaResponse> generarCheckInHoy(LocalDate hoy, Set<String> leidas) {
        List<EntityReserva> reservasHoy = reservaRepository.findByFechaEntradaOrderByFechaReservaDesc(hoy);
        List<AlertaResponse> list = new ArrayList<>();
        int count = 0;
        String gid = hash("CHECKIN_HOY_" + hoy);
        for (EntityReserva r : reservasHoy) {
            if (r.getEstado() == EstadoReserva.CONFIRMADA) count++;
        }
        if (count > 0) {
            String desc = count == 1 ? "1 huésped espera ingreso hoy" : count + " huéspedes esperan ingreso hoy";
            AlertaResponse a = AlertaResponse.informativa(gid, "CHECK-INS PENDIENTES", desc, "login", "RESERVA", hoy.atStartOfDay());
            a.setCategoria("CHECKIN");
            a.setCantidad(count);
            a.setExpiracion(expiraEn(hoy.atStartOfDay(), 24));
            a.addAccion("Ver lista", "/recepcion/reservas", "RESERVA", null);
            a.addAccion("Abrir Check-In", "/recepcion/hospedajes", "HOSPEDAJE", null);
            list.add(a);
        }
        return marcarLeidas(list, leidas);
    }

    private List<AlertaResponse> generarCajaAbierta(Set<String> leidas) {
        List<EntityCaja> abiertas = cajaRepository.findByEstadoOrderByFechaAperturaDesc("ABIERTO");
        List<AlertaResponse> list = new ArrayList<>();
        for (EntityCaja c : abiertas) {
            String usuario = c.getUsuario() != null ? c.getUsuario().getNombreCompleto() : "N/A";
            String gid = hash("CAJA_ABIERTA_" + c.getId());
            AlertaResponse a = AlertaResponse.informativa(gid,
                "Caja abierta — " + usuario,
                "Apertura: S/ " + c.getMontoInicial() + " | Ingresos: S/ " + c.getTotalIngresos(),
                "account_balance", "CAJA", c.getFechaApertura());
            a.setCategoria("CAJA");
            a.setEntidadTipo("CAJA");
            a.setEntidadId(c.getId());
            a.addAccion("Ir a Caja", "/recepcion/caja", "CAJA", c.getId());
            a.addAccion("Cerrar Caja", "/recepcion/caja", "CAJA", c.getId());
            list.add(a);
        }
        return marcarLeidas(list, leidas);
    }

    private List<AlertaResponse> generarPagosAgrupados(LocalDateTime ahora, Set<String> leidas) {
        LocalDateTime inicio = ahora.minusHours(1);
        List<EntityPago> recientes = pagoRepository.findByFechaPagoBetweenOrderByFechaPagoDesc(inicio, ahora);
        if (recientes.isEmpty()) return List.of();

        String gid = hash("PAGOS_" + ahora.toLocalDate());
        BigDecimal total = recientes.stream().map(EntityPago::getMonto).reduce(BigDecimal.ZERO, BigDecimal::add);
        String desc = recientes.size() == 1
            ? "1 pago registrado — S/ " + total
            : recientes.size() + " pagos registrados — S/ " + total;
        AlertaResponse a = AlertaResponse.exito(gid, desc, "Cobros registrados en la última hora", "payments", "PAGO", ahora);
        a.setCategoria("PAGO");
        a.setCantidad(recientes.size());
        a.setExpiracion(expiraEn(ahora, 24));
        a.addAccion("Ver Pagos", "/recepcion/pagos", "PAGO", null);
        return marcarLeidas(List.of(a), leidas);
    }

    private List<AlertaResponse> generarClientesAgrupados(LocalDate hoy, Set<String> leidas) {
        LocalDateTime inicio = hoy.atStartOfDay();
        LocalDateTime fin = hoy.atTime(LocalTime.MAX);
        List<EntityCliente> nuevos = clienteRepository.findAllByOrderByCreatedAtDesc().stream()
            .filter(c -> c.getCreatedAt() != null && !c.getCreatedAt().isBefore(inicio) && c.getCreatedAt().isBefore(fin))
            .collect(Collectors.toList());
        if (nuevos.isEmpty()) return List.of();

        String gid = hash("CLIENTES_NUEVOS_" + hoy);
        String desc = nuevos.size() == 1
            ? "1 nuevo cliente registrado hoy"
            : nuevos.size() + " nuevos clientes registrados hoy";
        AlertaResponse a = AlertaResponse.exito(gid, desc, "Personas registradas hoy", "person_add", "CLIENTE", inicio);
        a.setCategoria("CLIENTE");
        a.setCantidad(nuevos.size());
        a.setExpiracion(expiraEn(inicio, 24));
        a.addAccion("Ver Clientes", "/recepcion/clientes", "CLIENTE", null);
        return marcarLeidas(List.of(a), leidas);
    }

    private List<AlertaResponse> generarDisponibilidadBaja(Set<String> leidas) {
        List<EntityHabitacion> activas = habitacionRepository.findByActivoTrueOrderByPisoAscNumeroAsc();
        long disponibles = activas.stream().filter(h -> h.getEstado() == EstadoHabitacion.DISPONIBLE).count();
        if (activas.isEmpty() || (disponibles * 100.0 / activas.size()) >= 20) return List.of();

        String gid = hash("DISPONIBILIDAD_BAJA");
        String desc = "Solo " + disponibles + "/" + activas.size() + " habitaciones disponibles";
        AlertaResponse a = AlertaResponse.importante(gid, desc, "Disponibilidad por debajo del 20%", "bed", "HABITACION", LocalDateTime.now());
        a.setCategoria("DISPONIBILIDAD");
        a.setCantidad((int) (activas.size() - disponibles));
        a.addAccion("Ver Habitaciones", "/admin/habitaciones", "HABITACION", null);
        a.addAccion("Ver Reservas", "/recepcion/reservas", "RESERVA", null);
        return marcarLeidas(List.of(a), leidas);
    }
}
