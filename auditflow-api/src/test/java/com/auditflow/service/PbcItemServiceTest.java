package com.auditflow.service;

import com.auditflow.domain.entity.AuditCycle;
import com.auditflow.domain.entity.Document;
import com.auditflow.domain.entity.PbcItem;
import com.auditflow.domain.entity.User;
import com.auditflow.domain.enums.CycleStatus;
import com.auditflow.domain.enums.PbcItemStatus;
import com.auditflow.domain.enums.Perfil;
import com.auditflow.domain.repository.AuditCycleRepository;
import com.auditflow.domain.repository.AuditLogRepository;
import com.auditflow.domain.repository.DocumentRepository;
import com.auditflow.domain.repository.PbcItemRepository;
import com.auditflow.domain.repository.UserRepository;
import com.auditflow.dto.request.ApproveRequest;
import com.auditflow.dto.request.RejectRequest;
import com.auditflow.exception.ForbiddenException;
import com.auditflow.exception.InvalidOperationException;
import com.auditflow.exception.InvalidStatusTransitionException;
import com.auditflow.exception.ResourceNotFoundException;
import com.auditflow.security.TenantContext;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * Regras críticas do fluxo PBC: máquina de status, segregação de funções
 * (quem envia não aprova/rejeita), posse do CLIENTE e isolamento de tenant.
 */
@ExtendWith(MockitoExtension.class)
class PbcItemServiceTest {

    @Mock private PbcItemRepository pbcItemRepository;
    @Mock private AuditCycleRepository auditCycleRepository;
    @Mock private UserRepository userRepository;
    @Mock private DocumentRepository documentRepository;
    @Mock private AuditLogRepository auditLogRepository;
    @Mock private StorageService storageService;
    @Mock private NotificationService notificationService;

    private PbcItemService service;

    private final UUID tenantId = UUID.randomUUID();
    private final UUID outroTenantId = UUID.randomUUID();
    private final UUID cycleId = UUID.randomUUID();
    private final UUID itemId = UUID.randomUUID();

    private User auditor;
    private User cliente;
    private PbcItem item;
    private AuditCycle cicloEmAndamento;

    @BeforeEach
    void setUp() {
        service = new PbcItemService(pbcItemRepository, auditCycleRepository, userRepository,
                documentRepository, auditLogRepository, storageService, notificationService);

        auditor = User.builder().id(UUID.randomUUID()).tenantId(tenantId)
                .nome("Auditor").email("a@t.io").senhaHash("x").perfil(Perfil.AUDITOR).ativo(true).build();
        cliente = User.builder().id(UUID.randomUUID()).tenantId(tenantId)
                .nome("Cliente").email("c@t.io").senhaHash("x").perfil(Perfil.CLIENTE).ativo(true).build();

        item = PbcItem.builder().id(itemId).tenantId(tenantId).cycleId(cycleId)
                .responsavelId(cliente.getId()).titulo("Balancete").status(PbcItemStatus.PENDENTE).build();

        cicloEmAndamento = AuditCycle.builder().id(cycleId).tenantId(tenantId)
                .auditClientId(UUID.randomUUID()).auditorId(auditor.getId())
                .titulo("Ciclo").status(CycleStatus.EM_ANDAMENTO).build();

        // Stubs comuns (lenient: nem todo teste passa por todos os caminhos)
        lenient().when(pbcItemRepository.findById(itemId)).thenReturn(Optional.of(item));
        lenient().when(auditCycleRepository.findById(cycleId)).thenReturn(Optional.of(cicloEmAndamento));
        lenient().when(pbcItemRepository.save(any(PbcItem.class))).thenAnswer(inv -> inv.getArgument(0));
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
        TenantContext.clear();
    }

