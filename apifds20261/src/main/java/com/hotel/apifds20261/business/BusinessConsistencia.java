package com.hotel.apifds20261.business;

import com.hotel.apifds20261.entity.EntityCaja;
import com.hotel.apifds20261.entity.EntityEgreso;
import com.hotel.apifds20261.entity.EntityHabitacion;
import com.hotel.apifds20261.entity.EntityHospedaje;
import com.hotel.apifds20261.entity.EntityIncidenciaHabitacion;
import com.hotel.apifds20261.entity.EntityPago;
import com.hotel.apifds20261.entity.EntityReserva;
import com.hotel.apifds20261.repository.RepositoryCaja;
import com.hotel.apifds20261.repository.RepositoryEgreso;
import com.hotel.apifds20261.repository.RepositoryHabitacion;
import com.hotel.apifds20261.repository.RepositoryHospedaje;
import com.hotel.apifds20261.repository.RepositoryIncidencia;
import com.hotel.apifds20261.repository.RepositoryPago;
import com.hotel.apifds20261.repository.RepositoryReserva;
import com.hotel.apifds20261.staticdata.EstadoHabitacion;
import com.hotel.apifds20261.staticdata.EstadoHospedaje;
import com.hotel.apifds20261.staticdata.EstadoReserva;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Auditoria de integridad de la base de datos.
 * Genera un reporte de inconsistencias entre habitaciones, hospedajes,
 * reservas, pagos, caja e incidencias.
 */
@Service
@RequiredArgsConstructor
public class BusinessConsistencia {

    private final RepositoryHabitacion habitacionRepository;
    private final RepositoryHospedaje hospedajeRepository;
    private final RepositoryReserva reservaRepository;
    private final RepositoryPago pagoRepository;
    private final RepositoryIncidencia incidenciaRepository;
    private final RepositoryCaja cajaRepository;
    private final RepositoryEgreso egresoRepository;

    public Map<String, Object> auditar() {
        Map<String, Object> reporte = new LinkedHashMap<>();
        List<Map<String, Object>> inconsistencias = new ArrayList<>();

        auditarHabitacionesYHospedajes(inconsistencias);
        auditarDeudasNegativas(inconsistencias);
        auditarPagosHuerfanos(inconsistencias);
        auditarReservasSuperpuestas(inconsistencias);
        auditarIncidenciasSinHabitacion(inconsistencias);
        auditarCaja(inconsistencias);

        reporte.put("fechaAuditoria", LocalDateTime.now().toString());
        reporte.put("totalInconsistencias", inconsistencias.size());
        reporte.put("inconsistencias", inconsistencias);
        return reporte;
    }

    private void auditarHabitacionesYHospedajes(List<Map<String, Object>> inconsistencias) {
        List<EntityHabitacion> habitaciones = habitacionRepository.findAllByOrderByPisoAscNumeroAsc();
        List<EntityHospedaje> activos = hospedajeRepository.findByEstadoOrderByFechaIngresoDesc(EstadoHospedaje.ACTIVO);

        // Map: habitacionId -> lista de hospedajes activos
        Map<Long, List<EntityHospedaje>> activosPorHabitacion = new LinkedHashMap<>();
        Map<Long, List<EntityHospedaje>> activosPorCliente = new LinkedHashMap<>();
        for (EntityHospedaje h : activos) {
            activosPorHabitacion.computeIfAbsent(h.getHabitacion().getId(), k -> new ArrayList<>()).add(h);
            activosPorCliente.computeIfAbsent(h.getCliente().getId(), k -> new ArrayList<>()).add(h);
        }

        for (Map.Entry<Long, List<EntityHospedaje>> e : activosPorHabitacion.entrySet()) {
            if (e.getValue().size() > 1) {
                inconsistencias.add(registro("HOSPEDAJE_DUPLICADO_HABITACION",
                        "La habitacion #" + e.getKey() + " tiene " + e.getValue().size() +
                                " hospedajes ACTIVOS simultaneos"));
            }
        }
        for (Map.Entry<Long, List<EntityHospedaje>> e : activosPorCliente.entrySet()) {
            if (e.getValue().size() > 1) {
                inconsistencias.add(registro("HOSPEDAJE_DUPLICADO_CLIENTE",
                        "El cliente #" + e.getKey() + " tiene " + e.getValue().size() +
                                " hospedajes ACTIVOS simultaneos"));
            }
        }

        for (EntityHabitacion hab : habitaciones) {
            boolean tieneActivo = activosPorHabitacion.containsKey(hab.getId());
            String estado = hab.getEstado().name();
            switch (estado) {
                case "DISPONIBLE", "SUCIA", "LIMPIEZA", "MANTENIMIENTO":
                    if (tieneActivo) {
                        inconsistencias.add(registro("HABITACION_" + estado + "_CON_HOSPEDAJE",
                                "Habitacion " + hab.getNumero() + " esta " + estado + " pero posee hospedaje ACTIVO"));
                    }
                    break;
                case "OCUPADA":
                    if (!tieneActivo) {
                        inconsistencias.add(registro("HABITACION_OCUPADA_SIN_HOSPEDAJE",
                                "Habitacion " + hab.getNumero() + " esta OCUPADA pero no posee hospedaje ACTIVO"));
                    }
                    break;
                default:
                    inconsistencias.add(registro("HABITACION_ESTADO_INVALIDO",
                            "Habitacion " + hab.getNumero() + " tiene un estado imposible: " + estado));
                    break;
            }
        }
    }

