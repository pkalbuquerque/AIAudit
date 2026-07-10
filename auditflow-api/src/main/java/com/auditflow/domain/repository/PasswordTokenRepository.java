package com.auditflow.domain.repository;

import com.auditflow.domain.entity.PasswordToken;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface PasswordTokenRepository extends JpaRepository<PasswordToken, UUID> {

    Optional<PasswordToken> findByTokenHash(String tokenHash);

    List<PasswordToken> findAllByUserIdAndUsadoEmIsNull(UUID userId);
}
