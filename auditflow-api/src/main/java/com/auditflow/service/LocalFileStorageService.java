package com.auditflow.service;

import com.auditflow.exception.FileAccessException;
import com.auditflow.exception.FileStorageException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
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

/**
 * Armazenamento em disco local. Padrão para desenvolvimento/testes.
 * ATENÇÃO: não usar em produção hospedada — o filesystem costuma ser efêmero.
 * Em produção use {@link R2FileStorageService} (storage.provider=r2).
 */
@Service
@ConditionalOnProperty(name = "storage.provider", havingValue = "local", matchIfMissing = true)
public class LocalFileStorageService implements StorageService {

    @Value("${storage.upload-dir:./uploads}")
    private String uploadDir;

    @Override
    public String store(MultipartFile file, UUID tenantId, UUID cycleId) {
        String safeFilename = FileStoragePolicy.validateAndSafeName(file);
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
