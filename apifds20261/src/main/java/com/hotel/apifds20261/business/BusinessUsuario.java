package com.hotel.apifds20261.business;

import com.hotel.apifds20261.dto.request.RequestUsuarioInsert;
import com.hotel.apifds20261.dto.request.RequestUsuarioUpdate;
import com.hotel.apifds20261.dto.response.ResponsePage;
import com.hotel.apifds20261.dto.response.SuggestionResponse;
import com.hotel.apifds20261.dto.response.UsuarioResponse;
import com.hotel.apifds20261.entity.EntityCaja;
import com.hotel.apifds20261.entity.EntityHospedaje;
import com.hotel.apifds20261.entity.EntityPago;
import com.hotel.apifds20261.entity.EntityReserva;
import com.hotel.apifds20261.entity.EntityUsuario;
import com.hotel.apifds20261.staticdata.RolUsuario;
import com.hotel.apifds20261.exception.BusinessException;
import com.hotel.apifds20261.exception.ResourceNotFoundException;
import com.hotel.apifds20261.repository.RepositoryCaja;
import com.hotel.apifds20261.repository.RepositoryHospedaje;
import com.hotel.apifds20261.repository.RepositoryPago;
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
import java.time.LocalDateTime;
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
    private final RepositoryPago pagoRepository;

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
    public UsuarioResponse actualizarCompleto(Long id, RequestUsuarioUpdate request, Long currentUserId) {
        EntityUsuario usuario = buscarOExcepcion(id);

        // Validar username único
        if (!usuario.getUsername().equals(request.getUsername()) &&
                usuarioRepository.existsByUsername(request.getUsername())) {
            throw new BusinessException("El username ya esta en uso");
        }

        // Validar email único
        if (request.getEmail() != null && !request.getEmail().isBlank()) {
            usuarioRepository.findByEmail(request.getEmail().trim()).ifPresent(existing -> {
                if (!existing.getId().equals(id)) {
                    throw new BusinessException("El correo electrónico ya está registrado");
                }
            });
        }

        // Validación de rol: no permitir dejar el sistema sin administradores
        RolUsuario nuevoRol = RolUsuario.valueOf(request.getRol());
        if (usuario.getRol() == RolUsuario.ADMIN && nuevoRol != RolUsuario.ADMIN) {
            long adminCount = usuarioRepository.countByRolAndActivoTrue(RolUsuario.ADMIN);
            if (adminCount <= 1) {
                throw new BusinessException("No se puede cambiar el rol del único administrador del sistema");
            }
        }

        // Validación: no permitir quitar permisos al admin autenticado si es el único
        if (usuario.getId().equals(currentUserId) && usuario.getRol() == RolUsuario.ADMIN && nuevoRol != RolUsuario.ADMIN) {
            long adminCount = usuarioRepository.countByRolAndActivoTrue(RolUsuario.ADMIN);
            if (adminCount <= 1) {
                throw new BusinessException("No puede cambiar su propio rol siendo el único administrador");
            }
        }

        // Validación de contraseña
        if (request.getPassword() != null && !request.getPassword().isBlank()) {
            if (request.getConfirmPassword() == null || request.getConfirmPassword().isBlank()) {
                throw new BusinessException("Debe confirmar la nueva contraseña");
            }
            if (!request.getPassword().equals(request.getConfirmPassword())) {
                throw new BusinessException("Las contraseñas no coinciden");
            }
            usuario.setPassword(passwordEncoder.encode(request.getPassword()));
        }

        usuario.setNombreCompleto(request.getNombreCompleto());
        usuario.setUsername(request.getUsername());
        usuario.setEmail(request.getEmail());
        usuario.setTelefono(request.getTelefono());
        usuario.setRol(nuevoRol);
        usuario.setActivo(request.isActivo());

        // Validación al desactivar: no dejar sin administradores
        if (usuario.getActivo() && !request.isActivo() && usuario.getRol() == RolUsuario.ADMIN) {
            long adminCount = usuarioRepository.countByRolAndActivoTrue(RolUsuario.ADMIN);
            if (adminCount <= 1) {
                throw new BusinessException("No se puede desactivar el último administrador del sistema");
            }
            validarUsuarioSinOperacionesActivas(id);
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
    public void eliminar(Long id, Long currentUserId) {
        EntityUsuario usuario = buscarOExcepcion(id);

        // Validación 1: No es administrador principal (último admin)
        if (usuario.getRol() == RolUsuario.ADMIN) {
            long adminCount = usuarioRepository.countByRolAndActivoTrue(RolUsuario.ADMIN);
            if (adminCount <= 1) {
                throw new BusinessException("No se puede eliminar el último administrador del sistema");
            }
        }

        // Validación 2: No es el usuario autenticado
        if (usuario.getId().equals(currentUserId)) {
            throw new BusinessException("No puede eliminarse a sí mismo");
        }

        // Validación 3-7: No tiene historial (reservas, hospedajes, pagos, incidencias, caja)
        validarUsuarioSinHistorial(id);

        // Desactivar en lugar de eliminar (soft delete)
        usuario.setActivo(false);
        usuarioRepository.save(usuario);
    }

    @Transactional
    public void resetPasswordByAdmin(Long id, String newPassword, String confirmPassword, Long currentUserId) {
        EntityUsuario usuario = buscarOExcepcion(id);

        // Validación: no puede restablecer su propia contraseña si es el único admin
        if (usuario.getId().equals(currentUserId) && usuario.getRol() == RolUsuario.ADMIN) {
            long adminCount = usuarioRepository.countByRolAndActivoTrue(RolUsuario.ADMIN);
            if (adminCount <= 1) {
                throw new BusinessException("No puede restablecer su propia contraseña siendo el único administrador");
            }
        }

        if (newPassword == null || newPassword.isBlank()) {
            throw new BusinessException("La nueva contraseña es obligatoria");
        }
        if (confirmPassword == null || confirmPassword.isBlank()) {
            throw new BusinessException("Debe confirmar la nueva contraseña");
        }
        if (!newPassword.equals(confirmPassword)) {
            throw new BusinessException("Las contraseñas no coinciden");
        }
        if (newPassword.length() < 6 || newPassword.length() > 100) {
            throw new BusinessException("La contraseña debe tener entre 6 y 100 caracteres");
        }

        usuario.setPassword(passwordEncoder.encode(newPassword));
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

    private void validarUsuarioSinHistorial(Long usuarioId) {
        // Verificar reservas
        long reservasCount = reservaRepository.countByUsuarioId(usuarioId);
        if (reservasCount > 0) {
            throw new BusinessException("Este usuario posee información histórica (reservas). Debe desactivarse en lugar de eliminarse.");
        }

        // Verificar hospedajes
        long hospedajesCount = hospedajeRepository.countByUsuarioId(usuarioId);
        if (hospedajesCount > 0) {
            throw new BusinessException("Este usuario posee información histórica (hospedajes). Debe desactivarse en lugar de eliminarse.");
        }

        // Verificar pagos
        long pagosCount = pagoRepository.countByUsuarioId(usuarioId);
        if (pagosCount > 0) {
            throw new BusinessException("Este usuario posee información histórica (pagos). Debe desactivarse en lugar de eliminarse.");
        }

        // Verificar incidencias
        long incidenciasCount = usuarioRepository.countIncidenciasByUsuarioId(usuarioId);
        if (incidenciasCount > 0) {
            throw new BusinessException("Este usuario posee información histórica (incidencias). Debe desactivarse en lugar de eliminarse.");
        }

        // Verificar movimientos de caja
        long cajaCount = cajaRepository.countByUsuarioId(usuarioId);
        if (cajaCount > 0) {
            throw new BusinessException("Este usuario posee información histórica (movimientos de caja). Debe desactivarse en lugar de eliminarse.");
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
        r.setUpdatedAt(u.getUpdatedAt());
        r.setCreatedBy(u.getCreatedBy());
        r.setUpdatedBy(u.getUpdatedBy());
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
        usuario.setUltimoAcceso(LocalDateTime.now());
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

