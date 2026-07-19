package com.hotel.apifds20261.repository;

import com.hotel.apifds20261.staticdata.EstadoReserva;
import com.hotel.apifds20261.entity.EntityReserva;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface RepositoryReserva extends JpaRepository<EntityReserva, Long> {

    List<EntityReserva> findByEstadoOrderByFechaReservaDesc(EstadoReserva estado);

    List<EntityReserva> findAllByOrderByFechaReservaDesc();

    List<EntityReserva> findByFechaEntradaOrderByFechaReservaDesc(LocalDate fecha);

    List<EntityReserva> findByClienteIdOrderByFechaReservaDesc(Long clienteId);

    @Query("SELECT r FROM EntityReserva r WHERE r.habitacion.id = :habitacionId AND r.estado = 'CONFIRMADA' " +
           "AND r.fechaEntrada < :fechaSalida AND r.fechaSalida > :fechaEntrada")
    List<EntityReserva> findSolapadas(Long habitacionId, LocalDate fechaEntrada, LocalDate fechaSalida);

    @Query("SELECT r FROM EntityReserva r WHERE r.estado = 'CONFIRMADA' AND r.fechaEntrada < :hoy")
    List<EntityReserva> findConfirmadasVencidas(LocalDate hoy);

    @Query("SELECT r FROM EntityReserva r WHERE " +
           "(:search IS NULL OR LOWER(r.cliente.nombreCompleto) LIKE LOWER(CONCAT('%',:search,'%')) " +
           "OR LOWER(r.habitacion.numero) LIKE LOWER(CONCAT('%',:search,'%')) " +
           "OR LOWER(r.estado) LIKE LOWER(CONCAT('%',:search,'%')))")
    Page<EntityReserva> findAllPaginated(@Param("search") String search, Pageable pageable);
}
