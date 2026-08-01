package com.hotel.apifds20261.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.hotel.apifds20261.staticdata.EstadoHabitacion;
import com.hotel.apifds20261.entity.EntityHabitacion;

import jakarta.persistence.LockModeType;

@Repository
public interface RepositoryHabitacion extends JpaRepository<EntityHabitacion, Long> {
    List<EntityHabitacion> findByPisoAndActivoTrue(Integer piso);
    List<EntityHabitacion> findByEstadoAndActivoTrue(EstadoHabitacion estado);
    List<EntityHabitacion> findAllByOrderByPisoAscNumeroAsc();
    List<EntityHabitacion> findByActivoTrueOrderByPisoAscNumeroAsc();
    boolean existsByNumero(String numero);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT h FROM EntityHabitacion h WHERE h.id = :id")
    EntityHabitacion findByIdForUpdate(@Param("id") Long id);

    @Query("SELECT h FROM EntityHabitacion h WHERE " +
           "LOWER(h.numero) LIKE LOWER(CONCAT('%',:valor,'%')) " +
           "OR LOWER(h.tipo) LIKE LOWER(CONCAT('%',:valor,'%')) " +
           "OR LOWER(h.estado) LIKE LOWER(CONCAT('%',:valor,'%'))")
    List<EntityHabitacion> search(@Param("valor") String valor);
}
