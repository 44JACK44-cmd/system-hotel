package com.hotel.apifds20261.repository;

import com.hotel.apifds20261.entity.EntityIncidenciaHabitacion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface RepositoryIncidencia extends JpaRepository<EntityIncidenciaHabitacion, Long> {

    List<EntityIncidenciaHabitacion> findAllByOrderByFechaInicioDesc();

    List<EntityIncidenciaHabitacion> findByFechaFinIsNullOrderByFechaInicioDesc();

    List<EntityIncidenciaHabitacion> findByHabitacionIdOrderByFechaInicioDesc(Long habitacionId);
}
