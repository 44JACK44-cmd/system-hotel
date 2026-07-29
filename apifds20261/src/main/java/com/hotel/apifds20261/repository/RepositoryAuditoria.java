package com.hotel.apifds20261.repository;

import com.hotel.apifds20261.entity.EntityAuditoria;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;

@Repository
public interface RepositoryAuditoria extends JpaRepository<EntityAuditoria, Long> {

    @Query("SELECT a FROM EntityAuditoria a WHERE " +
           "(:usuarioId IS NULL OR a.usuarioId = :usuarioId) AND " +
           "(:modulo IS NULL OR LOWER(a.modulo) LIKE LOWER(CONCAT('%',:modulo,'%'))) AND " +
           "(:fechaDesde IS NULL OR a.fecha >= :fechaDesde) AND " +
           "(:fechaHasta IS NULL OR a.fecha <= :fechaHasta) " +
           "ORDER BY a.fecha DESC")
    Page<EntityAuditoria> findAllFiltered(
            @Param("usuarioId") Long usuarioId,
            @Param("modulo") String modulo,
            @Param("fechaDesde") LocalDateTime fechaDesde,
            @Param("fechaHasta") LocalDateTime fechaHasta,
            Pageable pageable);
}
