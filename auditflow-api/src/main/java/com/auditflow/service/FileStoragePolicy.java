package com.auditflow.service;

import com.auditflow.exception.InvalidFileException;
import org.springframework.web.multipart.MultipartFile;

import java.util.Set;
import java.util.UUID;

/**
 * Regras de aceitação de arquivos compartilhadas por todas as implementações de
 * {@link StorageService} (local e R2): tipos permitidos, tamanho máximo e
 * saneamento do nome. Centraliza a política para não divergir entre back-ends.
 */
final class FileStoragePolicy {

    static final Set<String> ALLOWED_MIME_TYPES = Set.of(
            "application/pdf",
            "application/vnd.ms-excel",
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            "text/csv",
            "image/png",
            "image/jpeg"
    );

    static final long MAX_SIZE_BYTES = 20L * 1024 * 1024; // 20 MB

    private FileStoragePolicy() {
    }

    /**
     * Valida o arquivo (não vazio, dentro do limite, tipo permitido, nome presente)
     * e devolve um nome de arquivo seguro, prefixado por um UUID e sem caracteres perigosos.
     *
     * @throws InvalidFileException se o arquivo violar qualquer regra.
     */
    static String validateAndSafeName(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new InvalidFileException("Arquivo inválido ou vazio");
        }
        if (file.getSize() > MAX_SIZE_BYTES) {
            throw new InvalidFileException("Arquivo excede o tamanho máximo permitido de 20 MB");
        }

        String contentType = file.getContentType();
        if (contentType == null || !ALLOWED_MIME_TYPES.contains(contentType)) {
            throw new InvalidFileException(
                    "Tipo de arquivo não permitido: " + contentType +
                    ". Permitidos: PDF, XLS, XLSX, CSV, PNG, JPG");
        }

        String originalFilename = file.getOriginalFilename();
        if (originalFilename == null || originalFilename.isBlank()) {
            throw new InvalidFileException("Nome de arquivo inválido");
        }

        return UUID.randomUUID() + "_" + originalFilename.replaceAll("[^a-zA-Z0-9._-]", "_");
    }
}
