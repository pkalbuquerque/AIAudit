package com.auditflow.controller;

import com.auditflow.dto.request.CreatePbcItemRequest;
import com.auditflow.dto.request.UpdatePbcItemStatusRequest;
import com.auditflow.dto.response.PbcItemResponse;
import com.auditflow.service.PbcItemService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequiredArgsConstructor
public class PbcItemController {

    private final PbcItemService pbcItemService;

    @PostMapping("/api/cycles/{cycleId}/pbc")
    @PreAuthorize("hasAuthority('ADMIN') or hasAuthority('AUDITOR')")
    public ResponseEntity<PbcItemResponse> create(@PathVariable UUID cycleId,
                                                  @Valid @RequestBody CreatePbcItemRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(pbcItemService.create(cycleId, request));
    }

    @GetMapping("/api/cycles/{cycleId}/pbc")
    public ResponseEntity<List<PbcItemResponse>> findAll(@PathVariable UUID cycleId) {
        return ResponseEntity.ok(pbcItemService.findAll(cycleId));
    }

    @GetMapping("/api/pbc/{id}")
    public ResponseEntity<PbcItemResponse> findById(@PathVariable UUID id) {
        return ResponseEntity.ok(pbcItemService.findById(id));
    }

    @PatchMapping("/api/pbc/{id}/status")
    public ResponseEntity<PbcItemResponse> updateStatus(@PathVariable UUID id,
                                                        @Valid @RequestBody UpdatePbcItemStatusRequest request) {
        return ResponseEntity.ok(pbcItemService.updateStatus(id, request));
    }
}
