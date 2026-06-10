package com.auditflow.service;

import com.auditflow.exception.FileAccessException;
import com.auditflow.exception.FileStorageException;
import com.auditflow.exception.InvalidFileException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.net.MalformedURLException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.Set;
import java.util.UUID;

@Service
public class LocalFileStorageService implements StorageService {

    private static final Set<String> ALLOWED_MIME_TYPES = Set.of(
            "application/pdf",
            "application/vnd.ms-excel",
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            "text/csv",
            "image/png",
            "image/jpeg"
    );

    private static final long MAX_SIZE_BYTES = 20L * 1024 * 1024; // 20 MB

    @Value("${storage.upload-dir:./uploads}")
    private String uploadDir;

    @Override
    public String store(MultipartFile file, UUID tenantId, UUID cycleId) {
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

        String safeFilename = UUID.randomUUID() + "_" + originalFilename.replaceAll("[^a-zA-Z0-9._-]", "_");
        Path targetDir = Paths.get(uploadDir, tenantId.toString(), cycleId.toString());

        try {
            Files.createDirectories(targetDir);
            Path targetPath = targetDir.resolve(safeFilename);
            Files.copy(file.getInputStream(), targetPath, StandardCopyOption.REPLACE_EXISTING);
            return targetPath.toString();
        } catch (IOException e) {
            throw new FileStorageException("Falha ao salvar arquivo: " + e.getMessage(), e);
        }
    }

    @Override
    public Resource loadAsResource(String storagePath) {
        try {
            Path uploadRoot = Paths.get(uploadDir).toAbsolutePath().normalize();
            Path path = Paths.get(storagePath).toAbsolutePath().normalize();

            if (!path.startsWith(uploadRoot)) {
                throw new FileAccessException("Acesso negado ao arquivo");
            }

            Resource resource = new UrlResource(path.toUri());
            if (resource.exists() && resource.isReadable()) {
                return resource;
            }
            throw new FileAccessException("Arquivo não encontrado ou ilegível");
        } catch (MalformedURLException e) {
            throw new FileAccessException("Caminho de arquivo inválido", e);
        }
    }
}
