package com.auditflow.service;

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

    private static final Set<String> ALLOWED_EXTENSIONS =
            Set.of("pdf", "doc", "docx", "xls", "xlsx", "png", "jpg", "jpeg", "zip", "csv", "txt");

    @Value("${storage.upload-dir:./uploads}")
    private String uploadDir;

    @Override
    public String store(MultipartFile file, UUID tenantId, UUID cycleId) {
        String originalFilename = file.getOriginalFilename();
        if (originalFilename == null || originalFilename.isBlank()) {
            throw new IllegalArgumentException("Nome de arquivo inválido");
        }

        int dotIndex = originalFilename.lastIndexOf('.');
        if (dotIndex < 0) {
            throw new IllegalArgumentException("Arquivo sem extensão não é permitido");
        }
        String ext = originalFilename.substring(dotIndex + 1).toLowerCase();
        if (!ALLOWED_EXTENSIONS.contains(ext)) {
            throw new IllegalArgumentException("Tipo de arquivo não permitido: " + ext);
        }

        String safeFilename = UUID.randomUUID() + "_" + originalFilename.replaceAll("[^a-zA-Z0-9._-]", "_");
        Path targetDir = Paths.get(uploadDir, tenantId.toString(), cycleId.toString());

        try {
            Files.createDirectories(targetDir);
            Path targetPath = targetDir.resolve(safeFilename);
            Files.copy(file.getInputStream(), targetPath, StandardCopyOption.REPLACE_EXISTING);
            return targetPath.toString();
        } catch (IOException e) {
            throw new RuntimeException("Falha ao salvar arquivo: " + e.getMessage(), e);
        }
    }

    @Override
    public Resource loadAsResource(String storagePath) {
        try {
            Path uploadRoot = Paths.get(uploadDir).toAbsolutePath().normalize();
            Path path = Paths.get(storagePath).toAbsolutePath().normalize();

            if (!path.startsWith(uploadRoot)) {
                throw new IllegalArgumentException("Acesso negado ao arquivo");
            }

            Resource resource = new UrlResource(path.toUri());
            if (resource.exists() && resource.isReadable()) {
                return resource;
            }
            throw new IllegalArgumentException("Arquivo não encontrado ou ilegível");
        } catch (MalformedURLException e) {
            throw new IllegalArgumentException("Caminho de arquivo inválido", e);
        }
    }
}
