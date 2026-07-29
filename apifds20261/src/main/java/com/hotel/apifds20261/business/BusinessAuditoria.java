package com.hotel.apifds20261.business;

import com.hotel.apifds20261.dto.response.AuditoriaResponse;
import com.hotel.apifds20261.dto.response.ResponsePage;
import com.hotel.apifds20261.entity.EntityAuditoria;
import com.hotel.apifds20261.entity.EntityUsuario;
import com.hotel.apifds20261.repository.RepositoryAuditoria;
import com.hotel.apifds20261.repository.RepositoryUsuario;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class BusinessAuditoria {

    private final RepositoryAuditoria auditoriaRepository;
    private final RepositoryUsuario usuarioRepository;

    @Transactional
    public void registrar(Long usuarioId, String accion, String modulo, String detalle, String ip) {
        EntityAuditoria a = new EntityAuditoria();
        a.setUsuarioId(usuarioId);
        a.setAccion(accion);
        a.setModulo(modulo);
        a.setDetalle(detalle);
        a.setIp(ip);
        a.setFecha(LocalDateTime.now());
        auditoriaRepository.save(a);
    }

    public ResponsePage<AuditoriaResponse> listarPaginado(
            Long usuarioId, String modulo,
            LocalDate fechaDesde, LocalDate fechaHasta,
            int page, int size, String sortField, String sortDir) {

        Sort sort = Sort.by(sortDir.equalsIgnoreCase("desc") ? Sort.Direction.DESC : Sort.Direction.ASC,
                sortField == null || sortField.isBlank() ? "fecha" : sortField);
        Pageable pageable = PageRequest.of(page, size, sort);

        LocalDateTime desde = fechaDesde != null ? fechaDesde.atStartOfDay() : null;
        LocalDateTime hasta = fechaHasta != null ? fechaHasta.atTime(LocalTime.MAX) : null;

        Page<EntityAuditoria> pagina = auditoriaRepository.findAllFiltered(usuarioId, modulo, desde, hasta, pageable);
        List<AuditoriaResponse> list = new ArrayList<>();
        for (EntityAuditoria a : pagina.getContent()) {
            list.add(toResponse(a));
        }
        return new ResponsePage<>(list, pagina.getNumber(), pagina.getSize(), pagina.getTotalElements(), pagina.getTotalPages());
    }

    private AuditoriaResponse toResponse(EntityAuditoria a) {
        AuditoriaResponse r = new AuditoriaResponse();
        r.setId(a.getId());
        r.setUsuarioId(a.getUsuarioId());
        r.setAccion(a.getAccion());
        r.setModulo(a.getModulo());
        r.setDetalle(a.getDetalle());
        r.setIp(a.getIp());
        r.setFecha(a.getFecha());
        String nombre = usuarioRepository.findById(a.getUsuarioId())
                .map(EntityUsuario::getNombreCompleto).orElse(null);
        r.setNombreUsuario(nombre);
        return r;
    }
}
