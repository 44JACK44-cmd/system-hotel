package com.hotel.apifds20261.business;

import com.hotel.apifds20261.dto.response.NotificacionResponse;
import com.hotel.apifds20261.entity.EntityNotificacion;
import com.hotel.apifds20261.entity.EntityUsuario;
import com.hotel.apifds20261.exception.ResourceNotFoundException;
import com.hotel.apifds20261.repository.RepositoryNotificacion;
import com.hotel.apifds20261.repository.RepositoryUsuario;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class BusinessNotificacion {

    private final RepositoryNotificacion notificacionRepository;
    private final RepositoryUsuario usuarioRepository;

    public List<NotificacionResponse> listarPorUsuario(Long usuarioId) {
        List<EntityNotificacion> entities = notificacionRepository.findByUsuarioDestinoIdOrderByFechaCreacionDesc(usuarioId);
        return toListResponse(entities);
    }

    public List<NotificacionResponse> listarPendientes(Long usuarioId) {
        List<EntityNotificacion> entities = notificacionRepository.findByUsuarioDestinoIdAndLeidaFalseOrderByFechaCreacionDesc(usuarioId);
        return toListResponse(entities);
    }

    public long contarPendientes(Long usuarioId) {
        return notificacionRepository.countPendientesByUsuarioId(usuarioId);
    }

    public NotificacionResponse obtenerPorId(Long id) {
        EntityNotificacion entity = notificacionRepository.findById(id).orElse(null);
        if (entity == null) throw new ResourceNotFoundException("Notificacion no encontrada");
        return toResponse(entity);
    }

    @Transactional
    public NotificacionResponse crear(String titulo, String mensaje, String tipo, String prioridad, Long usuarioDestinoId) {
        EntityNotificacion n = new EntityNotificacion();
        n.setTitulo(titulo);
        n.setMensaje(mensaje);
        n.setTipo(tipo);
        n.setPrioridad(prioridad != null ? prioridad : "MEDIA");
        n.setFechaCreacion(LocalDateTime.now());
        n.setLeida(false);
        n.setEstado("PENDIENTE");
        if (usuarioDestinoId != null) {
            EntityUsuario usuario = usuarioRepository.findById(usuarioDestinoId).orElse(null);
            n.setUsuarioDestino(usuario);
        }
        return toResponse(notificacionRepository.save(n));
    }

    @Transactional
    public NotificacionResponse marcarLeida(Long id) {
        EntityNotificacion n = notificacionRepository.findById(id).orElse(null);
        if (n == null) throw new ResourceNotFoundException("Notificacion no encontrada");
        n.setLeida(true);
        n.setEstado("LEIDA");
        return toResponse(notificacionRepository.save(n));
    }

    @Transactional
    public void marcarTodasLeidas(Long usuarioId) {
        List<EntityNotificacion> pendientes = notificacionRepository.findByUsuarioDestinoIdAndLeidaFalseOrderByFechaCreacionDesc(usuarioId);
        for (EntityNotificacion n : pendientes) {
            n.setLeida(true);
            n.setEstado("LEIDA");
            notificacionRepository.save(n);
        }
    }

    @Transactional
    public void eliminar(Long id) {
        notificacionRepository.deleteById(id);
    }

    private NotificacionResponse toResponse(EntityNotificacion n) {
        NotificacionResponse r = new NotificacionResponse();
        r.setId(n.getId());
        r.setTitulo(n.getTitulo());
        r.setMensaje(n.getMensaje());
        r.setTipo(n.getTipo());
        r.setPrioridad(n.getPrioridad());
        r.setFechaCreacion(n.getFechaCreacion());
        r.setLeida(n.getLeida());
        r.setUsuarioDestinoId(n.getUsuarioDestino() != null ? n.getUsuarioDestino().getId() : null);
        r.setEstado(n.getEstado());
        r.setEntidadTipo(n.getEntidadTipo());
        r.setEntidadId(n.getEntidadId());
        return r;
    }

    private List<NotificacionResponse> toListResponse(List<EntityNotificacion> entities) {
        List<NotificacionResponse> list = new ArrayList<>();
        for (EntityNotificacion n : entities) list.add(toResponse(n));
        return list;
    }
}
