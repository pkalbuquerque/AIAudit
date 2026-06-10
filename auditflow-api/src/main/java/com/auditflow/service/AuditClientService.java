package com.auditflow.service;

import com.auditflow.domain.entity.AuditClient;
import com.auditflow.domain.entity.User;
import com.auditflow.domain.enums.CycleStatus;
import com.auditflow.domain.enums.Perfil;
import com.auditflow.domain.repository.AuditClientRepository;
import com.auditflow.domain.repository.AuditCycleRepository;
import com.auditflow.domain.repository.UserRepository;
import com.auditflow.dto.request.AssignAuditorRequest;
import com.auditflow.dto.request.CreateAuditClientRequest;
import com.auditflow.dto.request.UpdateAuditClientRequest;
import com.auditflow.dto.response.AuditClientResponse;
import com.auditflow.dto.response.UserResponse;
import com.auditflow.exception.DuplicateCnpjException;
import com.auditflow.exception.DuplicateEmailException;
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
public class AuditClientService {

    private final AuditClientRepository auditClientRepository;
    private final AuditCycleRepository auditCycleRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final UserService userService;

    @Transactional
    public AuditClientResponse create(CreateAuditClientRequest request) {
        UUID tenantId = TenantContext.getTenantId();

        if (auditClientRepository.findByCnpjAndTenantId(request.getCnpj(), tenantId).isPresent()) {
            throw new DuplicateCnpjException("CNPJ já cadastrado para este tenant");
        }

        if (userRepository.findByEmail(request.getEmail()).isPresent()) {
            throw new DuplicateEmailException("E-mail já cadastrado no sistema");
        }

        AuditClient client = AuditClient.builder()
                .tenantId(tenantId)
                .nomeEmpresa(request.getNomeEmpresa())
                .cnpj(request.getCnpj())
                .segmento(request.getSegmento())
                .site(request.getSite())
                .endereco(request.getEndereco())
                .build();
        client = auditClientRepository.save(client);

        String senhaGerada = UUID.randomUUID().toString().replace("-", "").substring(0, 10);

        User clientUser = User.builder()
                .tenantId(tenantId)
                .auditClientId(client.getId())
                .nome(request.getNomeUsuario())
                .email(request.getEmail())
                .senhaHash(passwordEncoder.encode(senhaGerada))
                .perfil(Perfil.CLIENTE)
                .senhaProvisoria(true)
                .build();
        userRepository.save(clientUser);

        return toResponse(client, senhaGerada);
    }

    public List<AuditClientResponse> findAll() {
        UUID tenantId = TenantContext.getTenantId();
        User currentUser = SecurityUtils.getCurrentUser();

        List<AuditClient> clients;
        if (currentUser.getPerfil() == Perfil.AUDITOR) {
            clients = auditClientRepository.findAllByTenantIdAndAuditorResponsavelId(tenantId, currentUser.getId());
        } else {
            clients = auditClientRepository.findAllByTenantId(tenantId);
        }

        return clients.stream()
                .map(c -> toResponse(c, null))
                .collect(Collectors.toList());
    }

    public AuditClientResponse findById(UUID id) {
        UUID tenantId = TenantContext.getTenantId();
        AuditClient client = auditClientRepository.findById(id)
                .filter(c -> c.getTenantId().equals(tenantId))
                .orElseThrow(() -> new ResourceNotFoundException("Cliente não encontrado"));
        return toResponse(client, null);
    }

    @Transactional
    public AuditClientResponse update(UUID id, UpdateAuditClientRequest request) {
        UUID tenantId = TenantContext.getTenantId();
        AuditClient client = auditClientRepository.findById(id)
                .filter(c -> c.getTenantId().equals(tenantId))
                .orElseThrow(() -> new ResourceNotFoundException("Cliente não encontrado"));

        if (!client.getCnpj().equals(request.getCnpj())) {
            auditClientRepository.findByCnpjAndTenantId(request.getCnpj(), tenantId)
                    .ifPresent(existing -> {
                        throw new DuplicateCnpjException("CNPJ já cadastrado para este tenant");
                    });
        }

        client.setNomeEmpresa(request.getNomeEmpresa());
        client.setCnpj(request.getCnpj());
        client.setSegmento(request.getSegmento());
        client.setSite(request.getSite());
        client.setEmailContato(request.getEmailContato());
        client.setEndereco(request.getEndereco());
        client = auditClientRepository.save(client);
        return toResponse(client, null);
    }

    @Transactional
    public AuditClientResponse assignAuditor(UUID id, AssignAuditorRequest request) {
        UUID tenantId = TenantContext.getTenantId();
        AuditClient client = auditClientRepository.findById(id)
                .filter(c -> c.getTenantId().equals(tenantId))
                .orElseThrow(() -> new ResourceNotFoundException("Cliente não encontrado"));

        userRepository.findById(request.getAuditorId())
                .filter(u -> u.getTenantId().equals(tenantId) && u.getPerfil() == Perfil.AUDITOR)
                .orElseThrow(() -> new IllegalArgumentException("Auditor inválido ou não pertence a este tenant"));

        client.setAuditorResponsavelId(request.getAuditorId());
        client = auditClientRepository.save(client);
        return toResponse(client, null);
    }

    private AuditClientResponse toResponse(AuditClient client, String senhaProvisoria) {
        UserResponse auditorResp = null;
        if (client.getAuditorResponsavelId() != null) {
            auditorResp = userRepository.findById(client.getAuditorResponsavelId())
                    .map(userService::toResponse)
                    .orElse(null);
        }

        long totalCiclos = auditCycleRepository.findAllByTenantIdAndAuditClientId(
                client.getTenantId(), client.getId()).size();
        long ciclosAtivos = auditCycleRepository.findAllByTenantIdAndAuditClientIdAndStatus(
                client.getTenantId(), client.getId(), CycleStatus.EM_ANDAMENTO).size();

        return AuditClientResponse.builder()
                .id(client.getId())
                .tenantId(client.getTenantId())
                .nomeEmpresa(client.getNomeEmpresa())
                .cnpj(client.getCnpj())
                .segmento(client.getSegmento())
                .site(client.getSite())
                .emailContato(client.getEmailContato())
                .endereco(client.getEndereco())
                .ativo(client.isAtivo())
                .auditorResponsavel(auditorResp)
                .totalCiclos(totalCiclos)
                .ciclosAtivos(ciclosAtivos)
                .criadoEm(client.getCriadoEm())
                .senhaProvisoria(senhaProvisoria)
                .build();
    }
}