    private void loginAs(User user) {
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(user, null, user.getAuthorities()));
        TenantContext.setTenantId(user.getTenantId());
    }

    private MockMultipartFile pdf() {
        return new MockMultipartFile("file", "doc.pdf", "application/pdf", "%PDF-1.4".getBytes());
    }

    private Document docEnviadoPor(UUID userId) {
        return Document.builder().id(UUID.randomUUID()).tenantId(tenantId).pbcItemId(itemId)
                .enviadoPor(userId).storagePath("p").nomeArquivo("doc.pdf").build();
    }

    // ---------- máquina de status: submit ----------

    @Test
    void submitDePendenteVaiParaEmRevisao() {
        loginAs(cliente);
        when(storageService.store(any(), any(), any())).thenReturn("t/c/doc.pdf");

        var resp = service.submit(itemId, pdf());

        assertThat(resp.getStatus()).isEqualTo(PbcItemStatus.EM_REVISAO);
        verify(documentRepository).save(any(Document.class));
    }

    @Test
    void submitDeRejeitadoEhPermitido() {
        item.setStatus(PbcItemStatus.REJEITADO);
        loginAs(cliente);
        when(storageService.store(any(), any(), any())).thenReturn("t/c/doc.pdf");

        var resp = service.submit(itemId, pdf());

        assertThat(resp.getStatus()).isEqualTo(PbcItemStatus.EM_REVISAO);
    }

    @Test
    void submitDeAprovadoOuEmRevisaoEhTransicaoInvalida() {
        loginAs(cliente);
        for (PbcItemStatus invalido : List.of(PbcItemStatus.APROVADO, PbcItemStatus.EM_REVISAO)) {
            item.setStatus(invalido);
            assertThatThrownBy(() -> service.submit(itemId, pdf()))
                    .isInstanceOf(InvalidStatusTransitionException.class);
        }
    }

    @Test
    void clienteNaoSubmeteItemDeOutroCliente() {
        User outroCliente = User.builder().id(UUID.randomUUID()).tenantId(tenantId)
                .nome("Outro").email("o@t.io").senhaHash("x").perfil(Perfil.CLIENTE).ativo(true).build();
        loginAs(outroCliente);

        assertThatThrownBy(() -> service.submit(itemId, pdf()))
                .isInstanceOf(ForbiddenException.class);
    }

    @Test
    void submitBloqueadoQuandoCicloNaoEstaEmAndamento() {
        cicloEmAndamento.setStatus(CycleStatus.ABERTO);
        loginAs(cliente);

        assertThatThrownBy(() -> service.submit(itemId, pdf()))
                .isInstanceOf(InvalidOperationException.class)
                .hasMessageContaining("EM ANDAMENTO");
    }

    // ---------- máquina de status: approve / reject ----------

    @Test
    void aprovarExigeStatusEmRevisao() {
        item.setStatus(PbcItemStatus.PENDENTE);
        loginAs(auditor);

        assertThatThrownBy(() -> service.approve(itemId, new ApproveRequest()))
                .isInstanceOf(InvalidStatusTransitionException.class);
    }

    @Test
    void quemEnviouNaoPodeAprovarOMesmoItem() {
        item.setStatus(PbcItemStatus.EM_REVISAO);
        loginAs(auditor);
        when(documentRepository.findAllByPbcItemIdAndTenantId(itemId, tenantId))
                .thenReturn(List.of(docEnviadoPor(auditor.getId())));

        assertThatThrownBy(() -> service.approve(itemId, new ApproveRequest()))
                .isInstanceOf(ForbiddenException.class)
                .hasMessageContaining("separação de deveres");
    }

    @Test
    void quemEnviouNaoPodeRejeitarOMesmoItem() {
        item.setStatus(PbcItemStatus.EM_REVISAO);
        loginAs(auditor);
        when(documentRepository.findAllByPbcItemIdAndTenantId(itemId, tenantId))
                .thenReturn(List.of(docEnviadoPor(auditor.getId())));

        RejectRequest req = new RejectRequest();
        req.setMotivo("faltou assinatura");
        assertThatThrownBy(() -> service.reject(itemId, req))
                .isInstanceOf(ForbiddenException.class);
    }

    @Test
    void aprovarPorRevisorDiferenteFunciona() {
        item.setStatus(PbcItemStatus.EM_REVISAO);
        loginAs(auditor);
        when(documentRepository.findAllByPbcItemIdAndTenantId(itemId, tenantId))
                .thenReturn(List.of(docEnviadoPor(cliente.getId())));

        var resp = service.approve(itemId, new ApproveRequest());

        assertThat(resp.getStatus()).isEqualTo(PbcItemStatus.APROVADO);
    }

    @Test
    void rejeitarGravaMotivo() {
        item.setStatus(PbcItemStatus.EM_REVISAO);
        loginAs(auditor);
        when(documentRepository.findAllByPbcItemIdAndTenantId(itemId, tenantId))
                .thenReturn(List.of(docEnviadoPor(cliente.getId())));

        RejectRequest req = new RejectRequest();
        req.setMotivo("Período incorreto");
        var resp = service.reject(itemId, req);

        assertThat(resp.getStatus()).isEqualTo(PbcItemStatus.REJEITADO);
        assertThat(resp.getMotivoRejeicao()).isEqualTo("Período incorreto");
    }

    // ---------- isolamento de tenant / posse ----------

    @Test
    void itemDeOutroTenantNaoEhEncontrado() {
        User auditorOutroTenant = User.builder().id(UUID.randomUUID()).tenantId(outroTenantId)
                .nome("Estranho").email("e@x.io").senhaHash("x").perfil(Perfil.AUDITOR).ativo(true).build();
        loginAs(auditorOutroTenant);

        assertThatThrownBy(() -> service.findById(itemId))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void clienteNaoVeItemDeOutroResponsavel() {
        User outroCliente = User.builder().id(UUID.randomUUID()).tenantId(tenantId)
                .nome("Outro").email("o@t.io").senhaHash("x").perfil(Perfil.CLIENTE).ativo(true).build();
        loginAs(outroCliente);

        assertThatThrownBy(() -> service.findById(itemId))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    // ---------- delete ----------

    @Test
    void apenasItensPendentesPodemSerRemovidos() {
        item.setStatus(PbcItemStatus.EM_REVISAO);
        loginAs(auditor);

        assertThatThrownBy(() -> service.delete(itemId))
                .isInstanceOf(InvalidOperationException.class);
    }
}
