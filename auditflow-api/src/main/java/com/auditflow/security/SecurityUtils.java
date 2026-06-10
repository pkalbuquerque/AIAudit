package com.auditflow.security;

import com.auditflow.domain.entity.User;
import com.auditflow.exception.UnauthorizedException;
import org.springframework.security.core.context.SecurityContextHolder;

public final class SecurityUtils {

    private SecurityUtils() {}

    public static User getCurrentUser() {
        Object principal = SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        if (principal instanceof User user) {
            return user;
        }
        throw new UnauthorizedException("Usuário não autenticado");
    }
}
