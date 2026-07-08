package com.hotel.apifds20261.controller;

import com.hotel.apifds20261.business.BusinessHospedaje;
import com.hotel.apifds20261.dto.request.RequestHospedajeCheckInDirecto;
import com.hotel.apifds20261.dto.request.RequestHospedajeCheckIn;
import com.hotel.apifds20261.dto.request.RequestHospedajeCheckOut;
import com.hotel.apifds20261.dto.response.HospedajeResponse;
import com.hotel.apifds20261.dto.response.ResponseHospedaje;
import com.hotel.apifds20261.security.JwtService;
import com.hotel.apifds20261.service.BoletoService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("hospedaje")
@RequiredArgsConstructor
public class HospedajeController {

    private final BusinessHospedaje hospedajeBusiness;
    private final JwtService jwtService;
    private final BoletoService boletoService;

    @GetMapping("getactive")
    public ResponseEntity<ResponseHospedaje> actionGetActive() {
        List<HospedajeResponse> list = hospedajeBusiness.listarActivos();
        ResponseHospedaje response = new ResponseHospedaje();
        response.success();
        response.setListHospedaje(list);
        return ResponseEntity.ok(response);
    }

    @GetMapping("getall")
    public ResponseEntity<ResponseHospedaje> actionGetAll() {
        List<HospedajeResponse> list = hospedajeBusiness.listarTodos();
        ResponseHospedaje response = new ResponseHospedaje();
        response.success();
        response.setListHospedaje(list);
        return ResponseEntity.ok(response);
    }

    @GetMapping("getbyid/{id}")
    public ResponseEntity<ResponseHospedaje> actionGetById(@PathVariable Long id) {
        HospedajeResponse item = hospedajeBusiness.obtenerPorId(id);
        ResponseHospedaje response = new ResponseHospedaje();
        response.success();
        response.getListHospedaje().add(item);
        return ResponseEntity.ok(response);
    }

    @PostMapping("checkin")
    public ResponseEntity<ResponseHospedaje> actionCheckIn(
            @Valid @RequestBody RequestHospedajeCheckIn request,
            @RequestHeader("Authorization") String authHeader) {
        Long usuarioId = jwtService.getUserIdFromToken(authHeader.substring(7));
        HospedajeResponse item = hospedajeBusiness.checkInDesdeReserva(request, usuarioId);
        ResponseHospedaje response = new ResponseHospedaje();
        response.success();
        response.getListHospedaje().add(item);
        response.listMessage.add("Check-in realizado exitosamente");
        return ResponseEntity.ok(response);
    }

    @PostMapping("checkindirect")
    public ResponseEntity<ResponseHospedaje> actionCheckInDirect(
            @Valid @RequestBody RequestHospedajeCheckInDirecto request,
            @RequestHeader("Authorization") String authHeader) {
        Long usuarioId = jwtService.getUserIdFromToken(authHeader.substring(7));
        HospedajeResponse item = hospedajeBusiness.checkInDirecto(request, usuarioId);
        ResponseHospedaje response = new ResponseHospedaje();
        response.success();
        response.getListHospedaje().add(item);
        response.listMessage.add("Check-in directo realizado exitosamente");
        return ResponseEntity.ok(response);
    }

    @PostMapping("checkout/{id}")
    public ResponseEntity<ResponseHospedaje> actionCheckOut(
            @PathVariable Long id,
            @Valid @RequestBody RequestHospedajeCheckOut request,
            @RequestHeader("Authorization") String authHeader) {
        Long usuarioId = jwtService.getUserIdFromToken(authHeader.substring(7));
        request.setHospedajeId(id);
        HospedajeResponse item = hospedajeBusiness.checkOut(request, usuarioId);
        ResponseHospedaje response = new ResponseHospedaje();
        response.success();
        response.getListHospedaje().add(item);
        response.listMessage.add("Check-out realizado exitosamente");
        return ResponseEntity.ok(response);
    }

    @GetMapping("boleto/{id}")
    public ResponseEntity<byte[]> generarBoleto(@PathVariable Long id) {
        try {
            HospedajeResponse hospedaje = hospedajeBusiness.obtenerPorId(id);
            
            byte[] pdfContent = boletoService.generarBoletoHospedaje(
                    hospedaje.getId(),
                    hospedaje.getClienteNombre(),
                    hospedaje.getClienteTelefono(),
                    null, // documento se puede agregar despues
                    hospedaje.getHabitacionNumero(),
                    hospedaje.getHabitacionTipo(),
                    hospedaje.getUsuarioNombre(),
                    hospedaje.getFechaIngreso().toString(),
                    hospedaje.getFechaSalidaProgramada().toString(),
                    hospedaje.getEstado(),
                    hospedaje.getTotalPagado().toString(),
                    hospedaje.getDeudaPendiente().toString()
            );
            
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_PDF);
            headers.setContentDispositionFormData("attachment", "boleto_hospedaje_" + id + ".pdf");
            
            return ResponseEntity.ok()
                    .headers(headers)
                    .body(pdfContent);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().build();
        }
    }
}

