package com.hotel.apifds20261.business;

import com.hotel.apifds20261.dto.request.RequestUsuarioInsert;
import com.hotel.apifds20261.dto.response.ResponsePage;
import com.hotel.apifds20261.dto.response.SuggestionResponse;
import com.hotel.apifds20261.dto.response.UsuarioResponse;
import com.hotel.apifds20261.entity.EntityCaja;
import com.hotel.apifds20261.entity.EntityHospedaje;
import com.hotel.apifds20261.entity.EntityReserva;
import com.hotel.apifds20261.entity.EntityUsuario;
import com.hotel.apifds20261.staticdata.RolUsuario;
import com.hotel.apifds20261.exception.BusinessException;
import com.hotel.apifds20261.exception.ResourceNotFoundException;
import com.hotel.apifds20261.repository.RepositoryCaja;
import com.hotel.apifds20261.repository.RepositoryHospedaje;
import com.hotel.apifds20261.repository.RepositoryReserva;
import com.hotel.apifds20261.repository.RepositoryUsuario;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class BusinessUsuario {

    private final RepositoryUsuario usuarioRepository;
    private final PasswordEncoder passwordEncoder;
    private final RepositoryHospedaje hospedajeRepository;
    private final RepositoryReserva reservaRepository;
    private final RepositoryCaja cajaRepository;

    public List<UsuarioResponse> listarTodos() {
        List<EntityUsuario> entities = usuarioRepository.findAll();
        List<UsuarioResponse> list = new ArrayList<>();
        for (EntityUsuario u : entities) {
            list.add(toResponse(u));
        }
        return list;
    }

    public ResponsePage<UsuarioResponse> listarPaginado(String search, int page, int size, String sortField, String sortDir) {
        Sort sort = Sort.by(sortDir.equalsIgnoreCase("desc") ? Sort.Direction.DESC : Sort.Direction.ASC,
                sortField == null || sortField.isBlank() ? "id" : sortField);
        Pageable pageable = PageRequest.of(page, size, sort);
        Page<EntityUsuario> pagina = usuarioRepository.findAllPaginated(search, pageable);
        List<UsuarioResponse> list = new ArrayList<>();
        for (EntityUsuario u : pagina.getContent()) {
            list.add(toResponse(u));
        }
        return new ResponsePage<>(list, pagina.getNumber(), pagina.getSize(), pagina.getTotalElements(), pagina.getTotalPages());
    }

    public UsuarioResponse obtenerPorId(Long id) {
        return toResponse(buscarOExcepcion(id));
    }

    @Transactional
    public UsuarioResponse crear(RequestUsuarioInsert request) {
        if (usuarioRepository.existsByUsername(request.getUsername())) {
            throw new BusinessException("El username ya esta en uso");
        }
        if (request.getEmail() != null && !request.getEmail().isBlank()) {
            usuarioRepository.findByEmail(request.getEmail().trim()).ifPresent(existing -> {
                throw new BusinessException("El correo electrónico ya está registrado");
            });
        }
        EntityUsuario usuario = new EntityUsuario();
        usuario.setNombreCompleto(request.getNombreCompleto());
        usuario.setUsername(request.getUsername());
        usuario.setPassword(passwordEncoder.encode(request.getPassword()));
        usuario.setRol(RolUsuario.valueOf(request.getRol()));
        usuario.setEmail(request.getEmail());
        usuario.setTelefono(request.getTelefono());
        usuario.setActivo(true);
        return toResponse(usuarioRepository.save(usuario));
    }

    @Transactional
    public UsuarioResponse actualizar(Long id, RequestUsuarioInsert request) {
        EntityUsuario usuario = buscarOExcepcion(id);
        if (!usuario.getUsername().equals(request.getUsername()) &&
                usuarioRepository.existsByUsername(request.getUsername())) {
            throw new BusinessException("El username ya esta en uso");
        }
        if (request.getEmail() != null && !request.getEmail().isBlank()) {
            usuarioRepository.findByEmail(request.getEmail().trim()).ifPresent(existing -> {
                if (!existing.getId().equals(id)) {
                    throw new BusinessException("El correo electrónico ya está registrado");
                }
            });
        }
        usuario.setNombreCompleto(request.getNombreCompleto());
        usuario.setUsername(request.getUsername());
        usuario.setRol(RolUsuario.valueOf(request.getRol()));
        usuario.setEmail(request.getEmail());
        usuario.setTelefono(request.getTelefono());
        if (request.getPassword() != null && !request.getPassword().isBlank()) {
            usuario.setPassword(passwordEncoder.encode(request.getPassword()));
        }
        return toResponse(usuarioRepository.save(usuario));
    }

    @Transactional
    public void cambiarEstado(Long id) {
        EntityUsuario usuario = buscarOExcepcion(id);
        boolean seraDesactivado = usuario.getActivo();
        if (seraDesactivado && usuario.getRol() == RolUsuario.ADMIN) {
            long adminCount = usuarioRepository.countByRolAndActivoTrue(RolUsuario.ADMIN);
            if (adminCount <= 1) {
                throw new BusinessException("No se puede desactivar el último administrador del sistema");
            }
        }
        usuario.setActivo(!usuario.getActivo());
        if (seraDesactivado) {
            validarUsuarioSinOperacionesActivas(id);
        }
        usuarioRepository.save(usuario);
    }

    @Transactional
    public void eliminar(Long id) {
        EntityUsuario usuario = buscarOExcepcion(id);
        if (usuario.getRol() == RolUsuario.ADMIN) {
            long adminCount = usuarioRepository.countByRolAndActivoTrue(RolUsuario.ADMIN);
            if (adminCount <= 1) {
                throw new BusinessException("No se puede eliminar el último administrador del sistema");
            }
        }
        validarUsuarioSinOperacionesActivas(id);
        usuario.setActivo(false);
        usuarioRepository.save(usuario);
    }

    private void validarUsuarioSinOperacionesActivas(Long usuarioId) {
        List<EntityHospedaje> activos = hospedajeRepository.findActivosByUsuarioId(usuarioId);
        if (!activos.isEmpty()) {
            throw new BusinessException("No se puede desactivar el usuario: tiene " + activos.size() +
                    " hospedaje(s) activo(s). Finalice los hospedajes primero.");
        }
        List<EntityReserva> futuras = reservaRepository.findFuturasByUsuario(usuarioId, LocalDate.now());
        if (!futuras.isEmpty()) {
            throw new BusinessException("No se puede desactivar el usuario: tiene " + futuras.size() +
                    " reserva(s) confirmada(s) pendiente(s). Remueva las reservas primero.");
        }
        List<EntityCaja> cajasAbiertas = cajaRepository.findByEstadoOrderByFechaAperturaDesc("ABIERTO");
        boolean tieneCajaAbierta = cajasAbiertas.stream().anyMatch(c -> c.getUsuario().getId().equals(usuarioId));
        if (tieneCajaAbierta) {
            throw new BusinessException("No se puede desactivar el usuario: tiene una caja abierta. Cierre la caja primero.");
        }
    }

    private EntityUsuario buscarOExcepcion(Long id) {
        EntityUsuario u = usuarioRepository.findById(id).orElse(null);
        if (u == null) {
            throw new ResourceNotFoundException("Usuario no encontrado");
        }
        return u;
    }

    private UsuarioResponse toResponse(EntityUsuario u) {
        UsuarioResponse r = new UsuarioResponse();
        r.setId(u.getId());
        r.setNombreCompleto(u.getNombreCompleto());
        r.setUsername(u.getUsername());
        r.setEmail(u.getEmail());
        r.setTelefono(u.getTelefono());
        r.setFotoPerfil(u.getFotoPerfil());
        r.setRol(u.getRol().name());
        r.setActivo(u.getActivo());
        r.setTema(u.getTema());
        r.setCreatedAt(u.getCreatedAt());
        r.setUltimoAcceso(u.getUltimoAcceso());
        return r;
    }

    @Transactional
    public UsuarioResponse updateProfile(Long id, String nombreCompleto, String email, String telefono) {
        EntityUsuario usuario = buscarOExcepcion(id);
        if (nombreCompleto != null && !nombreCompleto.isBlank()) {
            usuario.setNombreCompleto(nombreCompleto);
        }
        if (email != null) usuario.setEmail(email);
        if (telefono != null) usuario.setTelefono(telefono);
        return toResponse(usuarioRepository.save(usuario));
    }

    @Transactional
    public void cambiarPassword(Long id, String currentPassword, String newPassword) {
        EntityUsuario usuario = buscarOExcepcion(id);
        if (!passwordEncoder.matches(currentPassword, usuario.getPassword())) {
            throw new BusinessException("La contrasena actual no es correcta");
        }
        usuario.setPassword(passwordEncoder.encode(newPassword));
        usuarioRepository.save(usuario);
    }

    @Transactional
    public UsuarioResponse uploadAvatar(Long id, String fotoBase64) {
        EntityUsuario usuario = buscarOExcepcion(id);
        usuario.setFotoPerfil(fotoBase64);
        return toResponse(usuarioRepository.save(usuario));
    }

    public void actualizarUltimoAcceso(Long id) {
        EntityUsuario usuario = buscarOExcepcion(id);
        usuario.setUltimoAcceso(java.time.LocalDateTime.now());
        usuarioRepository.save(usuario);
    }

    public List<SuggestionResponse> buscarSugerencias(String termino) {
        List<EntityUsuario> entities = usuarioRepository.search(termino);
        List<SuggestionResponse> list = new ArrayList<>();
        int max = Math.min(entities.size(), 10);
        for (int i = 0; i < max; i++) {
            EntityUsuario u = entities.get(i);
            String subtitle = "@" + u.getUsername() + " | " + u.getRol().name();
            list.add(new SuggestionResponse(u.getId(), u.getNombreCompleto(), subtitle, "USUARIO"));
        }
        return list;
    }

    @Transactional
    public UsuarioResponse actualizarTema(Long id, String tema) {
        EntityUsuario usuario = buscarOExcepcion(id);
        boolean esValido = "LIGHT".equalsIgnoreCase(tema) || "DARK".equalsIgnoreCase(tema);
        if (!esValido) {
            throw new BusinessException("El tema debe ser LIGHT o DARK");
        }
        usuario.setTema(tema.toUpperCase());
        return toResponse(usuarioRepository.save(usuario));
    }
}

