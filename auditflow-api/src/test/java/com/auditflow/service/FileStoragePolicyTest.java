package com.auditflow.service;

import com.auditflow.exception.InvalidFileException;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockMultipartFile;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/**
 * Política de aceitação de arquivos compartilhada pelos storages (local e R2):
 * allowlist de MIME, limite de 20 MB e saneamento do nome.
 */
class FileStoragePolicyTest {

    private MockMultipartFile arquivo(String nome, String mime, byte[] conteudo) {
        return new MockMultipartFile("file", nome, mime, conteudo);
    }

    @Test
    void aceitaTiposPermitidosEPrefixaComUuid() {
        for (String mime : List.of("application/pdf", "text/csv", "image/png", "image/jpeg",
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")) {
            String nome = FileStoragePolicy.validateAndSafeName(arquivo("doc.pdf", mime, new byte[]{1}));
            assertThat(nome).matches("[0-9a-f-]{36}_doc\\.pdf");
        }
    }

    @Test
    void saneiaCaracteresPerigososDoNome() {
        String nome = FileStoragePolicy.validateAndSafeName(
                arquivo("../relatório final (v2).pdf", "application/pdf", new byte[]{1}));

        // sem path traversal, espaços, acentos ou parênteses
        assertThat(nome).doesNotContain("/", "\\", " ", "(", ")", "ó");
        assertThat(nome).endsWith(".pdf");
    }

    @Test
    void recusaMimeForaDaAllowlist() {
        assertThatThrownBy(() -> FileStoragePolicy.validateAndSafeName(
                arquivo("virus.exe", "application/x-msdownload", new byte[]{1})))
                .isInstanceOf(InvalidFileException.class)
                .hasMessageContaining("não permitido");
    }

    @Test
    void recusaArquivoVazio() {
        assertThatThrownBy(() -> FileStoragePolicy.validateAndSafeName(
                arquivo("doc.pdf", "application/pdf", new byte[0])))
                .isInstanceOf(InvalidFileException.class);
    }

    @Test
    void recusaArquivoAcimaDe20MB() {
        byte[] grande = new byte[20 * 1024 * 1024 + 1];
        assertThatThrownBy(() -> FileStoragePolicy.validateAndSafeName(
                arquivo("grande.pdf", "application/pdf", grande)))
                .isInstanceOf(InvalidFileException.class)
                .hasMessageContaining("20 MB");
    }

    @Test
    void recusaMimeNulo() {
        assertThatThrownBy(() -> FileStoragePolicy.validateAndSafeName(
                arquivo("doc.pdf", null, new byte[]{1})))
                .isInstanceOf(InvalidFileException.class);
    }
}
