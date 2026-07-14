package com.hotel.apifds20261.controller;

import com.hotel.apifds20261.business.BusinessParametro;
import com.hotel.apifds20261.dto.request.RequestParametroUpsert;
import com.hotel.apifds20261.dto.response.ParametroResponse;
import com.hotel.apifds20261.dto.response.ResponseParametro;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("parametro")
@RequiredArgsConstructor
public class ParametroController {

    private final BusinessParametro parametroBusiness;

    @GetMapping("getall")
    public ResponseEntity<ResponseParametro> actionGetAll() {
        List<ParametroResponse> list = parametroBusiness.listarTodos();
        ResponseParametro response = new ResponseParametro();
        response.success();
        response.setListParametro(list);
        return ResponseEntity.ok(response);
    }

    @GetMapping("getbyid/{id}")
    public ResponseEntity<ResponseParametro> actionGetById(@PathVariable Long id) {
        ParametroResponse item = parametroBusiness.obtenerPorId(id);
        ResponseParametro response = new ResponseParametro();
        response.success();
        response.getListParametro().add(item);
        return ResponseEntity.ok(response);
    }

    @GetMapping("getbyclave/{clave}")
    public ResponseEntity<ResponseParametro> actionGetByClave(@PathVariable String clave) {
        ParametroResponse item = parametroBusiness.obtenerPorClave(clave);
        ResponseParametro response = new ResponseParametro();
        response.success();
        response.getListParametro().add(item);
        return ResponseEntity.ok(response);
    }

    @GetMapping("getbymodulo/{modulo}")
    public ResponseEntity<ResponseParametro> actionGetByModulo(@PathVariable String modulo) {
        List<ParametroResponse> list = parametroBusiness.listarPorModulo(modulo);
        ResponseParametro response = new ResponseParametro();
        response.success();
        response.setListParametro(list);
        return ResponseEntity.ok(response);
    }

    @PostMapping("upsert")
    public ResponseEntity<ResponseParametro> actionUpsert(@Valid @RequestBody RequestParametroUpsert request) {
        ParametroResponse item = parametroBusiness.crear(request);
        ResponseParametro response = new ResponseParametro();
        response.success();
        response.getListParametro().add(item);
        response.listMessage.add("Parametro guardado exitosamente");
        return ResponseEntity.ok(response);
    }

    @PutMapping("update/{id}")
    public ResponseEntity<ResponseParametro> actionUpdate(
            @PathVariable Long id, @Valid @RequestBody RequestParametroUpsert request) {
        ParametroResponse item = parametroBusiness.actualizar(id, request);
        ResponseParametro response = new ResponseParametro();
        response.success();
        response.getListParametro().add(item);
        response.listMessage.add("Parametro actualizado exitosamente");
        return ResponseEntity.ok(response);
    }

    @PatchMapping("updatevalor/{clave}")
    public ResponseEntity<ResponseParametro> actionUpdateValor(
            @PathVariable String clave, @RequestBody String valor) {
        ParametroResponse item = parametroBusiness.actualizarValor(clave, valor);
        ResponseParametro response = new ResponseParametro();
        response.success();
        response.getListParametro().add(item);
        response.listMessage.add("Valor actualizado exitosamente");
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("delete/{id}")
    public ResponseEntity<ResponseParametro> actionDelete(@PathVariable Long id) {
        parametroBusiness.eliminar(id);
        ResponseParametro response = new ResponseParametro();
        response.success();
        response.listMessage.add("Parametro eliminado exitosamente");
        return ResponseEntity.ok(response);
    }
}
