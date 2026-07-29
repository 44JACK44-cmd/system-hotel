package com.hotel.apifds20261.repository;

import com.hotel.apifds20261.entity.EntityUsuario;
import com.hotel.apifds20261.staticdata.RolUsuario;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface RepositoryUsuario extends JpaRepository<EntityUsuario, Long> {
    Optional<EntityUsuario> findByUsername(String username);
    boolean existsByUsername(String username);

    @Query("SELECT u FROM EntityUsuario u WHERE " +
           "(:search IS NULL OR LOWER(u.nombreCompleto) LIKE LOWER(CONCAT('%',:search,'%')) " +
           "OR LOWER(u.username) LIKE LOWER(CONCAT('%',:search,'%')) " +
           "OR LOWER(u.rol) LIKE LOWER(CONCAT('%',:search,'%')))")
    Page<EntityUsuario> findAllPaginated(@Param("search") String search, Pageable pageable);

    @Query("SELECT u FROM EntityUsuario u WHERE " +
           "LOWER(u.nombreCompleto) LIKE LOWER(CONCAT('%',:valor,'%')) " +
           "OR LOWER(u.username) LIKE LOWER(CONCAT('%',:valor,'%')) " +
           "OR LOWER(u.rol) LIKE LOWER(CONCAT('%',:valor,'%'))")
    List<EntityUsuario> search(@Param("valor") String valor);

    Optional<EntityUsuario> findByEmail(String email);
    long countByRolAndActivoTrue(RolUsuario rol);
}
