package com.hotel.apifds20261.repository;

import com.hotel.apifds20261.entity.EntityConsumo;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;

@Repository
public interface RepositoryConsumo extends JpaRepository<EntityConsumo, Long> {

    List<EntityConsumo> findByHospedajeIdOrderByFechaRegistroDesc(Long hospedajeId);

    @Query("SELECT COALESCE(SUM(c.subtotal), 0) FROM EntityConsumo c WHERE c.hospedaje.id = :hospedajeId")
    BigDecimal sumTotalByHospedajeId(@Param("hospedajeId") Long hospedajeId);
}
