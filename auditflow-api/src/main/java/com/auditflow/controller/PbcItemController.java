package com.auditflow.controller;

import com.auditflow.dto.request.ApproveRequest;
import com.auditflow.dto.request.CreatePbcItemRequest;
import com.auditflow.dto.request.RejectRequest;
import com.auditflow.dto.response.PbcItemResponse;
import com.auditflow.service.PbcItemService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.UUID;

@RestController
@RequiredArgsConstructor
public class PbcItemController {

    private final PbcItemService pbcItemService;

    @PostMapping("/api/pbc-items")
    @PreAuthorize("hasAuthority('ADMIN') or hasAuthority('AUDITOR')")
    public ResponseEntity<PbcItemResponse> create(@RequestParam UUID cycleId,
                                                  @Valid @RequestBody CreatePbcItemRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(pbcItemService.create(cycleId, request));
    }

    @GetMapping("/api/pbc-items")
    @PreAuthorize("hasAuthority('ADMIN') or hasAuthority('AUDITOR')")
    public ResponseEntity<List<PbcItemResponse>> findAll(@RequestParam UUID cycleId) {
        return ResponseEntity.ok(pbcItemService.findAll(cycleId));
    }

    @GetMapping("/api/pbc-items/{id}")
    public ResponseEntity<PbcItemResponse> findById(@PathVariable UUID id) {
        return ResponseEntity.ok(pbcItemService.findById(id));
    }

    @DeleteMapping("/api/pbc-items/{id}")
    @PreAuthorize("hasAuthority('ADMIN') or hasAuthority('AUDITOR')")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        pbcItemService.delete(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/api/pbc-items/{id}/submit")
    @PreAuthorize("hasAuthority('CLIENTE')")
    public ResponseEntity<PbcItemResponse> submit(@PathVariable UUID id,
                                                  @RequestParam("file") MultipartFile file) {
        return ResponseEntity.ok(pbcItemService.submit(id, file));
    }

    @PostMapping("/api/pbc-items/{id}/approve")
    @PreAuthorize("hasAuthority('ADMIN') or hasAuthority('AUDITOR')")
    public ResponseEntity<PbcItemResponse> approve(@PathVariable UUID id,
                                                   @RequestBody(required = false) ApproveRequest request) {
        return ResponseEntity.ok(pbcItemService.approve(id, request != null ? request : new ApproveRequest()));
    }

    @PostMapping("/api/pbc-items/{id}/reject")
    @PreAuthorize("hasAuthority('ADMIN') or hasAuthority('AUDITOR')")
    public ResponseEntity<PbcItemResponse> reject(@PathVariable UUID id,
                                                  @Valid @RequestBody RejectRequest request) {
        return ResponseEntity.ok(pbcItemService.reject(id, request));
    }

    // Legacy path compat
    @PostMapping("/api/cycles/{cycleId}/pbc")
    @PreAuthorize("hasAuthority('ADMIN') or hasAuthority('AUDITOR')")
    public ResponseEntity<PbcItemResponse> createLegacy(@PathVariable UUID cycleId,
                                                        @Valid @RequestBody CreatePbcItemRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(pbcItemService.create(cycleId, request));
    }

    @GetMapping("/api/cycles/{cycleId}/pbc")
    public ResponseEntity<List<PbcItemResponse>> findAllLegacy(@PathVariable UUID cycleId) {
        return ResponseEntity.ok(pbcItemService.findAll(cycleId));
    }
}
