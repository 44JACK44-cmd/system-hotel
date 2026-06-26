package com.hotel.apifds20261.business;

import java.math.BigDecimal;
import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import org.springframework.stereotype.Service;

import com.hotel.apifds20261.staticdata.EstadoHabitacion;
import com.hotel.apifds20261.staticdata.EstadoReserva;
import com.hotel.apifds20261.entity.EntityHabitacion;
import com.hotel.apifds20261.entity.EntityHospedaje;
import com.hotel.apifds20261.entity.EntityIncidenciaHabitacion;
import com.hotel.apifds20261.entity.EntityPago;
import com.hotel.apifds20261.entity.EntityReserva;
import com.hotel.apifds20261.staticdata.MetodoPago;
import com.hotel.apifds20261.staticdata.TipoPago;
import com.hotel.apifds20261.repository.RepositoryHabitacion;
import com.hotel.apifds20261.repository.RepositoryHospedaje;
import com.hotel.apifds20261.repository.RepositoryIncidencia;
import com.hotel.apifds20261.repository.RepositoryPago;
import com.hotel.apifds20261.repository.RepositoryReserva;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class BusinessReporte {

    private final RepositoryPago pagoRepository;
    private final RepositoryHospedaje hospedajeRepository;
    private final RepositoryReserva reservaRepository;
    private final RepositoryIncidencia incidenciaRepository;
    private final RepositoryHabitacion habitacionRepository;

    public Map<String, Object> ingresos(LocalDate inicio, LocalDate fin) {
        LocalDateTime inicioDt = inicio.atStartOfDay();
        LocalDateTime finDt = fin.atTime(LocalTime.MAX);

        List<EntityPago> pagos = pagoRepository.findByFechaPagoBetweenOrderByFechaPagoDesc(inicioDt, finDt);

        BigDecimal total = BigDecimal.ZERO;
        BigDecimal totalAdelantos = BigDecimal.ZERO;
        BigDecimal totalSaldos = BigDecimal.ZERO;
        BigDecimal totalExtensiones = BigDecimal.ZERO;
        BigDecimal totalYape = BigDecimal.ZERO;
        BigDecimal totalEfectivo = BigDecimal.ZERO;

        for (EntityPago p : pagos) {
            total = total.add(p.getMonto());
            if (p.getTipo() == TipoPago.ADELANTO) {
                totalAdelantos = totalAdelantos.add(p.getMonto());
            } else if (p.getTipo() == TipoPago.SALDO) {
                totalSaldos = totalSaldos.add(p.getMonto());
            } else if (p.getTipo() == TipoPago.EXTENSION) {
                totalExtensiones = totalExtensiones.add(p.getMonto());
            }
            if (p.getMetodo() == MetodoPago.YAPE) {
                totalYape = totalYape.add(p.getMonto());
            } else if (p.getMetodo() == MetodoPago.EFECTIVO) {
                totalEfectivo = totalEfectivo.add(p.getMonto());
            }
        }

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("periodoInicio", inicio.toString());
        result.put("periodoFin", fin.toString());
        result.put("total", total);
        result.put("totalAdelantos", totalAdelantos);
        result.put("totalSaldos", totalSaldos);
        result.put("totalExtensiones", totalExtensiones);
        result.put("totalYape", totalYape);
        result.put("totalEfectivo", totalEfectivo);
        return result;
    }

    public Map<String, Object> ingresosPorMetodo(LocalDate inicio, LocalDate fin) {
        LocalDateTime inicioDt = inicio.atStartOfDay();
        LocalDateTime finDt = fin.atTime(LocalTime.MAX);

        List<EntityPago> pagos = pagoRepository.findByFechaPagoBetweenOrderByFechaPagoDesc(inicioDt, finDt);

        BigDecimal totalYape = BigDecimal.ZERO;
        BigDecimal totalEfectivo = BigDecimal.ZERO;

        for (EntityPago p : pagos) {
            if (p.getMetodo() == MetodoPago.YAPE) {
                totalYape = totalYape.add(p.getMonto());
            } else if (p.getMetodo() == MetodoPago.EFECTIVO) {
                totalEfectivo = totalEfectivo.add(p.getMonto());
            }
        }

        BigDecimal total = totalYape.add(totalEfectivo);

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("yape", totalYape);
        result.put("efectivo", totalEfectivo);
        result.put("total", total);
        result.put("porcentajeYape", total.compareTo(BigDecimal.ZERO) > 0
                ? totalYape.multiply(BigDecimal.valueOf(100)).divide(total, 2, java.math.RoundingMode.HALF_UP) : 0);
        result.put("porcentajeEfectivo", total.compareTo(BigDecimal.ZERO) > 0
                ? totalEfectivo.multiply(BigDecimal.valueOf(100)).divide(total, 2, java.math.RoundingMode.HALF_UP) : 0);
        return result;
    }

    public Map<String, Object> ocupacion(LocalDate fecha) {
        List<EntityHabitacion> todas = habitacionRepository.findByActivoTrueOrderByPisoAscNumeroAsc();
        long total = todas.size();
        long ocupadas = 0;
        for (EntityHabitacion h : todas) {
            if (h.getEstado() == EstadoHabitacion.OCUPADA) {
                ocupadas++;
            }
        }

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("fecha", fecha.toString());
        result.put("totalHabitaciones", total);
        result.put("ocupadas", ocupadas);
        result.put("disponibles", total - ocupadas);
        result.put("porcentajeOcupacion", total > 0
                ? BigDecimal.valueOf(ocupadas).multiply(BigDecimal.valueOf(100))
                        .divide(BigDecimal.valueOf(total), 2, java.math.RoundingMode.HALF_UP) : 0);
        return result;
    }

    public Map<String, Object> reservasNoConcretadas(LocalDate inicio, LocalDate fin) {
        List<EntityReserva> todas = reservaRepository.findAllByOrderByFechaReservaDesc();
        List<EntityReserva> filtradas = new ArrayList<>();
        for (EntityReserva r : todas) {
            LocalDate fechaReserva = r.getFechaReserva().toLocalDate();
            if (!fechaReserva.isBefore(inicio) && !fechaReserva.isAfter(fin)) {
                filtradas.add(r);
            }
        }

        long canceladas = 0;
        long noShow = 0;
        BigDecimal adelantoPerdidoCanceladas = BigDecimal.ZERO;
        BigDecimal adelantoPerdidoNoShow = BigDecimal.ZERO;

        for (EntityReserva r : filtradas) {
            if (r.getEstado() == EstadoReserva.CANCELADA) {
                canceladas++;
                adelantoPerdidoCanceladas = adelantoPerdidoCanceladas.add(r.getMontoAdelanto());
            } else if (r.getEstado() == EstadoReserva.NO_SHOW) {
                noShow++;
                adelantoPerdidoNoShow = adelantoPerdidoNoShow.add(r.getMontoAdelanto());
            }
        }

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("canceladas", canceladas);
        result.put("noShow", noShow);
        result.put("totalNoConcretadas", canceladas + noShow);
        result.put("adelantoPerdidoCanceladas", adelantoPerdidoCanceladas);
        result.put("adelantoPerdidoNoShow", adelantoPerdidoNoShow);
        result.put("totalAdelantoPerdido", adelantoPerdidoCanceladas.add(adelantoPerdidoNoShow));
        return result;
    }

    public List<Map<String, Object>> historialIncidencias() {
        List<EntityIncidenciaHabitacion> entities = incidenciaRepository.findAllByOrderByFechaInicioDesc();
        List<Map<String, Object>> list = new ArrayList<>();
        for (EntityIncidenciaHabitacion i : entities) {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("habitacion", i.getHabitacion().getNumero());
            m.put("tipo", i.getTipo().name());
            m.put("motivo", i.getMotivo());
            m.put("fechaInicio", i.getFechaInicio());
            m.put("fechaFin", i.getFechaFin());
            m.put("duracionHoras", i.getFechaFin() != null
                    ? Duration.between(i.getFechaInicio(), i.getFechaFin()).toHours()
                    : null);
            list.add(m);
        }
        return list;
    }

    public List<Map<String, Object>> rankingHabitaciones() {
        List<EntityHospedaje> todos = hospedajeRepository.findAllByOrderByFechaIngresoDesc();

        Map<Long, List<EntityHospedaje>> porHabitacion = new LinkedHashMap<>();
        for (EntityHospedaje h : todos) {
            Long habId = h.getHabitacion().getId();
            if (!porHabitacion.containsKey(habId)) {
                porHabitacion.put(habId, new ArrayList<>());
            }
            porHabitacion.get(habId).add(h);
        }

        List<Map<String, Object>> rankings = new ArrayList<>();
        for (Map.Entry<Long, List<EntityHospedaje>> entry : porHabitacion.entrySet()) {
            EntityHabitacion h = entry.getValue().get(0).getHabitacion();
            long veces = entry.getValue().size();
            BigDecimal ingreso = BigDecimal.ZERO;
            for (EntityHospedaje ho : entry.getValue()) {
                if (ho.getTotalPagado() != null) {
                    ingreso = ingreso.add(ho.getTotalPagado());
                }
            }
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("habitacionId", h.getId());
            m.put("numero", h.getNumero());
            m.put("tipo", h.getTipo().name());
            m.put("vecesReservada", veces);
            m.put("ingresoGenerado", ingreso);
            rankings.add(m);
        }

        rankings.sort((a, b) -> Long.compare((Long) b.get("vecesReservada"), (Long) a.get("vecesReservada")));
        return rankings;
    }
}
