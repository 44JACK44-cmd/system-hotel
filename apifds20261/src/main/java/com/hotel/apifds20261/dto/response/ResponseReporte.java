package com.hotel.apifds20261.dto.response;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

import com.hotel.apifds20261.generic.ResponseGeneric;

import lombok.Getter;
import lombok.Setter;

@Getter @Setter
public class ResponseReporte extends ResponseGeneric {
    private Map<String, Object> reporte;
    private List<Map<String, Object>> listReporte = new ArrayList<>();
}
