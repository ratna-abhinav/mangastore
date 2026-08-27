package com.example.shoppingdotcom.service;

import java.io.IOException;
import java.io.InputStream;
import java.net.URI;
import java.util.Locale;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import jakarta.annotation.PostConstruct;
import software.amazon.awssdk.auth.credentials.AwsBasicCredentials;
import software.amazon.awssdk.auth.credentials.StaticCredentialsProvider;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.s3.S3Client;

@Service
public class NeonStorageService {

    private static final String ALLOWED_EXTENSIONS = "\\.(png|jpe?g|gif|webp|bmp|svg)";

    @Value("${neon.s3.endpoint}")
    private String endpoint;

    @Value("${neon.s3.region}")
    private String region;

    @Value("${neon.s3.access-key}")
    private String accessKey;

    @Value("${neon.s3.secret-key}")
    private String secretKey;

    @Value("${neon.bucket-name}")
    private String bucketName;

    private S3Client s3Client;

    @PostConstruct
    void init() {
        s3Client = S3Client.builder()
                .endpointOverride(URI.create(endpoint))
                .region(Region.of(region))
                .forcePathStyle(true)
                .credentialsProvider(StaticCredentialsProvider.create(
                        AwsBasicCredentials.create(accessKey, secretKey)))
                .build();
    }

    public String uploadFile(String folder, MultipartFile file) throws IOException {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("File is empty");
        }

        String key = sanitizeKey(folder) + "/" + UUID.randomUUID() + resolveExtension(file.getOriginalFilename());

        try (InputStream in = file.getInputStream()) {
            s3Client.putObject(
                    software.amazon.awssdk.services.s3.model.PutObjectRequest.builder()
                            .bucket(bucketName)
                            .key(key)
                            .contentType(file.getContentType())
                            .cacheControl("public, max-age=604800")
                            .build(),
                    RequestBody.fromInputStream(in, file.getSize()));
        }

        return publicUrl(key);
    }

    public String uploadBytes(String folder, byte[] bytes, String contentType) throws IOException {
        if (bytes == null || bytes.length == 0) {
            throw new IllegalArgumentException("Bytes are empty");
        }
        String extension = ".jpg";
        if (contentType != null && contentType.toLowerCase(Locale.ROOT).contains("png")) {
            extension = ".png";
        } else if (contentType != null && contentType.toLowerCase(Locale.ROOT).contains("webp")) {
            extension = ".webp";
        }
        String key = sanitizeKey(folder) + "/" + UUID.randomUUID() + extension;
        s3Client.putObject(
                software.amazon.awssdk.services.s3.model.PutObjectRequest.builder()
                        .bucket(bucketName)
                        .key(key)
                        .contentType(contentType != null ? contentType : "image/jpeg")
                        .cacheControl("public, max-age=604800")
                        .build(),
                RequestBody.fromBytes(bytes));
        return publicUrl(key);
    }

    public String publicUrl(String key) {
        return String.format("%s/%s/%s", endpoint.replaceAll("/+$", ""), bucketName, key);
    }

    private String sanitizeKey(String folder) {
        return folder == null ? "misc" : folder.replaceAll("[^a-zA-Z0-9-_]", "");
    }

    private String resolveExtension(String originalFilename) {
        if (originalFilename == null) {
            return ".bin";
        }
        int dotIndex = originalFilename.lastIndexOf('.');
        if (dotIndex < 0 || dotIndex == originalFilename.length() - 1) {
            return ".bin";
        }
        String ext = originalFilename.substring(dotIndex).toLowerCase(Locale.ROOT);
        return ext.matches(ALLOWED_EXTENSIONS) ? ext : ".bin";
    }
}
