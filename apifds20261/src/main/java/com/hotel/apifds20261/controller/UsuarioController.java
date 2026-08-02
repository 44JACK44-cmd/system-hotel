package com.hotel.apifds20261.controller;

import com.hotel.apifds20261.business.BusinessUsuario;
import com.hotel.apifds20261.dto.request.RequestUsuarioInsert;
import com.hotel.apifds20261.dto.request.RequestUsuarioUpdate;
import com.hotel.apifds20261.dto.response.ResponsePage;
import com.hotel.apifds20261.dto.response.ResponseUsuario;
import com.hotel.apifds20261.dto.response.SuggestionResponse;
import com.hotel.apifds20261.dto.response.UsuarioResponse;
import com.hotel.apifds20261.security.JwtService;
import com.hotel.apifds20261.security.SecurityUtil;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.Base64;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/usuario")
@RequiredArgsConstructor
public class UsuarioController {

    private final BusinessUsuario usuarioBusiness;
    private final JwtService jwtService;

    @GetMapping("getall")
    public ResponseEntity<ResponseUsuario> actionGetAll() {
        List<UsuarioResponse> list = usuarioBusiness.listarTodos();
        ResponseUsuario response = new ResponseUsuario();
        response.success();
        response.setListUsuario(list);
        return ResponseEntity.ok(response);
    }

