package com.auditflow.controller;

import com.auditflow.dto.response.DocumentResponse;
import com.auditflow.dto.response.PbcItemResponse;
import com.auditflow.service.DocumentService;
import com.auditflow.service.PbcItemService;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.UUID;

@RestController
@RequiredArgsConstructor
public class DocumentController {

    private final DocumentService documentService;
    private final PbcItemService pbcItemService;

    // CLIENTE submits a document — triggers status transition to EM_REVISAO
    @PostMapping("/api/pbc/{pbcItemId}/documents")
    @PreAuthorize("hasAuthority('CLIENTE')")
    public ResponseEntity<PbcItemResponse> upload(@PathVariable UUID pbcItemId,
                                                  @RequestParam("file") MultipartFile file) {
        return ResponseEntity.status(HttpStatus.CREATED).body(pbcItemService.submit(pbcItemId, file));
    }

    @GetMapping("/api/pbc/{pbcItemId}/documents")
    public ResponseEntity<List<DocumentResponse>> findAll(@PathVariable UUID pbcItemId) {
        return ResponseEntity.ok(documentService.findAll(pbcItemId));
    }

    @GetMapping("/api/documents/{id}/download")
    public ResponseEntity<Resource> download(@PathVariable UUID id) {
        Resource resource = documentService.download(id);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        "attachment; filename=\"" + resource.getFilename() + "\"")
                .contentType(MediaType.APPLICATION_OCTET_STREAM)
                .body(resource);
    }
}
