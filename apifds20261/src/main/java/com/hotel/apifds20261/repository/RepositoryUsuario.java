package com.hotel.apifds20261.repository;

import com.hotel.apifds20261.entity.EntityUsuario;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface RepositoryUsuario extends JpaRepository<EntityUsuario, Long> {
    Optional<EntityUsuario> findByUsername(String username);
    boolean existsByUsername(String username);
}
