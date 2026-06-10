package com.auditflow.controller;

import com.auditflow.domain.enums.CycleStatus;
import com.auditflow.dto.request.CreateAuditCycleRequest;
import com.auditflow.dto.request.UpdateCycleStatusRequest;
import com.auditflow.dto.response.AuditCycleResponse;
import com.auditflow.service.AuditCycleService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/cycles")
@RequiredArgsConstructor
public class AuditCycleController {

    private final AuditCycleService auditCycleService;

    @PostMapping
    @PreAuthorize("hasAuthority('ADMIN') or hasAuthority('AUDITOR')")
    public ResponseEntity<AuditCycleResponse> create(@Valid @RequestBody CreateAuditCycleRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(auditCycleService.create(request));
    }

    @GetMapping
    @PreAuthorize("hasAuthority('ADMIN') or hasAuthority('AUDITOR')")
    public ResponseEntity<List<AuditCycleResponse>> findAll(
            @RequestParam(required = false) CycleStatus status,
            @RequestParam(required = false) UUID auditClientId) {
        return ResponseEntity.ok(auditCycleService.findAll(status, auditClientId));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAuthority('ADMIN') or hasAuthority('AUDITOR')")
    public ResponseEntity<AuditCycleResponse> findById(@PathVariable UUID id) {
        return ResponseEntity.ok(auditCycleService.findById(id));
    }

    @PatchMapping("/{id}/status")
    @PreAuthorize("hasAuthority('ADMIN') or hasAuthority('AUDITOR')")
    public ResponseEntity<AuditCycleResponse> advanceStatus(@PathVariable UUID id,
                                                            @Valid @RequestBody UpdateCycleStatusRequest request) {
        return ResponseEntity.ok(auditCycleService.advanceStatus(id, request));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('ADMIN')")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        auditCycleService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
