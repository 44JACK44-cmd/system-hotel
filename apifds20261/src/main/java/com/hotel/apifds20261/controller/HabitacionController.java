package com.hotel.apifds20261.controller;

import com.hotel.apifds20261.business.BusinessHabitacion;
import com.hotel.apifds20261.dto.request.RequestHabitacionCambioEstado;
import com.hotel.apifds20261.dto.request.RequestHabitacionInsert;
import com.hotel.apifds20261.dto.response.HabitacionResponse;
import com.hotel.apifds20261.dto.response.ResponseHabitacion;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("habitacion")
@RequiredArgsConstructor
public class HabitacionController {

    private final BusinessHabitacion habitacionBusiness;

    @GetMapping("getall")
    public ResponseEntity<ResponseHabitacion> actionGetAll() {
        List<HabitacionResponse> list = habitacionBusiness.listarActivas();
        ResponseHabitacion response = new ResponseHabitacion();
        response.success();
        response.setListHabitacion(list);
        return ResponseEntity.ok(response);
    }

    @GetMapping("getallwithdisabled")
    public ResponseEntity<ResponseHabitacion> actionGetAllWithDisabled() {
        List<HabitacionResponse> list = habitacionBusiness.listarTodas();
        ResponseHabitacion response = new ResponseHabitacion();
        response.success();
        response.setListHabitacion(list);
        return ResponseEntity.ok(response);
    }

    @GetMapping("getbyid/{id}")
    public ResponseEntity<ResponseHabitacion> actionGetById(@PathVariable Long id) {
        HabitacionResponse item = habitacionBusiness.obtenerPorId(id);
        ResponseHabitacion response = new ResponseHabitacion();
        response.success();
        response.getListHabitacion().add(item);
        return ResponseEntity.ok(response);
    }

    @GetMapping("map")
    public ResponseEntity<ResponseHabitacion> actionMap() {
        Map<Integer, List<HabitacionResponse>> mapa = habitacionBusiness.obtenerMapa();
        ResponseHabitacion response = new ResponseHabitacion();
        response.success();
        response.setReporte(mapa);
        response.listMessage.add("Mapa de habitaciones cargado");
        return ResponseEntity.ok(response);
    }

    @PostMapping("insert")
    public ResponseEntity<ResponseHabitacion> actionInsert(@Valid @RequestBody RequestHabitacionInsert request) {
        HabitacionResponse item = habitacionBusiness.crear(request);
        ResponseHabitacion response = new ResponseHabitacion();
        response.success();
        response.getListHabitacion().add(item);
        response.listMessage.add("Habitacion creada exitosamente");
        return ResponseEntity.ok(response);
    }

    @PutMapping("update/{id}")
    public ResponseEntity<ResponseHabitacion> actionUpdate(
            @PathVariable Long id, @Valid @RequestBody RequestHabitacionInsert request) {
        HabitacionResponse item = habitacionBusiness.actualizar(id, request);
        ResponseHabitacion response = new ResponseHabitacion();
        response.success();
        response.getListHabitacion().add(item);
        response.listMessage.add("Habitacion actualizada exitosamente");
        return ResponseEntity.ok(response);
    }

    @PatchMapping("changestate/{id}")
    public ResponseEntity<ResponseHabitacion> actionChangeState(
            @PathVariable Long id, @Valid @RequestBody RequestHabitacionCambioEstado request) {
        habitacionBusiness.cambiarEstado(id, request);
        ResponseHabitacion response = new ResponseHabitacion();
        response.success();
        response.listMessage.add("Estado cambiado exitosamente");
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("delete/{id}")
    public ResponseEntity<ResponseHabitacion> actionDelete(@PathVariable Long id) {
        habitacionBusiness.eliminar(id);
        ResponseHabitacion response = new ResponseHabitacion();
        response.success();
        response.listMessage.add("Habitacion desactivada exitosamente");
        return ResponseEntity.ok(response);
    }
}

