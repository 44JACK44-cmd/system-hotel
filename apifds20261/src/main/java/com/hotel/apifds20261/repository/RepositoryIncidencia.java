package com.hotel.apifds20261.repository;

import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.hotel.apifds20261.entity.EntityIncidenciaHabitacion;

@Repository
public interface RepositoryIncidencia extends JpaRepository<EntityIncidenciaHabitacion, Long> {

    @EntityGraph(attributePaths = {"habitacion", "usuario"})
    List<EntityIncidenciaHabitacion> findAllByOrderByFechaInicioDesc();

    /**
     * Query nativa para el reporte: evita el mapeo de enum y devuelve
     * el valor de 'tipo' como String raw desde la BD.
     * Esto previene IllegalArgumentException si hay valores legacy en la BD
     * (ej: 'LIMPIEZA' que fue renombrado a 'LIMPIEZA_CHECKOUT').
     */
    @Query(value = """
            SELECT h.numero AS habitacion,
                   i.tipo   AS tipo,
                   i.motivo AS motivo,
                   i.fecha_inicio AS fechaInicio,
                   i.fecha_fin    AS fechaFin
            FROM incidencias_habitacion i
            INNER JOIN habitaciones h ON h.id = i.habitacion_id
            ORDER BY i.fecha_inicio DESC
            """, nativeQuery = true)
    List<Object[]> findAllForReporte();

    @EntityGraph(attributePaths = {"habitacion"})
    List<EntityIncidenciaHabitacion> findByFechaFinIsNullOrderByFechaInicioDesc();

    @EntityGraph(attributePaths = {"habitacion"})
    List<EntityIncidenciaHabitacion> findByHabitacionIdOrderByFechaInicioDesc(Long habitacionId);

    List<EntityIncidenciaHabitacion> findByFechaFinIsNullAndHabitacionId(Long habitacionId);

    @Query("SELECT i FROM EntityIncidenciaHabitacion i WHERE " +
           "(:search IS NULL OR LOWER(i.habitacion.numero) LIKE LOWER(CONCAT('%',:search,'%')) " +
           "OR LOWER(i.tipo) LIKE LOWER(CONCAT('%',:search,'%')) " +
           "OR LOWER(i.motivo) LIKE LOWER(CONCAT('%',:search,'%')))")
    Page<EntityIncidenciaHabitacion> findAllPaginated(@Param("search") String search, Pageable pageable);

    long countByUsuarioId(Long usuarioId);
}
