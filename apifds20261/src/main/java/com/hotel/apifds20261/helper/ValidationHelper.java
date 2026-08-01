package com.hotel.apifds20261.helper;

import com.hotel.apifds20261.exception.BusinessException;

import java.util.regex.Pattern;

/**
 * Utilidades centrales de validacion y normalizacion de datos.
 * Usadas por Business y DTOs para mantener reglas consistentes.
 */
public final class ValidationHelper {

    private ValidationHelper() {
    }

    // Solo letras (incluye tildes y ñ), espacios internos simples.
    // Permite "Juan Carlos", "María José", "José Ñahui".
    // Bloquea: numeros, simbolos, espacios al inicio/fin y espacios consecutivos.
    public static final Pattern NOMBRE = Pattern.compile("^[A-Za-zÁÉÍÓÚÜáéíóúüÑñ]+(?:\\s[A-Za-zÁÉÍÓÚÜáéíóúüÑñ]+)*$");

    public static final Pattern DNI = Pattern.compile("^\\d{8}$");
    public static final Pattern PASAPORTE = Pattern.compile("^[A-Za-z0-9]{6,15}$");
    public static final Pattern RUC = Pattern.compile("^\\d{11}$");
    public static final Pattern TELEFONO = Pattern.compile("^\\d{6,12}$");
    public static final Pattern USERNAME = Pattern.compile("^[A-Za-z0-9._-]{4,30}$");
    public static final Pattern EMAIL = Pattern.compile("^[A-Za-z0-9._%+\\-]+@[A-Za-z0-9.\\-]+\\.[A-Za-z]{2,}$");

    public static final Pattern PASSWORD =
            Pattern.compile("^(?=.*[A-Z])(?=.*[a-z])(?=.*\\d)(?=.*[^A-Za-z0-9]).{8,100}$");

    public static String normalizarNombre(String nombre) {
        if (nombre == null) {
            return null;
        }
        return nombre.trim().replaceAll("\\s+", " ");
    }

    public static String normalizarTexto(String texto) {
        if (texto == null) {
            return null;
        }
        return texto.trim();
    }

    public static void validarNombre(String nombre, String campo) {
        if (nombre == null || nombre.isBlank()) {
            throw new BusinessException("El " + campo + " es obligatorio");
        }
        String norm = normalizarNombre(nombre);
        if (norm.length() < 2) {
            throw new BusinessException("El " + campo + " debe tener al menos 2 caracteres");
        }
        if (norm.length() > 60) {
            throw new BusinessException("El " + campo + " no puede exceder 60 caracteres");
        }
        if (!NOMBRE.matcher(norm).matches()) {
            throw new BusinessException("El " + campo + " solo puede contener letras y espacios simples (sin números ni símbolos)");
        }
    }

    public static void validarDocumento(String tipoDocumento, String documento) {
        String tipo = (tipoDocumento == null || tipoDocumento.isBlank()) ? "DNI" : tipoDocumento.trim().toUpperCase();
        if (documento == null || documento.isBlank()) {
            return;
        }
        String doc = documento.trim();
        if ("PASAPORTE".equals(tipo)) {
            if (!PASAPORTE.matcher(doc).matches()) {
                throw new BusinessException("El pasaporte debe tener entre 6 y 15 caracteres alfanuméricos");
            }
        } else {
            if (!DNI.matcher(doc).matches()) {
                throw new BusinessException("El DNI debe contener exactamente 8 dígitos numéricos");
            }
        }
    }

    public static void validarTelefono(String codigoPais, String telefono) {
        String tel = (telefono == null) ? "" : telefono.trim();
        if (tel.isEmpty()) {
            throw new BusinessException("El teléfono es obligatorio");
        }
        if (!TELEFONO.matcher(tel).matches()) {
            throw new BusinessException("El teléfono debe contener solo números (6 a 12 dígitos)");
        }
        if (codigoPais != null && !codigoPais.isBlank() && !codigoPais.matches("^\\+?[0-9]{1,4}$")) {
            throw new BusinessException("El código de país no es válido");
        }
    }

    public static void validarUsername(String username) {
        if (username == null || username.isBlank()) {
            throw new BusinessException("El nombre de usuario es obligatorio");
        }
        if (!USERNAME.matcher(username.trim()).matches()) {
            throw new BusinessException("El nombre de usuario debe tener entre 4 y 30 caracteres (letras, números, punto, guión o guión bajo) sin espacios");
        }
    }

    public static void validarEmail(String email) {
        if (email == null || email.isBlank()) {
            return;
        }
        if (!EMAIL.matcher(email.trim()).matches()) {
            throw new BusinessException("El correo electrónico no tiene un formato válido");
        }
    }

    public static void validarPassword(String password) {
        if (password == null || password.isBlank()) {
            throw new BusinessException("La contraseña es obligatoria");
        }
        if (!PASSWORD.matcher(password).matches()) {
            throw new BusinessException("La contraseña debe tener al menos 8 caracteres e incluir una mayúscula, una minúscula, un número y un carácter especial");
        }
    }

    public static void validarRuc(String ruc) {
        if (ruc == null || ruc.isBlank()) {
            throw new BusinessException("El RUC es obligatorio");
        }
        if (!RUC.matcher(ruc.trim()).matches()) {
            throw new BusinessException("El RUC debe contener exactamente 11 dígitos numéricos");
        }
    }
}
