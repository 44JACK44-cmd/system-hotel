package com.hotel.apifds20261.controller;

import com.hotel.apifds20261.business.BusinessUsuario;
import com.hotel.apifds20261.dto.request.RequestUsuarioInsert;
import com.hotel.apifds20261.dto.response.ResponseUsuario;
import com.hotel.apifds20261.dto.response.UsuarioResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("usuario")
@RequiredArgsConstructor
public class UsuarioController {

    private final BusinessUsuario usuarioBusiness;

    @GetMapping("getall")
    public ResponseEntity<ResponseUsuario> actionGetAll() {
        List<UsuarioResponse> list = usuarioBusiness.listarTodos();
        ResponseUsuario response = new ResponseUsuario();
        response.success();
        response.setListUsuario(list);
        return ResponseEntity.ok(response);
    }

    @GetMapping("getbyid/{id}")
    public ResponseEntity<ResponseUsuario> actionGetById(@PathVariable Long id) {
        UsuarioResponse item = usuarioBusiness.obtenerPorId(id);
        ResponseUsuario response = new ResponseUsuario();
        response.success();
        response.getListUsuario().add(item);
        return ResponseEntity.ok(response);
    }

    @PostMapping("insert")
    public ResponseEntity<ResponseUsuario> actionInsert(@Valid @RequestBody RequestUsuarioInsert request) {
        UsuarioResponse item = usuarioBusiness.crear(request);
        ResponseUsuario response = new ResponseUsuario();
        response.success();
        response.getListUsuario().add(item);
        response.listMessage.add("Usuario creado exitosamente");
        return ResponseEntity.ok(response);
    }

    @PutMapping("update/{id}")
    public ResponseEntity<ResponseUsuario> actionUpdate(
            @PathVariable Long id, @Valid @RequestBody RequestUsuarioInsert request) {
        UsuarioResponse item = usuarioBusiness.actualizar(id, request);
        ResponseUsuario response = new ResponseUsuario();
        response.success();
        response.getListUsuario().add(item);
        response.listMessage.add("Usuario actualizado exitosamente");
        return ResponseEntity.ok(response);
    }

    @PatchMapping("togglestate/{id}")
    public ResponseEntity<ResponseUsuario> actionToggleState(@PathVariable Long id) {
        usuarioBusiness.cambiarEstado(id);
        ResponseUsuario response = new ResponseUsuario();
        response.success();
        response.listMessage.add("Estado cambiado exitosamente");
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("delete/{id}")
    public ResponseEntity<ResponseUsuario> actionDelete(@PathVariable Long id) {
        usuarioBusiness.eliminar(id);
        ResponseUsuario response = new ResponseUsuario();
        response.success();
        response.listMessage.add("Usuario desactivado exitosamente");
        return ResponseEntity.ok(response);
    }
}

