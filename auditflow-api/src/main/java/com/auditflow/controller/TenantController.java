package com.auditflow.controller;

import com.auditflow.dto.request.UpdateTenantRequest;
import com.auditflow.dto.response.TenantResponse;
import com.auditflow.service.TenantService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/tenant")
@RequiredArgsConstructor
public class TenantController {

    private final TenantService tenantService;

    @GetMapping
    @PreAuthorize("hasAuthority('ADMIN') or hasAuthority('AUDITOR')")
    public ResponseEntity<TenantResponse> current() {
        return ResponseEntity.ok(tenantService.getCurrent());
    }

    @PatchMapping
    @PreAuthorize("hasAuthority('ADMIN')")
    public ResponseEntity<TenantResponse> update(@Valid @RequestBody UpdateTenantRequest request) {
        return ResponseEntity.ok(tenantService.update(request));
    }
}
