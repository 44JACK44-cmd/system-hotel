package com.hotel.apifds20261.repository;

import com.hotel.apifds20261.entity.EntityCliente;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface RepositoryCliente extends JpaRepository<EntityCliente, Long> {
    List<EntityCliente> findByNombreCompletoContainingIgnoreCaseOrTelefonoContaining(String nombre, String telefono);
    List<EntityCliente> findByTelefono(String telefono);
    List<EntityCliente> findAllByOrderByCreatedAtDesc();

    @Query("SELECT c FROM EntityCliente c WHERE " +
           "(:search IS NULL OR LOWER(c.nombreCompleto) LIKE LOWER(CONCAT('%',:search,'%')) " +
           "OR LOWER(c.telefono) LIKE LOWER(CONCAT('%',:search,'%')) " +
           "OR LOWER(c.documento) LIKE LOWER(CONCAT('%',:search,'%')) " +
           "OR LOWER(c.email) LIKE LOWER(CONCAT('%',:search,'%')))")
    Page<EntityCliente> findAllPaginated(@Param("search") String search, Pageable pageable);
}
