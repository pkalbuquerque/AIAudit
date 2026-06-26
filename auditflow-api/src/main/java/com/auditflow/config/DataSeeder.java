package com.auditflow.config;

import com.auditflow.domain.entity.AuditClient;
import com.auditflow.domain.entity.AuditCycle;
import com.auditflow.domain.entity.PbcItem;
import com.auditflow.domain.entity.Tenant;
import com.auditflow.domain.entity.User;
import com.auditflow.domain.enums.CycleStatus;
import com.auditflow.domain.enums.PbcItemStatus;
import com.auditflow.domain.enums.Perfil;
import com.auditflow.domain.enums.Prioridade;
import com.auditflow.domain.repository.AuditClientRepository;
import com.auditflow.domain.repository.AuditCycleRepository;
import com.auditflow.domain.repository.PbcItemRepository;
import com.auditflow.domain.repository.TenantRepository;
import com.auditflow.domain.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

/**
 * Popula o banco com dados de demonstração para testes manuais.
 * Ativado por app.seed-demo=true. Idempotente: se o admin demo já existir, não faz nada.
 * Todos os usuários demo têm a senha: demo1234
 */
@Slf4j
@Component
@RequiredArgsConstructor
@ConditionalOnProperty(prefix = "app", name = "seed-demo", havingValue = "true")
public class DataSeeder implements CommandLineRunner {

    private static final String SENHA_DEMO = "demo1234";
    private static final String ADMIN_EMAIL = "admin@demo.auditflow.io";

    private final TenantRepository tenantRepository;
    private final UserRepository userRepository;
    private final AuditClientRepository auditClientRepository;
    private final AuditCycleRepository auditCycleRepository;
    private final PbcItemRepository pbcItemRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    @Transactional
    public void run(String... args) {
        if (userRepository.findByEmail(ADMIN_EMAIL).isPresent()) {
            log.info("[seed] Dados demo já presentes — nada a fazer.");
            return;
        }

        log.info("[seed] Criando dados de demonstração…");

        Tenant tenant = tenantRepository.save(Tenant.builder()
                .nome("Andrade & Associados Auditores")
                .emailContato("contato@andradeauditores.com.br")
                .build());
        UUID t = tenant.getId();

        User admin = saveUser(t, null, "Pedro Andrade", ADMIN_EMAIL, Perfil.ADMIN);
        User rafael = saveUser(t, null, "Rafael Mendes", "rafael@demo.auditflow.io", Perfil.AUDITOR);
        User camila = saveUser(t, null, "Camila Torres", "camila@demo.auditflow.io", Perfil.AUDITOR);

        // ---- Cliente 1: Acme (auditor Rafael) ----
        AuditClient acme = saveClient(t, "Acme Corp", "12.345.678/0001-90", "Indústria",
                "contato@acme.com.br", rafael.getId());
        User maria = saveClientUser(t, acme.getId(), "Maria Souza", "maria@acme.demo.io");

        AuditCycle acmeCycle = saveCycle(t, acme.getId(), rafael.getId(),
                "Auditoria Anual 2025", "Financeira", CycleStatus.EM_ANDAMENTO,
                LocalDate.now().minusMonths(2), LocalDate.now().plusMonths(1));
        savePbc(t, acmeCycle.getId(), maria.getId(), "Balancete Geral — Dez/2024", PbcItemStatus.EM_REVISAO,
                Prioridade.ALTA, LocalDate.now().plusDays(3));
        savePbc(t, acmeCycle.getId(), maria.getId(), "Extrato Bancário — Jan/2025", PbcItemStatus.APROVADO,
                Prioridade.MEDIA, LocalDate.now().minusDays(5));
        savePbc(t, acmeCycle.getId(), maria.getId(), "Conciliação Bancária — Q4", PbcItemStatus.PENDENTE,
                Prioridade.MEDIA, LocalDate.now().minusDays(2)); // atrasado
        savePbc(t, acmeCycle.getId(), maria.getId(), "DRE Consolidada — 2024", PbcItemStatus.REJEITADO,
                Prioridade.CRITICA, LocalDate.now().plusDays(7), "Arquivo sem assinatura do contador.");

        // ---- Cliente 2: BetaTech (auditor Camila) ----
        AuditClient beta = saveClient(t, "BetaTech Ltda", "98.765.432/0001-11", "Tecnologia",
                "financeiro@betatech.com.br", camila.getId());
        User joao = saveClientUser(t, beta.getId(), "João Lima", "joao@betatech.demo.io");

        AuditCycle betaCycle = saveCycle(t, beta.getId(), camila.getId(),
                "Revisão Trimestral Q2", "Financeira", CycleStatus.EM_ANDAMENTO,
                LocalDate.now().minusMonths(1), LocalDate.now().plusMonths(2));
        savePbc(t, betaCycle.getId(), joao.getId(), "Razão Contábil — Abr/2025", PbcItemStatus.PENDENTE,
                Prioridade.ALTA, LocalDate.now().plusDays(10));
        savePbc(t, betaCycle.getId(), joao.getId(), "Notas Fiscais — Mai/2025", PbcItemStatus.EM_REVISAO,
                Prioridade.MEDIA, LocalDate.now().plusDays(5));

        // ---- Cliente 3: Grupo RX (sem auditor — aparece em Atribuições) ----
        AuditClient rx = saveClient(t, "Grupo RX S.A.", "45.678.901/0001-55", "Financeiro",
                "compliance@grupox.com.br", null);
        User carlos = saveClientUser(t, rx.getId(), "Carlos Melo", "carlos@grupox.demo.io");

        AuditCycle rxCycle = saveCycle(t, rx.getId(), rafael.getId(),
                "Auditoria Fiscal 2024", "Fiscal", CycleStatus.ENCERRADO,
                LocalDate.now().minusMonths(6), LocalDate.now().minusMonths(1));
        savePbc(t, rxCycle.getId(), carlos.getId(),
                "Relatório de Conformidade", PbcItemStatus.APROVADO, Prioridade.MEDIA,
                LocalDate.now().minusMonths(2));

        log.info("[seed] Concluído. Login admin: {} / senha: {} (todos os usuários demo usam a mesma senha).",
                ADMIN_EMAIL, SENHA_DEMO);
        log.info("[seed] Auditores: rafael@demo.auditflow.io, camila@demo.auditflow.io");
        log.info("[seed] Clientes (portal): maria@acme.demo.io, joao@betatech.demo.io, carlos@grupox.demo.io");
    }

