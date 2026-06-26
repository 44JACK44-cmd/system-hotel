package com.hotel.apifds20261.business;

import com.hotel.apifds20261.dto.request.RequestAuthLogin;
import com.hotel.apifds20261.dto.response.LoginResponse;
import com.hotel.apifds20261.entity.EntityUsuario;
import com.hotel.apifds20261.exception.BusinessException;
import com.hotel.apifds20261.repository.RepositoryUsuario;
import com.hotel.apifds20261.security.JwtService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class BusinessAuth {

    private final RepositoryUsuario usuarioRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    public LoginResponse login(RequestAuthLogin request) {
        EntityUsuario usuario = usuarioRepository.findByUsername(request.getUsername()).orElse(null);
        if (usuario == null) {
            throw new BusinessException("Usuario o contrasena incorrectos");
        }

        if (!usuario.getActivo()) {
            throw new BusinessException("Usuario desactivado. Contacte al administrador");
        }

        if (!passwordEncoder.matches(request.getPassword(), usuario.getPassword())) {
            throw new BusinessException("Usuario o contrasena incorrectos");
        }

        String token = jwtService.generateToken(
                usuario.getUsername(),
                usuario.getRol().name(),
                usuario.getId()
        );

        LoginResponse response = new LoginResponse();
        response.setToken(token);
        response.setTipo("Bearer");
        response.setUsername(usuario.getUsername());
        response.setNombreCompleto(usuario.getNombreCompleto());
        response.setRol(usuario.getRol().name());
        response.setUserId(usuario.getId());
        return response;
    }
}

