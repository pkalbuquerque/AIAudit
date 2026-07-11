package com.auditflow.service;

import com.auditflow.domain.entity.Tenant;
import com.auditflow.domain.entity.User;
import com.auditflow.domain.enums.Perfil;
import com.auditflow.domain.repository.TenantRepository;
import com.auditflow.domain.repository.UserRepository;
import com.auditflow.dto.request.ChangePasswordRequest;
import com.auditflow.dto.request.LoginRequest;
import com.auditflow.dto.request.RegisterRequest;
import com.auditflow.dto.response.AuthResponse;
import com.auditflow.dto.response.UserResponse;
import com.auditflow.exception.DuplicateEmailException;
import com.auditflow.exception.UnauthorizedException;
import com.auditflow.security.JwtService;
import com.auditflow.security.SecurityUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

import java.time.LocalDateTime;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuthService {

    private final TenantRepository tenantRepository;
    private final UserRepository userRepository;
    private final JwtService jwtService;
    private final PasswordEncoder passwordEncoder;
    private final AuditLogService auditLogService;
    private final PasswordTokenService passwordTokenService;

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        // Pré-checa o e-mail para retornar 400 amigável em vez de estourar a constraint (500).
        if (userRepository.findByEmail(request.getEmail()).isPresent()) {
            throw new DuplicateEmailException("E-mail já cadastrado no sistema.");
        }

        Tenant tenant = Tenant.builder()
                .nome(request.getNomeEscritorio())
                .emailContato(request.getEmailContato())
                .build();
        tenant = tenantRepository.save(tenant);

        // emailVerificado=false: a conta só pode logar após confirmar o e-mail pelo link.
        User admin = User.builder()
                .tenantId(tenant.getId())
                .nome(request.getNomeAdmin())
                .email(request.getEmail())
                .senhaHash(passwordEncoder.encode(request.getSenha()))
                .perfil(Perfil.ADMIN)
                .build();
        admin = userRepository.save(admin);

        log.info("Novo tenant registrado: {} | admin: {} (aguardando verificação de e-mail)",
                tenant.getNome(), admin.getEmail());

        // O log de auditoria referencia o tenant recém-criado; como record() roda em transação
        // própria (REQUIRES_NEW), só pode ser gravado APÓS o commit desta — senão a FK falha.
        final UUID tenantId = tenant.getId();
        final UUID adminId = admin.getId();
        final String tenantNome = tenant.getNome();
        TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
            @Override
            public void afterCommit() {
                auditLogService.record(tenantId, adminId, "REGISTRO",
                        "Firma " + tenantNome + " registrada", "Tenant", tenantId);
            }
        });

        passwordTokenService.issueEmailVerification(admin);

        // Sem auto-login: nenhum token é emitido até o e-mail ser confirmado.
        return AuthResponse.builder()
                .usuario(toUserResponse(admin))
                .build();
    }

    @Transactional
    public AuthResponse login(LoginRequest request) {
        // Mesma mensagem para e-mail não encontrado e senha errada — não revela se o e-mail existe
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> {
                    log.warn("Tentativa de login com e-mail inexistente: {}", request.getEmail());
                    return new UnauthorizedException("Credenciais inválidas");
                });

        if (user.getBloqueadoAte() != null && user.getBloqueadoAte().isAfter(LocalDateTime.now())) {
            throw new UnauthorizedException("Conta bloqueada temporariamente. Tente novamente mais tarde.");
        }

        if (!passwordEncoder.matches(request.getSenha(), user.getSenhaHash())) {
            log.warn("Senha incorreta para o usuário: {}", request.getEmail());
            int tentativas = user.getTentativasLogin() + 1;
            if (tentativas >= 5) {
                user.setTentativasLogin(0);
                user.setBloqueadoAte(LocalDateTime.now().plusMinutes(15));
                log.warn("Conta bloqueada por excesso de tentativas: {}", user.getEmail());
            } else {
                user.setTentativasLogin(tentativas);
            }
            userRepository.save(user);
            throw new UnauthorizedException("Credenciais inválidas");
        }

        if (!user.isAtivo()) {
            log.warn("Tentativa de login em conta desativada: {}", user.getEmail());
            throw new UnauthorizedException("Conta desativada");
        }

        if (!user.isEmailVerificado()) {
            log.warn("Tentativa de login com e-mail não confirmado: {}", user.getEmail());
            throw new UnauthorizedException("E-mail não confirmado. Verifique sua caixa de entrada.");
        }

        user.setTentativasLogin(0);
        user.setBloqueadoAte(null);
        userRepository.save(user);

        log.info("Login bem-sucedido: {} | perfil: {}", user.getEmail(), user.getPerfil());
        auditLogService.record(user.getTenantId(), user.getId(), "LOGIN", "Login realizado", "User", user.getId());

        return AuthResponse.builder()
                .token(tokenFor(user))
                .senhaProvisoria(user.isSenhaProvisoria())
                .usuario(toUserResponse(user))
                .build();
    }

    /** Altera a própria senha e revoga as demais sessões; devolve um token novo para a sessão atual. */
    @Transactional
    public AuthResponse changePassword(ChangePasswordRequest request) {
        User user = SecurityUtils.getCurrentUser();

        if (!passwordEncoder.matches(request.getSenhaAtual(), user.getSenhaHash())) {
            throw new UnauthorizedException("Senha atual incorreta");
        }

        user.setSenhaHash(passwordEncoder.encode(request.getNovaSenha()));
        user.setSenhaProvisoria(false);
        user.setTentativasLogin(0);
        user.setBloqueadoAte(null);
        user.setTokenVersion(user.getTokenVersion() + 1); // invalida tokens antigos (outras sessões)
        userRepository.save(user);

        log.info("Senha alterada com sucesso: {}", user.getEmail());
        return AuthResponse.builder()
                .token(tokenFor(user))
                .usuario(toUserResponse(user))
                .build();
    }

    /** "Sair de todos os dispositivos": revoga todos os tokens e reemite um para a sessão atual. */
    @Transactional
    public AuthResponse logoutAllDevices() {
        User user = SecurityUtils.getCurrentUser();
        user.setTokenVersion(user.getTokenVersion() + 1);
        userRepository.save(user);
        log.info("Tokens revogados (logout global): {}", user.getEmail());
        return AuthResponse.builder()
                .token(tokenFor(user))
                .usuario(toUserResponse(user))
                .build();
    }

    private String tokenFor(User user) {
        return jwtService.generateToken(
                user.getEmail(),
                user.getTenantId(),
                user.getPerfil().name(),
                user.getId(),
                user.getTokenVersion());
    }

    private UserResponse toUserResponse(User user) {
        return UserResponse.builder()
                .id(user.getId())
                .tenantId(user.getTenantId())
                .nome(user.getNome())
                .email(user.getEmail())
                .perfil(user.getPerfil())
                .ativo(user.isAtivo())
                .criadoEm(user.getCriadoEm())
                .build();
    }
}
