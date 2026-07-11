package com.auditflow.service;

import com.auditflow.exception.InvalidFileException;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

/**
 * Regras de aceitação de arquivos compartilhadas por todas as implementações de
 * {@link StorageService} (local e R2): tipos permitidos, tamanho máximo e
 * saneamento do nome. Centraliza a política para não divergir entre back-ends.
 */
final class FileStoragePolicy {

    static final Set<String> ALLOWED_MIME_TYPES = Set.of(
            "application/pdf",
            "application/vnd.ms-excel",
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            "text/csv",
            "image/png",
            "image/jpeg"
    );

    static final long MAX_SIZE_BYTES = 20L * 1024 * 1024; // 20 MB

    /**
     * Assinaturas (magic bytes) esperadas por tipo. text/csv não tem assinatura — é validado
     * apenas pelo Content-Type declarado (não há como sniffar texto puro com segurança).
     */
    private static final Map<String, List<byte[]>> MAGIC_BYTES = Map.of(
            "application/pdf", List.of(new byte[]{0x25, 0x50, 0x44, 0x46}),                       // %PDF
            "image/png", List.of(new byte[]{(byte) 0x89, 0x50, 0x4E, 0x47}),                       // .PNG
            "image/jpeg", List.of(new byte[]{(byte) 0xFF, (byte) 0xD8, (byte) 0xFF}),              // JFIF/EXIF
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                    List.of(new byte[]{0x50, 0x4B, 0x03, 0x04},                                    // PK.. (zip/OOXML)
                            new byte[]{0x50, 0x4B, 0x05, 0x06}, new byte[]{0x50, 0x4B, 0x07, 0x08}),
            "application/vnd.ms-excel",
                    List.of(new byte[]{(byte) 0xD0, (byte) 0xCF, 0x11, (byte) 0xE0})               // OLE2 (xls antigo)
    );

    private FileStoragePolicy() {
    }

    /**
     * Valida o arquivo (não vazio, dentro do limite, tipo permitido, nome presente)
     * e devolve um nome de arquivo seguro, prefixado por um UUID e sem caracteres perigosos.
     *
     * @throws InvalidFileException se o arquivo violar qualquer regra.
     */
    static String validateAndSafeName(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new InvalidFileException("Arquivo inválido ou vazio");
        }
        if (file.getSize() > MAX_SIZE_BYTES) {
            throw new InvalidFileException("Arquivo excede o tamanho máximo permitido de 20 MB");
        }

        String contentType = file.getContentType();
        if (contentType == null || !ALLOWED_MIME_TYPES.contains(contentType)) {
            throw new InvalidFileException(
                    "Tipo de arquivo não permitido: " + contentType +
                    ". Permitidos: PDF, XLS, XLSX, CSV, PNG, JPG");
        }

        verifyMagicBytes(file, contentType);

        String originalFilename = file.getOriginalFilename();
        if (originalFilename == null || originalFilename.isBlank()) {
            throw new InvalidFileException("Nome de arquivo inválido");
        }

        return UUID.randomUUID() + "_" + originalFilename.replaceAll("[^a-zA-Z0-9._-]", "_");
    }

    /**
     * Confere se o conteúdo real do arquivo bate com o tipo declarado (magic bytes), impedindo
     * um binário disfarçado (ex.: .exe enviado como application/pdf). CSV é isento.
     */
    private static void verifyMagicBytes(MultipartFile file, String contentType) {
        List<byte[]> assinaturas = MAGIC_BYTES.get(contentType);
        if (assinaturas == null) {
            return; // text/csv — sem assinatura confiável
        }

        byte[] header = new byte[8];
        int lidos;
        try (InputStream in = file.getInputStream()) {
            lidos = in.readNBytes(header, 0, header.length);
        } catch (IOException e) {
            throw new InvalidFileException("Não foi possível ler o arquivo enviado");
        }

        for (byte[] assinatura : assinaturas) {
            if (comecaCom(header, lidos, assinatura)) {
                return;
            }
        }
        throw new InvalidFileException(
                "O conteúdo do arquivo não corresponde ao tipo informado (" + contentType + ").");
    }

    private static boolean comecaCom(byte[] header, int lidos, byte[] assinatura) {
        if (lidos < assinatura.length) {
            return false;
        }
        for (int i = 0; i < assinatura.length; i++) {
            if (header[i] != assinatura[i]) {
                return false;
            }
        }
        return true;
    }
}
