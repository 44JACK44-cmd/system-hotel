package com.hotel.apifds20261.repository;

import com.hotel.apifds20261.entity.EntityCliente;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface RepositoryCliente extends JpaRepository<EntityCliente, Long> {
    List<EntityCliente> findByNombreCompletoContainingIgnoreCaseOrTelefonoContaining(String nombre, String telefono);
    List<EntityCliente> findByTelefono(String telefono);
    List<EntityCliente> findAllByOrderByCreatedAtDesc();
}
