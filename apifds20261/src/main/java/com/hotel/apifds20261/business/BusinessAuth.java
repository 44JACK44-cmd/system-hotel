package com.hotel.apifds20261.business;

import java.time.LocalDateTime;
import com.hotel.apifds20261.dto.request.RequestAuthLogin;
import com.hotel.apifds20261.dto.response.LoginResponse;
import com.hotel.apifds20261.entity.EntityUsuario;
import com.hotel.apifds20261.exception.BusinessException;
import com.hotel.apifds20261.repository.RepositoryUsuario;
import com.hotel.apifds20261.security.JwtService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class BusinessAuth {

    private final RepositoryUsuario usuarioRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    @Transactional
    public LoginResponse login(RequestAuthLogin request) {
        EntityUsuario usuario = usuarioRepository.findByUsername(request.getUsername()).orElse(null);
        if (usuario == null) {
            throw new BusinessException("Usuario o contrasena incorrectos");
        }

        if (!usuario.getActivo()) {
            throw new BusinessException("Usuario desactivado. Contacte al administrador");
        }

        if (usuario.getBloqueoHasta() != null && LocalDateTime.now().isBefore(usuario.getBloqueoHasta())) {
            long minutosRestantes = java.time.Duration.between(LocalDateTime.now(), usuario.getBloqueoHasta()).toMinutes();
            throw new BusinessException("Cuenta bloqueada temporalmente. Intente nuevamente en " + (minutosRestantes + 1) + " minuto(s)");
        }

        if (!passwordEncoder.matches(request.getPassword(), usuario.getPassword())) {
            int intentos = (usuario.getIntentosFallidos() != null ? usuario.getIntentosFallidos() : 0) + 1;
            usuario.setIntentosFallidos(intentos);
            if (intentos >= 5) {
                usuario.setBloqueoHasta(LocalDateTime.now().plusMinutes(15));
                usuario.setIntentosFallidos(0);
                usuarioRepository.save(usuario);
                throw new BusinessException("Cuenta bloqueada por 15 minutos por multiples intentos fallidos");
            }
            usuarioRepository.save(usuario);
            throw new BusinessException("Usuario o contrasena incorrectos");
        }

        usuario.setIntentosFallidos(0);
        usuario.setBloqueoHasta(null);
        usuario.setUltimoAcceso(LocalDateTime.now());
        usuarioRepository.save(usuario);

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
        response.setEmail(usuario.getEmail());
        response.setTelefono(usuario.getTelefono());
        response.setFotoPerfil(usuario.getFotoPerfil());
        response.setRol(usuario.getRol().name());
        response.setUserId(usuario.getId());
        response.setTema(usuario.getTema());
        return response;
    }
}
