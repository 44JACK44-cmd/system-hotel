package com.hotel.apifds20261.exception;

import com.hotel.apifds20261.dto.response.ResponseError;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.io.IOException;
import java.util.List;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @Value("${cors.allowed-origins}")
    private String allowedOrigins;

    private void addCorsHeaders(HttpServletResponse response) {
        response.setHeader("Access-Control-Allow-Origin", allowedOrigins);
        response.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");
        response.setHeader("Access-Control-Allow-Headers", "*");
        response.setHeader("Access-Control-Allow-Credentials", "true");
    }

    @ExceptionHandler(BusinessException.class)
    public ResponseEntity<ResponseError> handleBusinessException(BusinessException ex, HttpServletResponse response) {
        addCorsHeaders(response);
        ResponseError errorResponse = new ResponseError();
        errorResponse.listMessage.add(ex.getMessage());
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(errorResponse);
    }

    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<ResponseError> handleNotFound(ResourceNotFoundException ex, HttpServletResponse response) {
        addCorsHeaders(response);
        ResponseError errorResponse = new ResponseError();
        errorResponse.listMessage.add(ex.getMessage());
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(errorResponse);
    }

    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<ResponseError> handleAccessDenied(AccessDeniedException ex, HttpServletResponse response) {
        addCorsHeaders(response);
        ResponseError errorResponse = new ResponseError();
        errorResponse.listMessage.add("No tienes permisos para esta accion");
        return ResponseEntity.status(HttpStatus.FORBIDDEN).body(errorResponse);
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ResponseError> handleValidation(MethodArgumentNotValidException ex, HttpServletResponse response) {
        addCorsHeaders(response);
        ResponseError errorResponse = new ResponseError();
        for (FieldError fe : ex.getBindingResult().getFieldErrors()) {
            errorResponse.listMessage.add(fe.getDefaultMessage());
        }
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(errorResponse);
    }

    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<ResponseError> handleDataIntegrity(DataIntegrityViolationException ex, HttpServletResponse response) {
        addCorsHeaders(response);
        ResponseError errorResponse = new ResponseError();
        String msg = ex.getMostSpecificCause().getMessage();
        if (msg != null) {
            if (msg.contains("documento")) {
                errorResponse.listMessage.add("El documento ya existe en el sistema");
            } else if (msg.contains("numero")) {
                errorResponse.listMessage.add("El numero de habitacion ya existe");
            } else if (msg.contains("email")) {
                errorResponse.listMessage.add("El email ya esta registrado");
            } else if (msg.contains("username")) {
                errorResponse.listMessage.add("El nombre de usuario ya existe");
            } else {
                errorResponse.listMessage.add("Error de duplicado: " + msg);
            }
        } else {
            errorResponse.listMessage.add("Error de integridad de datos");
        }
        return ResponseEntity.status(HttpStatus.CONFLICT).body(errorResponse);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ResponseError> handleGeneral(Exception ex, HttpServletResponse response) {
        addCorsHeaders(response);
        ResponseError errorResponse = new ResponseError();
        errorResponse.listMessage.add("Error interno del servidor: " + ex.getMessage());
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
    }
}
