package com.hotel.apifds20261.business;

import com.hotel.apifds20261.dto.request.RequestReservaInsert;
import com.hotel.apifds20261.dto.request.RequestReservaUpdate;
import com.hotel.apifds20261.dto.response.ReservaResponse;
import com.hotel.apifds20261.dto.response.ResponsePage;
import com.hotel.apifds20261.entity.*;
import com.hotel.apifds20261.staticdata.*;
import com.hotel.apifds20261.exception.BusinessException;
import com.hotel.apifds20261.exception.ResourceNotFoundException;
import com.hotel.apifds20261.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class BusinessReserva {

    private final RepositoryReserva reservaRepository;
    private final RepositoryCliente clienteRepository;
    private final RepositoryHabitacion habitacionRepository;
    private final RepositoryUsuario usuarioRepository;
    private final RepositoryPago pagoRepository;
    private final RepositoryHospedaje hospedajeRepository;

    public List<ReservaResponse> listarTodas() {
        List<EntityReserva> entities = reservaRepository.findAllByOrderByFechaReservaDesc();
        List<ReservaResponse> list = new ArrayList<>();
        for (EntityReserva r : entities) {
            list.add(toResponse(r));
        }
        return list;
    }

    public ResponsePage<ReservaResponse> listarPaginado(String search, int page, int size, String sortField, String sortDir) {
        org.springframework.data.domain.Sort sort = org.springframework.data.domain.Sort.by(
                sortDir.equalsIgnoreCase("desc") ? org.springframework.data.domain.Sort.Direction.DESC : org.springframework.data.domain.Sort.Direction.ASC,
                sortField == null || sortField.isBlank() ? "id" : sortField);
        org.springframework.data.domain.Pageable pageable = org.springframework.data.domain.PageRequest.of(page, size, sort);
        org.springframework.data.domain.Page<EntityReserva> pagina = reservaRepository.findAllPaginated(search, pageable);
        List<ReservaResponse> list = new ArrayList<>();
        for (EntityReserva r : pagina.getContent()) {
            list.add(toResponse(r));
        }
        return new ResponsePage<>(list, pagina.getNumber(), pagina.getSize(), pagina.getTotalElements(), pagina.getTotalPages());
    }

    public List<ReservaResponse> listarDelDia() {
        List<EntityReserva> entities = reservaRepository.findByFechaEntradaOrderByFechaReservaDesc(LocalDate.now());
        List<ReservaResponse> list = new ArrayList<>();
        for (EntityReserva r : entities) {
            list.add(toResponse(r));
        }
        return list;
    }

    public List<ReservaResponse> listarPorEstado(String estado) {
        List<EntityReserva> entities = reservaRepository.findByEstadoOrderByFechaReservaDesc(EstadoReserva.valueOf(estado));
        List<ReservaResponse> list = new ArrayList<>();
        for (EntityReserva r : entities) {
            list.add(toResponse(r));
        }
        return list;
    }

    public ReservaResponse obtenerPorId(Long id) {
        return toResponse(buscarOExcepcion(id));
    }

    @Transactional
    public ReservaResponse crear(RequestReservaInsert request, Long usuarioId) {
        EntityCliente cliente = clienteRepository.findById(request.getClienteId()).orElse(null);
        if (cliente == null) {
            throw new ResourceNotFoundException("Cliente no encontrado");
        }
        EntityHabitacion habitacion = habitacionRepository.findById(request.getHabitacionId()).orElse(null);
        if (habitacion == null) {
            throw new ResourceNotFoundException("Habitacion no encontrada");
        }
        EntityUsuario usuario = usuarioRepository.findById(usuarioId).orElse(null);
        if (usuario == null) {
            throw new ResourceNotFoundException("Usuario no encontrado");
        }

        validarDisponibilidad(habitacion, request.getFechaEntrada(), request.getFechaSalida());

        long noches = ChronoUnit.DAYS.between(request.getFechaEntrada(), request.getFechaSalida());
        BigDecimal montoTotal = habitacion.getPrecioNoche().multiply(BigDecimal.valueOf(noches));

        if (request.getMontoAdelanto().compareTo(montoTotal) > 0) {
            throw new BusinessException("El adelanto no puede ser mayor al monto total");
        }
        if (request.getMontoAdelanto().compareTo(BigDecimal.ZERO) <= 0) {
            throw new BusinessException("El adelanto es obligatorio y debe ser mayor a cero");
        }

        EntityReserva reserva = new EntityReserva();
        reserva.setCliente(cliente);
        reserva.setHabitacion(habitacion);
        reserva.setUsuario(usuario);
        reserva.setFechaEntrada(request.getFechaEntrada());
        reserva.setFechaSalida(request.getFechaSalida());
        reserva.setFechaReserva(LocalDateTime.now());
        reserva.setMontoTotal(montoTotal);
        reserva.setMontoAdelanto(request.getMontoAdelanto());
        reserva.setMetodoAdelanto(MetodoPago.valueOf(request.getMetodoAdelanto()));
        reserva.setReferenciaPago(request.getReferenciaPago());
        reserva.setObservacion(request.getObservacion());
        reserva = reservaRepository.save(reserva);

        EntityPago pagoAdelanto = new EntityPago();
        pagoAdelanto.setReserva(reserva);
        pagoAdelanto.setUsuario(usuario);
        pagoAdelanto.setMonto(request.getMontoAdelanto());
        pagoAdelanto.setMetodo(MetodoPago.valueOf(request.getMetodoAdelanto()));
        pagoAdelanto.setReferencia(request.getReferenciaPago());
        pagoAdelanto.setTipo(TipoPago.ADELANTO);
        pagoAdelanto.setFechaPago(LocalDateTime.now());
        pagoRepository.save(pagoAdelanto);

        return toResponse(reserva);
    }

    @Transactional
    public void cancelar(Long id) {
        EntityReserva reserva = buscarOExcepcion(id);
        if (reserva.getEstado() != EstadoReserva.CONFIRMADA) {
            throw new BusinessException("Solo se pueden cancelar reservas confirmadas");
        }
        reserva.setEstado(EstadoReserva.CANCELADA);
        reservaRepository.save(reserva);
    }

    @Transactional
    public void marcarNoShow() {
        List<EntityReserva> vencidas = reservaRepository.findConfirmadasVencidas(LocalDate.now());
        for (EntityReserva r : vencidas) {
            r.setEstado(EstadoReserva.NO_SHOW);
            reservaRepository.save(r);
        }
    }

    public boolean verificarDisponibilidad(Long habitacionId, LocalDate fechaEntrada, LocalDate fechaSalida) {
        EntityHabitacion habitacion = habitacionRepository.findById(habitacionId).orElse(null);
        if (habitacion == null) return false;
        try {
            validarDisponibilidad(habitacion, fechaEntrada, fechaSalida);
            return true;
        } catch (BusinessException e) {
            return false;
        }
    }

    @Transactional
    public ReservaResponse actualizar(Long id, RequestReservaUpdate request, Long usuarioId) {
        EntityReserva reserva = buscarOExcepcion(id);
        if (reserva.getEstado() != EstadoReserva.CONFIRMADA) {
            throw new BusinessException("Solo se pueden modificar reservas confirmadas");
        }

        EntityHabitacion nuevaHabitacion = habitacionRepository.findById(request.getHabitacionId()).orElse(null);
        if (nuevaHabitacion == null) {
            throw new ResourceNotFoundException("Habitacion no encontrada");
        }

        validarDisponibilidad(nuevaHabitacion, request.getFechaEntrada(), request.getFechaSalida(), id);

        long noches = ChronoUnit.DAYS.between(request.getFechaEntrada(), request.getFechaSalida());
        BigDecimal nuevoMontoTotal = nuevaHabitacion.getPrecioNoche().multiply(BigDecimal.valueOf(noches));

        if (reserva.getMontoAdelanto().compareTo(nuevoMontoTotal) > 0) {
            throw new BusinessException("El adelanto ya pagado (S/ " + reserva.getMontoAdelanto() +
                    ") supera el nuevo monto total (S/ " + nuevoMontoTotal + ")");
        }

        reserva.setHabitacion(nuevaHabitacion);
        reserva.setFechaEntrada(request.getFechaEntrada());
        reserva.setFechaSalida(request.getFechaSalida());
        reserva.setMontoTotal(nuevoMontoTotal);
        reserva.setObservacion(request.getObservacion());
        reserva = reservaRepository.save(reserva);

        return toResponse(reserva);
    }

    private void validarDisponibilidad(EntityHabitacion habitacion, LocalDate fechaEntrada, LocalDate fechaSalida) {
        validarDisponibilidad(habitacion, fechaEntrada, fechaSalida, null);
    }

    private void validarDisponibilidad(EntityHabitacion habitacion, LocalDate fechaEntrada, LocalDate fechaSalida, Long excludeReservaId) {
        if (!habitacion.getActivo()) {
            throw new BusinessException("La habitacion no esta activa");
        }
        if (fechaSalida.isBefore(fechaEntrada) || fechaSalida.isEqual(fechaEntrada)) {
            throw new BusinessException("La fecha de salida debe ser posterior a la fecha de entrada");
        }
        if (fechaEntrada.isBefore(LocalDate.now())) {
            throw new BusinessException("No se puede reservar con fecha de entrada en el pasado");
        }
        if (habitacion.getEstado() == EstadoHabitacion.LIMPIEZA ||
                habitacion.getEstado() == EstadoHabitacion.MANTENIMIENTO) {
            throw new BusinessException("La habitacion esta en " + habitacion.getEstado().name().toLowerCase() +
                    " y no puede reservarse");
        }
        if (habitacion.getEstado() == EstadoHabitacion.OCUPADA) {
            EntityHospedaje hospedajeActivo = hospedajeRepository.findActivoByHabitacionId(habitacion.getId());
            if (hospedajeActivo != null && hospedajeActivo.getFechaSalidaProgramada().toLocalDate().isAfter(fechaEntrada)) {
                throw new BusinessException("La habitacion estara ocupada hasta el " +
                        hospedajeActivo.getFechaSalidaProgramada().toLocalDate() + " y no puede reservarse para esas fechas");
            }
        }
        List<EntityReserva> solapadas = reservaRepository.findSolapadas(
                habitacion.getId(), fechaEntrada, fechaSalida);
        if (excludeReservaId != null) {
            solapadas.removeIf(r -> r.getId().equals(excludeReservaId));
        }
        if (!solapadas.isEmpty()) {
            throw new BusinessException("La habitacion ya tiene una reserva confirmada en esas fechas");
        }
    }

    private EntityReserva buscarOExcepcion(Long id) {
        EntityReserva r = reservaRepository.findById(id).orElse(null);
        if (r == null) {
            throw new ResourceNotFoundException("Reserva no encontrada");
        }
        return r;
    }

    private ReservaResponse toResponse(EntityReserva r) {
        ReservaResponse res = new ReservaResponse();
        res.setId(r.getId());
        res.setClienteId(r.getCliente().getId());
        res.setClienteNombre(r.getCliente().getNombreCompleto());
        res.setClienteTelefono(r.getCliente().getTelefono());
        res.setHabitacionId(r.getHabitacion().getId());
        res.setHabitacionNumero(r.getHabitacion().getNumero());
        res.setHabitacionTipo(r.getHabitacion().getTipo().name());
        res.setHabitacionPrecio(r.getHabitacion().getPrecioNoche());
        res.setUsuarioId(r.getUsuario().getId());
        res.setUsuarioNombre(r.getUsuario().getNombreCompleto());
        res.setFechaEntrada(r.getFechaEntrada());
        res.setFechaSalida(r.getFechaSalida());
        res.setFechaReserva(r.getFechaReserva());
        res.setEstado(r.getEstado().name());
        res.setMontoTotal(r.getMontoTotal());
        res.setMontoAdelanto(r.getMontoAdelanto());
        res.setMetodoAdelanto(r.getMetodoAdelanto().name());
        res.setReferenciaPago(r.getReferenciaPago());
        res.setObservacion(r.getObservacion());
        return res;
    }
}

