package com.auditflow.service;

import com.auditflow.domain.entity.Tenant;
import com.auditflow.domain.repository.TenantRepository;
import com.auditflow.dto.request.UpdateTenantRequest;
import com.auditflow.dto.response.TenantResponse;
import com.auditflow.exception.ResourceNotFoundException;
import com.auditflow.security.TenantContext;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class TenantService {

    private final TenantRepository tenantRepository;

    public TenantResponse getCurrent() {
        return toResponse(load());
    }

    @Transactional
    public TenantResponse update(UpdateTenantRequest request) {
        Tenant tenant = load();
        tenant.setNome(request.getNome());
        if (request.getEmailContato() != null) tenant.setEmailContato(request.getEmailContato());
        tenant.setCnpj(request.getCnpj());
        tenant.setSite(request.getSite());
        tenant.setEndereco(request.getEndereco());
        tenant.setCidade(request.getCidade());
        tenant.setEstado(request.getEstado());
        tenant.setCep(request.getCep());
        return toResponse(tenantRepository.save(tenant));
    }

    private Tenant load() {
        UUID tenantId = TenantContext.getTenantId();
        return tenantRepository.findById(tenantId)
                .orElseThrow(() -> new ResourceNotFoundException("Firma não encontrada"));
    }

    private TenantResponse toResponse(Tenant t) {
        return TenantResponse.builder()
                .id(t.getId())
                .nome(t.getNome())
                .emailContato(t.getEmailContato())
                .cnpj(t.getCnpj())
                .site(t.getSite())
                .endereco(t.getEndereco())
                .cidade(t.getCidade())
                .estado(t.getEstado())
                .cep(t.getCep())
                .criadoEm(t.getCriadoEm())
                .build();
    }
}
