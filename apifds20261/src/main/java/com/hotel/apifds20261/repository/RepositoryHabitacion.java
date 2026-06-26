package com.hotel.apifds20261.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.hotel.apifds20261.staticdata.EstadoHabitacion;
import com.hotel.apifds20261.entity.EntityHabitacion;

@Repository
public interface RepositoryHabitacion extends JpaRepository<EntityHabitacion, Long> {
    List<EntityHabitacion> findByPisoAndActivoTrue(Integer piso);
    List<EntityHabitacion> findByEstadoAndActivoTrue(EstadoHabitacion estado);
    List<EntityHabitacion> findAllByOrderByPisoAscNumeroAsc();
    List<EntityHabitacion> findByActivoTrueOrderByPisoAscNumeroAsc();
    boolean existsByNumero(String numero);
}
