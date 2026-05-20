package com.auditflow.service;

import com.auditflow.domain.entity.Tenant;
import com.auditflow.domain.entity.User;
import com.auditflow.domain.enums.Perfil;
import com.auditflow.domain.repository.TenantRepository;
import com.auditflow.domain.repository.UserRepository;
import com.auditflow.dto.request.LoginRequest;
import com.auditflow.dto.request.RegisterRequest;
import com.auditflow.dto.response.AuthResponse;
import com.auditflow.dto.response.UserResponse;
import com.auditflow.security.JwtService;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final TenantRepository tenantRepository;
    private final UserRepository userRepository;
    private final JwtService jwtService;
    private final PasswordEncoder passwordEncoder;

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        Tenant tenant = Tenant.builder()
                .nome(request.getNomeEscritorio())
                .emailContato(request.getEmailContato())
                .build();
        tenant = tenantRepository.save(tenant);

        User admin = User.builder()
                .tenantId(tenant.getId())
                .nome(request.getNomeAdmin())
                .email(request.getEmail())
                .senhaHash(passwordEncoder.encode(request.getSenha()))
                .perfil(Perfil.ADMIN)
                .build();
        admin = userRepository.save(admin);

        String token = jwtService.generateToken(
                admin.getEmail(),
                admin.getTenantId(),
                admin.getPerfil().name(),
                admin.getId()
        );

        return AuthResponse.builder()
                .token(token)
                .usuario(toUserResponse(admin))
                .build();
    }

    public AuthResponse login(LoginRequest request) {
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new EntityNotFoundException("Usuário não encontrado"));

        if (!passwordEncoder.matches(request.getSenha(), user.getSenhaHash())) {
            throw new RuntimeException("Credenciais inválidas");
        }

        String token = jwtService.generateToken(
                user.getEmail(),
                user.getTenantId(),
                user.getPerfil().name(),
                user.getId()
        );

        return AuthResponse.builder()
                .token(token)
                .usuario(toUserResponse(user))
                .build();
    }

    private UserResponse toUserResponse(User user) {
        return UserResponse.builder()
                .id(user.getId())
                .tenantId(user.getTenantId())
                .nome(user.getNome())
                .email(user.getEmail())
                .perfil(user.getPerfil())
                .criadoEm(user.getCriadoEm())
                .build();
    }
}
