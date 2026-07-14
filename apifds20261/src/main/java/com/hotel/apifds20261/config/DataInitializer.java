package com.hotel.apifds20261.config;

import com.hotel.apifds20261.entity.EntityParametro;
import com.hotel.apifds20261.entity.EntityUsuario;
import com.hotel.apifds20261.staticdata.RolUsuario;
import com.hotel.apifds20261.repository.RepositoryParametro;
import com.hotel.apifds20261.repository.RepositoryUsuario;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {

    private final RepositoryUsuario usuarioRepository;
    private final RepositoryParametro parametroRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) {
        seedUsuarios();
        seedParametros();
    }

    private void seedParametros() {
        seedParametro("hotel.nombre", "Hotel Abancay Plaza", "Nombre comercial del hotel", "datos-hotel");
        seedParametro("hotel.ruc", "20601234567", "RUC / ID Fiscal", "datos-hotel");
        seedParametro("hotel.direccion", "Av. Arenas 123, Abancay, Apurímac", "Dirección física del hotel", "datos-hotel");
        seedParametro("hotel.telefono", "+51 083 321456", "Teléfono de recepción", "datos-hotel");
        seedParametro("hotel.email", "recepcion@abancayplaza.com", "Correo electrónico del hotel", "datos-hotel");
        seedParametro("politicas.cancelacion", "Moderada: Reembolso 50% hasta 48h antes", "Política de cancelación estándar", "politicas");
        seedParametro("politicas.terminos", "El cliente acepta que el hotel no se hace responsable por objetos de valor no declarados en la caja fuerte de recepción. La hora de Check-out es a las 11:00 AM.", "Términos y condiciones", "politicas");
        seedParametro("politicas.checkout", "11:00", "Hora de check-out por defecto", "politicas");
    }

    private void seedParametro(String clave, String valor, String descripcion, String modulo) {
        if (!parametroRepository.existsByClave(clave)) {
            EntityParametro p = new EntityParametro();
            p.setClave(clave);
            p.setValor(valor);
            p.setDescripcion(descripcion);
            p.setModulo(modulo);
            p.setEditable(true);
            parametroRepository.save(p);
            System.out.println("Parametro creado: " + clave + " = " + valor);
        }
    }

    private void seedUsuarios() {
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
