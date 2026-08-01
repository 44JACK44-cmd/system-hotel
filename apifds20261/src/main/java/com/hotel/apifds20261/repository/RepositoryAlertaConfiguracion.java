package com.hotel.apifds20261.repository;

import com.hotel.apifds20261.entity.EntityAlertaConfiguracion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface RepositoryAlertaConfiguracion extends JpaRepository<EntityAlertaConfiguracion, Long> {
    Optional<EntityAlertaConfiguracion> findByUsuarioId(Long usuarioId);
}
