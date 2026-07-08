package com.auditflow.controller;

import com.auditflow.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;

    /** Envia um e-mail de teste para o endereço informado (somente ADMIN). */
    @PostMapping("/test")
    @PreAuthorize("hasAuthority('ADMIN')")
    public ResponseEntity<Map<String, String>> test(@RequestParam String to) {
        String resultado = notificationService.sendTest(to);
        return ResponseEntity.ok(Map.of("resultado", resultado));
    }
}
