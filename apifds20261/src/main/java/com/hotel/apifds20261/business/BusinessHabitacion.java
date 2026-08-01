package com.hotel.apifds20261.business;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.hotel.apifds20261.dto.request.RequestHabitacionCambioEstado;
import com.hotel.apifds20261.dto.request.RequestHabitacionInsert;
import com.hotel.apifds20261.dto.response.HabitacionResponse;
import com.hotel.apifds20261.dto.response.SuggestionResponse;
import com.hotel.apifds20261.staticdata.EstadoHabitacion;
import com.hotel.apifds20261.staticdata.EstadoHospedaje;
import com.hotel.apifds20261.staticdata.EstadoReserva;
import com.hotel.apifds20261.entity.EntityHabitacion;
import com.hotel.apifds20261.entity.EntityHospedaje;
import com.hotel.apifds20261.entity.EntityIncidenciaHabitacion;
import com.hotel.apifds20261.entity.EntityReserva;
import com.hotel.apifds20261.staticdata.TipoHabitacion;
import com.hotel.apifds20261.staticdata.TipoIncidencia;
import com.hotel.apifds20261.exception.BusinessException;
import com.hotel.apifds20261.exception.ResourceNotFoundException;
import com.hotel.apifds20261.repository.RepositoryHabitacion;
import com.hotel.apifds20261.repository.RepositoryHospedaje;
import com.hotel.apifds20261.repository.RepositoryReserva;
import com.hotel.apifds20261.repository.RepositoryIncidencia;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class BusinessHabitacion {

    private final RepositoryHabitacion habitacionRepository;
    private final RepositoryHospedaje hospedajeRepository;
    private final RepositoryReserva reservaRepository;
    private final RepositoryIncidencia incidenciaRepository;

    @Transactional
    public List<HabitacionResponse> listarActivas() {
        reconciliarEstados();
        List<EntityHabitacion> entities = habitacionRepository.findByActivoTrueOrderByPisoAscNumeroAsc();
        List<HabitacionResponse> list = new ArrayList<>();
        for (EntityHabitacion h : entities) {
            list.add(toResponse(h));
        }
        return list;
    }

    @Transactional
    public List<HabitacionResponse> listarTodas() {
        reconciliarEstados();
        List<EntityHabitacion> entities = habitacionRepository.findAllByOrderByPisoAscNumeroAsc();
        List<HabitacionResponse> list = new ArrayList<>();
        for (EntityHabitacion h : entities) {
            list.add(toResponse(h));
        }
        return list;
    }

    @Transactional
    public HabitacionResponse obtenerPorId(Long id) {
        reconciliarEstados();
        return toResponse(buscarOExcepcion(id));
    }

    @Transactional
    public Map<Integer, List<HabitacionResponse>> obtenerMapa() {
        reconciliarEstados();
        List<EntityHabitacion> entities = habitacionRepository.findAllByOrderByPisoAscNumeroAsc();
        Map<Integer, List<HabitacionResponse>> mapa = new LinkedHashMap<>();
        for (EntityHabitacion h : entities) {
            HabitacionResponse r = toResponse(h);
            Integer piso = r.getPiso();
            if (!mapa.containsKey(piso)) {
                mapa.put(piso, new ArrayList<>());
            }
            mapa.get(piso).add(r);
        }
        return mapa;
    }

    @Transactional
    public HabitacionResponse crear(RequestHabitacionInsert request) {
        String numero = request.getNumero().trim();
        if (habitacionRepository.existsByNumero(numero)) {
            throw new BusinessException("Ya existe una habitacion con el numero " + numero);
        }
        EntityHabitacion habitacion = new EntityHabitacion();
        habitacion.setPiso(request.getPiso());
        habitacion.setNumero(numero);
        habitacion.setTipo(TipoHabitacion.valueOf(request.getTipo().toUpperCase()));
        habitacion.setPrecioNoche(request.getPrecioNoche());
        habitacion.setEstado(EstadoHabitacion.DISPONIBLE);
        habitacion.setActivo(true);
        return toResponse(habitacionRepository.save(habitacion));
    }

    @Transactional
    public HabitacionResponse actualizar(Long id, RequestHabitacionInsert request) {
        EntityHabitacion h = buscarOExcepcion(id);
        String numero = request.getNumero().trim();
        if (!h.getNumero().equals(numero) &&
                habitacionRepository.existsByNumero(numero)) {
            throw new BusinessException("Ya existe una habitacion con el numero " + numero);
        }
        h.setPiso(request.getPiso());
        h.setNumero(numero);
        h.setTipo(TipoHabitacion.valueOf(request.getTipo().toUpperCase()));
        h.setPrecioNoche(request.getPrecioNoche());
        return toResponse(habitacionRepository.save(h));
    }

    @Transactional
    public void cambiarEstado(Long id, RequestHabitacionCambioEstado request) {
        EntityHabitacion h = buscarOExcepcion(id);
        EstadoHabitacion nuevoEstado;
        try {
            nuevoEstado = EstadoHabitacion.valueOf(request.getEstado());
        } catch (IllegalArgumentException e) {
            throw new BusinessException("El estado " + request.getEstado() + " no es valido");
        }

        EntityHospedaje hospedajeActivo = hospedajeRepository.findActivoByHabitacionId(id);

        if (hospedajeActivo != null) {
            if (nuevoEstado == EstadoHabitacion.OCUPADA) {
                if (h.getEstado() != EstadoHabitacion.OCUPADA) {
                    h.setEstado(EstadoHabitacion.OCUPADA);
                    habitacionRepository.save(h);
                }
                return;
            }
            throw new BusinessException(
                    "La habitacion tiene un hospedaje activo y no puede marcarse como " +
                    (nuevoEstado == EstadoHabitacion.DISPONIBLE ? "disponible" : nuevoEstado.name().toLowerCase()) + ".");
        }

        switch (nuevoEstado) {
            case DISPONIBLE: {
                List<EntityIncidenciaHabitacion> incidenciasActivas =
                        incidenciaRepository.findByFechaFinIsNullAndHabitacionId(id);
                if (!incidenciasActivas.isEmpty()) {
                    throw new BusinessException("No se puede marcar como DISPONIBLE una habitacion con incidencias pendientes. Finalice las incidencias primero.");
                }
                break;
            }
            case OCUPADA:
                throw new BusinessException("Una habitacion solo puede ocuparse mediante el check-in del huesped.");
            case SUCIA:
            case LIMPIEZA:
                break;
            case MANTENIMIENTO: {
                List<EntityIncidenciaHabitacion> incidenciasActivas =
                        incidenciaRepository.findByFechaFinIsNullAndHabitacionId(id);
                boolean tieneMantenimiento = incidenciasActivas.stream()
                        .anyMatch(i -> i.getTipo() == TipoIncidencia.MANTENIMIENTO);
                if (!tieneMantenimiento) {
                    throw new BusinessException("No se puede marcar en mantenimiento sin una incidencia de mantenimiento activa.");
                }
                break;
            }
        }

        h.setEstado(nuevoEstado);
        habitacionRepository.save(h);
    }

    public List<SuggestionResponse> buscarSugerencias(String termino) {
        List<EntityHabitacion> entities = habitacionRepository.search(termino);
        List<SuggestionResponse> list = new ArrayList<>();
        int max = Math.min(entities.size(), 10);
        for (int i = 0; i < max; i++) {
            EntityHabitacion h = entities.get(i);
            String subtitle = h.getTipo().name() + " | " + h.getEstado().name() + " | Piso " + h.getPiso();
            list.add(new SuggestionResponse(h.getId(), "Hab. " + h.getNumero(), subtitle, "HABITACION"));
        }
        return list;
    }

    @Transactional
    public void eliminar(Long id) {
        EntityHabitacion h = buscarOExcepcion(id);

        if (h.getEstado() == EstadoHabitacion.OCUPADA) {
            throw new BusinessException("No se puede eliminar una habitación que está OCUPADA");
        }
        if (h.getEstado() == EstadoHabitacion.LIMPIEZA || h.getEstado() == EstadoHabitacion.SUCIA) {
            throw new BusinessException("No se puede eliminar una habitación que está en limpieza");
        }
        if (h.getEstado() == EstadoHabitacion.MANTENIMIENTO) {
            throw new BusinessException("No se puede eliminar una habitación que está en mantenimiento");
        }

        if (hospedajeRepository.findActivoByHabitacionId(id) != null) {
            throw new BusinessException("No se puede eliminar una habitación con hospedaje activo");
        }

        List<EntityReserva> reservasActivas = reservaRepository.findByHabitacionIdAndEstado(id, EstadoReserva.CONFIRMADA);
        if (!reservasActivas.isEmpty()) {
            throw new BusinessException("No se puede eliminar una habitación con reservas confirmadas");
        }

        List<EntityIncidenciaHabitacion> incidenciasActivas = incidenciaRepository.findByFechaFinIsNullAndHabitacionId(id);
        if (!incidenciasActivas.isEmpty()) {
            throw new BusinessException("No se puede eliminar una habitación con incidencias activas");
        }

        h.setActivo(false);
        habitacionRepository.save(h);
    }

    private EntityHabitacion buscarOExcepcion(Long id) {
        EntityHabitacion h = habitacionRepository.findById(id).orElse(null);
        if (h == null) {
            throw new ResourceNotFoundException("Habitacion no encontrada");
        }
        return h;
    }

    /**
     * Mantiene la consistencia del estado de las habitaciones:
     * 1) Si una habitacion posee un hospedaje activo, su estado SIEMPRE debe ser OCUPADA.
     * 2) Una habitacion OCUPADA sin hospedaje activo debe volver a un estado coherente:
     *    MANTENIMIENTO si tiene incidencia de mantenimiento activa,
     *    SUCIA si tiene incidencia de limpieza activa, DISPONIBLE en caso contrario.
     */
    private void reconciliarEstados() {
        List<EntityHospedaje> activos = hospedajeRepository.findByEstadoOrderByFechaIngresoDesc(EstadoHospedaje.ACTIVO);
        for (EntityHospedaje h : activos) {
            EntityHabitacion hab = h.getHabitacion();
            if (hab != null && hab.getActivo() && hab.getEstado() != EstadoHabitacion.OCUPADA) {
                hab.setEstado(EstadoHabitacion.OCUPADA);
                habitacionRepository.save(hab);
            }
        }

        List<EntityHabitacion> habitaciones = habitacionRepository.findAllByOrderByPisoAscNumeroAsc();
        for (EntityHabitacion hab : habitaciones) {
            if (!hab.getActivo() || hab.getEstado() != EstadoHabitacion.OCUPADA) {
                continue;
            }
            boolean tieneActivo = activos.stream()
                    .anyMatch(a -> a.getHabitacion() != null && a.getHabitacion().getId().equals(hab.getId()));
            if (tieneActivo) {
                continue;
            }
            List<EntityIncidenciaHabitacion> incidenciasActivas =
                    incidenciaRepository.findByFechaFinIsNullAndHabitacionId(hab.getId());
            boolean mantenimiento = incidenciasActivas.stream()
                    .anyMatch(i -> i.getTipo() == TipoIncidencia.MANTENIMIENTO);
            boolean limpieza = incidenciasActivas.stream()
                    .anyMatch(i -> i.getTipo() == TipoIncidencia.LIMPIEZA_CHECKOUT);
            if (mantenimiento) {
                hab.setEstado(EstadoHabitacion.MANTENIMIENTO);
            } else if (limpieza) {
                hab.setEstado(EstadoHabitacion.SUCIA);
            } else {
                hab.setEstado(EstadoHabitacion.DISPONIBLE);
            }
            habitacionRepository.save(hab);
        }
    }

    private HabitacionResponse toResponse(EntityHabitacion h) {
        HabitacionResponse r = new HabitacionResponse();
        r.setId(h.getId());
        r.setPiso(h.getPiso());
        r.setNumero(h.getNumero());
        r.setTipo(h.getTipo().name());
        r.setPrecioNoche(h.getPrecioNoche());
        r.setEstado(h.getEstado().name());
        r.setActivo(h.getActivo());
        return r;
    }
}

