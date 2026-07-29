package com.hotel.apifds20261.dto.response;

import com.hotel.apifds20261.generic.ResponseGeneric;
import lombok.*;

import java.util.ArrayList;
import java.util.List;

@Getter @Setter
public class ResponseParametro extends ResponseGeneric {
    private List<ParametroResponse> listParametro = new ArrayList<>();
}
