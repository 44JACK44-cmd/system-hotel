package com.hotel.apifds20261.business;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.hotel.apifds20261.exception.BusinessException;
import com.hotel.apifds20261.entity.EntityHabitacion;
import com.hotel.apifds20261.entity.EntityHospedaje;
import com.hotel.apifds20261.entity.EntityPago;
import com.hotel.apifds20261.entity.EntityReserva;
import com.hotel.apifds20261.repository.RepositoryHabitacion;
import com.hotel.apifds20261.repository.RepositoryHospedaje;
import com.hotel.apifds20261.repository.RepositoryIncidencia;
import com.hotel.apifds20261.repository.RepositoryPago;
import com.hotel.apifds20261.repository.RepositoryReserva;
import com.hotel.apifds20261.staticdata.EstadoHabitacion;
import com.hotel.apifds20261.staticdata.EstadoReserva;
import com.hotel.apifds20261.staticdata.MetodoPago;
import com.hotel.apifds20261.staticdata.TipoPago;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class BusinessReporte {

    private final RepositoryPago pagoRepository;
    private final RepositoryHospedaje hospedajeRepository;
    private final RepositoryReserva reservaRepository;
    private final RepositoryIncidencia incidenciaRepository;
    private final RepositoryHabitacion habitacionRepository;

    public Map<String, Object> ingresos(LocalDate inicio, LocalDate fin) {
        if (inicio == null || fin == null) {
            throw new BusinessException("Las fechas de inicio y fin son requeridas");
        }
        if (inicio.isAfter(fin)) {
            throw new BusinessException("La fecha de inicio no puede ser posterior a la fecha de fin");
        }
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
        result.put("detalles", buildDetalles(pagos));
        return result;
    }

    private List<Map<String, Object>> buildDetalles(List<EntityPago> pagos) {
        List<Map<String, Object>> detalles = new ArrayList<>();
        for (EntityPago p : pagos) {
            Map<String, Object> d = new LinkedHashMap<>();
            d.put("fecha", p.getFechaPago() != null ? p.getFechaPago().toString() : "");
            String habitacion = "";
            String cliente = "";
            if (p.getHospedaje() != null) {
                habitacion = p.getHospedaje().getHabitacion() != null ? p.getHospedaje().getHabitacion().getNumero() : "";
                cliente = p.getHospedaje().getCliente() != null ? p.getHospedaje().getCliente().getNombreCompleto() : "";
            } else if (p.getReserva() != null) {
                habitacion = p.getReserva().getHabitacion() != null ? p.getReserva().getHabitacion().getNumero() : "";
                cliente = p.getReserva().getCliente() != null ? p.getReserva().getCliente().getNombreCompleto() : "";
            }
            d.put("habitacion", habitacion);
            d.put("cliente", cliente);
            d.put("monto", p.getMonto());
            d.put("metodo", p.getMetodo() != null ? p.getMetodo().name() : "");
            d.put("tipo", p.getTipo() != null ? p.getTipo().name() : "");
            detalles.add(d);
        }
        return detalles;
    }

    public Map<String, Object> ingresosPorMetodo(LocalDate inicio, LocalDate fin) {
        if (inicio == null || fin == null) {
            throw new BusinessException("Las fechas de inicio y fin son requeridas");
        }
        if (inicio.isAfter(fin)) {
            throw new BusinessException("La fecha de inicio no puede ser posterior a la fecha de fin");
        }
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
        if (inicio == null || fin == null) {
            throw new BusinessException("Las fechas de inicio y fin son requeridas");
        }
        if (inicio.isAfter(fin)) {
            throw new BusinessException("La fecha de inicio no puede ser posterior a la fecha de fin");
        }
        LocalDateTime inicioDT = inicio.atStartOfDay();
        LocalDateTime finDT = fin.plusDays(1).atStartOfDay();
        List<EntityReserva> noConcretadas = reservaRepository.findByFechaReservaBetweenAndEstadoIn(
                inicioDT, finDT, List.of(EstadoReserva.CANCELADA, EstadoReserva.NO_SHOW));

        long canceladas = 0;
        long noShow = 0;
        BigDecimal adelantoPerdidoCanceladas = BigDecimal.ZERO;
        BigDecimal adelantoPerdidoNoShow = BigDecimal.ZERO;

        for (EntityReserva r : noConcretadas) {
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
        // Usamos query nativa para evitar IllegalArgumentException cuando la BD
        // contiene valores de 'tipo' legacy (ej: 'LIMPIEZA') que ya no están
        // en el enum TipoIncidencia actual.
        List<Object[]> rows = incidenciaRepository.findAllForReporte();
        List<Map<String, Object>> list = new ArrayList<>();
        for (Object[] row : rows) {
            // índices: 0=habitacion, 1=tipo, 2=motivo, 3=fechaInicio, 4=fechaFin
            String habitacion = row[0] != null ? row[0].toString() : "N/A";
            String tipo       = row[1] != null ? row[1].toString() : "DESCONOCIDO";
            String motivo     = row[2] != null ? row[2].toString() : "";
            Object rawInicio = row[3];
            LocalDateTime fechaInicio = null;
            if (rawInicio instanceof java.sql.Timestamp ts) {
                fechaInicio = ts.toLocalDateTime();
            } else if (rawInicio instanceof java.time.LocalDateTime ldt) {
                fechaInicio = ldt;
            }

            Object rawFin = row[4];
            LocalDateTime fechaFin = null;
            if (rawFin instanceof java.sql.Timestamp ts) {
                fechaFin = ts.toLocalDateTime();
            } else if (rawFin instanceof java.time.LocalDateTime ldt) {
                fechaFin = ldt;
            }

            Map<String, Object> m = new LinkedHashMap<>();
            m.put("habitacion", habitacion);
            m.put("tipo", tipo);
            m.put("motivo", motivo);
            m.put("fechaInicio", fechaInicio);
            m.put("fechaFin", fechaFin);
            m.put("duracionHoras", (fechaInicio != null && fechaFin != null)
                    ? Duration.between(fechaInicio, fechaFin).toHours()
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

    public List<Map<String, Object>> tendenciaOcupacion(LocalDate inicio, LocalDate fin) {
        if (inicio == null || fin == null) {
            throw new BusinessException("Las fechas de inicio y fin son requeridas");
        }
        if (inicio.isAfter(fin)) {
            throw new BusinessException("La fecha de inicio no puede ser posterior a la fecha de fin");
        }

        long totalHabitaciones = habitacionRepository.findByActivoTrueOrderByPisoAscNumeroAsc().size();

        LocalDateTime inicioStart = inicio.atStartOfDay();
        LocalDateTime finEnd = fin.plusDays(1).atStartOfDay();

        List<EntityHospedaje> hospedajes = hospedajeRepository.findHospedajesEnRango(inicioStart, finEnd);

        List<Map<String, Object>> result = new ArrayList<>();
        for (LocalDate d = inicio; !d.isAfter(fin); d = d.plusDays(1)) {
            LocalDate target = d;

            long ocupadas = hospedajes.stream()
                .filter(h -> {
                    LocalDate ingreso = h.getFechaIngreso().toLocalDate();
                    LocalDate salidaReal = h.getFechaSalidaReal() != null
                        ? h.getFechaSalidaReal().toLocalDate() : null;
                    return !ingreso.isAfter(target)
                        && (salidaReal == null || !salidaReal.isBefore(target));
                })
                .map(h -> h.getHabitacion().getId())
                .distinct()
                .count();

            long disponibles = totalHabitaciones - ocupadas;
            BigDecimal porcentaje = totalHabitaciones > 0
                ? BigDecimal.valueOf(ocupadas)
                    .multiply(BigDecimal.valueOf(100))
                    .divide(BigDecimal.valueOf(totalHabitaciones), 2, RoundingMode.HALF_UP)
                : BigDecimal.ZERO;

            Map<String, Object> item = new LinkedHashMap<>();
            item.put("fecha", d.toString());
            item.put("habitacionesOcupadas", ocupadas);
            item.put("habitacionesDisponibles", disponibles);
            item.put("totalHabitaciones", totalHabitaciones);
            item.put("porcentaje", porcentaje);
            result.add(item);
        }

        return result;
    }
}
