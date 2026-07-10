package com.auditflow.service;

import com.auditflow.domain.entity.AuditClient;
import com.auditflow.domain.entity.AuditCycle;
import com.auditflow.domain.entity.PbcItem;
import com.auditflow.domain.entity.User;
import com.auditflow.domain.enums.CycleStatus;
import com.auditflow.domain.enums.Perfil;
import com.auditflow.domain.repository.AuditClientRepository;
import com.auditflow.domain.repository.AuditCycleRepository;
import com.auditflow.domain.repository.DocumentRepository;
import com.auditflow.domain.repository.PbcItemRepository;
import com.auditflow.domain.repository.UserRepository;
import com.auditflow.dto.request.AssignAuditorRequest;
import com.auditflow.dto.request.CreateAuditClientRequest;
import com.auditflow.dto.request.CreateClientUserRequest;
import com.auditflow.dto.request.UpdateAuditClientRequest;
import com.auditflow.dto.response.AuditClientResponse;
import com.auditflow.dto.response.ClientDocumentResponse;
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
    private final PbcItemRepository pbcItemRepository;
    private final DocumentRepository documentRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final UserService userService;
    private final AuditLogService auditLogService;
    private final PasswordTokenService passwordTokenService;

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

        User clientUser = User.builder()
                .tenantId(tenantId)
                .auditClientId(client.getId())
                .nome(request.getNomeUsuario())
                .email(request.getEmail())
                .senhaHash(passwordEncoder.encode(UUID.randomUUID().toString()))
                .perfil(Perfil.CLIENTE)
                .senhaProvisoria(true)
                .build();
        clientUser = userRepository.save(clientUser);

        auditLogService.record(tenantId, SecurityUtils.getCurrentUser().getId(), "CLIENTE_CRIADO",
                "Cliente " + client.getNomeEmpresa() + " criado", "AuditClient", client.getId());

        String link = passwordTokenService.issueActivation(clientUser,
                "Sua empresa " + client.getNomeEmpresa() + " recebeu acesso ao Portal do Cliente.");
        return toResponse(client, link);
    }

    /**
     * Lista clientes do escritório (modelo colaborativo: todos os auditores veem tudo do tenant).
     * {@code mine=true} filtra opcionalmente para os clientes atribuídos ao usuário atual.
     */
    public List<AuditClientResponse> findAll(boolean mine) {
        UUID tenantId = TenantContext.getTenantId();

        List<AuditClient> clients = mine
                ? auditClientRepository.findAllByTenantIdAndAuditorResponsavelId(
                        tenantId, SecurityUtils.getCurrentUser().getId())
                : auditClientRepository.findAllByTenantId(tenantId);

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

    /** Usuários CLIENTE (ativos) vinculados a este cliente — usados como
        responsável (dono) ao criar itens PBC. Acessível a ADMIN e AUDITOR. */
    public List<UserResponse> listClientUsers(UUID clientId) {
        UUID tenantId = TenantContext.getTenantId();
        AuditClient client = auditClientRepository.findById(clientId)
                .filter(c -> c.getTenantId().equals(tenantId))
                .orElseThrow(() -> new ResourceNotFoundException("Cliente não encontrado"));

        return userRepository.findAllByTenantIdAndAuditClientId(tenantId, client.getId())
                .stream()
                .filter(User::isAtivo)
                .filter(u -> u.getPerfil() == Perfil.CLIENTE)
                .map(userService::toResponse)
                .collect(Collectors.toList());
    }

    /** Cria um usuário CLIENTE adicional para o cliente; envia o convite de ativação por e-mail. */
    @Transactional
    public UserResponse addClientUser(UUID clientId, CreateClientUserRequest request) {
        UUID tenantId = TenantContext.getTenantId();
        AuditClient client = auditClientRepository.findById(clientId)
                .filter(c -> c.getTenantId().equals(tenantId))
                .orElseThrow(() -> new ResourceNotFoundException("Cliente não encontrado"));

        if (userRepository.findByEmail(request.getEmail()).isPresent()) {
            throw new DuplicateEmailException("E-mail já cadastrado no sistema");
        }

        User user = User.builder()
                .tenantId(tenantId)
                .auditClientId(client.getId())
                .nome(request.getNome())
                .email(request.getEmail())
                .senhaHash(passwordEncoder.encode(UUID.randomUUID().toString()))
                .perfil(Perfil.CLIENTE)
                .senhaProvisoria(true)
                .build();
        user = userRepository.save(user);

        auditLogService.record(tenantId, SecurityUtils.getCurrentUser().getId(), "USUARIO_CLIENTE_CRIADO",
                "Usuário " + user.getNome() + " adicionado ao cliente " + client.getNomeEmpresa(),
                "User", user.getId());

        String link = passwordTokenService.issueActivation(user,
                "Você recebeu acesso ao Portal do Cliente de " + client.getNomeEmpresa() + ".");
        UserResponse response = userService.toResponse(user);
        response.setLinkAtivacao(link);
        return response;
    }

    /** Todos os documentos enviados nos ciclos deste cliente, com contexto item/ciclo. */
    public List<ClientDocumentResponse> listClientDocuments(UUID clientId) {
        UUID tenantId = TenantContext.getTenantId();
        AuditClient client = auditClientRepository.findById(clientId)
                .filter(c -> c.getTenantId().equals(tenantId))
                .orElseThrow(() -> new ResourceNotFoundException("Cliente não encontrado"));

        List<ClientDocumentResponse> docs = new java.util.ArrayList<>();
        for (AuditCycle cycle : auditCycleRepository.findAllByTenantIdAndAuditClientId(tenantId, client.getId())) {
            for (PbcItem item : pbcItemRepository.findAllByCycleIdAndTenantId(cycle.getId(), tenantId)) {
                documentRepository.findAllByPbcItemIdAndTenantId(item.getId(), tenantId).forEach(doc ->
                        docs.add(ClientDocumentResponse.builder()
                                .id(doc.getId())
                                .nomeArquivo(doc.getNomeArquivo())
                                .cicloTitulo(cycle.getTitulo())
                                .itemTitulo(item.getTitulo())
                                .itemStatus(item.getStatus())
                                .enviadoEm(doc.getCriadoEm())
                                .build()));
            }
        }
        docs.sort((a, b) -> {
            if (a.getEnviadoEm() == null || b.getEnviadoEm() == null) return 0;
            return b.getEnviadoEm().compareTo(a.getEnviadoEm());
        });
        return docs;
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
                .filter(u -> u.getTenantId().equals(tenantId)
                        && (u.getPerfil() == Perfil.AUDITOR || u.getPerfil() == Perfil.ADMIN))
                .orElseThrow(() -> new IllegalArgumentException("Auditor inválido ou não pertence a este tenant"));

        client.setAuditorResponsavelId(request.getAuditorId());
        client = auditClientRepository.save(client);
        auditLogService.record(tenantId, SecurityUtils.getCurrentUser().getId(), "AUDITOR_ATRIBUIDO",
                "Auditor atribuído ao cliente " + client.getNomeEmpresa(), "AuditClient", client.getId());
        return toResponse(client, null);
    }

    private AuditClientResponse toResponse(AuditClient client, String linkAtivacao) {
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
                .linkAtivacao(linkAtivacao)
                .build();
    }
}
