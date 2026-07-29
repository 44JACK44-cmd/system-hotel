package com.hotel.apifds20261.repository;

import com.hotel.apifds20261.entity.EntityParametro;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface RepositoryParametro extends JpaRepository<EntityParametro, Long> {
    Optional<EntityParametro> findByClave(String clave);
    List<EntityParametro> findByModulo(String modulo);
    boolean existsByClave(String clave);
}
