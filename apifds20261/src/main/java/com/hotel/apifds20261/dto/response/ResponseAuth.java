package com.hotel.apifds20261.dto.response;

import com.hotel.apifds20261.generic.ResponseGeneric;

import lombok.Getter;
import lombok.Setter;

@Getter @Setter
public class ResponseAuth extends ResponseGeneric {
    private LoginResponse loginResponse;
}
