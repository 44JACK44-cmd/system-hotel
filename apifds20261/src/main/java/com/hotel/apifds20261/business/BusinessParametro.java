package com.hotel.apifds20261.business;

import com.hotel.apifds20261.dto.request.RequestParametroUpsert;
import com.hotel.apifds20261.dto.response.ParametroResponse;
import com.hotel.apifds20261.entity.EntityParametro;
import com.hotel.apifds20261.exception.ResourceNotFoundException;
import com.hotel.apifds20261.repository.RepositoryParametro;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class BusinessParametro {

    private final RepositoryParametro parametroRepository;

    public List<ParametroResponse> listarTodos() {
        List<EntityParametro> entities = parametroRepository.findAll();
        List<ParametroResponse> list = new ArrayList<>();
        for (EntityParametro p : entities) {
            list.add(toResponse(p));
        }
        return list;
    }

    public ParametroResponse obtenerPorId(Long id) {
        return toResponse(buscarOExcepcion(id));
    }

    public ParametroResponse obtenerPorClave(String clave) {
        EntityParametro p = parametroRepository.findByClave(clave).orElse(null);
        if (p == null) {
            throw new ResourceNotFoundException("Parametro no encontrado: " + clave);
        }
        return toResponse(p);
    }

    public List<ParametroResponse> listarPorModulo(String modulo) {
        List<EntityParametro> entities = parametroRepository.findByModulo(modulo);
        List<ParametroResponse> list = new ArrayList<>();
        for (EntityParametro p : entities) {
            list.add(toResponse(p));
        }
        return list;
    }

    public ParametroResponse crear(RequestParametroUpsert request) {
        if (parametroRepository.existsByClave(request.getClave())) {
            EntityParametro existente = parametroRepository.findByClave(request.getClave()).orElseThrow();
            return actualizar(existente.getId(), request);
        }
        EntityParametro parametro = new EntityParametro();
        parametro.setClave(request.getClave());
        parametro.setValor(request.getValor());
        parametro.setDescripcion(request.getDescripcion());
        parametro.setModulo(request.getModulo());
        parametro.setEditable(request.getEditable() != null ? request.getEditable() : true);
        return toResponse(parametroRepository.save(parametro));
    }

    public ParametroResponse actualizar(Long id, RequestParametroUpsert request) {
        EntityParametro parametro = buscarOExcepcion(id);
        if (!parametro.getEditable()) {
            throw new RuntimeException("Este parametro no es editable");
        }
        parametro.setClave(request.getClave());
        parametro.setValor(request.getValor());
        parametro.setDescripcion(request.getDescripcion());
        parametro.setModulo(request.getModulo());
        return toResponse(parametroRepository.save(parametro));
    }

    public ParametroResponse actualizarValor(String clave, String valor) {
        EntityParametro p = parametroRepository.findByClave(clave).orElse(null);
        if (p == null) {
            throw new ResourceNotFoundException("Parametro no encontrado: " + clave);
        }
        if (!p.getEditable()) {
            throw new RuntimeException("Este parametro no es editable");
        }
        p.setValor(valor);
        return toResponse(parametroRepository.save(p));
    }

    public void eliminar(Long id) {
        EntityParametro parametro = buscarOExcepcion(id);
        parametroRepository.delete(parametro);
    }

    private EntityParametro buscarOExcepcion(Long id) {
        EntityParametro p = parametroRepository.findById(id).orElse(null);
        if (p == null) {
            throw new ResourceNotFoundException("Parametro no encontrado");
        }
        return p;
    }

    private ParametroResponse toResponse(EntityParametro p) {
        ParametroResponse r = new ParametroResponse();
        r.setId(p.getId());
        r.setClave(p.getClave());
        r.setValor(p.getValor());
        r.setDescripcion(p.getDescripcion());
        r.setModulo(p.getModulo());
        r.setEditable(p.getEditable());
        return r;
    }
}
