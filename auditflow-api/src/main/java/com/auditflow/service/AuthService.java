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

import java.time.LocalDateTime;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuthService {

    private final TenantRepository tenantRepository;
    private final UserRepository userRepository;
    private final JwtService jwtService;
    private final PasswordEncoder passwordEncoder;
    private final AuditLogService auditLogService;

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

        User admin = User.builder()
                .tenantId(tenant.getId())
                .nome(request.getNomeAdmin())
                .email(request.getEmail())
                .senhaHash(passwordEncoder.encode(request.getSenha()))
                .perfil(Perfil.ADMIN)
                .build();
        admin = userRepository.save(admin);

        log.info("Novo tenant registrado: {} | admin: {}", tenant.getNome(), admin.getEmail());
        auditLogService.record(tenant.getId(), admin.getId(), "REGISTRO",
                "Firma " + tenant.getNome() + " registrada", "Tenant", tenant.getId());

        String token = jwtService.generateToken(
                admin.getEmail(),
                admin.getTenantId(),
                admin.getPerfil().name(),
                admin.getId()
        );

        return AuthResponse.builder()
                .token(token)
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

        user.setTentativasLogin(0);
        user.setBloqueadoAte(null);
        userRepository.save(user);

        log.info("Login bem-sucedido: {} | perfil: {}", user.getEmail(), user.getPerfil());
        auditLogService.record(user.getTenantId(), user.getId(), "LOGIN", "Login realizado", "User", user.getId());

        String token = jwtService.generateToken(
                user.getEmail(),
                user.getTenantId(),
                user.getPerfil().name(),
                user.getId()
        );

        return AuthResponse.builder()
                .token(token)
                .senhaProvisoria(user.isSenhaProvisoria())
                .usuario(toUserResponse(user))
                .build();
    }

    @Transactional
    public void changePassword(ChangePasswordRequest request) {
        User user = SecurityUtils.getCurrentUser();

        if (!passwordEncoder.matches(request.getSenhaAtual(), user.getSenhaHash())) {
            throw new UnauthorizedException("Senha atual incorreta");
        }

        user.setSenhaHash(passwordEncoder.encode(request.getNovaSenha()));
        user.setSenhaProvisoria(false);
        user.setTentativasLogin(0);
        user.setBloqueadoAte(null);
        userRepository.save(user);

        log.info("Senha alterada com sucesso: {}", user.getEmail());
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
