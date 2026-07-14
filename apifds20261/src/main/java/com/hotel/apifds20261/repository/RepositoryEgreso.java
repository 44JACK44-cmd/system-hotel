package com.hotel.apifds20261.repository;

import com.hotel.apifds20261.entity.EntityEgreso;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface RepositoryEgreso extends JpaRepository<EntityEgreso, Long> {

    List<EntityEgreso> findAllByOrderByFechaRegistroDesc();

    List<EntityEgreso> findByFechaRegistroBetweenOrderByFechaRegistroDesc(LocalDateTime inicio, LocalDateTime fin);
}
