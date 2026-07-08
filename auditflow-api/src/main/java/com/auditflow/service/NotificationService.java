package com.auditflow.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.util.Map;

/**
 * Envia e-mails transacionais via Resend (https://resend.com).
 * Assíncrono e tolerante a falhas: nunca interrompe a operação de negócio.
 * Desativado se app.notifications-enabled=false ou sem RESEND_API_KEY.
 */
@Slf4j
@Service
public class NotificationService {

    private static final String RESEND_URL = "https://api.resend.com/emails";

    @Value("${app.notifications-enabled:false}")
    private boolean enabled;

    @Value("${resend.api-key:}")
    private String apiKey;

    @Value("${resend.from:AuditFlow <onboarding@resend.dev>}")
    private String from;

    @Value("${app.portal-url:http://localhost:3000/portal}")
    private String portalUrl;

    private final HttpClient http = HttpClient.newHttpClient();
    private final ObjectMapper mapper = new ObjectMapper();

    @Async
    public void itemCriado(String destinoEmail, String destinoNome, String itemTitulo, String cicloTitulo) {
        String html = wrap(destinoNome,
                "Você tem um novo item para entregar",
                "No projeto <b>" + esc(cicloTitulo) + "</b>, o auditor solicitou: <b>" + esc(itemTitulo) + "</b>.");
        send(destinoEmail, "Novo item PBC: " + itemTitulo, html);
    }

    @Async
    public void itemRejeitado(String destinoEmail, String destinoNome, String itemTitulo, String motivo) {
        String html = wrap(destinoNome,
                "Um item foi rejeitado e precisa de correção",
                "O item <b>" + esc(itemTitulo) + "</b> foi rejeitado pelo auditor."
                        + (motivo != null && !motivo.isBlank()
                        ? "<br><br><i>\"" + esc(motivo) + "\"</i>" : "")
                        + "<br><br>Acesse o portal para reenviar o documento corrigido.");
        send(destinoEmail, "Item rejeitado: " + itemTitulo, html);
    }

    @Async
    public void itemAtrasado(String destinoEmail, String destinoNome, String itemTitulo, boolean vencido, String prazo) {
        String titulo = vencido ? "Item em atraso" : "Item perto do prazo";
        String corpo = (vencido
                ? "O item <b>" + esc(itemTitulo) + "</b> está em atraso (prazo " + esc(prazo) + ")."
                : "O item <b>" + esc(itemTitulo) + "</b> vence em breve (prazo " + esc(prazo) + ").")
                + " Acesse o portal para enviar o documento.";
        send(destinoEmail, (vencido ? "Atraso: " : "Lembrete: ") + itemTitulo, wrap(destinoNome, titulo, corpo));
    }

    @Async
    public void itemAprovado(String destinoEmail, String destinoNome, String itemTitulo) {
        String html = wrap(destinoNome,
                "Item aprovado",
                "O item <b>" + esc(itemTitulo) + "</b> foi aprovado pelo auditor. Nada mais é necessário.");
        send(destinoEmail, "Item aprovado: " + itemTitulo, html);
    }

    /** Envio de teste manual (bypassa app.notifications-enabled). Retorna mensagem do resultado. */
    public String sendTest(String to) {
        String html = wrap("teste", "E-mail de teste do AuditFlow",
                "Se você recebeu este e-mail, a integração com o Resend está funcionando. 🎉");
        return deliver(to, "AuditFlow — e-mail de teste", html);
    }

    /** Usado pelos disparos automáticos: respeita o interruptor app.notifications-enabled. */
    private void send(String to, String subject, String html) {
        if (!enabled) {
            log.info("[notif] (desativado) e-mail não enviado para {} — assunto: {}", to, subject);
            return;
        }
        deliver(to, subject, html);
    }

    /** Chamada HTTP ao Resend. Retorna uma mensagem legível do resultado. */
    private String deliver(String to, String subject, String html) {
        if (apiKey == null || apiKey.isBlank()) {
            String m = "RESEND_API_KEY não configurada — nada enviado.";
            log.info("[notif] {}", m);
            return m;
        }
        try {
            String body = mapper.writeValueAsString(Map.of(
                    "from", from,
                    "to", new String[]{to},
                    "subject", subject,
                    "html", html));

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(RESEND_URL))
                    .header("Authorization", "Bearer " + apiKey)
                    .header("Content-Type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(body))
                    .build();

            HttpResponse<String> resp = http.send(request, HttpResponse.BodyHandlers.ofString());
            if (resp.statusCode() >= 200 && resp.statusCode() < 300) {
                log.info("[notif] e-mail enviado para {} — assunto: {}", to, subject);
                return "E-mail enviado para " + to + ".";
            }
            log.warn("[notif] Resend respondeu {} ao enviar para {}: {}", resp.statusCode(), to, resp.body());
            return "Resend retornou HTTP " + resp.statusCode() + ": " + resp.body();
        } catch (Exception e) {
            log.warn("[notif] Falha ao enviar e-mail para {}: {}", to, e.getMessage());
            return "Falha ao enviar: " + e.getMessage();
        }
    }

    private String wrap(String nome, String titulo, String corpo) {
        return "<div style=\"font-family:Arial,sans-serif;max-width:520px;margin:0 auto;border:1px solid #E2E8F0;border-radius:10px;overflow:hidden\">"
                + "<div style=\"background:#0D1F2D;padding:20px 24px;color:#fff;font-size:18px\">AuditFlow</div>"
                + "<div style=\"padding:24px\">"
                + "<p style=\"color:#1C1C1E;font-size:14px;margin:0 0 8px\">Olá, " + esc(nome) + ",</p>"
                + "<h1 style=\"color:#0D1F2D;font-size:20px;margin:0 0 12px\">" + esc(titulo) + "</h1>"
                + "<p style=\"color:#4B5563;font-size:14px;line-height:1.6;margin:0 0 20px\">" + corpo + "</p>"
                + "<a href=\"" + esc(portalUrl) + "\" style=\"display:inline-block;background:#00C896;color:#0D1F2D;"
                + "padding:12px 22px;border-radius:6px;text-decoration:none;font-weight:600;font-size:14px\">Acessar o portal</a>"
                + "</div></div>";
    }

    private String esc(String s) {
        if (s == null) return "";
        return s.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;");
    }
}
