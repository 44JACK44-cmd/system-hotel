# Informe Final: Auditoría Integral de Validaciones — Sistema Hotelero

**Proyecto:** `system-hotel` (Angular + PrimeNG / Spring Boot 3.5.15 + Java 21 + MySQL)
**Fecha:** 01/08/2026
**Alcance:** 8 módulos (Clientes, Usuarios, Habitaciones, Reservas, Hospedajes, Pagos, Incidencias, Configuración)
**Resultado general:** FASE 1 a FASE 5 completadas. `mvn clean compile` ✅ y `ng build` ✅ sin errores.

---

## 1. Reglas obligatorias aplicadas (7 reglas)

| # | Regla | Estado |
|---|-------|--------|
| 1 | Validación visual en Angular (errores bajo cada campo) | ✅ |
| 2 | Formulario reactivo (`FormGroup` + `Validators`) | ✅ |
| 3 | Mensajes de error amigables (es-PE, claros y específicos) | ✅ |
| 4 | Botón de guardado deshabilitado cuando el form es inválido | ✅ |
| 5 | Bean Validation en DTOs backend | ✅ |
| 6 | Validaciones de negocio en capa Business | ✅ |
| 7 | Respuesta HTTP 400 con mensajes (`ResponseError.listMessage`) | ✅ |

---

## 2. Campos auditados y validaciones agregadas

### Módulo Clientes (`/api/cliente`)
| Campo | Validación |
|-------|-----------|
| `nombreCompleto` | Obligatorio, 2–60 chars, solo letras (tildes/Ñ), 1 espacio simple, sin números/símbolos. Se mantiene como campo único (NO separado). |
| `tipoDocumento` | `DNI` (default) o `PASAPORTE`. DNI = 8 dígitos; PASAPORTE ≤ 20 chars. |
| `documento` | ≤ 20 chars; se interpreta por tipo de documento. |
| `telefono` | Obligatorio, solo dígitos 6–12. Se conserva como cadena única (compatibilidad `wa.me`). |
| `codigoPais` | `^\+?[0-9]{1,4}$`, default `+51` (campo nuevo). |
| `email` | `@Email`, ≤ 100 chars, se guarda en minúsculas. |
| Normalización | Nombre sin dobles espacios; trim en documento/teléfono; email lowercase. |

### Módulo Usuarios (`/api/usuario`)
| Campo | Validación |
|-------|-----------|
| `nombreCompleto` | Obligatorio, 2–60, solo letras, 1 espacio simple. |
| `username` | `^[A-Za-z0-9._-]{4,30}$` sin espacios. |
| `password` | ≥ 8 chars con mayúscula + minúscula + número + carácter especial (al crear y al restablecer). |
| `email` | `@Email`, ≤ 100, lowercase. |
| `telefono` | Solo dígitos 6–12. |
| `rol` | Obligatorio; reglas de negocio: no dejar el sistema sin administradores, no cambiar rol propio si es único admin. |
| `confirmPassword` | Debe coincidir con password. |

### Módulo Habitaciones (`/api/habitacion`)
| Campo | Validación |
|-------|-----------|
| `piso` | 1–99. |
| `numero` | `^\d{1,4}$` (1 a 4 dígitos). |
| `tipo` | Obligatorio. |
| `precioNoche` | > 0.01, `@Digits(8,2)` máx 2 decimales. |

### Módulo Reservas (`/api/reserva`)
| Campo | Validación |
|-------|-----------|
| `clienteId` / `habitacionId` | Obligatorios. |
| `fechaEntrada` | `@FutureOrPresent`. |
| `fechaSalida` | `@Future`, y en negocio salida > entrada (noches > 0). |
| `montoAdelanto` | ≥ 0.01, máx 2 decimales. |
| `metodoAdelanto` | `EFECTIVO\|YAPE`. |
| `referenciaPago` / `observacion` | ≤ 100 / ≤ 500. |

### Módulo Hospedajes (`/api/hospedaje`)
| Campo | Validación |
|-------|-----------|
| Check-in directo | Habitación debe estar `DISPONIBLE` y activa; noches 1–30 (según parámetro `hotel.maxNochesHospedaje`); monto no negativo ni > total; cliente sin hospedaje activo; cliente sin deuda pendiente. |
| Check-in desde reserva | Reserva requerida; saldo y método validados. |
| Check-out | `fechaSalidaReal` ≥ `fechaIngreso`; montos de extensión/pago validados (no negativos, no exceder deuda). |
| Extensión | Nueva fecha > ingreso y ≥ salida programada; al menos 1 noche adicional; **límite total ≤ 30 noches** (agregado en esta sesión). |
| Cambio de habitación | Habitación nueva debe estar `DISPONIBLE`. |

