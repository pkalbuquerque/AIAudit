package com.auditflow.security;

import com.auth0.jwt.JWT;
import com.auth0.jwt.algorithms.Algorithm;
import com.auth0.jwt.exceptions.JWTVerificationException;
import com.auth0.jwt.interfaces.DecodedJWT;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.UUID;

@Service
public class JwtService {

    @Value("${jwt.secret}")
    private String secret;

    @Value("${jwt.expiration-hours:24}")
    private long expirationHours;

    public String generateToken(String email, UUID tenantId, String perfil, UUID userId) {
        return JWT.create()
                .withSubject(email)
                .withClaim("tenantId", tenantId.toString())
                .withClaim("perfil", perfil)
                .withClaim("userId", userId.toString())
                .withIssuedAt(Instant.now())
                .withExpiresAt(Instant.now().plus(expirationHours, ChronoUnit.HOURS))
                .sign(Algorithm.HMAC256(secret));
    }

    public DecodedJWT validateToken(String token) {
        try {
            return JWT.require(Algorithm.HMAC256(secret))
                    .build()
                    .verify(token);
        } catch (JWTVerificationException e) {
            throw new RuntimeException("Token JWT inválido ou expirado", e);
        }
    }

    public String extractEmail(String token) {
        return validateToken(token).getSubject();
    }

    public UUID extractTenantId(String token) {
        return UUID.fromString(validateToken(token).getClaim("tenantId").asString());
    }

    public String extractPerfil(String token) {
        return validateToken(token).getClaim("perfil").asString();
    }

    public UUID extractUserId(String token) {
        return UUID.fromString(validateToken(token).getClaim("userId").asString());
    }
}
