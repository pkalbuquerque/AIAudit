package com.auditflow.dto.response;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
public class CommentResponse {

    private UUID id;
    private UUID pbcItemId;
    private UUID autorId;
    private String texto;
    private LocalDateTime criadoEm;
}
