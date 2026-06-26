package com.auditflow.controller;

import com.auditflow.dto.response.AuditorLoadResponse;
import com.auditflow.dto.response.DashboardResponse;
import com.auditflow.service.DashboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/dashboard")
@PreAuthorize("hasAuthority('ADMIN') or hasAuthority('AUDITOR')")
@RequiredArgsConstructor
public class DashboardController {

    private final DashboardService dashboardService;

    @GetMapping
    public ResponseEntity<DashboardResponse> getDashboard() {
        return ResponseEntity.ok(dashboardService.getDashboard());
    }

    @GetMapping("/auditor-load")
    @PreAuthorize("hasAuthority('ADMIN')")
    public ResponseEntity<List<AuditorLoadResponse>> auditorLoad() {
        return ResponseEntity.ok(dashboardService.getAuditorLoad());
    }
}
