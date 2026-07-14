package com.hotel.apifds20261.business;

import com.hotel.apifds20261.dto.request.RequestHospedajeCheckInDirecto;
import com.hotel.apifds20261.dto.request.RequestHospedajeCheckIn;
import com.hotel.apifds20261.dto.request.RequestHospedajeCheckOut;
import com.hotel.apifds20261.dto.response.HospedajeResponse;
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
import java.time.LocalTime;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class BusinessHospedaje {

    private final RepositoryHospedaje hospedajeRepository;
    private final RepositoryReserva reservaRepository;
    private final RepositoryHabitacion habitacionRepository;
    private final RepositoryCliente clienteRepository;
    private final RepositoryUsuario usuarioRepository;
    private final RepositoryPago pagoRepository;

    public List<HospedajeResponse> listarActivos() {
        List<EntityHospedaje> entities = hospedajeRepository.findByEstadoOrderByFechaIngresoDesc(EstadoHospedaje.ACTIVO);
        List<HospedajeResponse> list = new ArrayList<>();
        for (EntityHospedaje h : entities) {
            list.add(toResponse(h));
        }
        return list;
    }

    public List<HospedajeResponse> listarTodos() {
        List<EntityHospedaje> entities = hospedajeRepository.findAllByOrderByFechaIngresoDesc();
        List<HospedajeResponse> list = new ArrayList<>();
        for (EntityHospedaje h : entities) {
            list.add(toResponse(h));
        }
        return list;
    }

    public HospedajeResponse obtenerPorId(Long id) {
        return toResponse(buscarOExcepcion(id));
    }

    @Transactional
    public HospedajeResponse checkInDesdeReserva(RequestHospedajeCheckIn request, Long usuarioId) {
        EntityReserva reserva = reservaRepository.findById(request.getReservaId()).orElse(null);
        if (reserva == null) {
            throw new ResourceNotFoundException("Reserva no encontrada");
        }

        if (reserva.getEstado() != EstadoReserva.CONFIRMADA) {
            throw new BusinessException("La reserva debe estar CONFIRMADA para hacer check-in");
        }
        if (reserva.getFechaEntrada().isAfter(LocalDate.now())) {
            throw new BusinessException("La fecha de entrada aun no llega. No se puede hacer check-in");
        }

        EntityHabitacion habitacion = reserva.getHabitacion();
        if (!habitacion.getActivo()) {
            throw new BusinessException("La habitacion no esta activa");
        }
        if (habitacion.getEstado() != EstadoHabitacion.DISPONIBLE) {
            throw new BusinessException("La habitacion no esta disponible");
        }

        List<EntityHospedaje> activosCliente = hospedajeRepository.findActivosByClienteId(reserva.getCliente().getId());
        if (!activosCliente.isEmpty()) {
            throw new BusinessException("El cliente ya tiene un hospedaje activo");
        }

        EntityUsuario usuario = usuarioRepository.findById(usuarioId).orElse(null);
        if (usuario == null) {
            throw new ResourceNotFoundException("Usuario no encontrado");
        }

        LocalDateTime fechaIngreso = LocalDateTime.now();
        LocalDateTime fechaSalidaProg = reserva.getFechaSalida().atTime(LocalTime.NOON);

        EntityHospedaje hospedaje = new EntityHospedaje();
        hospedaje.setCliente(reserva.getCliente());
        hospedaje.setHabitacion(habitacion);
        hospedaje.setReserva(reserva);
        hospedaje.setUsuario(usuario);
        hospedaje.setFechaIngreso(fechaIngreso);
        hospedaje.setFechaSalidaProgramada(fechaSalidaProg);
        hospedaje.setTotalPagado(reserva.getMontoAdelanto());

        BigDecimal saldoPendiente = reserva.getMontoTotal().subtract(reserva.getMontoAdelanto());
        hospedaje.setDeudaPendiente(saldoPendiente);

        if (request.getMontoSaldo() != null && request.getMontoSaldo().compareTo(BigDecimal.ZERO) > 0) {
            if (request.getMontoSaldo().compareTo(saldoPendiente) > 0) {
                throw new BusinessException("El monto de saldo no puede exceder el saldo pendiente");
            }
            EntityPago pagoSaldo = new EntityPago();
            pagoSaldo.setReserva(reserva);
            pagoSaldo.setHospedaje(hospedaje);
            pagoSaldo.setUsuario(usuario);
            pagoSaldo.setMonto(request.getMontoSaldo());
            pagoSaldo.setMetodo(MetodoPago.valueOf(request.getMetodoSaldo()));
            pagoSaldo.setReferencia(request.getReferencia());
            pagoSaldo.setTipo(TipoPago.SALDO);
            pagoSaldo.setFechaPago(LocalDateTime.now());
            pagoRepository.save(pagoSaldo);
            hospedaje.setTotalPagado(hospedaje.getTotalPagado().add(request.getMontoSaldo()));
            hospedaje.setDeudaPendiente(saldoPendiente.subtract(request.getMontoSaldo()));
        }

        hospedaje = hospedajeRepository.save(hospedaje);

        habitacion.setEstado(EstadoHabitacion.OCUPADA);
        habitacionRepository.save(habitacion);

        reserva.setEstado(EstadoReserva.REALIZADA);
        reservaRepository.save(reserva);

        return toResponse(hospedaje);
    }

    @Transactional
    public HospedajeResponse checkInDirecto(RequestHospedajeCheckInDirecto request, Long usuarioId) {
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

        if (!habitacion.getActivo() || habitacion.getEstado() != EstadoHabitacion.DISPONIBLE) {
            throw new BusinessException("La habitacion no esta disponible");
        }

        List<EntityHospedaje> activosCliente = hospedajeRepository.findActivosByClienteId(cliente.getId());
        if (!activosCliente.isEmpty()) {
            throw new BusinessException("El cliente ya tiene un hospedaje activo");
        }

        int noches = request.getNoches() != null && request.getNoches() > 0
                ? request.getNoches() : 1;
        BigDecimal total = habitacion.getPrecioNoche().multiply(BigDecimal.valueOf(noches));

        LocalDateTime fechaIngreso = LocalDateTime.now();
        LocalDateTime fechaSalidaProg = fechaIngreso.toLocalDate().plusDays(noches).atTime(LocalTime.NOON);

        if (request.getMontoPago().compareTo(total) > 0) {
            throw new BusinessException("El monto pagado no puede exceder el total");
        }

        EntityHospedaje hospedaje = new EntityHospedaje();
        hospedaje.setCliente(cliente);
        hospedaje.setHabitacion(habitacion);
        hospedaje.setUsuario(usuario);
        hospedaje.setFechaIngreso(fechaIngreso);
        hospedaje.setFechaSalidaProgramada(fechaSalidaProg);
        hospedaje.setTotalPagado(request.getMontoPago());
        hospedaje.setDeudaPendiente(total.subtract(request.getMontoPago()));

        hospedaje = hospedajeRepository.save(hospedaje);

        EntityPago pago = new EntityPago();
        pago.setHospedaje(hospedaje);
        pago.setUsuario(usuario);
        pago.setMonto(request.getMontoPago());
        pago.setMetodo(MetodoPago.valueOf(request.getMetodo()));
        pago.setReferencia(request.getReferencia());
        pago.setTipo(TipoPago.SALDO);
        pago.setFechaPago(LocalDateTime.now());
        pagoRepository.save(pago);

        habitacion.setEstado(EstadoHabitacion.OCUPADA);
        habitacionRepository.save(habitacion);

        return toResponse(hospedaje);
    }

    @Transactional
    public HospedajeResponse checkOut(RequestHospedajeCheckOut request, Long usuarioId) {
        EntityHospedaje hospedaje = buscarOExcepcion(request.getHospedajeId());

        if (hospedaje.getEstado() != EstadoHospedaje.ACTIVO) {
            throw new BusinessException("El hospedaje ya esta finalizado");
        }

        EntityUsuario usuario = usuarioRepository.findById(usuarioId).orElse(null);
        if (usuario == null) {
            throw new ResourceNotFoundException("Usuario no encontrado");
        }

        hospedaje.setFechaSalidaReal(request.getFechaSalidaReal());
        hospedaje.setEstado(EstadoHospedaje.FINALIZADO);

        BigDecimal cargoExtension = BigDecimal.ZERO;

        if (request.getFechaSalidaReal().isAfter(hospedaje.getFechaSalidaProgramada())) {
            long nochesExtra = calcularNochesExtra(request.getFechaSalidaReal(), hospedaje.getFechaSalidaProgramada());
            BigDecimal precioNoche = hospedaje.getHabitacion().getPrecioNoche();
            cargoExtension = precioNoche.multiply(BigDecimal.valueOf(nochesExtra));
            hospedaje.setDeudaPendiente(hospedaje.getDeudaPendiente().add(cargoExtension));

            if (request.getMontoExtension() != null) {
                if (request.getMontoExtension().compareTo(BigDecimal.ZERO) < 0) {
                    throw new BusinessException("El monto de extension no puede ser negativo");
                }
                if (request.getMontoExtension().compareTo(cargoExtension) > 0) {
                    throw new BusinessException("El monto de extension no puede exceder el cargo por extension");
                }
                if (request.getMontoExtension().compareTo(BigDecimal.ZERO) > 0) {
                    if (request.getMetodoExtension() == null || request.getMetodoExtension().isBlank()) {
                        throw new BusinessException("Debe indicar el metodo de pago para la extension");
                    }
                    EntityPago pagoExtension = new EntityPago();
                    pagoExtension.setHospedaje(hospedaje);
                    pagoExtension.setUsuario(usuario);
                    pagoExtension.setMonto(request.getMontoExtension());
                    pagoExtension.setMetodo(MetodoPago.valueOf(request.getMetodoExtension()));
                    pagoExtension.setReferencia(request.getReferenciaExtension());
                    pagoExtension.setTipo(TipoPago.EXTENSION);
                    pagoExtension.setFechaPago(LocalDateTime.now());
                    pagoRepository.save(pagoExtension);
                    hospedaje.setTotalPagado(hospedaje.getTotalPagado().add(request.getMontoExtension()));
                    hospedaje.setDeudaPendiente(hospedaje.getDeudaPendiente().subtract(request.getMontoExtension()));
                }
            }
        }

        if (request.getMontoPago() != null) {
            if (request.getMontoPago().compareTo(BigDecimal.ZERO) < 0) {
                throw new BusinessException("El monto de pago no puede ser negativo");
            }
            if (request.getMontoPago().compareTo(hospedaje.getDeudaPendiente()) > 0) {
                throw new BusinessException("El monto de pago no puede exceder la deuda pendiente");
            }
            if (request.getMontoPago().compareTo(BigDecimal.ZERO) > 0) {
                if (request.getMetodoPago() == null || request.getMetodoPago().isBlank()) {
                    throw new BusinessException("Debe indicar el metodo de pago para el saldo");
                }
                EntityPago pagoSalida = new EntityPago();
                pagoSalida.setHospedaje(hospedaje);
                pagoSalida.setUsuario(usuario);
                pagoSalida.setMonto(request.getMontoPago());
                pagoSalida.setMetodo(MetodoPago.valueOf(request.getMetodoPago()));
                pagoSalida.setReferencia(request.getReferencia());
                pagoSalida.setTipo(TipoPago.SALDO);
                pagoSalida.setFechaPago(LocalDateTime.now());
                pagoRepository.save(pagoSalida);
                hospedaje.setTotalPagado(hospedaje.getTotalPagado().add(request.getMontoPago()));
                hospedaje.setDeudaPendiente(hospedaje.getDeudaPendiente().subtract(request.getMontoPago()));
            }
        }

        hospedaje = hospedajeRepository.save(hospedaje);

        EntityHabitacion habitacion = hospedaje.getHabitacion();
        habitacion.setEstado(EstadoHabitacion.DISPONIBLE);
        habitacionRepository.save(habitacion);

        return toResponse(hospedaje);
    }

    @Transactional
    public HospedajeResponse extenderEstadia(Long hospedajeId, LocalDateTime nuevaFechaSalida, Long usuarioId) {
        EntityHospedaje hospedaje = buscarOExcepcion(hospedajeId);

        if (hospedaje.getEstado() != EstadoHospedaje.ACTIVO) {
            throw new BusinessException("No se puede extender un hospedaje finalizado");
        }

        EntityUsuario usuario = usuarioRepository.findById(usuarioId).orElse(null);
        if (usuario == null) {
            throw new ResourceNotFoundException("Usuario no encontrado");
        }

        if (!nuevaFechaSalida.isAfter(hospedaje.getFechaIngreso())) {
            throw new BusinessException("La nueva fecha de salida debe ser posterior al ingreso");
        }

        if (nuevaFechaSalida.isBefore(hospedaje.getFechaSalidaProgramada())) {
            throw new BusinessException("La nueva fecha de salida debe ser posterior o igual a la fecha programada actual");
        }

        long nochesOriginales = ChronoUnit.DAYS.between(
                hospedaje.getFechaIngreso().toLocalDate(),
                hospedaje.getFechaSalidaProgramada().toLocalDate());

        long nochesNuevas = ChronoUnit.DAYS.between(
                hospedaje.getFechaIngreso().toLocalDate(),
                nuevaFechaSalida.toLocalDate());

        long nochesExtra = nochesNuevas - nochesOriginales;
        if (nochesExtra <= 0) {
            throw new BusinessException("La extension debe agregar al menos una noche adicional");
        }

        BigDecimal precioNoche = hospedaje.getHabitacion().getPrecioNoche();
        BigDecimal cargoExtension = precioNoche.multiply(BigDecimal.valueOf(nochesExtra));

        hospedaje.setFechaSalidaProgramada(nuevaFechaSalida);
        hospedaje.setDeudaPendiente(hospedaje.getDeudaPendiente().add(cargoExtension));
        hospedaje = hospedajeRepository.save(hospedaje);

        return toResponse(hospedaje);
    }

    @Transactional
    public HospedajeResponse cambiarHabitacion(Long hospedajeId, Long nuevaHabitacionId, Long usuarioId) {
        EntityHospedaje hospedaje = buscarOExcepcion(hospedajeId);

        if (hospedaje.getEstado() != EstadoHospedaje.ACTIVO) {
            throw new BusinessException("No se puede cambiar de habitacion en un hospedaje finalizado");
        }

        EntityUsuario usuario = usuarioRepository.findById(usuarioId).orElse(null);
        if (usuario == null) {
            throw new ResourceNotFoundException("Usuario no encontrado");
        }

        EntityHabitacion nuevaHabitacion = habitacionRepository.findById(nuevaHabitacionId).orElse(null);
        if (nuevaHabitacion == null) {
            throw new ResourceNotFoundException("Habitacion no encontrada");
        }

        if (hospedaje.getHabitacion().getId().equals(nuevaHabitacion.getId())) {
            throw new BusinessException("El hospedaje ya esta asignado a esa habitacion");
        }

        if (!nuevaHabitacion.getActivo()) {
            throw new BusinessException("La habitacion no esta activa");
        }
        if (nuevaHabitacion.getEstado() != EstadoHabitacion.DISPONIBLE) {
            throw new BusinessException("La habitacion no esta disponible");
        }

        EntityHabitacion habitacionAnterior = hospedaje.getHabitacion();
        habitacionAnterior.setEstado(EstadoHabitacion.DISPONIBLE);
        habitacionRepository.save(habitacionAnterior);

        nuevaHabitacion.setEstado(EstadoHabitacion.OCUPADA);
        habitacionRepository.save(nuevaHabitacion);

        hospedaje.setHabitacion(nuevaHabitacion);
        hospedaje = hospedajeRepository.save(hospedaje);

        return toResponse(hospedaje);
    }

    public long calcularNochesExtra(LocalDateTime fechaSalidaReal, LocalDateTime fechaSalidaProgramada) {
        if (fechaSalidaReal == null || fechaSalidaProgramada == null) return 0;
        if (!fechaSalidaReal.isAfter(fechaSalidaProgramada)) return 0;

        LocalDateTime salidaProgMediodia = fechaSalidaProgramada.toLocalDate().atTime(LocalTime.NOON);
        if (fechaSalidaReal.isBefore(salidaProgMediodia)) return 0;

        LocalDate inicioExtra = salidaProgMediodia.toLocalDate();
        LocalDate finExtra = fechaSalidaReal.toLocalDate();
        long dias = ChronoUnit.DAYS.between(inicioExtra, finExtra);
        if (fechaSalidaReal.toLocalTime().isAfter(LocalTime.NOON)) dias++;
        return Math.max(dias, 1);
    }

    private EntityHospedaje buscarOExcepcion(Long id) {
        EntityHospedaje h = hospedajeRepository.findById(id).orElse(null);
        if (h == null) {
            throw new ResourceNotFoundException("Hospedaje no encontrado");
        }
        return h;
    }

    private HospedajeResponse toResponse(EntityHospedaje h) {
        HospedajeResponse r = new HospedajeResponse();
        r.setId(h.getId());
        r.setClienteId(h.getCliente().getId());
        r.setClienteNombre(h.getCliente().getNombreCompleto());
        r.setClienteTelefono(h.getCliente().getTelefono());
        r.setHabitacionId(h.getHabitacion().getId());
        r.setHabitacionNumero(h.getHabitacion().getNumero());
        r.setHabitacionTipo(h.getHabitacion().getTipo().name());
        r.setHabitacionPiso(h.getHabitacion().getPiso());
        r.setHabitacionPrecio(h.getHabitacion().getPrecioNoche());
        r.setReservaId(h.getReserva() != null ? h.getReserva().getId() : null);
        r.setUsuarioId(h.getUsuario().getId());
        r.setUsuarioNombre(h.getUsuario().getNombreCompleto());
        r.setFechaIngreso(h.getFechaIngreso());
        r.setFechaSalidaProgramada(h.getFechaSalidaProgramada());
        r.setFechaSalidaReal(h.getFechaSalidaReal());
        r.setEstado(h.getEstado().name());
        r.setTotalPagado(h.getTotalPagado());
        r.setDeudaPendiente(h.getDeudaPendiente());
        return r;
    }
}

