package com.hotel.apifds20261.repository;

import com.hotel.apifds20261.entity.EntityPago;
import org.springframework.data.jpa.repository.JpaRepository;
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
}
