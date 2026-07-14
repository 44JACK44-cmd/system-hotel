package com.hotel.apifds20261.business;

import com.hotel.apifds20261.dto.response.CajaResponse;
import com.hotel.apifds20261.entity.*;
import com.hotel.apifds20261.exception.BusinessException;
import com.hotel.apifds20261.exception.ResourceNotFoundException;
import com.hotel.apifds20261.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class BusinessCaja {

    private final RepositoryCaja cajaRepository;
    private final RepositoryPago pagoRepository;
    private final RepositoryEgreso egresoRepository;
    private final RepositoryUsuario usuarioRepository;

    public CajaResponse obtenerActual() {
        List<EntityCaja> abiertas = cajaRepository.findByEstadoOrderByFechaAperturaDesc("ABIERTO");
        if (abiertas.isEmpty()) {
            return null;
        }
        EntityCaja caja = abiertas.get(0);
        recalcular(caja);
        return toResponse(caja);
    }

    public List<CajaResponse> historial() {
        List<EntityCaja> entities = cajaRepository.findAllByOrderByFechaAperturaDesc();
        List<CajaResponse> list = new ArrayList<>();
        for (EntityCaja c : entities) {
            list.add(toResponse(c));
        }
        return list;
    }

    @Transactional
    public CajaResponse abrir(Long usuarioId, BigDecimal montoInicial) {
        List<EntityCaja> abiertas = cajaRepository.findByEstadoOrderByFechaAperturaDesc("ABIERTO");
        if (!abiertas.isEmpty()) {
            throw new BusinessException("Ya existe una caja abierta. Debe cerrarla antes de abrir una nueva.");
        }

        EntityUsuario usuario = usuarioRepository.findById(usuarioId).orElse(null);
        if (usuario == null) {
            throw new ResourceNotFoundException("Usuario no encontrado");
        }

        EntityCaja caja = new EntityCaja();
        caja.setUsuario(usuario);
        caja.setFechaApertura(LocalDateTime.now());
        caja.setMontoInicial(montoInicial != null ? montoInicial : BigDecimal.ZERO);
        caja.setTotalIngresos(BigDecimal.ZERO);
        caja.setTotalEgresos(BigDecimal.ZERO);
        caja.setBalanceFinal(BigDecimal.ZERO);
        caja.setEstado("ABIERTO");

        return toResponse(cajaRepository.save(caja));
    }

    @Transactional
    public CajaResponse cerrar(Long cajaId, BigDecimal montoFisicoEfectivo, String observacion, Long usuarioId) {
        EntityCaja caja = cajaRepository.findById(cajaId).orElse(null);
        if (caja == null) {
            throw new ResourceNotFoundException("Caja no encontrada");
        }
        if (!"ABIERTO".equals(caja.getEstado())) {
            throw new BusinessException("La caja ya esta cerrada");
        }

        recalcular(caja);

        caja.setFechaCierre(LocalDateTime.now());
        caja.setEstado("CERRADO");
        caja.setObservacion(observacion);

        if (montoFisicoEfectivo != null) {
            BigDecimal diferencia = caja.getBalanceFinal().subtract(montoFisicoEfectivo);
            if (diferencia.compareTo(BigDecimal.ZERO) != 0) {
                if (observacion == null || observacion.isBlank()) {
                    throw new BusinessException("Hay una diferencia de S/ " + diferencia +
                            " entre el sistema y el efectivo fisico. Agregue una observacion.");
                }
            }
        }

        return toResponse(cajaRepository.save(caja));
    }

    private void recalcular(EntityCaja caja) {
        LocalDate hoy = caja.getFechaApertura().toLocalDate();
        LocalDateTime inicio = hoy.atStartOfDay();
        LocalDateTime fin = hoy.atTime(LocalTime.MAX);

        List<EntityPago> pagos = pagoRepository.findByFechaPagoBetweenOrderByFechaPagoDesc(inicio, fin);
        List<EntityEgreso> egresos = egresoRepository.findByFechaRegistroBetweenOrderByFechaRegistroDesc(inicio, fin);

        BigDecimal totalIngresos = BigDecimal.ZERO;
        BigDecimal totalEgresos = BigDecimal.ZERO;

        for (EntityPago p : pagos) {
            totalIngresos = totalIngresos.add(p.getMonto());
        }
        for (EntityEgreso e : egresos) {
            totalEgresos = totalEgresos.add(e.getMonto());
        }

        caja.setTotalIngresos(totalIngresos);
        caja.setTotalEgresos(totalEgresos);
        caja.setBalanceFinal(caja.getMontoInicial().add(totalIngresos).subtract(totalEgresos));

        cajaRepository.save(caja);
    }

    private CajaResponse toResponse(EntityCaja c) {
        CajaResponse r = new CajaResponse();
        r.setId(c.getId());
        r.setUsuarioId(c.getUsuario().getId());
        r.setUsuarioNombre(c.getUsuario().getNombreCompleto());
        r.setFechaApertura(c.getFechaApertura());
        r.setFechaCierre(c.getFechaCierre());
        r.setMontoInicial(c.getMontoInicial());
        r.setTotalIngresos(c.getTotalIngresos());
        r.setTotalEgresos(c.getTotalEgresos());
        r.setBalanceFinal(c.getBalanceFinal());
        r.setEstado(c.getEstado());
        r.setObservacion(c.getObservacion());
        return r;
    }
}
