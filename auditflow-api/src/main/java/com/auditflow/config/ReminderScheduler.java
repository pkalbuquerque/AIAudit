package com.auditflow.config;

import com.auditflow.domain.entity.PbcItem;
import com.auditflow.domain.repository.PbcItemRepository;
import com.auditflow.domain.repository.UserRepository;
import com.auditflow.service.NotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;

/**
 * Envia lembretes por e-mail para itens PBC atrasados ou próximos do prazo que
 * ainda dependem do cliente (PENDENTE/REJEITADO). Roda diariamente.
 * Desativável por app.reminders-enabled=false. O envio real só ocorre se as
 * notificações (Resend) estiverem configuradas — caso contrário apenas registra no log.
 */
@Slf4j
@Component
@RequiredArgsConstructor
@ConditionalOnProperty(prefix = "app", name = "reminders-enabled", havingValue = "true", matchIfMissing = true)
public class ReminderScheduler {

    private static final DateTimeFormatter FMT = DateTimeFormatter.ofPattern("dd/MM/yyyy");
    private static final int DIAS_ANTECEDENCIA = 2;

    private final PbcItemRepository pbcItemRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;

    @Scheduled(cron = "${app.reminders.cron:0 0 8 * * *}")
    public void enviarLembretes() {
        LocalDate hoje = LocalDate.now();
        LocalDate limite = hoje.plusDays(DIAS_ANTECEDENCIA);

        List<PbcItem> itens = pbcItemRepository.findPendentesComPrazoAte(limite);
        log.info("[reminders] {} item(ns) atrasado(s)/próximo(s) do prazo para lembrar.", itens.size());

        for (PbcItem item : itens) {
            userRepository.findById(item.getResponsavelId())
                    .filter(u -> u.isAtivo())
                    .ifPresent(dono -> {
                        boolean vencido = item.getPrazo().isBefore(hoje);
                        notificationService.itemAtrasado(dono.getEmail(), dono.getNome(),
                                item.getTitulo(), vencido, item.getPrazo().format(FMT));
                    });
        }
    }
}
