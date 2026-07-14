package com.hotel.apifds20261.business;

import com.hotel.apifds20261.dto.request.RequestPagoInsert;
import com.hotel.apifds20261.dto.response.PagoResponse;
import com.hotel.apifds20261.entity.*;
import com.hotel.apifds20261.staticdata.*;
import com.hotel.apifds20261.exception.BusinessException;
import com.hotel.apifds20261.exception.ResourceNotFoundException;
import com.hotel.apifds20261.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class BusinessPago {

    private final RepositoryPago pagoRepository;
    private final RepositoryReserva reservaRepository;
    private final RepositoryHospedaje hospedajeRepository;
    private final RepositoryUsuario usuarioRepository;

    public List<PagoResponse> listarTodos() {
        List<EntityPago> entities = pagoRepository.findAllByOrderByFechaPagoDesc();
        List<PagoResponse> list = new ArrayList<>();
        for (EntityPago p : entities) {
            list.add(toResponse(p));
        }
        return list;
    }

    public PagoResponse obtenerPorId(Long id) {
        EntityPago p = pagoRepository.findById(id).orElse(null);
        if (p == null) {
            throw new ResourceNotFoundException("Pago no encontrado");
        }
        return toResponse(p);
    }

    public List<PagoResponse> listarPorReserva(Long reservaId) {
        List<EntityPago> entities = pagoRepository.findByReservaIdOrderByFechaPagoDesc(reservaId);
        List<PagoResponse> list = new ArrayList<>();
        for (EntityPago p : entities) {
            list.add(toResponse(p));
        }
        return list;
    }

    public List<PagoResponse> listarPorHospedaje(Long hospedajeId) {
        List<EntityPago> entities = pagoRepository.findByHospedajeIdOrderByFechaPagoDesc(hospedajeId);
        List<PagoResponse> list = new ArrayList<>();
        for (EntityPago p : entities) {
            list.add(toResponse(p));
        }
        return list;
    }

    @Transactional
    public PagoResponse registrar(RequestPagoInsert request, Long usuarioId) {
        if (request.getReservaId() == null && request.getHospedajeId() == null) {
            throw new BusinessException("Debe asociar el pago a una reserva o a un hospedaje");
        }
        if (request.getMonto().compareTo(java.math.BigDecimal.ZERO) <= 0) {
            throw new BusinessException("El monto debe ser mayor a cero");
        }

        EntityUsuario usuario = usuarioRepository.findById(usuarioId).orElse(null);
        if (usuario == null) {
            throw new ResourceNotFoundException("Usuario no encontrado");
        }

        EntityPago pago = new EntityPago();
        pago.setUsuario(usuario);
        pago.setMonto(request.getMonto());
        pago.setMetodo(MetodoPago.valueOf(request.getMetodo()));
        pago.setTipo(TipoPago.valueOf(request.getTipo()));
        pago.setReferencia(request.getReferencia());
        pago.setFechaPago(LocalDateTime.now());
        pago.setObservacion(request.getObservacion());

        if (request.getReservaId() != null) {
            EntityReserva reserva = reservaRepository.findById(request.getReservaId()).orElse(null);
            if (reserva == null) {
                throw new ResourceNotFoundException("Reserva no encontrada");
            }
            pago.setReserva(reserva);
        }

        if (request.getHospedajeId() != null) {
            EntityHospedaje hospedaje = hospedajeRepository.findById(request.getHospedajeId()).orElse(null);
            if (hospedaje == null) {
                throw new ResourceNotFoundException("Hospedaje no encontrado");
            }
            if (request.getMonto().compareTo(hospedaje.getDeudaPendiente()) > 0) {
                throw new BusinessException("El monto no puede exceder la deuda pendiente (S/ " +
                        hospedaje.getDeudaPendiente() + ")");
            }
            pago.setHospedaje(hospedaje);
            hospedaje.setTotalPagado(hospedaje.getTotalPagado().add(request.getMonto()));
            hospedaje.setDeudaPendiente(hospedaje.getDeudaPendiente().subtract(request.getMonto()));
            hospedajeRepository.save(hospedaje);
        }

        return toResponse(pagoRepository.save(pago));
    }

    private PagoResponse toResponse(EntityPago p) {
        PagoResponse r = new PagoResponse();
        r.setId(p.getId());
        r.setReservaId(p.getReserva() != null ? p.getReserva().getId() : null);
        r.setHospedajeId(p.getHospedaje() != null ? p.getHospedaje().getId() : null);
        r.setUsuarioId(p.getUsuario().getId());
        r.setUsuarioNombre(p.getUsuario().getNombreCompleto());
        r.setMonto(p.getMonto());
        r.setMetodo(p.getMetodo().name());
        r.setReferencia(p.getReferencia());
        r.setTipo(p.getTipo().name());
        r.setFechaPago(p.getFechaPago());
        r.setObservacion(p.getObservacion());
        return r;
    }
}

