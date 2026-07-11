package com.auditflow.service;

import com.auditflow.exception.InvalidFileException;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockMultipartFile;

import java.util.Map;

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

    /** Conteúdo com magic bytes válidos para cada tipo. */
    private static final Map<String, byte[]> HEADERS = Map.of(
            "application/pdf", new byte[]{0x25, 0x50, 0x44, 0x46, '1'},
            "text/csv", "a,b,c\n1,2,3\n".getBytes(),
            "image/png", new byte[]{(byte) 0x89, 0x50, 0x4E, 0x47, 1},
            "image/jpeg", new byte[]{(byte) 0xFF, (byte) 0xD8, (byte) 0xFF, 1},
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                    new byte[]{0x50, 0x4B, 0x03, 0x04, 1});

    @Test
    void aceitaTiposPermitidosComConteudoCoerenteEPrefixaComUuid() {
        HEADERS.forEach((mime, conteudo) -> {
            String nome = FileStoragePolicy.validateAndSafeName(arquivo("doc.pdf", mime, conteudo));
            assertThat(nome).matches("[0-9a-f-]{36}_doc\\.pdf");
        });
    }

    @Test
    void recusaConteudoQueNaoBateComOTipoDeclarado() {
        // declarado como PDF, mas o conteúdo é um executável (MZ) — deve ser barrado
        assertThatThrownBy(() -> FileStoragePolicy.validateAndSafeName(
                arquivo("falso.pdf", "application/pdf", new byte[]{0x4D, 0x5A, 1, 2, 3, 4, 5, 6})))
                .isInstanceOf(InvalidFileException.class)
                .hasMessageContaining("não corresponde");
    }

    @Test
    void saneiaCaracteresPerigososDoNome() {
        String nome = FileStoragePolicy.validateAndSafeName(
                arquivo("../relatório final (v2).pdf", "application/pdf", HEADERS.get("application/pdf")));

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
