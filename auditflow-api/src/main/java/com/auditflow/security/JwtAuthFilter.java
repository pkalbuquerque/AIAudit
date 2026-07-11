package com.auditflow.security;

import com.auditflow.domain.entity.User;
import com.auditflow.domain.repository.UserRepository;
import com.auth0.jwt.interfaces.DecodedJWT;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.UUID;

@Slf4j
@Component
@RequiredArgsConstructor
public class JwtAuthFilter extends OncePerRequestFilter {

    private final JwtService jwtService;
    private final UserRepository userRepository;

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {

        String authHeader = request.getHeader("Authorization");

        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            filterChain.doFilter(request, response);
            return;
        }

        try {
            String token = authHeader.substring(7);
            DecodedJWT decoded = jwtService.validateToken(token);

            String email = decoded.getSubject();
            UUID tenantId = UUID.fromString(decoded.getClaim("tenantId").asString());
            Integer tokenVersion = decoded.getClaim("tokenVersion").asInt();

            TenantContext.setTenantId(tenantId);

            if (SecurityContextHolder.getContext().getAuthentication() == null) {
                User user = userRepository.findByEmailAndTenantId(email, tenantId).orElse(null);

                if (user == null) {
                    log.warn("Token válido mas usuário não encontrado no banco: {} | tenantId: {}", email, tenantId);
                } else if (!user.isAtivo()) {
                    log.warn("Token válido mas conta desativada: {} | tenantId: {}", email, tenantId);
                } else if (tokenVersion == null || tokenVersion != user.getTokenVersion()) {
                    log.warn("Token revogado (tokenVersion divergente): {} | tenantId: {}", email, tenantId);
                } else {
                    UsernamePasswordAuthenticationToken authToken =
                            new UsernamePasswordAuthenticationToken(user, null, user.getAuthorities());
                    authToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                    SecurityContextHolder.getContext().setAuthentication(authToken);
                }
            }

            filterChain.doFilter(request, response);

        } catch (Exception e) {
            log.warn("Falha ao processar token JWT — {}: {}", e.getClass().getSimpleName(), e.getMessage());
            filterChain.doFilter(request, response);
        } finally {
            TenantContext.clear();
        }
    }
}