### Módulo Pagos (`/api/pago`)
| Campo | Validación |
|-------|-----------|
| `monto` | ≥ 0.01, `@Digits(8,2)`. |
| `metodo` / `tipo` | Valores permitidos (EFECTIVO/YAPE; ADELANTO/SALDO/EXTENSION). |
| Regla de negocio | Monto no puede exceder el saldo pendiente de la reserva/hospedaje. |

### Módulo Incidencias (`/api/incidencia`)
| Campo | Validación |
|-------|-----------|
| `tipo` | `LIMPIEZA_CHECKOUT\|LIMPIEZA\|SERVICIO_LIMPIEZA_HUESPED\|MANTENIMIENTO`. |
| `motivo` | 5–300 chars, no solo espacios. |
| Regla de negocio | No crear incidencia de limpieza en habitación OCUPADA. |

### Módulo Configuración (`/api/parametro`)
| Campo | Validación |
|-------|-----------|
| `hotel.ruc` | Exactamente 11 dígitos. |
| `hotel.telefono` | Solo dígitos 6–12. |
| `hotel.email` | Formato email válido. |
| Otros | Valores validados por clave; claves no editables rechazadas con `BusinessException`. |

---

## 3. Archivos modificados/creados

### Backend (`apifds20261/`)
- **Nuevos:**
  - `helper/ValidationHelper.java` — patrones y métodos de validación reutilizables.
  - `staticdata/TipoDocumento.java` — enum DNI / PASAPORTE.
- **DTO request reescritos:**
  - `RequestClienteInsert`, `RequestUsuarioInsert`, `RequestUsuarioUpdate`, `RequestHabitacionInsert`, `RequestReservaInsert`, `RequestReservaUpdate`, `RequestHospedajeCheckIn`, `RequestHospedajeCheckInDirecto`, `RequestHospedajeCheckOut`, `RequestHospedajeExtend`, `RequestPagoInsert`, `RequestIncidenciaInsert`, `RequestConsumoInsert`.
- **Business:**
  - `BusinessCliente`, `BusinessUsuario`, `BusinessHabitacion`, `BusinessPago`, `BusinessParametro`, `BusinessHospedaje` (límite 30 noches en extensión).
- **Otros:**
  - `exception/GlobalExceptionHandler.java` — manejadores para Bean Validation, malformed JSON, type mismatch, parámetros faltantes, duplicados.
  - `entity/EntityCliente.java` (columnas `tipo_documento`, `codigo_pais`), `dto/response/ClienteResponse.java`.
  - `controller/HospedajeController.java`, `controller/ReservaController.java` (`@Valid`, propagación correcta de errores).
  - `business/BusinessAlertas.java` — corregidas 4 llamadas a `AlertaResponse` con la firma correcta (8 args, faltaba `descripcion`).
  - `controller/ClienteController.java` — **CSV formula-injection protegido** (`csvSafe`).

### Frontend (`appds20261/`)
- `page/auth/clientes/clientes.ts` + `.html` + `.css` — form reactivo, tipo de documento, código de país, mensajes detallados.
- `page/auth/usuarios/usuarios.component.ts` + `.html` — validators de nombre, username, teléfono y fortaleza de contraseña.
- `page/auth/habitaciones/habitaciones.component.ts` + `.html` — piso 1–99, número 1–4 dígitos.
- `page/auth/reservas/reservas.component.ts` + `.html` — validación de fechas (salida > entrada, entrada no pasada).
- `components/nueva-reserva/nueva-reserva.component.ts` — validación de fechas, adelanto ≤ total, 2 decimales.
- `page/auth/hospedajes/hospedajes.component.ts` — noches 1–30, montos, extensión futura.
- `components/checkout/checkout.component.ts` + `.html` — botón deshabilitado si monto > deuda.
- `components/pagos-modal/pagos-modal.component.ts` — monto > 0, ≤ 99,999,999.99.
- `page/auth/incidencias/incidencias.component.ts` + `.html` — motivo 5–300, no solo espacios, tipos ampliados.
- `page/auth/configuracion/configuracion.ts` + `.html` — validación RUC/teléfono/email.
- `components/consumo-modal/consumo-modal.component.ts` + `.html` — cantidad 1–9999.
- `components/cliente-quick-create/cliente-quick-create.component.ts` + `.html` — alineado con validaciones backend.
- `shared/models.ts` — `ClienteResponse` con `tipoDocumento`, `codigoPais`.
- `page/auth/login/login.ts` — lectura de `listMessage`.

