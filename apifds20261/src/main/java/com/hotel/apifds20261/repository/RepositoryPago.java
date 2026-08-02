package com.hotel.apifds20261.repository;

import com.hotel.apifds20261.entity.EntityPago;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface RepositoryPago extends JpaRepository<EntityPago, Long> {

    List<EntityPago> findByReservaIdOrderByFechaPagoDesc(Long reservaId);

    List<EntityPago> findByHospedajeIdOrderByFechaPagoDesc(Long hospedajeId);

    @EntityGraph(attributePaths = {"usuario", "reserva", "hospedaje"})
    List<EntityPago> findAllByOrderByFechaPagoDesc();

    @EntityGraph(attributePaths = {"hospedaje.cliente", "hospedaje.habitacion", "reserva.cliente", "reserva.habitacion"})
    List<EntityPago> findByFechaPagoBetweenOrderByFechaPagoDesc(LocalDateTime inicio, LocalDateTime fin);

    List<EntityPago> findByTipoOrderByFechaPagoDesc(String tipo);

    @Query(value = """
            SELECT p.* FROM pagos p
            LEFT JOIN usuarios u ON u.id = p.usuario_id
            WHERE (:search IS NULL OR LOWER(u.nombre_completo) LIKE LOWER(CONCAT('%',:search,'%')) OR LOWER(p.tipo) LIKE LOWER(CONCAT('%',:search,'%')) OR LOWER(p.metodo) LIKE LOWER(CONCAT('%',:search,'%')) OR LOWER(p.referencia) LIKE LOWER(CONCAT('%',:search,'%')))
            AND (:tipo IS NULL OR p.tipo = :tipo)
            AND (:metodo IS NULL OR p.metodo = :metodo)
            AND (:inicio IS NULL OR p.fecha_pago >= :inicio)
            AND (:fin IS NULL OR p.fecha_pago < :fin)
            """, nativeQuery = true, countQuery = """
            SELECT COUNT(*) FROM pagos p
            LEFT JOIN usuarios u ON u.id = p.usuario_id
            WHERE (:search IS NULL OR LOWER(u.nombre_completo) LIKE LOWER(CONCAT('%',:search,'%')) OR LOWER(p.tipo) LIKE LOWER(CONCAT('%',:search,'%')) OR LOWER(p.metodo) LIKE LOWER(CONCAT('%',:search,'%')) OR LOWER(p.referencia) LIKE LOWER(CONCAT('%',:search,'%')))
            AND (:tipo IS NULL OR p.tipo = :tipo)
            AND (:metodo IS NULL OR p.metodo = :metodo)
            AND (:inicio IS NULL OR p.fecha_pago >= :inicio)
            AND (:fin IS NULL OR p.fecha_pago < :fin)
            """)
    Page<Object[]> findAllPaginated(@Param("search") String search,
            @Param("tipo") String tipo,
            @Param("metodo") String metodo,
            @Param("inicio") LocalDateTime inicio,
            @Param("fin") LocalDateTime fin, Pageable pageable);

    long countByUsuarioId(Long usuarioId);
}
