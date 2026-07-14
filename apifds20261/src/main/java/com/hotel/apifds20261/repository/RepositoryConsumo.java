package com.hotel.apifds20261.repository;

import com.hotel.apifds20261.entity.EntityConsumo;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface RepositoryConsumo extends JpaRepository<EntityConsumo, Long> {

    List<EntityConsumo> findByHospedajeIdOrderByFechaRegistroDesc(Long hospedajeId);
}
