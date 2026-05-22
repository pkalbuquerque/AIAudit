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
import java.util.UUID;

@Service
public class LocalFileStorageService implements StorageService {

    @Value("${storage.upload-dir:./uploads}")
    private String uploadDir;

    @Override
    public String store(MultipartFile file, UUID tenantId, UUID cycleId) {
        String originalFilename = file.getOriginalFilename();
        if (originalFilename == null || originalFilename.isBlank()) {
            throw new IllegalArgumentException("Nome de arquivo inválido");
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
            Path path = Paths.get(storagePath);
            Resource resource = new UrlResource(path.toUri());
            if (resource.exists() && resource.isReadable()) {
                return resource;
            }
            throw new IllegalArgumentException("Arquivo não encontrado ou ilegível: " + storagePath);
        } catch (MalformedURLException e) {
            throw new IllegalArgumentException("Caminho de arquivo inválido: " + storagePath, e);
        }
    }
}
