package com.hotel.apifds20261.dto.response;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

import com.hotel.apifds20261.generic.ResponseGeneric;

import lombok.Getter;
import lombok.Setter;

@Getter @Setter
public class ResponseHabitacion extends ResponseGeneric {
    private List<HabitacionResponse> listHabitacion = new ArrayList<>();
    private Map<Integer, List<HabitacionResponse>> reporte;
}
