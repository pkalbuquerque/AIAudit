package com.auditflow.service;

import com.auditflow.domain.entity.AuditClient;
import com.auditflow.domain.entity.User;
import com.auditflow.domain.enums.Perfil;
import com.auditflow.domain.repository.AuditClientRepository;
import com.auditflow.domain.repository.UserRepository;
import com.auditflow.dto.request.CreateAuditClientRequest;
import com.auditflow.dto.request.UpdateAuditClientRequest;
import com.auditflow.dto.response.AuditClientResponse;
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
public class AuditClientService {

    private final AuditClientRepository auditClientRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Transactional
    public AuditClientResponse create(CreateAuditClientRequest request) {
        UUID tenantId = TenantContext.getTenantId();

        if (auditClientRepository.findByCnpjAndTenantId(request.getCnpj(), tenantId).isPresent()) {
            throw new IllegalArgumentException("CNPJ já cadastrado para este tenant");
        }

        if (userRepository.findByEmail(request.getEmail()).isPresent()) {
            throw new IllegalArgumentException("E-mail já cadastrado no sistema");
        }

        AuditClient client = AuditClient.builder()
                .tenantId(tenantId)
                .nomeEmpresa(request.getNomeEmpresa())
                .cnpj(request.getCnpj())
                .build();
        client = auditClientRepository.save(client);

        String senhaProvisoria = UUID.randomUUID().toString().replace("-", "").substring(0, 10);

        User clientUser = User.builder()
                .tenantId(tenantId)
                .auditClientId(client.getId())
                .nome(request.getNomeUsuario())
                .email(request.getEmail())
                .senhaHash(passwordEncoder.encode(senhaProvisoria))
                .perfil(Perfil.CLIENTE)
                .build();
        userRepository.save(clientUser);

        return toResponse(client, senhaProvisoria);
    }

    public List<AuditClientResponse> findAll() {
        UUID tenantId = TenantContext.getTenantId();
        return auditClientRepository.findAllByTenantId(tenantId)
                .stream()
                .map(c -> toResponse(c, null))
                .collect(Collectors.toList());
    }

    public AuditClientResponse findById(UUID id) {
        UUID tenantId = TenantContext.getTenantId();
        AuditClient client = auditClientRepository.findById(id)
                .filter(c -> c.getTenantId().equals(tenantId))
                .orElseThrow(() -> new EntityNotFoundException("Cliente não encontrado"));
        return toResponse(client, null);
    }

    @Transactional
    public AuditClientResponse update(UUID id, UpdateAuditClientRequest request) {
        UUID tenantId = TenantContext.getTenantId();
        AuditClient client = auditClientRepository.findById(id)
                .filter(c -> c.getTenantId().equals(tenantId))
                .orElseThrow(() -> new EntityNotFoundException("Cliente não encontrado"));

        if (!client.getCnpj().equals(request.getCnpj())) {
            auditClientRepository.findByCnpjAndTenantId(request.getCnpj(), tenantId)
                    .ifPresent(existing -> {
                        throw new IllegalArgumentException("CNPJ já cadastrado para este tenant");
                    });
        }

        client.setNomeEmpresa(request.getNomeEmpresa());
        client.setCnpj(request.getCnpj());
        client = auditClientRepository.save(client);
        return toResponse(client, null);
    }

    private AuditClientResponse toResponse(AuditClient client, String senhaProvisoria) {
        return AuditClientResponse.builder()
                .id(client.getId())
                .tenantId(client.getTenantId())
                .nomeEmpresa(client.getNomeEmpresa())
                .cnpj(client.getCnpj())
                .criadoEm(client.getCriadoEm())
                .senhaProvisoria(senhaProvisoria)
                .build();
    }
}
