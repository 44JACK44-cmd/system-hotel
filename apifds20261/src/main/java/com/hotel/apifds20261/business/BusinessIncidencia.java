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
    private final RepositoryHospedaje hospedajeRepository;
    private final RepositoryUsuario usuarioRepository;
    private final RepositoryNotificacion notificacionRepository;

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

        List<EntityIncidenciaHabitacion> activas = incidenciaRepository.findByFechaFinIsNullOrderByFechaInicioDesc();
        boolean yaActiva = activas.stream().anyMatch(i ->
            i.getHabitacion().getId().equals(request.getHabitacionId())
        );
        if (yaActiva) {
            throw new BusinessException("Ya existe una incidencia activa para esta habitación. Finalice la incidencia anterior primero.");
        }

        String rawTipo = request.getTipo();
        if ("LIMPIEZA".equalsIgnoreCase(rawTipo)) {
            rawTipo = "LIMPIEZA_CHECKOUT";
        }
        TipoIncidencia tipo = TipoIncidencia.valueOf(rawTipo);

        if (tipo == TipoIncidencia.LIMPIEZA_CHECKOUT) {
            if (hospedajeRepository.findActivoByHabitacionId(habitacion.getId()) != null) {
                throw new BusinessException("La habitacion posee un hospedaje activo. Su estado es administrado automaticamente por el sistema.");
            }
            if (habitacion.getEstado() != EstadoHabitacion.SUCIA &&
                    habitacion.getEstado() != EstadoHabitacion.LIMPIEZA &&
                    habitacion.getEstado() != EstadoHabitacion.DISPONIBLE) {
                throw new BusinessException("La habitacion debe estar sucia o libre para registrar limpieza de checkout");
            }
            habitacion.setEstado(EstadoHabitacion.SUCIA);
        } else if (tipo == TipoIncidencia.SERVICIO_LIMPIEZA_HUESPED) {
            if (habitacion.getEstado() != EstadoHabitacion.OCUPADA) {
                throw new BusinessException("Solo se puede solicitar limpieza en habitaciones ocupadas");
            }
        } else if (tipo == TipoIncidencia.MANTENIMIENTO) {
            if (habitacion.getEstado() == EstadoHabitacion.OCUPADA ||
                    hospedajeRepository.findActivoByHabitacionId(habitacion.getId()) != null) {
                throw new BusinessException("No se puede poner en mantenimiento una habitacion ocupada o con hospedaje activo");
            }
            habitacion.setEstado(EstadoHabitacion.MANTENIMIENTO);
        }

        EntityIncidenciaHabitacion incidencia = new EntityIncidenciaHabitacion();
        incidencia.setHabitacion(habitacion);
        incidencia.setUsuario(usuario);
        incidencia.setTipo(tipo);
          incidencia.setMotivo(request.getMotivo());
          incidencia.setFoto(validarFoto(request.getFoto()));
          incidencia.setFechaInicio(LocalDateTime.now());

        habitacionRepository.save(habitacion);
        IncidenciaResponse saved = toResponse(incidenciaRepository.save(incidencia));

        EntityNotificacion notif = new EntityNotificacion();
        notif.setTitulo(tipo == TipoIncidencia.MANTENIMIENTO ? "Mantenimiento pendiente" : "Incidencia registrada");
        notif.setMensaje((tipo == TipoIncidencia.MANTENIMIENTO ? "Mantenimiento" : "Incidencia") +
                " pendiente - Hab. " + habitacion.getNumero() + ": " + request.getMotivo());
        notif.setTipo("INCIDENCIA");
        notif.setPrioridad(tipo == TipoIncidencia.MANTENIMIENTO ? "ALTA" : "MEDIA");
        notif.setFechaCreacion(LocalDateTime.now());
        notif.setLeida(false);
        notif.setEstado("PENDIENTE");
        notif.setEntidadTipo("INCIDENCIA");
        notif.setEntidadId(incidencia.getId());
        notificacionRepository.save(notif);

        return saved;
    }

    @Transactional
    public IncidenciaResponse finalizar(Long id) {
        EntityIncidenciaHabitacion incidencia = incidenciaRepository.findById(id).orElse(null);
        if (incidencia == null) {
            throw new ResourceNotFoundException("Incidencia no encontrada");
        }

        if (incidencia.getFechaFin() != null) {
            throw new BusinessException("La incidencia ya está cerrada");
        }

        incidencia.setFechaFin(LocalDateTime.now());

        EntityHabitacion habitacion = incidencia.getHabitacion();

        if (incidencia.getTipo() == TipoIncidencia.LIMPIEZA_CHECKOUT ||
                incidencia.getTipo() == TipoIncidencia.MANTENIMIENTO) {
            if (hospedajeRepository.findActivoByHabitacionId(habitacion.getId()) != null) {
                throw new BusinessException("La habitacion posee un hospedaje activo. Su estado es administrado automaticamente por el sistema.");
            }
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
        r.setFoto(i.getFoto());
        r.setFechaInicio(i.getFechaInicio());
        r.setFechaFin(i.getFechaFin());
        r.setEstado(i.getFechaFin() == null ? "ACTIVA" : "FINALIZADA");
        return r;
    }

    private String validarFoto(String foto) {
        if (foto == null || foto.isBlank()) {
            return null;
        }
        String value = foto.trim();
        if (!value.matches("^data:image/(png|jpeg|jpg|webp|gif);base64,[A-Za-z0-9+/=]+$")) {
            throw new com.hotel.apifds20261.exception.BusinessException("La foto no es una imagen válida");
        }
        if (value.length() > 5 * 1024 * 1024) {
            throw new com.hotel.apifds20261.exception.BusinessException("La imagen no debe superar los 5MB");
        }
        return value;
    }
}
