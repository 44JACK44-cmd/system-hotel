package com.hotel.apifds20261.business;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import org.springframework.stereotype.Service;

import com.hotel.apifds20261.dto.request.RequestHabitacionCambioEstado;
import com.hotel.apifds20261.dto.request.RequestHabitacionInsert;
import com.hotel.apifds20261.dto.response.HabitacionResponse;
import com.hotel.apifds20261.staticdata.EstadoHabitacion;
import com.hotel.apifds20261.entity.EntityHabitacion;
import com.hotel.apifds20261.staticdata.TipoHabitacion;
import com.hotel.apifds20261.exception.BusinessException;
import com.hotel.apifds20261.exception.ResourceNotFoundException;
import com.hotel.apifds20261.repository.RepositoryHabitacion;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class BusinessHabitacion {

    private final RepositoryHabitacion habitacionRepository;

    public List<HabitacionResponse> listarActivas() {
        List<EntityHabitacion> entities = habitacionRepository.findByActivoTrueOrderByPisoAscNumeroAsc();
        List<HabitacionResponse> list = new ArrayList<>();
        for (EntityHabitacion h : entities) {
            list.add(toResponse(h));
        }
        return list;
    }

    public List<HabitacionResponse> listarTodas() {
        List<EntityHabitacion> entities = habitacionRepository.findAllByOrderByPisoAscNumeroAsc();
        List<HabitacionResponse> list = new ArrayList<>();
        for (EntityHabitacion h : entities) {
            list.add(toResponse(h));
        }
        return list;
    }

    public HabitacionResponse obtenerPorId(Long id) {
        return toResponse(buscarOExcepcion(id));
    }

    public Map<Integer, List<HabitacionResponse>> obtenerMapa() {
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

    public HabitacionResponse crear(RequestHabitacionInsert request) {
        if (habitacionRepository.existsByNumero(request.getNumero())) {
            throw new BusinessException("Ya existe una habitacion con el numero " + request.getNumero());
        }
        EntityHabitacion habitacion = new EntityHabitacion();
        habitacion.setPiso(request.getPiso());
        habitacion.setNumero(request.getNumero());
        habitacion.setTipo(TipoHabitacion.valueOf(request.getTipo()));
        habitacion.setPrecioNoche(request.getPrecioNoche());
        habitacion.setEstado(EstadoHabitacion.DISPONIBLE);
        habitacion.setActivo(true);
        return toResponse(habitacionRepository.save(habitacion));
    }

    public HabitacionResponse actualizar(Long id, RequestHabitacionInsert request) {
        EntityHabitacion h = buscarOExcepcion(id);
        if (!h.getNumero().equals(request.getNumero()) &&
                habitacionRepository.existsByNumero(request.getNumero())) {
            throw new BusinessException("Ya existe una habitacion con el numero " + request.getNumero());
        }
        h.setPiso(request.getPiso());
        h.setNumero(request.getNumero());
        h.setTipo(TipoHabitacion.valueOf(request.getTipo()));
        h.setPrecioNoche(request.getPrecioNoche());
        return toResponse(habitacionRepository.save(h));
    }

    public void cambiarEstado(Long id, RequestHabitacionCambioEstado request) {
        EntityHabitacion h = buscarOExcepcion(id);
        EstadoHabitacion nuevoEstado = EstadoHabitacion.valueOf(request.getEstado());

        if (h.getEstado() == EstadoHabitacion.OCUPADA &&
                (nuevoEstado == EstadoHabitacion.LIMPIEZA || nuevoEstado == EstadoHabitacion.MANTENIMIENTO)) {
            throw new BusinessException("No se puede cambiar a " + nuevoEstado +
                    " una habitacion que esta OCUPADA");
        }
        h.setEstado(nuevoEstado);
        habitacionRepository.save(h);
    }

    public void eliminar(Long id) {
        EntityHabitacion h = buscarOExcepcion(id);
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

