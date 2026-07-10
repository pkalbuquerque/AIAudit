package com.auditflow.service;

import com.auditflow.domain.entity.PasswordToken;
import com.auditflow.domain.entity.User;
import com.auditflow.domain.enums.Perfil;
import com.auditflow.domain.enums.TokenType;
import com.auditflow.domain.repository.PasswordTokenRepository;
import com.auditflow.domain.repository.UserRepository;
import com.auditflow.exception.UnauthorizedException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * Tokens de ativação/reset: hash no banco (nunca o token puro), uso único,
 * expiração e comportamento silencioso para e-mail inexistente.
 */
@ExtendWith(MockitoExtension.class)
class PasswordTokenServiceTest {

    @Mock private PasswordTokenRepository tokenRepository;
    @Mock private UserRepository userRepository;
    @Mock private PasswordEncoder passwordEncoder;
    @Mock private NotificationService notificationService;

    private PasswordTokenService service;
    private User user;

    @BeforeEach
    void setUp() {
        service = new PasswordTokenService(tokenRepository, userRepository,
                passwordEncoder, notificationService);
        ReflectionTestUtils.setField(service, "webUrl", "http://localhost:3000");
        ReflectionTestUtils.setField(service, "activationHours", 168L);
        ReflectionTestUtils.setField(service, "resetMinutes", 60L);

        user = User.builder().id(UUID.randomUUID()).tenantId(UUID.randomUUID())
                .nome("Maria").email("maria@t.io").senhaHash("antigo")
                .perfil(Perfil.CLIENTE).ativo(true).senhaProvisoria(true).build();

        lenient().when(tokenRepository.save(any(PasswordToken.class)))
                .thenAnswer(inv -> inv.getArgument(0));
    }

    private PasswordToken tokenValido() {
        return PasswordToken.builder().id(UUID.randomUUID()).userId(user.getId())
                .tokenHash("h".repeat(64)).tipo(TokenType.ACTIVATION)
                .expiraEm(LocalDateTime.now().plusHours(1)).build();
    }

    @Test
    void ativacaoGuardaApenasHashEEnviaLinkComTokenPuro() {
        ArgumentCaptor<PasswordToken> salvo = ArgumentCaptor.forClass(PasswordToken.class);

        String link = service.issueActivation(user, "Bem-vindo.");

        verify(tokenRepository).save(salvo.capture());
        String rawToken = link.substring(link.indexOf("token=") + 6);

        assertThat(link).startsWith("http://localhost:3000/definir-senha?token=");
        assertThat(salvo.getValue().getTipo()).isEqualTo(TokenType.ACTIVATION);
        assertThat(salvo.getValue().getTokenHash())
                .matches("[0-9a-f]{64}")     // SHA-256 em hex
                .isNotEqualTo(rawToken);      // nunca o token puro
        verify(notificationService).convite(user.getEmail(), user.getNome(), "Bem-vindo.", link);
    }

    @Test
    void resetParaEmailInexistenteEhSilencioso() {
        when(userRepository.findByEmail("fantasma@t.io")).thenReturn(Optional.empty());

        service.issueReset("fantasma@t.io"); // não lança

        verify(tokenRepository, never()).save(any());
        verify(notificationService, never()).resetSenha(anyString(), anyString(), anyString());
    }

    @Test
    void resetParaEmailExistenteCriaTokenComValidadeCurta() {
        when(userRepository.findByEmail(user.getEmail())).thenReturn(Optional.of(user));
        ArgumentCaptor<PasswordToken> salvo = ArgumentCaptor.forClass(PasswordToken.class);

        service.issueReset(user.getEmail());

        verify(tokenRepository).save(salvo.capture());
        assertThat(salvo.getValue().getTipo()).isEqualTo(TokenType.RESET);
        assertThat(salvo.getValue().getExpiraEm())
                .isBefore(LocalDateTime.now().plusMinutes(61)); // ~60 min, não 7 dias
    }

    @Test
    void redefinirTrocaSenhaEConsomeTodosOsTokensDoUsuario() {
        PasswordToken token = tokenValido();
        PasswordToken outroPendente = tokenValido();
        when(tokenRepository.findByTokenHash(anyString())).thenReturn(Optional.of(token));
        when(userRepository.findById(user.getId())).thenReturn(Optional.of(user));
        when(userRepository.save(any(User.class))).thenAnswer(inv -> inv.getArgument(0));
        when(tokenRepository.findAllByUserIdAndUsadoEmIsNull(user.getId()))
                .thenReturn(List.of(token, outroPendente));
        when(passwordEncoder.encode("NovaSenha1")).thenReturn("novoHash");

        service.redefinir("token-cru", "NovaSenha1");

        assertThat(user.getSenhaHash()).isEqualTo("novoHash");
        assertThat(user.isSenhaProvisoria()).isFalse();
        assertThat(user.isAtivo()).isTrue();
        assertThat(token.getUsadoEm()).isNotNull();
        assertThat(outroPendente.getUsadoEm()).isNotNull(); // invalida os demais
    }

    @Test
    void tokenExpiradoNaoRedefine() {
        PasswordToken expirado = tokenValido();
        expirado.setExpiraEm(LocalDateTime.now().minusMinutes(1));
        when(tokenRepository.findByTokenHash(anyString())).thenReturn(Optional.of(expirado));

        assertThatThrownBy(() -> service.redefinir("token-cru", "NovaSenha1"))
                .isInstanceOf(UnauthorizedException.class);
        verify(userRepository, never()).save(any());
    }

    @Test
    void tokenJaUsadoNaoRedefine() {
        PasswordToken usado = tokenValido();
        usado.setUsadoEm(LocalDateTime.now().minusMinutes(5));
        when(tokenRepository.findByTokenHash(anyString())).thenReturn(Optional.of(usado));

        assertThatThrownBy(() -> service.redefinir("token-cru", "NovaSenha1"))
                .isInstanceOf(UnauthorizedException.class);
    }

    @Test
    void tokenInfoDeTokenDesconhecidoRetornaInvalido() {
        when(tokenRepository.findByTokenHash(anyString())).thenReturn(Optional.empty());

        var info = service.tokenInfo("nao-existe");

        assertThat(info.isValido()).isFalse();
        assertThat(info.getEmail()).isNull();
    }
}
