package com.hotel.apifds20261.business;

import com.hotel.apifds20261.dto.request.RequestUsuarioInsert;
import com.hotel.apifds20261.dto.response.UsuarioResponse;
import com.hotel.apifds20261.entity.EntityUsuario;
import com.hotel.apifds20261.staticdata.RolUsuario;
import com.hotel.apifds20261.exception.BusinessException;
import com.hotel.apifds20261.exception.ResourceNotFoundException;
import com.hotel.apifds20261.repository.RepositoryUsuario;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class BusinessUsuario {

    private final RepositoryUsuario usuarioRepository;
    private final PasswordEncoder passwordEncoder;

    public List<UsuarioResponse> listarTodos() {
        List<EntityUsuario> entities = usuarioRepository.findAll();
        List<UsuarioResponse> list = new ArrayList<>();
        for (EntityUsuario u : entities) {
            list.add(toResponse(u));
        }
        return list;
    }

    public UsuarioResponse obtenerPorId(Long id) {
        return toResponse(buscarOExcepcion(id));
    }

    public UsuarioResponse crear(RequestUsuarioInsert request) {
        if (usuarioRepository.existsByUsername(request.getUsername())) {
            throw new BusinessException("El username ya esta en uso");
        }
        EntityUsuario usuario = new EntityUsuario();
        usuario.setNombreCompleto(request.getNombreCompleto());
        usuario.setUsername(request.getUsername());
        usuario.setPassword(passwordEncoder.encode(request.getPassword()));
        usuario.setRol(RolUsuario.valueOf(request.getRol()));
        usuario.setActivo(true);
        return toResponse(usuarioRepository.save(usuario));
    }

    public UsuarioResponse actualizar(Long id, RequestUsuarioInsert request) {
        EntityUsuario usuario = buscarOExcepcion(id);
        if (!usuario.getUsername().equals(request.getUsername()) &&
                usuarioRepository.existsByUsername(request.getUsername())) {
            throw new BusinessException("El username ya esta en uso");
        }
        usuario.setNombreCompleto(request.getNombreCompleto());
        usuario.setUsername(request.getUsername());
        usuario.setRol(RolUsuario.valueOf(request.getRol()));
        if (request.getPassword() != null && !request.getPassword().isBlank()) {
            usuario.setPassword(passwordEncoder.encode(request.getPassword()));
        }
        return toResponse(usuarioRepository.save(usuario));
    }

    public void cambiarEstado(Long id) {
        EntityUsuario usuario = buscarOExcepcion(id);
        usuario.setActivo(!usuario.getActivo());
        usuarioRepository.save(usuario);
    }

    public void eliminar(Long id) {
        EntityUsuario usuario = buscarOExcepcion(id);
        usuario.setActivo(false);
        usuarioRepository.save(usuario);
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
        r.setRol(u.getRol().name());
        r.setActivo(u.getActivo());
        r.setCreatedAt(u.getCreatedAt());
        return r;
    }
}

