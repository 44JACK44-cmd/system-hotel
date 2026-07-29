package com.hotel.apifds20261.repository;

import com.hotel.apifds20261.entity.EntityNotificacion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface RepositoryNotificacion extends JpaRepository<EntityNotificacion, Long> {

    List<EntityNotificacion> findByUsuarioDestinoIdOrderByFechaCreacionDesc(Long usuarioId);

    List<EntityNotificacion> findByUsuarioDestinoIdAndLeidaFalseOrderByFechaCreacionDesc(Long usuarioId);

    @Query("SELECT COUNT(n) FROM EntityNotificacion n WHERE n.usuarioDestino.id = :usuarioId AND n.leida = false")
    long countPendientesByUsuarioId(@Param("usuarioId") Long usuarioId);

    List<EntityNotificacion> findByEntidadTipoAndEntidadId(String entidadTipo, Long entidadId);
}
