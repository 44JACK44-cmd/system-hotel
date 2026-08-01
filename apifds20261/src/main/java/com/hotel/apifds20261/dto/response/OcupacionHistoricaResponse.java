package com.hotel.apifds20261.dto.response;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class OcupacionHistoricaResponse {
    private String fecha;
    private long habitacionesOcupadas;
    private long habitacionesDisponibles;
    private long totalHabitaciones;
    private double porcentaje;
}
