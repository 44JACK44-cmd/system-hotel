package com.hotel.apifds20261.business;

import com.hotel.apifds20261.dto.request.RequestIncidenciaInsert;
import com.hotel.apifds20261.dto.response.IncidenciaResponse;
import com.hotel.apifds20261.dto.response.ResponsePage;
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
public class BusinessIncidencia {

    private final RepositoryIncidencia incidenciaRepository;
    private final RepositoryHabitacion habitacionRepository;
    private final RepositoryUsuario usuarioRepository;

    public List<IncidenciaResponse> listarTodas() {
        List<EntityIncidenciaHabitacion> entities = incidenciaRepository.findAllByOrderByFechaInicioDesc();
        List<IncidenciaResponse> list = new ArrayList<>();
        for (EntityIncidenciaHabitacion i : entities) {
            list.add(toResponse(i));
        }
        return list;
    }

    public ResponsePage<IncidenciaResponse> listarPaginado(String search, int page, int size, String sortField, String sortDir) {
        org.springframework.data.domain.Sort sort = org.springframework.data.domain.Sort.by(
                sortDir.equalsIgnoreCase("desc") ? org.springframework.data.domain.Sort.Direction.DESC : org.springframework.data.domain.Sort.Direction.ASC,
                sortField == null || sortField.isBlank() ? "id" : sortField);
        org.springframework.data.domain.Pageable pageable = org.springframework.data.domain.PageRequest.of(page, size, sort);
        org.springframework.data.domain.Page<EntityIncidenciaHabitacion> pagina = incidenciaRepository.findAllPaginated(search, pageable);
        List<IncidenciaResponse> list = new ArrayList<>();
        for (EntityIncidenciaHabitacion i : pagina.getContent()) {
            list.add(toResponse(i));
        }
        return new ResponsePage<>(list, pagina.getNumber(), pagina.getSize(), pagina.getTotalElements(), pagina.getTotalPages());
    }

    public List<IncidenciaResponse> listarActivas() {
        List<EntityIncidenciaHabitacion> entities = incidenciaRepository.findByFechaFinIsNullOrderByFechaInicioDesc();
        List<IncidenciaResponse> list = new ArrayList<>();
        for (EntityIncidenciaHabitacion i : entities) {
            list.add(toResponse(i));
        }
        return list;
    }

    public IncidenciaResponse obtenerPorId(Long id) {
        EntityIncidenciaHabitacion i = incidenciaRepository.findById(id).orElse(null);
        if (i == null) {
            throw new ResourceNotFoundException("Incidencia no encontrada");
        }
        return toResponse(i);
    }

    @Transactional
    public IncidenciaResponse crear(RequestIncidenciaInsert request, Long usuarioId) {
        EntityHabitacion habitacion = habitacionRepository.findById(request.getHabitacionId()).orElse(null);
        if (habitacion == null) {
            throw new ResourceNotFoundException("Habitacion no encontrada");
        }
        EntityUsuario usuario = usuarioRepository.findById(usuarioId).orElse(null);
        if (usuario == null) {
            throw new ResourceNotFoundException("Usuario no encontrado");
        }

        if (habitacion.getEstado() == EstadoHabitacion.OCUPADA && request.getTipo().equals("LIMPIEZA")) {
            throw new BusinessException("No se puede crear una incidencia de limpieza en una habitacion ocupada");
        }

        EntityIncidenciaHabitacion incidencia = new EntityIncidenciaHabitacion();
        incidencia.setHabitacion(habitacion);
        incidencia.setUsuario(usuario);
        incidencia.setTipo(TipoIncidencia.valueOf(request.getTipo()));
        incidencia.setMotivo(request.getMotivo());
        incidencia.setFechaInicio(LocalDateTime.now());

        EstadoHabitacion nuevoEstado = request.getTipo().equals("LIMPIEZA")
                ? EstadoHabitacion.LIMPIEZA : EstadoHabitacion.MANTENIMIENTO;
        habitacion.setEstado(nuevoEstado);
        habitacionRepository.save(habitacion);

        return toResponse(incidenciaRepository.save(incidencia));
    }

    @Transactional
    public IncidenciaResponse finalizar(Long id) {
        EntityIncidenciaHabitacion incidencia = incidenciaRepository.findById(id).orElse(null);
        if (incidencia == null) {
            throw new ResourceNotFoundException("Incidencia no encontrada");
        }

        incidencia.setFechaFin(LocalDateTime.now());

        EntityHabitacion habitacion = incidencia.getHabitacion();
        if (habitacion.getEstado() == EstadoHabitacion.LIMPIEZA ||
                habitacion.getEstado() == EstadoHabitacion.MANTENIMIENTO) {
            habitacion.setEstado(EstadoHabitacion.DISPONIBLE);
            habitacionRepository.save(habitacion);
        }

        return toResponse(incidenciaRepository.save(incidencia));
    }

    private IncidenciaResponse toResponse(EntityIncidenciaHabitacion i) {
        IncidenciaResponse r = new IncidenciaResponse();
        r.setId(i.getId());
        r.setHabitacionId(i.getHabitacion().getId());
        r.setHabitacionNumero(i.getHabitacion().getNumero());
        r.setHabitacionPiso(i.getHabitacion().getPiso());
        r.setUsuarioId(i.getUsuario().getId());
        r.setUsuarioNombre(i.getUsuario().getNombreCompleto());
        r.setTipo(i.getTipo().name());
        r.setMotivo(i.getMotivo());
        r.setFechaInicio(i.getFechaInicio());
        r.setFechaFin(i.getFechaFin());
        r.setEstado(i.getFechaFin() == null ? "ACTIVA" : "FINALIZADA");
        return r;
    }
}

