package com.auditflow.dto.response;

import lombok.Builder;
import lombok.Data;
import org.springframework.data.domain.Page;

import java.util.List;
import java.util.function.Function;

/** Envelope de paginação estável para respostas de listagem (evita expor o formato do Spring Page). */
@Data
@Builder
public class PageResponse<T> {

    private List<T> content;
    private int page;
    private int size;
    private long totalElements;
    private int totalPages;

    /** Constrói a partir de um {@link Page} do Spring, mapeando cada item para o DTO. */
    public static <E, T> PageResponse<T> from(Page<E> page, Function<E, T> mapper) {
        return PageResponse.<T>builder()
                .content(page.getContent().stream().map(mapper).toList())
                .page(page.getNumber())
                .size(page.getSize())
                .totalElements(page.getTotalElements())
                .totalPages(page.getTotalPages())
                .build();
    }
}
