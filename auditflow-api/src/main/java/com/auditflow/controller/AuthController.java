package com.auditflow.controller;

import com.auditflow.dto.request.ChangePasswordRequest;
import com.auditflow.dto.request.ForgotPasswordRequest;
import com.auditflow.dto.request.LoginRequest;
import com.auditflow.dto.request.RegisterRequest;
import com.auditflow.dto.request.ResetPasswordRequest;
import com.auditflow.dto.response.AuthResponse;
import com.auditflow.dto.response.TokenInfoResponse;
import com.auditflow.service.AuthService;
import com.auditflow.service.PasswordTokenService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;
    private final PasswordTokenService passwordTokenService;

    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@RequestBody @Valid RegisterRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(authService.register(request));
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@RequestBody @Valid LoginRequest request) {
        return ResponseEntity.ok(authService.login(request));
    }

    @PostMapping("/change-password")
    public ResponseEntity<Void> changePassword(@RequestBody @Valid ChangePasswordRequest request) {
        authService.changePassword(request);
        return ResponseEntity.noContent().build();
    }

    /** "Esqueci minha senha": sempre responde 200 (não revela se o e-mail existe). */
    @PostMapping("/forgot-password")
    public ResponseEntity<Void> forgotPassword(@RequestBody @Valid ForgotPasswordRequest request) {
        passwordTokenService.issueReset(request.getEmail());
        return ResponseEntity.ok().build();
    }

    /** Contexto de um token de ativação/redefinição — usado pela tela de definir senha. */
    @GetMapping("/token-info")
    public ResponseEntity<TokenInfoResponse> tokenInfo(@RequestParam("token") String token) {
        return ResponseEntity.ok(passwordTokenService.tokenInfo(token));
    }

    /** Define a senha a partir de um token de ativação (convite) ou de redefinição. */
    @PostMapping("/reset-password")
    public ResponseEntity<Void> resetPassword(@RequestBody @Valid ResetPasswordRequest request) {
        passwordTokenService.redefinir(request.getToken(), request.getNovaSenha());
        return ResponseEntity.noContent().build();
    }
}
