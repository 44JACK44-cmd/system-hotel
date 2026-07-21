package com.hotel.apifds20261.controller;

import com.hotel.apifds20261.business.BusinessCliente;
import com.hotel.apifds20261.dto.request.RequestClienteInsert;
import com.hotel.apifds20261.dto.response.ClienteResponse;
import com.hotel.apifds20261.dto.response.HospedajeResponse;
import com.hotel.apifds20261.dto.response.ReservaResponse;
import com.hotel.apifds20261.dto.response.ResponseCliente;
import com.hotel.apifds20261.dto.response.ResponsePage;
import com.hotel.apifds20261.dto.response.ResponseReserva;
import com.hotel.apifds20261.dto.response.ResponseHospedaje;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/cliente")
@RequiredArgsConstructor
public class ClienteController {

    private final BusinessCliente clienteBusiness;

    @GetMapping("getall")
    public ResponseEntity<ResponseCliente> actionGetAll() {
        List<ClienteResponse> list = clienteBusiness.listarTodos();
        ResponseCliente response = new ResponseCliente();
        response.success();
        response.setListCliente(list);
        return ResponseEntity.ok(response);
    }

    @GetMapping("getallpaginated")
    public ResponseEntity<ResponsePage<ClienteResponse>> actionGetAllPaginated(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "id") String sortField,
            @RequestParam(defaultValue = "asc") String sortDir,
            @RequestParam(required = false) String search) {
        ResponsePage<ClienteResponse> response = clienteBusiness.listarPaginado(search, page, size, sortField, sortDir);
        return ResponseEntity.ok(response);
    }

    @GetMapping("getbyid/{id}")
    public ResponseEntity<ResponseCliente> actionGetById(@PathVariable Long id) {
        ClienteResponse item = clienteBusiness.obtenerPorId(id);
        ResponseCliente response = new ResponseCliente();
        response.success();
        response.getListCliente().add(item);
        return ResponseEntity.ok(response);
    }

    @GetMapping("search")
    public ResponseEntity<ResponseCliente> actionSearch(@RequestParam String termino) {
        List<ClienteResponse> list = clienteBusiness.buscar(termino);
        ResponseCliente response = new ResponseCliente();
        response.success();
        response.setListCliente(list);
        return ResponseEntity.ok(response);
    }

    @GetMapping("getbytelefono/{telefono}")
    public ResponseEntity<ResponseCliente> actionGetByTelefono(@PathVariable String telefono) {
        ClienteResponse item = clienteBusiness.buscarPorTelefono(telefono);
        ResponseCliente response = new ResponseCliente();
        response.success();
        response.getListCliente().add(item);
        return ResponseEntity.ok(response);
    }

    @GetMapping("historialreservas/{id}")
    public ResponseEntity<ResponseReserva> actionHistorialReservas(@PathVariable Long id) {
        List<ReservaResponse> list = clienteBusiness.historialReservas(id);
        ResponseReserva response = new ResponseReserva();
        response.success();
        response.setListReserva(list);
        response.listMessage.add("Historial de reservas cargado");
        return ResponseEntity.ok(response);
    }

    @GetMapping("historialhospedajes/{id}")
    public ResponseEntity<ResponseHospedaje> actionHistorialHospedajes(@PathVariable Long id) {
        List<HospedajeResponse> list = clienteBusiness.historialHospedajes(id);
        ResponseHospedaje response = new ResponseHospedaje();
        response.success();
        response.setListHospedaje(list);
        response.listMessage.add("Historial de hospedajes cargado");
        return ResponseEntity.ok(response);
    }

    @PostMapping("insert")
    public ResponseEntity<ResponseCliente> actionInsert(@Valid @RequestBody RequestClienteInsert request) {
        ClienteResponse item = clienteBusiness.crear(request);
        ResponseCliente response = new ResponseCliente();
        response.success();
        response.getListCliente().add(item);
        response.listMessage.add("Cliente creado exitosamente");
        return ResponseEntity.ok(response);
    }

    @PutMapping("update/{id}")
    public ResponseEntity<ResponseCliente> actionUpdate(
            @PathVariable Long id, @Valid @RequestBody RequestClienteInsert request) {
        ClienteResponse item = clienteBusiness.actualizar(id, request);
        ResponseCliente response = new ResponseCliente();
        response.success();
        response.getListCliente().add(item);
        response.listMessage.add("Cliente actualizado exitosamente");
        return ResponseEntity.ok(response);
    }
}

