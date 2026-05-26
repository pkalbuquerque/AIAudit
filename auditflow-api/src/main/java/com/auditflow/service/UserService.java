package com.auditflow.service;

import com.auditflow.domain.entity.User;
import com.auditflow.domain.enums.Perfil;
import com.auditflow.domain.repository.UserRepository;
import com.auditflow.dto.request.CreateUserRequest;
import com.auditflow.dto.response.UserResponse;
import com.auditflow.security.TenantContext;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Transactional
    public UserResponse create(CreateUserRequest request) {
        UUID tenantId = TenantContext.getTenantId();

        if (request.getPerfil() == Perfil.CLIENTE) {
            throw new IllegalArgumentException(
                    "Perfil CLIENTE não pode ser criado por este endpoint. Use POST /api/clients.");
        }

        if (userRepository.findByEmail(request.getEmail()).isPresent()) {
            throw new IllegalArgumentException("E-mail já cadastrado no sistema.");
        }

        User user = User.builder()
                .tenantId(tenantId)
                .nome(request.getNome())
                .email(request.getEmail())
                .senhaHash(passwordEncoder.encode(request.getSenha()))
                .perfil(request.getPerfil())
                .build();

        user = userRepository.save(user);
        return toResponse(user);
    }

    public List<UserResponse> findAll() {
        UUID tenantId = TenantContext.getTenantId();
        return userRepository.findAllByTenantId(tenantId)
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    public UserResponse findById(UUID id) {
        UUID tenantId = TenantContext.getTenantId();
        User user = userRepository.findById(id)
                .filter(u -> u.getTenantId().equals(tenantId))
                .orElseThrow(() -> new EntityNotFoundException("Usuário não encontrado"));
        return toResponse(user);
    }

    private UserResponse toResponse(User user) {
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
