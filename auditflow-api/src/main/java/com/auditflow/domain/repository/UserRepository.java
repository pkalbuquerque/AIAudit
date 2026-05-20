package com.auditflow.domain.repository;

import com.auditflow.domain.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface UserRepository extends JpaRepository<User, UUID> {

    Optional<User> findByEmailAndTenantId(String email, UUID tenantId);

    List<User> findAllByTenantId(UUID tenantId);

    Optional<User> findByEmail(String email);
}
