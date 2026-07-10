package com.auditflow.service;

import com.auditflow.exception.FileAccessException;
import com.auditflow.exception.FileStorageException;
import jakarta.annotation.PostConstruct;
import jakarta.annotation.PreDestroy;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import software.amazon.awssdk.auth.credentials.AwsBasicCredentials;
import software.amazon.awssdk.auth.credentials.StaticCredentialsProvider;
import software.amazon.awssdk.core.ResponseBytes;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.http.apache.ApacheHttpClient;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.S3Configuration;
import software.amazon.awssdk.services.s3.model.GetObjectRequest;
import software.amazon.awssdk.services.s3.model.GetObjectResponse;
import software.amazon.awssdk.services.s3.model.NoSuchKeyException;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;
import software.amazon.awssdk.services.s3.model.S3Exception;

import java.io.IOException;
import java.net.URI;
import java.util.UUID;

/**
 * Armazenamento em Cloudflare R2 (API compatível com S3) via AWS SDK v2.
 * Ativado com storage.provider=r2. Os documentos são gravados sob a chave
 * {@code <tenantId>/<cycleId>/<uuid>_<nome-seguro>} — o mesmo layout do storage local,
 * mas em bucket de objetos (persistente e independente do host da aplicação).
 */
@Slf4j
@Service
@ConditionalOnProperty(name = "storage.provider", havingValue = "r2")
public class R2FileStorageService implements StorageService {

    @Value("${r2.account-id:}")
    private String accountId;

    @Value("${r2.endpoint:}")
    private String endpointOverride;

    @Value("${r2.access-key-id}")
    private String accessKeyId;

    @Value("${r2.secret-access-key}")
    private String secretAccessKey;

    @Value("${r2.bucket}")
    private String bucket;

    private S3Client s3;

    @PostConstruct
    void init() {
        if ((accountId == null || accountId.isBlank()) && (endpointOverride == null || endpointOverride.isBlank())) {
            throw new IllegalStateException(
                    "Configure r2.account-id (ou r2.endpoint) para usar storage.provider=r2");
        }
        if (accessKeyId == null || accessKeyId.isBlank()
                || secretAccessKey == null || secretAccessKey.isBlank()) {
            throw new IllegalStateException(
                    "Configure r2.access-key-id e r2.secret-access-key para usar storage.provider=r2");
        }
        if (bucket == null || bucket.isBlank()) {
            throw new IllegalStateException("Configure r2.bucket para usar storage.provider=r2");
        }

        String endpoint = (endpointOverride != null && !endpointOverride.isBlank())
                ? endpointOverride
                : "https://" + accountId + ".r2.cloudflarestorage.com";

        this.s3 = S3Client.builder()
                .endpointOverride(URI.create(endpoint))
                .region(Region.of("auto")) // R2 ignora a região, mas o SDK exige uma
                .credentialsProvider(StaticCredentialsProvider.create(
                        AwsBasicCredentials.create(accessKeyId, secretAccessKey)))
                .serviceConfiguration(S3Configuration.builder()
                        .pathStyleAccessEnabled(true)
                        .build())
                .httpClient(ApacheHttpClient.create())
                .build();

        log.info("[storage] R2 habilitado — endpoint: {}, bucket: {}", endpoint, bucket);
    }

    @PreDestroy
    void shutdown() {
        if (s3 != null) {
            s3.close();
        }
    }

    @Override
    public String store(MultipartFile file, UUID tenantId, UUID cycleId) {
        String safeFilename = FileStoragePolicy.validateAndSafeName(file);
        String key = tenantId + "/" + cycleId + "/" + safeFilename;

        try {
            PutObjectRequest request = PutObjectRequest.builder()
                    .bucket(bucket)
                    .key(key)
                    .contentType(file.getContentType())
                    .contentLength(file.getSize())
                    .build();
            s3.putObject(request, RequestBody.fromInputStream(file.getInputStream(), file.getSize()));
            return key;
        } catch (IOException | S3Exception e) {
            throw new FileStorageException("Falha ao enviar arquivo para o R2: " + e.getMessage(), e);
        }
    }

    @Override
    public Resource loadAsResource(String storagePath) {
        try {
            ResponseBytes<GetObjectResponse> object = s3.getObjectAsBytes(GetObjectRequest.builder()
                    .bucket(bucket)
                    .key(storagePath)
                    .build());
            String filename = storagePath.substring(storagePath.lastIndexOf('/') + 1);
            return new NamedByteArrayResource(object.asByteArray(), filename);
        } catch (NoSuchKeyException e) {
            throw new FileAccessException("Arquivo não encontrado no R2");
        } catch (S3Exception e) {
            throw new FileAccessException("Falha ao ler arquivo do R2: " + e.getMessage(), e);
        }
    }

    /** ByteArrayResource que preserva o nome do arquivo (usado no Content-Disposition do download). */
    private static final class NamedByteArrayResource extends ByteArrayResource {
        private final String filename;

        NamedByteArrayResource(byte[] bytes, String filename) {
            super(bytes);
            this.filename = filename;
        }

        @Override
        public String getFilename() {
            return filename;
        }
    }
}
