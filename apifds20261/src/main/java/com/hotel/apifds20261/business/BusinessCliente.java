package com.hotel.apifds20261.business;

import com.hotel.apifds20261.dto.request.RequestClienteInsert;
import com.hotel.apifds20261.dto.response.ClienteResponse;
import com.hotel.apifds20261.dto.response.HospedajeResponse;
import com.hotel.apifds20261.dto.response.ReservaResponse;
import com.hotel.apifds20261.dto.response.ResponsePage;
import com.hotel.apifds20261.entity.EntityCliente;
import com.hotel.apifds20261.entity.EntityHospedaje;
import com.hotel.apifds20261.entity.EntityReserva;
import com.hotel.apifds20261.exception.ResourceNotFoundException;
import com.hotel.apifds20261.repository.RepositoryCliente;
import com.hotel.apifds20261.repository.RepositoryHospedaje;
import com.hotel.apifds20261.repository.RepositoryReserva;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import com.hotel.apifds20261.staticdata.*;

@Service
@RequiredArgsConstructor
public class BusinessCliente {

    private final RepositoryCliente clienteRepository;
    private final RepositoryReserva reservaRepository;
    private final RepositoryHospedaje hospedajeRepository;

    public List<ClienteResponse> listarTodos() {
        List<EntityCliente> entities = clienteRepository.findAllByOrderByCreatedAtDesc();
        List<ClienteResponse> list = new ArrayList<>();
        for (EntityCliente c : entities) {
            list.add(toResponse(c));
        }
        return list;
    }

    public ResponsePage<ClienteResponse> listarPaginado(String search, int page, int size, String sortField, String sortDir) {
        Sort sort = Sort.by(sortDir.equalsIgnoreCase("desc") ? Sort.Direction.DESC : Sort.Direction.ASC,
                sortField == null || sortField.isBlank() ? "id" : sortField);
        Pageable pageable = PageRequest.of(page, size, sort);
        Page<EntityCliente> pagina = clienteRepository.findAllPaginated(search, pageable);
        List<ClienteResponse> list = new ArrayList<>();
        for (EntityCliente c : pagina.getContent()) {
            list.add(toResponse(c));
        }
        return new ResponsePage<>(list, pagina.getNumber(), pagina.getSize(), pagina.getTotalElements(), pagina.getTotalPages());
    }

    public ClienteResponse obtenerPorId(Long id) {
        return toResponse(buscarOExcepcion(id));
    }

    public List<ClienteResponse> buscar(String termino) {
        List<EntityCliente> entities = clienteRepository
                .findByNombreCompletoContainingIgnoreCaseOrTelefonoContaining(termino, termino);
        List<ClienteResponse> list = new ArrayList<>();
        for (EntityCliente c : entities) {
            list.add(toResponse(c));
        }
        return list;
    }

    public ClienteResponse crear(RequestClienteInsert request) {
        EntityCliente cliente = new EntityCliente();
        cliente.setNombreCompleto(request.getNombreCompleto());
        cliente.setTelefono(request.getTelefono());
        cliente.setDocumento(request.getDocumento());
        cliente.setEmail(request.getEmail());
        return toResponse(clienteRepository.save(cliente));
    }

    public ClienteResponse actualizar(Long id, RequestClienteInsert request) {
        EntityCliente c = buscarOExcepcion(id);
        c.setNombreCompleto(request.getNombreCompleto());
        c.setTelefono(request.getTelefono());
        c.setDocumento(request.getDocumento());
        c.setEmail(request.getEmail());
        return toResponse(clienteRepository.save(c));
    }

    public ClienteResponse buscarPorTelefono(String telefono) {
        List<EntityCliente> clientes = clienteRepository.findByTelefono(telefono);
        if (clientes.isEmpty()) {
            throw new ResourceNotFoundException("No se encontro cliente con telefono " + telefono);
        }
        return toResponse(clientes.get(0));
    }

    public List<ReservaResponse> historialReservas(Long clienteId) {
        List<EntityReserva> entities = reservaRepository.findByClienteIdOrderByFechaReservaDesc(clienteId);
        List<ReservaResponse> list = new ArrayList<>();
        for (EntityReserva r : entities) {
            list.add(toReservaResponse(r));
        }
        return list;
    }

