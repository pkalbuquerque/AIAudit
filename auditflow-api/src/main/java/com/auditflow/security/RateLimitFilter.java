package com.auditflow.security;

import io.github.bucket4j.Bandwidth;
import io.github.bucket4j.Bucket;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.annotation.Order;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.time.Duration;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.function.Supplier;

@Slf4j
@Component
@Order(1)
public class RateLimitFilter extends OncePerRequestFilter {

    /**
     * Limite por rota de autenticação. Cada rota tem seu próprio mapa IP→bucket para que o
     * consumo de uma não afete a outra. Rotas que disparam e-mail (forgot/reset/resend) são
     * incluídas para evitar email bombing e abuso de custo do provedor de e-mail.
     */
    private final Map<String, ConcurrentHashMap<String, Bucket>> bucketsByPath = new ConcurrentHashMap<>();
    private final Map<String, Supplier<Bucket>> limits = Map.of(
            "/api/auth/login", () -> bucket(10, Duration.ofMinutes(1)),          // 10/min
            "/api/auth/register", () -> bucket(5, Duration.ofHours(1)),          // 5/hora
            "/api/auth/forgot-password", () -> bucket(5, Duration.ofHours(1)),   // 5/hora
            "/api/auth/reset-password", () -> bucket(10, Duration.ofMinutes(15)),// 10/15min
            "/api/auth/resend-verification", () -> bucket(5, Duration.ofHours(1))// 5/hora
    );

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {
        String path = request.getRequestURI();
        Supplier<Bucket> limit = limits.get(path);

        if (limit != null) {
            String ip = resolveClientIp(request);
            Bucket bucket = bucketsByPath
                    .computeIfAbsent(path, k -> new ConcurrentHashMap<>())
                    .computeIfAbsent(ip, k -> limit.get());

            if (!bucket.tryConsume(1)) {
                log.warn("[429] Rate limit excedido — IP: {}, path: {}", ip, path);
                response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
                response.setContentType("application/json;charset=UTF-8");
                response.getWriter().write(
                        "{\"status\":429,\"erro\":\"Muitas tentativas. Tente novamente em alguns instantes.\"}"
                );
                return;
            }
        }

        filterChain.doFilter(request, response);
    }

    private static Bucket bucket(int capacity, Duration refill) {
        return Bucket.builder()
                .addLimit(Bandwidth.builder().capacity(capacity).refillIntervally(capacity, refill).build())
                .build();
    }

    /**
     * IP do cliente para chaveamento do rate limit.
     *
     * X-Forwarded-For é uma lista "cliente, proxy1, proxy2, …" onde cada salto ANEXA o IP que
     * viu. Os valores da esquerda são controlados pelo cliente e não são confiáveis; o valor
     * confiável é o ÚLTIMO, inserido pelo proxy imediatamente à frente da aplicação. Usar o
     * primeiro valor (como antes) deixava o rate limit ser contornado trocando-se o header.
     *
     * Sem proxy (app exposto direto), não há X-Forwarded-For e usamos o IP real da conexão.
     */
    private String resolveClientIp(HttpServletRequest request) {
        String forwarded = request.getHeader("X-Forwarded-For");
        if (forwarded != null && !forwarded.isBlank()) {
            String[] hops = forwarded.split(",");
            String last = hops[hops.length - 1].trim();
            if (!last.isEmpty()) {
                return last;
            }
        }
        return request.getRemoteAddr();
    }
}
