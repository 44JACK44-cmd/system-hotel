package com.hotel.apifds20261.repository;

import com.hotel.apifds20261.entity.EntityAlertaLeida;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface RepositoryAlertaLeida extends JpaRepository<EntityAlertaLeida, Long> {

    List<EntityAlertaLeida> findByUsuarioId(Long usuarioId);

    @Query("SELECT a.grupoId FROM EntityAlertaLeida a WHERE a.usuarioId = :usuarioId")
    List<String> findGrupoIdsByUsuarioId(@Param("usuarioId") Long usuarioId);

    boolean existsByUsuarioIdAndGrupoId(Long usuarioId, String grupoId);

    @Modifying
    @Query("DELETE FROM EntityAlertaLeida a WHERE a.usuarioId = :usuarioId")
    void deleteAllByUsuarioId(@Param("usuarioId") Long usuarioId);
}
