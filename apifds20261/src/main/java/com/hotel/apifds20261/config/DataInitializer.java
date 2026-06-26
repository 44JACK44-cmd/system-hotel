package com.hotel.apifds20261.config;

import com.hotel.apifds20261.entity.EntityUsuario;
import com.hotel.apifds20261.staticdata.RolUsuario;
import com.hotel.apifds20261.repository.RepositoryUsuario;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {

    private final RepositoryUsuario usuarioRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) {
        String hashAdmin = passwordEncoder.encode("admin123");
        String hashRecep = passwordEncoder.encode("recep123");

        if (usuarioRepository.existsByUsername("admin")) {
            EntityUsuario admin = usuarioRepository.findByUsername("admin").orElseThrow();
            admin.setPassword(hashAdmin);
            usuarioRepository.save(admin);
            System.out.println("Password updated for ADMIN: admin / admin123");
        } else {
            EntityUsuario admin = new EntityUsuario();
            admin.setNombreCompleto("Administrador");
            admin.setUsername("admin");
            admin.setPassword(hashAdmin);
            admin.setRol(RolUsuario.ADMIN);
            admin.setActivo(true);
            usuarioRepository.save(admin);
            System.out.println("Usuario ADMIN creado: admin / admin123");
        }

        if (usuarioRepository.existsByUsername("recepcionista")) {
            EntityUsuario recep = usuarioRepository.findByUsername("recepcionista").orElseThrow();
            recep.setPassword(hashRecep);
            usuarioRepository.save(recep);
            System.out.println("Password updated for RECEPCIONISTA: recepcionista / recep123");
        } else {
            EntityUsuario recep = new EntityUsuario();
            recep.setNombreCompleto("Recepcionista");
            recep.setUsername("recepcionista");
            recep.setPassword(hashRecep);
            recep.setRol(RolUsuario.RECEPCIONISTA);
            recep.setActivo(true);
            usuarioRepository.save(recep);
            System.out.println("Usuario RECEPCIONISTA creado: recepcionista / recep123");
        }
    }
}
