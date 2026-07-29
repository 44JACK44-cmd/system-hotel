# Módulo API - Estructura Futura de Integración OpenAPI

Este directorio (`src/app/api`) está preparado como parte de la homologación con la arquitectura del docente para alojar en el futuro el cliente API autogenerado mediante **`ng-openapi-gen`**.

## Plan de Integración Futura
1. **Generación automática**: Cuando se active, se configurará la herramienta `ng-openapi-gen` para leer la especificación de OpenAPI (Swagger) del backend desde `/api-docs` y generar los servicios correspondientes en este directorio.
2. **Uso de Promesas**: Los componentes consumirán los servicios a través de la inyección de la clase central `Api` utilizando promesas (`this.api.invoke(...)`).

## Estado Actual
* **Uso de Servicios Manuales**: Actualmente, para garantizar la estabilidad y el no romper las funcionalidades del sistema hotelero, se siguen utilizando los servicios HTTP tradicionales en `src/app/service/` que operan con RxJS `Observable`.
* **Archivos Locales**: Este directorio sólo contiene la configuración básica de entorno (`environment.ts`).
