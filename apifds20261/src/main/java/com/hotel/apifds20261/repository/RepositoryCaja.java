package com.hotel.apifds20261.repository;

import com.hotel.apifds20261.entity.EntityCaja;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface RepositoryCaja extends JpaRepository<EntityCaja, Long> {

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT c FROM EntityCaja c WHERE c.estado = :estado ORDER BY c.fechaApertura DESC")
    List<EntityCaja> findByEstadoOrderByFechaAperturaDesc(String estado);

    @EntityGraph(attributePaths = {"usuario"})
    @Query("SELECT c FROM EntityCaja c ORDER BY c.fechaApertura DESC")
    List<EntityCaja> findAllByOrderByFechaAperturaDesc();

    long countByUsuarioId(Long usuarioId);
}
