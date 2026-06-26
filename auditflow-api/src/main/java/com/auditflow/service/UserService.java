package com.auditflow.service;

import com.auditflow.domain.entity.User;
import com.auditflow.domain.enums.Perfil;
import com.auditflow.domain.repository.UserRepository;
import com.auditflow.dto.request.CreateUserRequest;
import com.auditflow.dto.request.UserUpdateRequest;
import com.auditflow.dto.response.UserResponse;
import com.auditflow.exception.DuplicateEmailException;
import com.auditflow.exception.ForbiddenException;
import com.auditflow.exception.InvalidOperationException;
import com.auditflow.exception.ResourceNotFoundException;
import com.auditflow.security.SecurityUtils;
import com.auditflow.security.TenantContext;
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
    private final AuditLogService auditLogService;

    @Transactional
    public UserResponse invite(CreateUserRequest request) {
        UUID tenantId = TenantContext.getTenantId();

        if (request.getPerfil() == Perfil.CLIENTE) {
            throw new InvalidOperationException(
                    "Perfil CLIENTE não pode ser criado por este endpoint. Use POST /api/clients.");
        }

        if (userRepository.findByEmail(request.getEmail()).isPresent()) {
            throw new DuplicateEmailException("E-mail já cadastrado no sistema.");
        }

        String senhaGerada = UUID.randomUUID().toString().replace("-", "").substring(0, 12);

        User user = User.builder()
                .tenantId(tenantId)
                .nome(request.getNome())
                .email(request.getEmail())
                .senhaHash(passwordEncoder.encode(senhaGerada))
                .perfil(request.getPerfil() != null ? request.getPerfil() : Perfil.AUDITOR)
                .senhaProvisoria(true)
                .build();

        user = userRepository.save(user);
        auditLogService.record(tenantId, SecurityUtils.getCurrentUser().getId(), "AUDITOR_CONVIDADO",
                "Usuário " + user.getNome() + " (" + user.getPerfil() + ") convidado", "User", user.getId());
        UserResponse response = toResponse(user);
        response.setSenhaProvisoria(senhaGerada); // repassada ao convidado até o e-mail estar ativo
        return response;
    }

    public List<UserResponse> findAll() {
        UUID tenantId = TenantContext.getTenantId();
        return userRepository.findAllByTenantId(tenantId)
                .stream()
                .filter(u -> u.getPerfil() != Perfil.CLIENTE)
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    public UserResponse findById(UUID id) {
        UUID tenantId = TenantContext.getTenantId();
        User user = userRepository.findById(id)
                .filter(u -> u.getTenantId().equals(tenantId))
                .orElseThrow(() -> new ResourceNotFoundException("Usuário não encontrado"));
        return toResponse(user);
    }

    public UserResponse getCurrentUser() {
        return toResponse(SecurityUtils.getCurrentUser());
    }

    @Transactional
    public UserResponse updateProfile(com.auditflow.dto.request.UpdateProfileRequest request) {
        User user = SecurityUtils.getCurrentUser();
        user.setNome(request.getNome());
        return toResponse(userRepository.save(user));
    }

    @Transactional
    public UserResponse update(UUID id, UserUpdateRequest request) {
        UUID tenantId = TenantContext.getTenantId();
        User user = userRepository.findById(id)
                .filter(u -> u.getTenantId().equals(tenantId))
                .orElseThrow(() -> new ResourceNotFoundException("Usuário não encontrado"));

        if (request.getPerfil() == Perfil.CLIENTE) {
            throw new InvalidOperationException("Não é possível atribuir perfil CLIENTE por este endpoint.");
        }

        user.setNome(request.getNome());
        user.setPerfil(request.getPerfil());
        return toResponse(userRepository.save(user));
    }

    @Transactional
    public void deactivate(UUID id) {
        UUID tenantId = TenantContext.getTenantId();
        User currentUser = SecurityUtils.getCurrentUser();

        if (currentUser.getId().equals(id)) {
            throw new ForbiddenException("Você não pode desativar sua própria conta.");
        }

        User user = userRepository.findById(id)
                .filter(u -> u.getTenantId().equals(tenantId))
                .orElseThrow(() -> new ResourceNotFoundException("Usuário não encontrado"));

        user.setAtivo(false);
        userRepository.save(user);
    }

    public UserResponse toResponse(User user) {
        return UserResponse.builder()
                .id(user.getId())
                .tenantId(user.getTenantId())
                .nome(user.getNome())
                .email(user.getEmail())
                .perfil(user.getPerfil())
                .ativo(user.isAtivo())
                .criadoEm(user.getCriadoEm())
                .build();
    }
}
