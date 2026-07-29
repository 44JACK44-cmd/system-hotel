package com.hotel.apifds20261.repository;

import com.hotel.apifds20261.staticdata.EstadoReserva;
import com.hotel.apifds20261.entity.EntityReserva;
import jakarta.persistence.LockModeType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface RepositoryReserva extends JpaRepository<EntityReserva, Long> {

    List<EntityReserva> findByEstadoOrderByFechaReservaDesc(EstadoReserva estado);

    @EntityGraph(attributePaths = {"cliente", "habitacion", "usuario"})
    List<EntityReserva> findAllByOrderByFechaReservaDesc();

    @EntityGraph(attributePaths = {"cliente", "habitacion", "usuario"})
    List<EntityReserva> findByFechaEntradaOrderByFechaReservaDesc(LocalDate fecha);

    @EntityGraph(attributePaths = {"cliente", "habitacion", "usuario"})
    List<EntityReserva> findByClienteIdOrderByFechaReservaDesc(Long clienteId);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT r FROM EntityReserva r WHERE r.habitacion.id = :habitacionId AND r.estado = 'CONFIRMADA' " +
           "AND r.fechaEntrada < :fechaSalida AND r.fechaSalida > :fechaEntrada")
    List<EntityReserva> findSolapadas(Long habitacionId, LocalDate fechaEntrada, LocalDate fechaSalida);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT r FROM EntityReserva r WHERE r.cliente.id = :clienteId AND r.estado = 'CONFIRMADA' " +
           "AND r.fechaEntrada < :fechaSalida AND r.fechaSalida > :fechaEntrada")
    List<EntityReserva> findSolapadasByCliente(Long clienteId, LocalDate fechaEntrada, LocalDate fechaSalida);

    @EntityGraph(attributePaths = {"cliente", "habitacion", "usuario"})
    @Query("SELECT r FROM EntityReserva r WHERE r.usuario.id = :usuarioId AND r.estado = 'CONFIRMADA' " +
           "AND r.fechaEntrada >= :hoy")
    List<EntityReserva> findFuturasByUsuario(Long usuarioId, LocalDate hoy);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT r FROM EntityReserva r WHERE r.estado = 'CONFIRMADA' AND r.fechaEntrada < :hoy")
    List<EntityReserva> findConfirmadasVencidas(LocalDate hoy);

    @Query("SELECT r FROM EntityReserva r WHERE " +
           "(:search IS NULL OR LOWER(r.cliente.nombreCompleto) LIKE LOWER(CONCAT('%',:search,'%')) " +
           "OR LOWER(r.habitacion.numero) LIKE LOWER(CONCAT('%',:search,'%')) " +
           "OR LOWER(r.estado) LIKE LOWER(CONCAT('%',:search,'%')))")
    Page<EntityReserva> findAllPaginated(@Param("search") String search, Pageable pageable);

    @Query("SELECT r FROM EntityReserva r WHERE r.fechaReserva >= :inicio AND r.fechaReserva < :fin " +
           "AND r.estado IN :estados")
    List<EntityReserva> findByFechaReservaBetweenAndEstadoIn(
            @Param("inicio") LocalDateTime inicio,
            @Param("fin") LocalDateTime fin,
            @Param("estados") List<EstadoReserva> estados);

    @EntityGraph(attributePaths = {"cliente", "habitacion", "usuario"})
    @Query("SELECT r FROM EntityReserva r WHERE r.estado = 'CONFIRMADA' AND " +
           "(LOWER(r.cliente.nombreCompleto) LIKE LOWER(CONCAT('%',:valor,'%')) " +
           "OR LOWER(r.cliente.documento) LIKE LOWER(CONCAT('%',:valor,'%')) " +
           "OR LOWER(r.cliente.telefono) LIKE LOWER(CONCAT('%',:valor,'%')) " +
           "OR LOWER(r.habitacion.numero) LIKE LOWER(CONCAT('%',:valor,'%')) " +
           "OR CAST(r.id AS string) LIKE CONCAT('%',:valor,'%'))")
    List<EntityReserva> searchConfirmadas(@Param("valor") String valor);

    List<EntityReserva> findByHabitacionIdAndEstado(Long habitacionId, EstadoReserva estado);
}
