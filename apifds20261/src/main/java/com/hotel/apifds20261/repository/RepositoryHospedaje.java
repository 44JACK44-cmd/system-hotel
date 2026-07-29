package com.hotel.apifds20261.repository;

import com.hotel.apifds20261.staticdata.EstadoHospedaje;
import com.hotel.apifds20261.entity.EntityHospedaje;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface RepositoryHospedaje extends JpaRepository<EntityHospedaje, Long> {

    @EntityGraph(attributePaths = {"cliente", "habitacion", "usuario"})
    List<EntityHospedaje> findByEstadoOrderByFechaIngresoDesc(EstadoHospedaje estado);

    @EntityGraph(attributePaths = {"cliente", "habitacion", "usuario"})
    List<EntityHospedaje> findAllByOrderByFechaIngresoDesc();

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT h FROM EntityHospedaje h WHERE h.estado = 'ACTIVO' AND h.cliente.id = :clienteId")
    List<EntityHospedaje> findActivosByClienteId(Long clienteId);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT h FROM EntityHospedaje h WHERE h.habitacion.id = :habitacionId AND h.estado = 'ACTIVO'")
    EntityHospedaje findActivoByHabitacionId(Long habitacionId);

    @EntityGraph(attributePaths = {"cliente", "habitacion", "usuario"})
    List<EntityHospedaje> findByClienteIdOrderByFechaIngresoDesc(Long clienteId);

    @EntityGraph(attributePaths = {"cliente", "habitacion", "usuario"})
    @Query("SELECT h FROM EntityHospedaje h WHERE h.usuario.id = :usuarioId AND h.estado = 'ACTIVO'")
    List<EntityHospedaje> findActivosByUsuarioId(Long usuarioId);

    @EntityGraph(attributePaths = {"cliente", "habitacion", "usuario"})
    @Query("SELECT h FROM EntityHospedaje h WHERE h.estado = 'ACTIVO' AND " +
           "(LOWER(h.cliente.nombreCompleto) LIKE LOWER(CONCAT('%',:valor,'%')) " +
           "OR LOWER(h.cliente.documento) LIKE LOWER(CONCAT('%',:valor,'%')) " +
           "OR LOWER(h.cliente.telefono) LIKE LOWER(CONCAT('%',:valor,'%')) " +
           "OR LOWER(h.habitacion.numero) LIKE LOWER(CONCAT('%',:valor,'%')) " +
           "OR CAST(h.id AS string) LIKE CONCAT('%',:valor,'%'))")
    List<EntityHospedaje> searchActivos(@Param("valor") String valor);
}
