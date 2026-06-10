package com.auditflow.controller;

import com.auditflow.dto.request.AssignAuditorRequest;
import com.auditflow.dto.request.CreateAuditClientRequest;
import com.auditflow.dto.request.UpdateAuditClientRequest;
import com.auditflow.dto.response.AuditClientResponse;
import com.auditflow.service.AuditClientService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/clients")
@RequiredArgsConstructor
public class AuditClientController {

    private final AuditClientService auditClientService;

    @PostMapping
    @PreAuthorize("hasAuthority('ADMIN')")
    public ResponseEntity<AuditClientResponse> create(@Valid @RequestBody CreateAuditClientRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(auditClientService.create(request));
    }

    @GetMapping
    @PreAuthorize("hasAuthority('ADMIN') or hasAuthority('AUDITOR')")
    public ResponseEntity<List<AuditClientResponse>> findAll() {
        return ResponseEntity.ok(auditClientService.findAll());
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAuthority('ADMIN') or hasAuthority('AUDITOR')")
    public ResponseEntity<AuditClientResponse> findById(@PathVariable UUID id) {
        return ResponseEntity.ok(auditClientService.findById(id));
    }

    @PatchMapping("/{id}")
    @PreAuthorize("hasAuthority('ADMIN')")
    public ResponseEntity<AuditClientResponse> update(@PathVariable UUID id,
                                                      @Valid @RequestBody UpdateAuditClientRequest request) {
        return ResponseEntity.ok(auditClientService.update(id, request));
    }

    @PostMapping("/{id}/assign")
    @PreAuthorize("hasAuthority('ADMIN')")
    public ResponseEntity<AuditClientResponse> assignAuditor(@PathVariable UUID id,
                                                             @Valid @RequestBody AssignAuditorRequest request) {
        return ResponseEntity.ok(auditClientService.assignAuditor(id, request));
    }
}
