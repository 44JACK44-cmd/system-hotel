package com.hotel.apifds20261.business;

import com.hotel.apifds20261.dto.request.RequestClienteInsert;
import com.hotel.apifds20261.dto.response.ClienteResponse;
import com.hotel.apifds20261.dto.response.HospedajeResponse;
import com.hotel.apifds20261.dto.response.ReservaResponse;
import com.hotel.apifds20261.dto.response.ResponsePage;
import com.hotel.apifds20261.dto.response.SuggestionResponse;
import com.hotel.apifds20261.entity.EntityCliente;
import com.hotel.apifds20261.entity.EntityHospedaje;
import com.hotel.apifds20261.entity.EntityReserva;
import com.hotel.apifds20261.exception.BusinessException;
import com.hotel.apifds20261.exception.ResourceNotFoundException;
import com.hotel.apifds20261.helper.ValidationHelper;
import com.hotel.apifds20261.repository.RepositoryCliente;
import com.hotel.apifds20261.repository.RepositoryHospedaje;
import com.hotel.apifds20261.repository.RepositoryReserva;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

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

    public ResponsePage<ClienteResponse> listarPaginado(String search, int page, int size, String sortField, String sortDir, boolean includeInactivos) {
        Sort sort = Sort.by(sortDir.equalsIgnoreCase("desc") ? Sort.Direction.DESC : Sort.Direction.ASC,
                sortField == null || sortField.isBlank() ? "id" : sortField);
        Pageable pageable = PageRequest.of(page, size, sort);
        Page<EntityCliente> pagina = clienteRepository.findAllPaginated(search, includeInactivos, pageable);
        List<ClienteResponse> list = new ArrayList<>();
        for (EntityCliente c : pagina.getContent()) {
            list.add(toResponse(c));
        }
        return new ResponsePage<>(list, pagina.getNumber(), pagina.getSize(), pagina.getTotalElements(), pagina.getTotalPages());
    }

    @Transactional
    public ClienteResponse deactivate(Long id) {
        EntityCliente c = buscarOExcepcion(id);
        if (!c.isActivo()) throw new BusinessException("El cliente ya está inactivo");
        c.setActivo(false);
        return toResponse(clienteRepository.save(c));
    }

    @Transactional
    public ClienteResponse activate(Long id) {
        EntityCliente c = buscarOExcepcion(id);
        if (c.isActivo()) throw new BusinessException("El cliente ya está activo");
        c.setActivo(true);
        return toResponse(clienteRepository.save(c));
    }

    @Transactional
    public void safeDelete(Long id) {
        EntityCliente c = buscarOExcepcion(id);
        long hospedajes = hospedajeRepository.findByClienteIdOrderByFechaIngresoDesc(id).size();
        if (hospedajes > 0) throw new BusinessException("No se puede eliminar un cliente con hospedajes registrados");
        long reservas = reservaRepository.findByClienteIdOrderByFechaReservaDesc(id).size();
        if (reservas > 0) throw new BusinessException("No se puede eliminar un cliente con reservas registradas");
        clienteRepository.delete(c);
    }

    public ClienteResponse obtenerPorId(Long id) {
        return toResponse(buscarOExcepcion(id));
    }

    public List<ClienteResponse> buscar(String termino) {
        if (termino == null || termino.isBlank() || termino.equals("[object Object]")) {
            return List.of();
        }
        List<EntityCliente> entities = clienteRepository.search(termino.trim());
        List<ClienteResponse> list = new ArrayList<>();
        for (EntityCliente c : entities) {
            list.add(toResponse(c));
        }
        return list;
    }

    public List<SuggestionResponse> buscarSugerencias(String termino) {
        List<EntityCliente> entities = clienteRepository.search(termino);
        List<SuggestionResponse> list = new ArrayList<>();
        int max = Math.min(entities.size(), 10);
        for (int i = 0; i < max; i++) {
            EntityCliente c = entities.get(i);
            String subtitle = "";
            String docLabel = "PASAPORTE".equalsIgnoreCase(c.getTipoDocumento()) ? "Pasaporte" : "DNI";
            if (c.getDocumento() != null) subtitle += docLabel + ": " + c.getDocumento();
            String telCompleto = (c.getCodigoPais() != null ? c.getCodigoPais() : "+51") + (c.getTelefono() != null ? c.getTelefono() : "");
            if (c.getTelefono() != null) subtitle += (subtitle.isEmpty() ? "" : " | ") + "Tel: " + telCompleto;
            list.add(new SuggestionResponse(c.getId(), c.getNombreCompleto(), subtitle, "CLIENTE"));
        }
        return list;
    }

    @Transactional
    public ClienteResponse crear(RequestClienteInsert request) {
        String doc = (request.getDocumento() != null && !request.getDocumento().isBlank()) ? request.getDocumento().trim() : null;
        String eml = (request.getEmail() != null && !request.getEmail().isBlank()) ? request.getEmail().trim().toLowerCase() : null;
        validarClienteUnico(null, doc, eml);
        validarDatosCliente(request);
        EntityCliente cliente = new EntityCliente();
        cliente.setNombreCompleto(ValidationHelper.normalizarNombre(request.getNombreCompleto()));
        cliente.setTipoDocumento(ValidationHelper.normalizarTexto(request.getTipoDocumento()) != null ? ValidationHelper.normalizarTexto(request.getTipoDocumento()).toUpperCase() : "DNI");
        cliente.setTelefono(ValidationHelper.normalizarTexto(request.getTelefono()));
        cliente.setCodigoPais(ValidationHelper.normalizarTexto(request.getCodigoPais()) != null ? ValidationHelper.normalizarTexto(request.getCodigoPais()) : "+51");
        cliente.setDocumento(doc);
        cliente.setEmail(eml);
        return toResponse(clienteRepository.save(cliente));
    }

    @Transactional
    public ClienteResponse actualizar(Long id, RequestClienteInsert request) {
        EntityCliente c = buscarOExcepcion(id);
        String doc = (request.getDocumento() != null && !request.getDocumento().isBlank()) ? request.getDocumento().trim() : null;
        String eml = (request.getEmail() != null && !request.getEmail().isBlank()) ? request.getEmail().trim().toLowerCase() : null;
        validarClienteUnico(id, doc, eml);
        validarDatosCliente(request);
        c.setNombreCompleto(ValidationHelper.normalizarNombre(request.getNombreCompleto()));
        c.setTipoDocumento(ValidationHelper.normalizarTexto(request.getTipoDocumento()) != null ? ValidationHelper.normalizarTexto(request.getTipoDocumento()).toUpperCase() : "DNI");
        c.setTelefono(ValidationHelper.normalizarTexto(request.getTelefono()));
        c.setCodigoPais(ValidationHelper.normalizarTexto(request.getCodigoPais()) != null ? ValidationHelper.normalizarTexto(request.getCodigoPais()) : "+51");
        c.setDocumento(doc);
        c.setEmail(eml);
        return toResponse(clienteRepository.save(c));
    }

    private void validarDatosCliente(RequestClienteInsert request) {
        ValidationHelper.validarNombre(request.getNombreCompleto(), "nombre del cliente");
        ValidationHelper.validarDocumento(request.getTipoDocumento(), request.getDocumento());
        ValidationHelper.validarTelefono(request.getCodigoPais(), request.getTelefono());
        ValidationHelper.validarEmail(request.getEmail());
    }

    private void validarClienteUnico(Long excludeId, String documento, String email) {
        if (documento != null && !documento.isBlank()) {
            clienteRepository.findByDocumentoIgnoreCase(documento).ifPresent(existing -> {
                if (excludeId == null || !existing.getId().equals(excludeId)) {
                    throw new BusinessException("Ya existe un cliente con el documento: " + documento);
                }
            });
        }
        if (email != null && !email.isBlank()) {
            clienteRepository.findByEmailIgnoreCase(email).ifPresent(existing -> {
                if (excludeId == null || !existing.getId().equals(excludeId)) {
                    throw new BusinessException("Ya existe un cliente con el email: " + email);
                }
            });
        }
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
        r.setTipoDocumento(c.getTipoDocumento() != null ? c.getTipoDocumento() : "DNI");
        r.setTelefono(c.getTelefono());
        r.setCodigoPais(c.getCodigoPais() != null ? c.getCodigoPais() : "+51");
        r.setDocumento(c.getDocumento());
        r.setEmail(c.getEmail());
        r.setCreatedAt(c.getCreatedAt());
        r.setActivo(c.isActivo());

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

