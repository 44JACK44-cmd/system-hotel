package com.hotel.apifds20261.security;

import com.hotel.apifds20261.exception.BusinessException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

/**
 * Utilidad para obtener la identidad del usuario autenticado desde el token JWT
 * (nunca desde headers controlados por el cliente, como X-User-Id).
 */
public final class SecurityUtil {

    private SecurityUtil() {
    }

    /**
     * Devuelve el userId del usuario autenticado leyendo el token JWT almacenado
     * en los detalles de la autenticacion por JwtAuthenticationFilter.
     */
    public static Long getCurrentUserId(JwtService jwtService) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || auth.getDetails() == null) {
            throw new BusinessException("Sesion no autenticada");
        }
        String token = (String) auth.getDetails();
        if (token == null || !jwtService.isTokenValid(token)) {
            throw new BusinessException("Sesion no autenticada");
        }
        return jwtService.getUserIdFromToken(token);
    }

    /**
     * Devuelve el username del usuario autenticado.
     */
    public static String getCurrentUsername() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || auth.getName() == null) {
            throw new BusinessException("Sesion no autenticada");
        }
        return auth.getName();
    }
}