    @GetMapping("getallpaginated")
    public ResponseEntity<ResponsePage<UsuarioResponse>> actionGetAllPaginated(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "id") String sortField,
            @RequestParam(defaultValue = "asc") String sortDir,
            @RequestParam(required = false) String search) {
        ResponsePage<UsuarioResponse> response = usuarioBusiness.listarPaginado(search, page, size, sortField, sortDir);
        return ResponseEntity.ok(response);
    }

    @GetMapping("search/suggestions")
    public ResponseEntity<List<SuggestionResponse>> actionSuggestions(@RequestParam String termino) {
        List<SuggestionResponse> list = usuarioBusiness.buscarSugerencias(termino);
        return ResponseEntity.ok(list);
    }

    @GetMapping("getbyid/{id}")
    public ResponseEntity<ResponseUsuario> actionGetById(@PathVariable Long id) {
        UsuarioResponse item = usuarioBusiness.obtenerPorId(id);
        ResponseUsuario response = new ResponseUsuario();
        response.success();
        response.getListUsuario().add(item);
        return ResponseEntity.ok(response);
    }

    @PostMapping("insert")
    public ResponseEntity<ResponseUsuario> actionInsert(@Valid @RequestBody RequestUsuarioInsert request) {
        UsuarioResponse item = usuarioBusiness.crear(request);
        ResponseUsuario response = new ResponseUsuario();
        response.success();
        response.getListUsuario().add(item);
        response.listMessage.add("Usuario creado exitosamente");
        return ResponseEntity.ok(response);
    }

    @PutMapping("update/{id}")
    public ResponseEntity<ResponseUsuario> actionUpdate(
            @PathVariable Long id, @Valid @RequestBody RequestUsuarioInsert request) {
        UsuarioResponse item = usuarioBusiness.actualizar(id, request);
        ResponseUsuario response = new ResponseUsuario();
        response.success();
        response.getListUsuario().add(item);
        response.listMessage.add("Usuario actualizado exitosamente");
        return ResponseEntity.ok(response);
    }

    @PutMapping("updatecompleto/{id}")
    public ResponseEntity<ResponseUsuario> actionUpdateCompleto(
            @PathVariable Long id, @Valid @RequestBody RequestUsuarioUpdate request) {
        Long currentUserId = SecurityUtil.getCurrentUserId(jwtService);
        UsuarioResponse item = usuarioBusiness.actualizarCompleto(id, request, currentUserId);
        ResponseUsuario response = new ResponseUsuario();
        response.success();
        response.getListUsuario().add(item);
        response.listMessage.add("Usuario actualizado exitosamente");
        return ResponseEntity.ok(response);
    }

    @PatchMapping("togglestate/{id}")
    public ResponseEntity<ResponseUsuario> actionToggleState(@PathVariable Long id) {
        usuarioBusiness.cambiarEstado(id);
        ResponseUsuario response = new ResponseUsuario();
        response.success();
        response.listMessage.add("Estado cambiado exitosamente");
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("delete/{id}")
    public ResponseEntity<ResponseUsuario> actionDelete(@PathVariable Long id) {
        Long currentUserId = SecurityUtil.getCurrentUserId(jwtService);
        usuarioBusiness.eliminar(id, currentUserId);
        ResponseUsuario response = new ResponseUsuario();
        response.success();
        response.listMessage.add("Usuario desactivado exitosamente");
        return ResponseEntity.ok(response);
    }

    @PatchMapping("updateprofile/{id}")
    public ResponseEntity<ResponseUsuario> actionUpdateProfile(
            @PathVariable Long id, @RequestBody Map<String, String> body) {
        verificarPerfilPropio(id);
        String nombre = body.get("nombreCompleto");
        String email = body.get("email");
        String telefono = body.get("telefono");
        UsuarioResponse item = usuarioBusiness.updateProfile(id, nombre, email, telefono);
        ResponseUsuario response = new ResponseUsuario();
        response.success();
        response.getListUsuario().add(item);
        response.listMessage.add("Perfil actualizado exitosamente");
        return ResponseEntity.ok(response);
    }

    @PatchMapping("cambiarpassword/{id}")
    public ResponseEntity<ResponseUsuario> actionCambiarPassword(
            @PathVariable Long id, @RequestBody Map<String, String> body) {
        verificarPerfilPropio(id);
        String currentPassword = body.get("currentPassword");
        String newPassword = body.get("newPassword");
        if (currentPassword == null || newPassword == null ||
                currentPassword.isBlank() || newPassword.isBlank()) {
            throw new com.hotel.apifds20261.exception.BusinessException("Ambas contrasenas son requeridas");
        }
        usuarioBusiness.cambiarPassword(id, currentPassword, newPassword);
        ResponseUsuario response = new ResponseUsuario();
        response.success();
        response.listMessage.add("Contrasena cambiada exitosamente");
        return ResponseEntity.ok(response);
    }

    @PatchMapping("resetpassword/{id}")
    public ResponseEntity<ResponseUsuario> actionResetPasswordByAdmin(
            @PathVariable Long id, @RequestBody Map<String, String> body) {
        Long currentUserId = SecurityUtil.getCurrentUserId(jwtService);
        String newPassword = body.get("newPassword");
        String confirmPassword = body.get("confirmPassword");
        usuarioBusiness.resetPasswordByAdmin(id, newPassword, confirmPassword, currentUserId);
        ResponseUsuario response = new ResponseUsuario();
        response.success();
        response.listMessage.add("Contraseña restablecida exitosamente");
        return ResponseEntity.ok(response);
    }

@PostMapping(value = "uploadavatar/{id}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ResponseUsuario> actionUploadAvatar(
            @PathVariable Long id, @RequestParam("file") MultipartFile file) {
        verificarPerfilPropio(id);
        if (file.isEmpty()) {
            throw new com.hotel.apifds20261.exception.BusinessException("Debe seleccionar un archivo");
        }
        String contentType = file.getContentType();
        if (contentType == null || !contentType.startsWith("image/")) {
            throw new com.hotel.apifds20261.exception.BusinessException("Solo se permiten archivos de imagen");
        }
        if (file.getSize() > 2 * 1024 * 1024) {
            throw new com.hotel.apifds20261.exception.BusinessException("La imagen no debe superar los 2MB");
        }
        try {
            byte[] bytes = file.getBytes();
            String base64 = Base64.getEncoder().encodeToString(bytes);
            String dataUri = "data:" + contentType + ";base64," + base64;
            UsuarioResponse item = usuarioBusiness.uploadAvatar(id, dataUri);
            ResponseUsuario response = new ResponseUsuario();
            response.success();
            response.getListUsuario().add(item);
            response.listMessage.add("Foto de perfil actualizada exitosamente");
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            throw new com.hotel.apifds20261.exception.BusinessException("Error al procesar la imagen");
        }
    }

    @PatchMapping("tema/{id}")
    public ResponseEntity<ResponseUsuario> actionActualizarTema(
            @PathVariable Long id, @RequestBody Map<String, String> body) {
        verificarPerfilPropio(id);
        String tema = body.get("tema");
        UsuarioResponse item = usuarioBusiness.actualizarTema(id, tema);
        ResponseUsuario response = new ResponseUsuario();
        response.success();
        response.getListUsuario().add(item);
        response.listMessage.add("Tema actualizado exitosamente");
        return ResponseEntity.ok(response);
    }

    @PatchMapping("ultimoacceso/{id}")
    public ResponseEntity<ResponseUsuario> actionUltimoAcceso(@PathVariable Long id) {
        usuarioBusiness.actualizarUltimoAcceso(id);
        ResponseUsuario response = new ResponseUsuario();
        response.success();
        return ResponseEntity.ok(response);
    }

    private void verificarPerfilPropio(Long id) {
        Long currentUserId = SecurityUtil.getCurrentUserId(jwtService);
        if (!currentUserId.equals(id)) {
            throw new AccessDeniedException("Solo puede modificar su propio perfil");
        }
    }
}