    private User saveUser(UUID tenantId, UUID clientId, String nome, String email, Perfil perfil) {
        return userRepository.save(User.builder()
                .tenantId(tenantId)
                .auditClientId(clientId)
                .nome(nome)
                .email(email)
                .senhaHash(passwordEncoder.encode(SENHA_DEMO))
                .perfil(perfil)
                .ativo(true)
                .senhaProvisoria(false)
                .build());
    }

    private User saveClientUser(UUID tenantId, UUID clientId, String nome, String email) {
        return saveUser(tenantId, clientId, nome, email, Perfil.CLIENTE);
    }

    private AuditClient saveClient(UUID tenantId, String nome, String cnpj, String segmento,
                                   String emailContato, UUID auditorId) {
        return auditClientRepository.save(AuditClient.builder()
                .tenantId(tenantId)
                .nomeEmpresa(nome)
                .cnpj(cnpj)
                .segmento(segmento)
                .emailContato(emailContato)
                .auditorResponsavelId(auditorId)
                .ativo(true)
                .build());
    }

    private AuditCycle saveCycle(UUID tenantId, UUID clientId, UUID auditorId, String titulo, String tipo,
                                 CycleStatus status, LocalDate inicio, LocalDate fim) {
        return auditCycleRepository.save(AuditCycle.builder()
                .tenantId(tenantId)
                .auditClientId(clientId)
                .auditorId(auditorId)
                .titulo(titulo)
                .tipo(tipo)
                .status(status)
                .dataInicio(inicio)
                .dataFim(fim)
                .build());
    }

    private void savePbc(UUID tenantId, UUID cycleId, UUID responsavelId, String titulo,
                         PbcItemStatus status, Prioridade prioridade, LocalDate prazo) {
        savePbc(tenantId, cycleId, responsavelId, titulo, status, prioridade, prazo, null);
    }

    private void savePbc(UUID tenantId, UUID cycleId, UUID responsavelId, String titulo,
                         PbcItemStatus status, Prioridade prioridade, LocalDate prazo, String motivoRejeicao) {
        pbcItemRepository.save(PbcItem.builder()
                .tenantId(tenantId)
                .cycleId(cycleId)
                .responsavelId(responsavelId)
                .titulo(titulo)
                .descricao("Item de demonstração: " + titulo)
                .status(status)
                .prioridade(prioridade)
                .prazo(prazo)
                .criteriosDeAceite(List.of("Formato PDF ou Excel", "Período correto", "Assinado"))
                .motivoRejeicao(motivoRejeicao)
                .build());
    }
}
