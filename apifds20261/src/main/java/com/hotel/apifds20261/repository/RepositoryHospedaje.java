package com.hotel.apifds20261.repository;

import com.hotel.apifds20261.staticdata.EstadoHospedaje;
import com.hotel.apifds20261.entity.EntityHospedaje;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface RepositoryHospedaje extends JpaRepository<EntityHospedaje, Long> {

    List<EntityHospedaje> findByEstadoOrderByFechaIngresoDesc(EstadoHospedaje estado);

    List<EntityHospedaje> findAllByOrderByFechaIngresoDesc();

    @Query("SELECT h FROM EntityHospedaje h WHERE h.estado = 'ACTIVO' AND h.cliente.id = :clienteId")
    List<EntityHospedaje> findActivosByClienteId(Long clienteId);

    @Query("SELECT h FROM EntityHospedaje h WHERE h.habitacion.id = :habitacionId AND h.estado = 'ACTIVO'")
    EntityHospedaje findActivoByHabitacionId(Long habitacionId);

    List<EntityHospedaje> findByClienteIdOrderByFechaIngresoDesc(Long clienteId);
}
