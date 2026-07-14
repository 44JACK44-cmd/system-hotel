package com.hotel.apifds20261.business;

import com.hotel.apifds20261.dto.request.RequestConsumoInsert;
import com.hotel.apifds20261.dto.response.ConsumoResponse;
import com.hotel.apifds20261.entity.*;
import com.hotel.apifds20261.staticdata.EstadoHospedaje;
import com.hotel.apifds20261.exception.BusinessException;
import com.hotel.apifds20261.exception.ResourceNotFoundException;
import com.hotel.apifds20261.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
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

        BigDecimal subtotal = request.getPrecioUnitario().multiply(BigDecimal.valueOf(request.getCantidad()));

        EntityConsumo consumo = new EntityConsumo();
        consumo.setHospedaje(hospedaje);
        consumo.setUsuario(usuario);
        consumo.setDescripcion(request.getDescripcion());
        consumo.setCantidad(request.getCantidad());
        consumo.setPrecioUnitario(request.getPrecioUnitario());
        consumo.setSubtotal(subtotal);
        consumo.setFechaRegistro(LocalDateTime.now());

        consumo = consumoRepository.save(consumo);

        hospedaje.setDeudaPendiente(hospedaje.getDeudaPendiente().add(subtotal));
        hospedajeRepository.save(hospedaje);

        return toResponse(consumo);
    }

    private ConsumoResponse toResponse(EntityConsumo c) {
        ConsumoResponse r = new ConsumoResponse();
        r.setId(c.getId());
        r.setHospedajeId(c.getHospedaje().getId());
        r.setUsuarioId(c.getUsuario().getId());
        r.setUsuarioNombre(c.getUsuario().getNombreCompleto());
        r.setDescripcion(c.getDescripcion());
        r.setCantidad(c.getCantidad());
        r.setPrecioUnitario(c.getPrecioUnitario());
        r.setSubtotal(c.getSubtotal());
        r.setFechaRegistro(c.getFechaRegistro());
        return r;
    }
}
