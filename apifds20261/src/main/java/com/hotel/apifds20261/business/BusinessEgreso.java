package com.hotel.apifds20261.business;

import com.hotel.apifds20261.dto.request.RequestEgresoInsert;
import com.hotel.apifds20261.dto.response.EgresoResponse;
import com.hotel.apifds20261.entity.*;
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
public class BusinessEgreso {

    private final RepositoryEgreso egresoRepository;
    private final RepositoryUsuario usuarioRepository;

    public List<EgresoResponse> listarTodos() {
        List<EntityEgreso> entities = egresoRepository.findAllByOrderByFechaRegistroDesc();
        List<EgresoResponse> list = new ArrayList<>();
        for (EntityEgreso e : entities) {
            list.add(toResponse(e));
        }
        return list;
    }

    public List<EgresoResponse> listarPorFecha(LocalDateTime inicio, LocalDateTime fin) {
        List<EntityEgreso> entities = egresoRepository.findByFechaRegistroBetweenOrderByFechaRegistroDesc(inicio, fin);
        List<EgresoResponse> list = new ArrayList<>();
        for (EntityEgreso e : entities) {
            list.add(toResponse(e));
        }
        return list;
    }

    @Transactional
    public EgresoResponse registrar(RequestEgresoInsert request, Long usuarioId) {
        EntityUsuario usuario = usuarioRepository.findById(usuarioId).orElse(null);
        if (usuario == null) {
            throw new ResourceNotFoundException("Usuario no encontrado");
        }

        EntityEgreso egreso = new EntityEgreso();
        egreso.setUsuario(usuario);
        egreso.setConcepto(request.getConcepto());
        egreso.setCategoria(request.getCategoria());
        egreso.setMonto(request.getMonto());
        egreso.setFechaRegistro(LocalDateTime.now());
        egreso.setObservacion(request.getObservacion());

        return toResponse(egresoRepository.save(egreso));
    }

    private EgresoResponse toResponse(EntityEgreso e) {
        EgresoResponse r = new EgresoResponse();
        r.setId(e.getId());
        r.setUsuarioId(e.getUsuario().getId());
        r.setUsuarioNombre(e.getUsuario().getNombreCompleto());
        r.setConcepto(e.getConcepto());
        r.setCategoria(e.getCategoria());
        r.setMonto(e.getMonto());
        r.setFechaRegistro(e.getFechaRegistro());
        r.setObservacion(e.getObservacion());
        return r;
    }
}