---

## 4. Casos de prueba ejecutados (end-to-end real vía HTTP)

| # | Caso | Resultado esperado | Resultado |
|---|------|--------------------|-----------|
| 1 | Login admin | Token JWT | ✅ |
| 2 | Crear cliente con `nombreCompleto="Juan123"` | 400 "El nombre solo puede contener letras..." | ✅ |
| 3 | Nombre con doble espacio `"Juan  Perez"` | 400 | ✅ |
| 4 | Teléfono `"9876ab"` | 400 "solo números (6 a 12 dígitos)" | ✅ |
| 5 | DNI `"1234"` | 400 "exactamente 8 dígitos" | ✅ |
| 6 | Cliente válido con `PASAPORTE` | 200, guarda tipoDocumento=PASAPORTE | ✅ |
| 7 | Reserva con salida anterior a entrada | 400 "fecha de salida debe ser posterior a hoy" | ✅ |
| 8 | Reserva válida | 200, estado CONFIRMADA | ✅ |
| 9 | Pago SALDO mayor al saldo restante | 400 "no puede exceder el saldo pendiente (S/ 35.00)" | ✅ |
| 10 | Usuario con password débil `"abc"` | 400 "8 caracteres... mayúscula..." | ✅ |
| 11 | Incidencia con motivo de 2 chars | 400 "5 y 300 caracteres" | ✅ |
| 12 | Check-in directo en habitación OCUPADA | 400 "La habitacion no esta disponible" | ✅ |
| 13 | Check-in directo con 40 noches | 400 "máximo permitido es 30" | ✅ |
| 14 | Extensión que supera 30 noches totales | 400 "no puede superar 30 noches en total" | ✅ |

**Datos de prueba:** creados y eliminados; la base quedó sin registros residuales.

---

## 5. Seguridad verificada (FASE 4)

| Riesgo | Verificación |
|--------|--------------|
| XSS | Angular escapa por interpolación; **no hay** `[innerHTML]`/`bypassSecurityTrust` en la app. ✅ |
| SQL injection | Todas las consultas (`findAllPaginated`, `search`, reportes) usan **parámetros vinculados** (`:param`) o JPQL; no hay concatenación de input del usuario. ✅ |
| CSV formula injection | **Nuevo**: `csvSafe()` escapa `"` y antepone `'` a celdas que empiezan con `= + - @ \t \r`. ✅ |
| Null / vacíos | `@NotBlank`/`@NotNull` en todos los DTO. ✅ |
| Cadenas largas | `@Size`/`@MaxLength` en todos los campos. ✅ |
| Unicode | Nombres aceptan tildes y Ñ (patrón explícito); almacenado en UTF-8. ✅ |

---

## 6. Problemas encontrados y resueltos

1. **Compilación backend rota** (`BusinessAlertas`): 4 llamadas a `AlertaResponse.informativa/exito/importante` usaban 7 argumentos cuando la firma exige 8 (faltaba `descripcion`). → Corregido con descripciones de alerta adecuadas.
2. **`BusinessPago`**: faltaba import de `BigDecimal` (el import de repositorios ya existía vía wildcard). → Añadido.
3. **`ng build` previo** fallaba por TS2345 (`'CAJA_CAMBIO'` faltaba en `TipoEvento`): ya corregido en sesión anterior; se re-verificó OK.
4. **CSV export** sin protección contra fórmula de Excel. → Corregido.

---

## 7. Recomendaciones

- **`nombreCompleto` como campo único**: se mantuvo según decisión del usuario (no se separó en nombre/apellido).
- **Pasaporte**: el manejo es funcional pero no hay validación de formato estándar de pasaporte (solo longitud ≤ 20). Si se requiere, agregar patrón específico.
- **Pruebas automatizadas**: se recomienda agregar tests de integración (JUnit + MockMvc) para las 7 reglas en cada módulo, y tests unitarios de los validators Angular.
- **Parámetro `hotel.maxNochesHospedaje`**: ahora se aplica también a la extensión de estadía (antes solo a check-in directo). Verificar que el valor de producción sea el deseado (default 30).
- **Mensajes de error**: los textos usan el acento correcto en la mayoría; algunos mensajes backend usan "contrasena" sin tilde por convención previa (funcionalmente correctos, pero se pueden unificar ortográficamente).

---

*Fin del informe.*
