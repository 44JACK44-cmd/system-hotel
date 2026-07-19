package com.hotel.apifds20261.business;

import com.hotel.apifds20261.dto.request.RequestConsumoInsert;
import com.hotel.apifds20261.dto.response.ConsumoResponse;
import com.hotel.apifds20261.entity.*;
import com.hotel.apifds20261.staticdata.EstadoHospedaje;
import com.hotel.apifds20261.staticdata.TipoConsumo;
import com.hotel.apifds20261.exception.BusinessException;
import com.hotel.apifds20261.exception.ResourceNotFoundException;
import com.hotel.apifds20261.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class BusinessConsumo {

    private final RepositoryConsumo consumoRepository;
    private final RepositoryHospedaje hospedajeRepository;
    private final RepositoryUsuario usuarioRepository;

    public List<ConsumoResponse> listarPorHospedaje(Long hospedajeId) {
        List<EntityConsumo> entities = consumoRepository.findByHospedajeIdOrderByFechaRegistroDesc(hospedajeId);
        List<ConsumoResponse> list = new ArrayList<>();
        for (EntityConsumo c : entities) {
            list.add(toResponse(c));
        }
        return list;
    }

    @Transactional
    public ConsumoResponse registrar(RequestConsumoInsert request, Long usuarioId) {
        EntityHospedaje hospedaje = hospedajeRepository.findById(request.getHospedajeId()).orElse(null);
        if (hospedaje == null) {
            throw new ResourceNotFoundException("Hospedaje no encontrado");
        }
        if (hospedaje.getEstado() != EstadoHospedaje.ACTIVO) {
            throw new BusinessException("No se pueden registrar consumos en un hospedaje finalizado");
        }

        EntityUsuario usuario = usuarioRepository.findById(usuarioId).orElse(null);
        if (usuario == null) {
            throw new ResourceNotFoundException("Usuario no encontrado");
        }

        TipoConsumo tipo = TipoConsumo.OTROS;
        if (request.getTipoConsumo() != null && !request.getTipoConsumo().isBlank()) {
            try {
                tipo = TipoConsumo.valueOf(request.getTipoConsumo().toUpperCase());
            } catch (IllegalArgumentException e) {
                throw new BusinessException("Tipo de consumo invalido: " + request.getTipoConsumo());
            }
        }

        BigDecimal subtotal = request.getPrecioUnitario().multiply(BigDecimal.valueOf(request.getCantidad()));

        EntityConsumo consumo = new EntityConsumo();
        consumo.setHospedaje(hospedaje);
        consumo.setUsuario(usuario);
        consumo.setTipoConsumo(tipo);
        consumo.setDescripcion(request.getDescripcion());
        consumo.setCantidad(request.getCantidad());
        consumo.setPrecioUnitario(request.getPrecioUnitario());
        consumo.setSubtotal(subtotal);
        consumo.setObservacion(request.getObservacion());

        consumo = consumoRepository.save(consumo);

        hospedaje.setDeudaPendiente(hospedaje.getDeudaPendiente().add(subtotal));
        hospedajeRepository.save(hospedaje);

        return toResponse(consumo);
    }

    @Transactional
    public ConsumoResponse actualizar(Long id, RequestConsumoInsert request, Long usuarioId) {
        EntityConsumo consumo = consumoRepository.findById(id).orElse(null);
        if (consumo == null) {
            throw new ResourceNotFoundException("Consumo no encontrado");
        }

        EntityHospedaje hospedaje = consumo.getHospedaje();
        if (hospedaje.getEstado() != EstadoHospedaje.ACTIVO) {
            throw new BusinessException("No se pueden modificar consumos de un hospedaje finalizado");
        }

        EntityUsuario usuario = usuarioRepository.findById(usuarioId).orElse(null);
        if (usuario == null) {
            throw new ResourceNotFoundException("Usuario no encontrado");
        }

        BigDecimal subtotalAnterior = consumo.getSubtotal();
        BigDecimal nuevoSubtotal = request.getPrecioUnitario().multiply(BigDecimal.valueOf(request.getCantidad()));

        TipoConsumo tipo = TipoConsumo.OTROS;
        if (request.getTipoConsumo() != null && !request.getTipoConsumo().isBlank()) {
            try {
                tipo = TipoConsumo.valueOf(request.getTipoConsumo().toUpperCase());
            } catch (IllegalArgumentException e) {
                throw new BusinessException("Tipo de consumo invalido: " + request.getTipoConsumo());
            }
        }

        consumo.setTipoConsumo(tipo);
        consumo.setDescripcion(request.getDescripcion());
        consumo.setCantidad(request.getCantidad());
        consumo.setPrecioUnitario(request.getPrecioUnitario());
        consumo.setSubtotal(nuevoSubtotal);
        consumo.setObservacion(request.getObservacion());
        consumo.setUsuario(usuario);

        consumo = consumoRepository.save(consumo);

        BigDecimal diferencia = nuevoSubtotal.subtract(subtotalAnterior);
        hospedaje.setDeudaPendiente(hospedaje.getDeudaPendiente().add(diferencia));
        hospedajeRepository.save(hospedaje);

        return toResponse(consumo);
    }

    @Transactional
    public void eliminar(Long id) {
        EntityConsumo consumo = consumoRepository.findById(id).orElse(null);
        if (consumo == null) {
            throw new ResourceNotFoundException("Consumo no encontrado");
        }

        EntityHospedaje hospedaje = consumo.getHospedaje();
        if (hospedaje.getEstado() != EstadoHospedaje.ACTIVO) {
            throw new BusinessException("No se pueden eliminar consumos de un hospedaje finalizado");
        }

        BigDecimal subtotal = consumo.getSubtotal();
        consumoRepository.delete(consumo);

        hospedaje.setDeudaPendiente(hospedaje.getDeudaPendiente().subtract(subtotal));
        hospedajeRepository.save(hospedaje);
    }

    public BigDecimal obtenerTotal(Long hospedajeId) {
        return consumoRepository.sumTotalByHospedajeId(hospedajeId);
    }

    private ConsumoResponse toResponse(EntityConsumo c) {
        ConsumoResponse r = new ConsumoResponse();
        r.setId(c.getId());
        r.setIdConsumo(c.getIdConsumo());
        r.setHospedajeId(c.getHospedaje().getId());
        r.setUsuarioId(c.getUsuario().getId());
        r.setUsuarioNombre(c.getUsuario().getNombreCompleto());
        r.setTipoConsumo(c.getTipoConsumo() != null ? c.getTipoConsumo().name() : "OTROS");
        r.setDescripcion(c.getDescripcion());
        r.setCantidad(c.getCantidad());
        r.setPrecioUnitario(c.getPrecioUnitario());
        r.setSubtotal(c.getSubtotal());
        r.setObservacion(c.getObservacion());
        r.setFechaRegistro(c.getFechaRegistro());
        r.setCreatedAt(c.getCreatedAt());
        r.setUpdatedAt(c.getUpdatedAt());
        return r;
    }
}
