package com.auditflow.controller;

import com.auditflow.domain.entity.User;
import com.auditflow.domain.enums.Perfil;
import com.auditflow.domain.repository.PbcItemRepository;
import com.auditflow.dto.response.PbcItemResponse;
import com.auditflow.exception.ForbiddenException;
import com.auditflow.security.SecurityUtils;
import com.auditflow.security.TenantContext;
import com.auditflow.service.PbcItemService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/portal")
@PreAuthorize("hasAuthority('CLIENTE')")
@RequiredArgsConstructor
public class PortalController {

    private final PbcItemService pbcItemService;
    private final PbcItemRepository pbcItemRepository;

    @GetMapping("/items")
    public ResponseEntity<List<PbcItemResponse>> listMyItems(@RequestParam(required = false) UUID cycleId) {
        UUID tenantId = TenantContext.getTenantId();
        User currentUser = SecurityUtils.getCurrentUser();

        List<PbcItemResponse> items;
        if (cycleId != null) {
            items = pbcItemService.findAll(cycleId).stream()
                    .filter(i -> i.getResponsavelId().equals(currentUser.getId()))
                    .collect(Collectors.toList());
        } else {
            items = pbcItemRepository.findAllByResponsavelIdAndTenantId(currentUser.getId(), tenantId)
                    .stream()
                    .map(item -> pbcItemService.findById(item.getId()))
                    .collect(Collectors.toList());
        }

        return ResponseEntity.ok(items);
    }

    @GetMapping("/items/{id}")
    public ResponseEntity<PbcItemResponse> getItem(@PathVariable UUID id) {
        PbcItemResponse item = pbcItemService.findById(id);
        User currentUser = SecurityUtils.getCurrentUser();

        if (!item.getResponsavelId().equals(currentUser.getId())) {
            throw new ForbiddenException("Acesso negado a este item.");
        }

        return ResponseEntity.ok(item);
    }

    @PostMapping("/items/{id}/submit")
    public ResponseEntity<PbcItemResponse> submit(@PathVariable UUID id,
                                                  @RequestParam("file") MultipartFile file) {
        return ResponseEntity.ok(pbcItemService.submit(id, file));
    }
}
