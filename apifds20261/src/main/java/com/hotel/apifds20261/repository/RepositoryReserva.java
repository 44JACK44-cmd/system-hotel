package com.hotel.apifds20261.repository;

import com.hotel.apifds20261.staticdata.EstadoReserva;
import com.hotel.apifds20261.entity.EntityReserva;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
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
}
