package com.auditflow.service;

import org.springframework.core.io.Resource;
import org.springframework.web.multipart.MultipartFile;

import java.util.UUID;

public interface StorageService {

    String store(MultipartFile file, UUID tenantId, UUID cycleId);

    Resource loadAsResource(String storagePath);
}
