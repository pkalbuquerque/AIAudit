package com.auditflow.exception;

import jakarta.persistence.EntityNotFoundException;
import com.auditflow.exception.DuplicateEmailException;
import com.auditflow.exception.FileAccessException;
import com.auditflow.exception.FileStorageException;
import com.auditflow.exception.InvalidFileException;
import com.auditflow.exception.InvalidOperationException;
import com.auditflow.exception.JwtAuthException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.multipart.MaxUploadSizeExceededException;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

@Slf4j
@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(UnauthorizedException.class)
    public ResponseEntity<ErrorResponse> handleUnauthorized(UnauthorizedException ex) {
        log.warn("[401] Autenticação falhou: {}", ex.getMessage());
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(error(401, ex.getMessage()));
    }

    @ExceptionHandler({EntityNotFoundException.class, ResourceNotFoundException.class})
    public ResponseEntity<ErrorResponse> handleNotFound(RuntimeException ex) {
        log.warn("[404] Recurso não encontrado: {}", ex.getMessage());
        return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(error(404, ex.getMessage()));
    }

    @ExceptionHandler({AccessDeniedException.class, ForbiddenException.class})
    public ResponseEntity<ErrorResponse> handleAccessDenied(RuntimeException ex) {
        log.warn("[403] Acesso negado: {}", ex.getMessage());
        return ResponseEntity.status(HttpStatus.FORBIDDEN)
                .body(error(403, ex.getMessage()));
    }

    @ExceptionHandler({
            InvalidStatusTransitionException.class,
            InvalidOperationException.class,
            DuplicateCnpjException.class,
            DuplicateEmailException.class,
            InvalidFileException.class
    })
    public ResponseEntity<ErrorResponse> handleBadRequest(RuntimeException ex) {
        log.warn("[400] Requisição inválida: {}", ex.getMessage());
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(error(400, ex.getMessage()));
    }

    @ExceptionHandler(FileAccessException.class)
    public ResponseEntity<ErrorResponse> handleFileAccess(FileAccessException ex) {
        log.warn("[403] Acesso a arquivo negado: {}", ex.getMessage());
        return ResponseEntity.status(HttpStatus.FORBIDDEN)
                .body(error(403, ex.getMessage()));
    }

    @ExceptionHandler(FileStorageException.class)
    public ResponseEntity<ErrorResponse> handleFileStorage(FileStorageException ex) {
        log.error("[500] Falha ao armazenar arquivo: {}", ex.getMessage(), ex);
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(error(500, ex.getMessage()));
    }

    @ExceptionHandler(JwtAuthException.class)
    public ResponseEntity<ErrorResponse> handleJwtAuth(JwtAuthException ex) {
        log.warn("[401] JWT inválido: {}", ex.getMessage());
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(error(401, ex.getMessage()));
    }

    @ExceptionHandler(MaxUploadSizeExceededException.class)
    public ResponseEntity<ErrorResponse> handleMaxUploadSize(MaxUploadSizeExceededException ex) {
        log.warn("[400] Arquivo excede tamanho máximo permitido");
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(error(400, "Arquivo excede o tamanho máximo permitido de 20 MB"));
    }

    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<ErrorResponse> handleNotReadable(HttpMessageNotReadableException ex) {
        log.warn("[400] Corpo da requisição inválido: {}", ex.getMessage());
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(error(400, "Corpo da requisição inválido ou mal formatado"));
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, String>> handleValidation(MethodArgumentNotValidException ex) {
        Map<String, String> errors = new HashMap<>();
        ex.getBindingResult().getAllErrors().forEach(e -> {
            String field = ((FieldError) e).getField();
            errors.put(field, e.getDefaultMessage());
        });
        log.warn("[400] Validação falhou: {}", errors);
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(errors);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponse> handleGeneric(Exception ex) {
        log.error("[500] Erro interno não tratado: {}", ex.getMessage(), ex);
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(error(500, "Erro interno do servidor"));
    }

    private ErrorResponse error(int status, String message) {
        return ErrorResponse.builder()
                .status(status)
                .erro(message)
                .timestamp(LocalDateTime.now())
                .build();
    }
}
