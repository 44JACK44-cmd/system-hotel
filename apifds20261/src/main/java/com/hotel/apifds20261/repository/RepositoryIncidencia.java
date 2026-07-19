package com.hotel.apifds20261.repository;

import com.hotel.apifds20261.entity.EntityIncidenciaHabitacion;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface RepositoryIncidencia extends JpaRepository<EntityIncidenciaHabitacion, Long> {

    List<EntityIncidenciaHabitacion> findAllByOrderByFechaInicioDesc();

    List<EntityIncidenciaHabitacion> findByFechaFinIsNullOrderByFechaInicioDesc();

    List<EntityIncidenciaHabitacion> findByHabitacionIdOrderByFechaInicioDesc(Long habitacionId);

    @Query("SELECT i FROM EntityIncidenciaHabitacion i WHERE " +
           "(:search IS NULL OR LOWER(i.habitacion.numero) LIKE LOWER(CONCAT('%',:search,'%')) " +
           "OR LOWER(i.tipo) LIKE LOWER(CONCAT('%',:search,'%')) " +
           "OR LOWER(i.motivo) LIKE LOWER(CONCAT('%',:search,'%')))")
    Page<EntityIncidenciaHabitacion> findAllPaginated(@Param("search") String search, Pageable pageable);
}
