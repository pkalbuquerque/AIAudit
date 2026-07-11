package com.auditflow.service;

import com.auditflow.domain.entity.User;
import com.auditflow.domain.enums.Perfil;
import com.auditflow.domain.repository.TenantRepository;
import com.auditflow.domain.repository.UserRepository;
import com.auditflow.dto.request.LoginRequest;
import com.auditflow.dto.request.RegisterRequest;
import com.auditflow.exception.DuplicateEmailException;
import com.auditflow.exception.UnauthorizedException;
import com.auditflow.security.JwtService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * Regras de autenticação: lockout progressivo, mensagens que não revelam
 * se o e-mail existe e pré-checagem de e-mail duplicado no registro.
 */
@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock private TenantRepository tenantRepository;
    @Mock private UserRepository userRepository;
    @Mock private JwtService jwtService;
    @Mock private PasswordEncoder passwordEncoder;
    @Mock private AuditLogService auditLogService;
    @Mock private PasswordTokenService passwordTokenService;

    private AuthService service;
    private User user;

    @BeforeEach
    void setUp() {
        service = new AuthService(tenantRepository, userRepository, jwtService,
                passwordEncoder, auditLogService, passwordTokenService);
        user = User.builder().id(UUID.randomUUID()).tenantId(UUID.randomUUID())
                .nome("Pedro").email("pedro@t.io").senhaHash("hash")
                .perfil(Perfil.ADMIN).ativo(true).emailVerificado(true).tentativasLogin(0).build();
        lenient().when(userRepository.findByEmail("pedro@t.io")).thenReturn(Optional.of(user));
        lenient().when(userRepository.save(any(User.class))).thenAnswer(inv -> inv.getArgument(0));
    }

    private LoginRequest login(String email, String senha) {
        LoginRequest req = new LoginRequest();
        req.setEmail(email);
        req.setSenha(senha);
        return req;
    }

    @Test
    void loginValidoEmiteTokenEResetaTentativas() {
        user.setTentativasLogin(3);
        when(passwordEncoder.matches("certa", "hash")).thenReturn(true);
        when(jwtService.generateToken(anyString(), any(), anyString(), any(), anyInt())).thenReturn("jwt-token");

        var resp = service.login(login("pedro@t.io", "certa"));

        assertThat(resp.getToken()).isEqualTo("jwt-token");
        assertThat(user.getTentativasLogin()).isZero();
        assertThat(user.getBloqueadoAte()).isNull();
    }

    @Test
    void senhaErradaIncrementaTentativas() {
        when(passwordEncoder.matches("errada", "hash")).thenReturn(false);

        assertThatThrownBy(() -> service.login(login("pedro@t.io", "errada")))
                .isInstanceOf(UnauthorizedException.class)
                .hasMessage("Credenciais inválidas");
        assertThat(user.getTentativasLogin()).isEqualTo(1);
    }

    @Test
    void quintaTentativaErradaBloqueiaConta() {
        user.setTentativasLogin(4);
        when(passwordEncoder.matches("errada", "hash")).thenReturn(false);

        assertThatThrownBy(() -> service.login(login("pedro@t.io", "errada")))
                .isInstanceOf(UnauthorizedException.class);
        assertThat(user.getBloqueadoAte()).isNotNull().isAfter(LocalDateTime.now());
        assertThat(user.getTentativasLogin()).isZero(); // zera junto com o bloqueio
    }

    @Test
    void contaBloqueadaNaoTentaValidarSenha() {
        user.setBloqueadoAte(LocalDateTime.now().plusMinutes(10));

        assertThatThrownBy(() -> service.login(login("pedro@t.io", "qualquer")))
                .isInstanceOf(UnauthorizedException.class)
                .hasMessageContaining("bloqueada");
        verify(passwordEncoder, never()).matches(anyString(), anyString());
    }

    @Test
    void contaDesativadaNaoLogaMesmoComSenhaCorreta() {
        user.setAtivo(false);
        when(passwordEncoder.matches("certa", "hash")).thenReturn(true);

        assertThatThrownBy(() -> service.login(login("pedro@t.io", "certa")))
                .isInstanceOf(UnauthorizedException.class)
                .hasMessage("Conta desativada");
        // não emite token nem registra login
        verify(jwtService, never()).generateToken(anyString(), any(), anyString(), any(), anyInt());
        verify(auditLogService, never()).record(any(), any(), anyString(), anyString(), anyString(), any());
    }

    @Test
    void emailNaoVerificadoNaoLoga() {
        user.setEmailVerificado(false);
        when(passwordEncoder.matches("certa", "hash")).thenReturn(true);

        assertThatThrownBy(() -> service.login(login("pedro@t.io", "certa")))
                .isInstanceOf(UnauthorizedException.class)
                .hasMessageContaining("não confirmado");
        verify(jwtService, never()).generateToken(anyString(), any(), anyString(), any(), anyInt());
    }

    @Test
    void emailInexistenteRetornaMesmaMensagemGenerica() {
        when(userRepository.findByEmail("naoexiste@t.io")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.login(login("naoexiste@t.io", "x")))
                .isInstanceOf(UnauthorizedException.class)
                .hasMessage("Credenciais inválidas"); // idêntica à de senha errada
    }

    @Test
    void registroComEmailJaCadastradoFalhaAntesDeCriarTenant() {
        RegisterRequest req = new RegisterRequest();
        req.setNomeEscritorio("Firma X");
        req.setEmailContato("contato@x.io");
        req.setNomeAdmin("Admin");
        req.setEmail("pedro@t.io"); // já existe
        req.setSenha("Senha123");

        assertThatThrownBy(() -> service.register(req))
                .isInstanceOf(DuplicateEmailException.class);
        verify(tenantRepository, never()).save(any());
    }
}
