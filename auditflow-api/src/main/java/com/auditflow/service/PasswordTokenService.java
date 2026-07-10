package com.auditflow.service;

import com.auditflow.domain.entity.PasswordToken;
import com.auditflow.domain.entity.User;
import com.auditflow.domain.enums.TokenType;
import com.auditflow.domain.repository.PasswordTokenRepository;
import com.auditflow.domain.repository.UserRepository;
import com.auditflow.dto.response.TokenInfoResponse;
import com.auditflow.exception.UnauthorizedException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.Base64;
import java.util.HexFormat;

/**
 * Emite e consome tokens de uso único para dois fluxos que compartilham o mesmo mecanismo:
 * ativação de conta (convite) e redefinição de senha ("esqueci minha senha").
 *
 * O token em texto puro só existe no link enviado por e-mail; no banco guardamos apenas
 * o hash SHA-256. Consumir um token o invalida (e invalida os demais tokens do usuário).
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class PasswordTokenService {

    private final PasswordTokenRepository tokenRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final NotificationService notificationService;

    private static final SecureRandom RANDOM = new SecureRandom();

    @Value("${app.web-url:http://localhost:3000}")
    private String webUrl;

    @Value("${app.token.activation-hours:168}")
    private long activationHours;

    @Value("${app.token.reset-minutes:60}")
    private long resetMinutes;

    /**
     * Cria um token de ativação para o usuário, dispara o e-mail de convite e devolve o link.
     * O link é retornado para exibição de contingência a quem convidou (caso o e-mail não chegue).
     */
    @Transactional
    public String issueActivation(User user, String tituloConvite) {
        String rawToken = createToken(user, TokenType.ACTIVATION,
                LocalDateTime.now().plusHours(activationHours));
        String link = buildLink(rawToken);
        notificationService.convite(user.getEmail(), user.getNome(), tituloConvite, link);
        return link;
    }

    /**
     * Fluxo "esqueci minha senha": se o e-mail existir, envia o link de redefinição.
     * Silencioso por design — não revela se o e-mail está ou não cadastrado.
     */
    @Transactional
    public void issueReset(String email) {
        userRepository.findByEmail(email).ifPresentOrElse(user -> {
            String rawToken = createToken(user, TokenType.RESET,
                    LocalDateTime.now().plusMinutes(resetMinutes));
            notificationService.resetSenha(user.getEmail(), user.getNome(), buildLink(rawToken));
            log.info("Token de redefinição emitido para {}", email);
        }, () -> log.info("Solicitação de redefinição para e-mail inexistente: {} (silencioso)", email));
    }

    /** Contexto do token para a tela de definir senha. Nunca lança — retorna {valido=false} se inválido. */
    @Transactional(readOnly = true)
    public TokenInfoResponse tokenInfo(String rawToken) {
        PasswordToken token = tokenRepository.findByTokenHash(hash(rawToken)).orElse(null);
        if (token == null || !token.isUtilizavel()) {
            return TokenInfoResponse.builder().valido(false).build();
        }
        User user = userRepository.findById(token.getUserId()).orElse(null);
        if (user == null) {
            return TokenInfoResponse.builder().valido(false).build();
        }
        return TokenInfoResponse.builder()
                .valido(true)
                .nome(user.getNome())
                .email(user.getEmail())
                .tipo(token.getTipo())
                .build();
    }

    /** Define a senha do usuário a partir de um token válido e o consome. */
    @Transactional
    public void redefinir(String rawToken, String novaSenha) {
        PasswordToken token = tokenRepository.findByTokenHash(hash(rawToken))
                .filter(PasswordToken::isUtilizavel)
                .orElseThrow(() -> new UnauthorizedException(
                        "Link inválido ou expirado. Solicite um novo."));

        User user = userRepository.findById(token.getUserId())
                .orElseThrow(() -> new UnauthorizedException("Link inválido ou expirado. Solicite um novo."));

        user.setSenhaHash(passwordEncoder.encode(novaSenha));
        user.setSenhaProvisoria(false);
        user.setAtivo(true);
        user.setTentativasLogin(0);
        user.setBloqueadoAte(null);
        userRepository.save(user);

        // Consome este token e invalida quaisquer outros pendentes do mesmo usuário.
        LocalDateTime agora = LocalDateTime.now();
        tokenRepository.findAllByUserIdAndUsadoEmIsNull(user.getId())
                .forEach(t -> t.setUsadoEm(agora));

        log.info("Senha definida via token ({}) para {}", token.getTipo(), user.getEmail());
    }

    private String createToken(User user, TokenType tipo, LocalDateTime expiraEm) {
        byte[] bytes = new byte[32];
        RANDOM.nextBytes(bytes);
        String rawToken = Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);

        tokenRepository.save(PasswordToken.builder()
                .userId(user.getId())
                .tokenHash(hash(rawToken))
                .tipo(tipo)
                .expiraEm(expiraEm)
                .build());
        return rawToken;
    }

    private String buildLink(String rawToken) {
        String base = webUrl.endsWith("/") ? webUrl.substring(0, webUrl.length() - 1) : webUrl;
        return base + "/definir-senha?token=" + rawToken;
    }

    private String hash(String rawToken) {
        try {
            MessageDigest md = MessageDigest.getInstance("SHA-256");
            byte[] digest = md.digest(rawToken.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(digest);
        } catch (Exception e) {
            throw new IllegalStateException("Falha ao gerar hash do token", e);
        }
    }
}