    public List<HospedajeResponse> historialHospedajes(Long clienteId) {
        List<EntityHospedaje> entities = hospedajeRepository.findByClienteIdOrderByFechaIngresoDesc(clienteId);
        List<HospedajeResponse> list = new ArrayList<>();
        for (EntityHospedaje h : entities) {
            list.add(toHospedajeResponse(h));
        }
        return list;
    }

    private EntityCliente buscarOExcepcion(Long id) {
        EntityCliente c = clienteRepository.findById(id).orElse(null);
        if (c == null) {
            throw new ResourceNotFoundException("Cliente no encontrado");
        }
        return c;
    }

    private ClienteResponse toResponse(EntityCliente c) {
        ClienteResponse r = new ClienteResponse();
        r.setId(c.getId());
        r.setNombreCompleto(c.getNombreCompleto());
        r.setTelefono(c.getTelefono());
        r.setDocumento(c.getDocumento());
        r.setEmail(c.getEmail());
        r.setCreatedAt(c.getCreatedAt());

        // Estado derivado de datos reales
        List<EntityHospedaje> hospedajes = hospedajeRepository.findByClienteIdOrderByFechaIngresoDesc(c.getId());
        boolean activo = hospedajes.stream().anyMatch(h -> h.getEstado() == EstadoHospedaje.ACTIVO);
        if (activo) {
            r.setEstado("Hospedado");
        } else {
            List<EntityReserva> reservas = reservaRepository.findByClienteIdOrderByFechaReservaDesc(c.getId());
            boolean tieneReserva = reservas.stream().anyMatch(res ->
                res.getEstado() == EstadoReserva.CONFIRMADA && !res.getFechaEntrada().isBefore(LocalDate.now()));
            r.setEstado(tieneReserva ? "Reserva" : "Registrado");
        }

        // Total estancias completadas
        long total = hospedajes.stream().filter(h -> h.getEstado() == EstadoHospedaje.FINALIZADO).count();
        r.setTotalEstancias((int) total);

        // Última estancia
        hospedajes.stream()
            .filter(h -> h.getEstado() == EstadoHospedaje.FINALIZADO && h.getFechaSalidaReal() != null)
            .max(Comparator.comparing(EntityHospedaje::getFechaSalidaReal))
            .ifPresent(h -> r.setUltimaEstancia(h.getFechaSalidaReal()));

        // Lealtad
        if (total == 0) r.setLealtad("Nuevo");
        else if (total <= 2) r.setLealtad("Regular");
        else if (total <= 5) r.setLealtad("Frecuente");
        else r.setLealtad("VIP");

        return r;
    }

    private ReservaResponse toReservaResponse(EntityReserva r) {
        ReservaResponse res = new ReservaResponse();
        res.setId(r.getId());
        res.setClienteId(r.getCliente().getId());
        res.setClienteNombre(r.getCliente().getNombreCompleto());
        res.setHabitacionId(r.getHabitacion().getId());
        res.setHabitacionNumero(r.getHabitacion().getNumero());
        res.setFechaEntrada(r.getFechaEntrada());
        res.setFechaSalida(r.getFechaSalida());
        res.setFechaReserva(r.getFechaReserva());
        res.setEstado(r.getEstado().name());
        res.setMontoTotal(r.getMontoTotal());
        res.setMontoAdelanto(r.getMontoAdelanto());
        return res;
    }

    private HospedajeResponse toHospedajeResponse(EntityHospedaje h) {
        HospedajeResponse res = new HospedajeResponse();
        res.setId(h.getId());
        res.setClienteId(h.getCliente().getId());
        res.setClienteNombre(h.getCliente().getNombreCompleto());
        res.setHabitacionId(h.getHabitacion().getId());
        res.setHabitacionNumero(h.getHabitacion().getNumero());
        res.setFechaIngreso(h.getFechaIngreso());
        res.setFechaSalidaProgramada(h.getFechaSalidaProgramada());
        res.setFechaSalidaReal(h.getFechaSalidaReal());
        res.setEstado(h.getEstado().name());
        return res;
    }
}

