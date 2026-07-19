package com.hotel.apifds20261.repository;

import com.hotel.apifds20261.entity.EntityPago;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface RepositoryPago extends JpaRepository<EntityPago, Long> {

    List<EntityPago> findByReservaIdOrderByFechaPagoDesc(Long reservaId);

    List<EntityPago> findByHospedajeIdOrderByFechaPagoDesc(Long hospedajeId);

    List<EntityPago> findAllByOrderByFechaPagoDesc();

    List<EntityPago> findByFechaPagoBetweenOrderByFechaPagoDesc(LocalDateTime inicio, LocalDateTime fin);

    List<EntityPago> findByTipoOrderByFechaPagoDesc(String tipo);

    @Query("SELECT p FROM EntityPago p WHERE " +
           "(:search IS NULL OR LOWER(p.usuario.nombreCompleto) LIKE LOWER(CONCAT('%',:search,'%')) " +
           "OR LOWER(p.tipo) LIKE LOWER(CONCAT('%',:search,'%')) " +
           "OR LOWER(p.metodo) LIKE LOWER(CONCAT('%',:search,'%')) " +
           "OR LOWER(p.referencia) LIKE LOWER(CONCAT('%',:search,'%')))")
    Page<EntityPago> findAllPaginated(@Param("search") String search, Pageable pageable);
}
