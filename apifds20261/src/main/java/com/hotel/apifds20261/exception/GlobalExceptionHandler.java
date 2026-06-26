package com.hotel.apifds20261.exception;

import com.hotel.apifds20261.dto.response.ResponseError;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.List;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(BusinessException.class)
    public ResponseEntity<ResponseError> handleBusinessException(BusinessException ex) {
        ResponseError response = new ResponseError();
        response.listMessage.add(ex.getMessage());
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
    }

    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<ResponseError> handleNotFound(ResourceNotFoundException ex) {
        ResponseError response = new ResponseError();
        response.listMessage.add(ex.getMessage());
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(response);
    }

    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<ResponseError> handleAccessDenied(AccessDeniedException ex) {
        ResponseError response = new ResponseError();
        response.listMessage.add("No tienes permisos para esta accion");
        return ResponseEntity.status(HttpStatus.FORBIDDEN).body(response);
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ResponseError> handleValidation(MethodArgumentNotValidException ex) {
        ResponseError response = new ResponseError();
        for (FieldError fe : ex.getBindingResult().getFieldErrors()) {
            response.listMessage.add(fe.getDefaultMessage());
        }
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ResponseError> handleGeneral(Exception ex) {
        ResponseError response = new ResponseError();
        response.listMessage.add("Error interno del servidor: " + ex.getMessage());
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
    }
}
