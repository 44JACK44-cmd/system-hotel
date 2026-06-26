package com.hotel.apifds20261.business;

import com.hotel.apifds20261.dto.request.RequestReservaInsert;
import com.hotel.apifds20261.dto.response.ReservaResponse;
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

        if (!habitacion.getActivo()) {
            throw new BusinessException("La habitacion no esta activa");
        }
        if (request.getFechaSalida().isBefore(request.getFechaEntrada()) ||
                request.getFechaSalida().isEqual(request.getFechaEntrada())) {
            throw new BusinessException("La fecha de salida debe ser posterior a la fecha de entrada");
        }
        if (request.getFechaEntrada().isBefore(LocalDate.now())) {
            throw new BusinessException("No se puede reservar con fecha de entrada en el pasado");
        }

        if (habitacion.getEstado() == EstadoHabitacion.LIMPIEZA ||
                habitacion.getEstado() == EstadoHabitacion.MANTENIMIENTO) {
            throw new BusinessException("La habitacion esta en " + habitacion.getEstado().name().toLowerCase() +
                    " y no puede reservarse");
        }
        if (habitacion.getEstado() == EstadoHabitacion.OCUPADA) {
            EntityHospedaje hospedajeActivo = hospedajeRepository.findActivoByHabitacionId(habitacion.getId());
            if (hospedajeActivo != null && hospedajeActivo.getFechaSalidaProgramada().toLocalDate().isAfter(request.getFechaEntrada())) {
                throw new BusinessException("La habitacion estara ocupada hasta el " +
                        hospedajeActivo.getFechaSalidaProgramada().toLocalDate() + " y no puede reservarse para esas fechas");
            }
        }

        List<EntityReserva> solapadas = reservaRepository.findSolapadas(
                request.getHabitacionId(), request.getFechaEntrada(), request.getFechaSalida());
        if (!solapadas.isEmpty()) {
            throw new BusinessException("La habitacion ya tiene una reserva confirmada en esas fechas");
        }

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
        if (reserva.getEstado() == EstadoReserva.REALIZADA) {
            throw new BusinessException("No se puede cancelar una reserva ya realizada");
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
        List<EntityReserva> solapadas = reservaRepository.findSolapadas(habitacionId, fechaEntrada, fechaSalida);
        return solapadas.isEmpty();
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

