package com.hotel.apifds20261.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.License;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class OpenApiConfig {

    @Bean
    public OpenAPI customOpenAPI() {
        return new OpenAPI()
                .info(new Info()
                        .title("Sistema de Gestion Hotelera API")
                        .version("1.0")
                        .description("API del Sistema de Gestion Hotelera")
                        .license(new License().name("Apache 2.0")));
    }
}