    private void auditarDeudasNegativas(List<Map<String, Object>> inconsistencias) {
        for (EntityHospedaje h : hospedajeRepository.findAllByOrderByFechaIngresoDesc()) {
            if (h.getDeudaPendiente() != null && h.getDeudaPendiente().compareTo(BigDecimal.ZERO) < 0) {
                inconsistencias.add(registro("DEUDA_NEGATIVA",
                        "Hospedaje #" + h.getId() + " tiene deuda negativa: S/ " + h.getDeudaPendiente()));
            }
            if (h.getTotalPagado() != null && h.getTotalPagado().compareTo(BigDecimal.ZERO) < 0) {
                inconsistencias.add(registro("PAGADO_NEGATIVO",
                        "Hospedaje #" + h.getId() + " tiene total pagado negativo: S/ " + h.getTotalPagado()));
            }
        }
        for (EntityReserva r : reservaRepository.findAllByOrderByFechaReservaDesc()) {
            if (r.getMontoTotal() != null && r.getMontoTotal().compareTo(BigDecimal.ZERO) <= 0) {
                inconsistencias.add(registro("RESERVA_MONTO_INVALIDO",
                        "Reserva #" + r.getId() + " tiene monto total no positivo: " + r.getMontoTotal()));
            }
        }
    }

    private void auditarPagosHuerfanos(List<Map<String, Object>> inconsistencias) {
        for (EntityPago p : pagoRepository.findAllByOrderByFechaPagoDesc()) {
            if (p.getReserva() == null && p.getHospedaje() == null) {
                inconsistencias.add(registro("PAGO_HUERFANO",
                        "Pago #" + p.getId() + " no esta asociado a ninguna reserva ni hospedaje"));
            }
            if (p.getMonto() == null || p.getMonto().compareTo(BigDecimal.ZERO) <= 0) {
                inconsistencias.add(registro("PAGO_MONTO_INVALIDO",
                        "Pago #" + p.getId() + " tiene monto no positivo"));
            }
        }
    }

    private void auditarReservasSuperpuestas(List<Map<String, Object>> inconsistencias) {
        List<EntityReserva> confirmadas = reservaRepository.findByEstadoOrderByFechaReservaDesc(EstadoReserva.CONFIRMADA);
        for (int i = 0; i < confirmadas.size(); i++) {
            EntityReserva a = confirmadas.get(i);
            for (int j = i + 1; j < confirmadas.size(); j++) {
                EntityReserva b = confirmadas.get(j);
                if (a.getHabitacion().getId().equals(b.getHabitacion().getId()) &&
                        a.getFechaEntrada().isBefore(b.getFechaSalida()) &&
                        b.getFechaEntrada().isBefore(a.getFechaSalida())) {
                    inconsistencias.add(registro("RESERVAS_SUPERPUESTAS",
                            "Reservas #" + a.getId() + " y #" + b.getId() +
                                    " se superponen para la habitacion " + a.getHabitacion().getNumero()));
                }
                if (a.getCliente().getId().equals(b.getCliente().getId()) &&
                        a.getFechaEntrada().isBefore(b.getFechaSalida()) &&
                        b.getFechaEntrada().isBefore(a.getFechaSalida())) {
                    inconsistencias.add(registro("RESERVAS_CLIENTE_SUPERPUESTAS",
                            "Reservas #" + a.getId() + " y #" + b.getId() +
                                    " del cliente #" + a.getCliente().getId() + " se superponen"));
                }
            }
        }
    }

    private void auditarIncidenciasSinHabitacion(List<Map<String, Object>> inconsistencias) {
        for (EntityIncidenciaHabitacion i : incidenciaRepository.findAllByOrderByFechaInicioDesc()) {
            if (i.getHabitacion() == null) {
                inconsistencias.add(registro("INCIDENCIA_SIN_HABITACION",
                        "Incidencia #" + i.getId() + " no tiene habitacion asociada"));
            }
            if (i.getFechaFin() != null && i.getFechaFin().isBefore(i.getFechaInicio())) {
                inconsistencias.add(registro("INCIDENCIA_FECHAS_INVALIDAS",
                        "Incidencia #" + i.getId() + " tiene fecha de fin anterior a la de inicio"));
            }
        }
    }

    private void auditarCaja(List<Map<String, Object>> inconsistencias) {
        List<EntityCaja> cajas = cajaRepository.findAllByOrderByFechaAperturaDesc();
        for (EntityCaja caja : cajas) {
            LocalDateTime inicio = caja.getFechaApertura();
            LocalDateTime fin = caja.getFechaCierre() != null ? caja.getFechaCierre() : LocalDateTime.now();

            BigDecimal ingresos = BigDecimal.ZERO;
            for (EntityPago p : pagoRepository.findByFechaPagoBetweenOrderByFechaPagoDesc(inicio, fin)) {
                ingresos = ingresos.add(p.getMonto());
            }

            BigDecimal egresos = BigDecimal.ZERO;
            for (EntityEgreso e : egresoRepository.findByFechaRegistroBetweenOrderByFechaRegistroDesc(inicio, fin)) {
                egresos = egresos.add(e.getMonto());
            }

            BigDecimal balanceEsperado = (caja.getMontoInicial() != null ? caja.getMontoInicial() : BigDecimal.ZERO)
                    .add(ingresos).subtract(egresos);

            BigDecimal balanceRegistrado = caja.getBalanceFinal() != null ? caja.getBalanceFinal() : BigDecimal.ZERO;
            if (balanceEsperado.compareTo(balanceRegistrado) != 0) {
                inconsistencias.add(registro("CAJA_DESCUADRADA",
                        "Caja #" + caja.getId() + " balance esperado S/ " + balanceEsperado +
                                " vs registrado S/ " + balanceRegistrado +
                                " (posible recalculacion pendiente. Consulte GET /api/caja/actual)"));
            }
        }
    }

    private Map<String, Object> registro(String tipo, String detalle) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("tipo", tipo);
        m.put("detalle", detalle);
        return m;
    }
}
