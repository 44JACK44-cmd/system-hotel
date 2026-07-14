package com.hotel.apifds20261.repository;

import com.hotel.apifds20261.entity.EntityCaja;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface RepositoryCaja extends JpaRepository<EntityCaja, Long> {

    List<EntityCaja> findByEstadoOrderByFechaAperturaDesc(String estado);

    List<EntityCaja> findAllByOrderByFechaAperturaDesc();
}
