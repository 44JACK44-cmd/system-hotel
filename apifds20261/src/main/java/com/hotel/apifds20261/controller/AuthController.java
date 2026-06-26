package com.hotel.apifds20261.controller;

import com.hotel.apifds20261.business.BusinessAuth;
import com.hotel.apifds20261.dto.request.RequestAuthLogin;
import com.hotel.apifds20261.dto.response.LoginResponse;
import com.hotel.apifds20261.dto.response.ResponseAuth;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("auth")
@RequiredArgsConstructor
public class AuthController {

    private final BusinessAuth authBusiness;

    @PostMapping("login")
    public ResponseEntity<ResponseAuth> actionLogin(@Valid @RequestBody RequestAuthLogin request) {
        LoginResponse loginResponse = authBusiness.login(request);
        ResponseAuth response = new ResponseAuth();
        response.success();
        response.setLoginResponse(loginResponse);
        response.listMessage.add("Inicio de sesion exitoso");
        return ResponseEntity.ok(response);
    }
}

