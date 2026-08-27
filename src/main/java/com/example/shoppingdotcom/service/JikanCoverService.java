package com.example.shoppingdotcom.service;

import com.fasterxml.jackson.databind.JsonNode;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.Optional;

@Service
public class JikanCoverService {

    private static final Logger log = LoggerFactory.getLogger(JikanCoverService.class);
    private static final String JIKAN_BASE = "https://api.jikan.moe/v4/manga";
    private static final Duration TIMEOUT = Duration.ofSeconds(10);

    private final HttpClient httpClient;
    private final NeonStorageService neonStorageService;

    public JikanCoverService(NeonStorageService neonStorageService) {
        this.neonStorageService = neonStorageService;
        this.httpClient = HttpClient.newBuilder()
                .connectTimeout(TIMEOUT)
                .followRedirects(HttpClient.Redirect.NORMAL)
                .build();
    }

    public Optional<String> fetchAndUploadCover(String query, String folder) {
        if (query == null || query.isBlank()) {
            return Optional.empty();
        }
        try {
            String coverUrl = fetchCoverUrl(query);
            if (coverUrl == null) {
                log.info("No Jikan hit for '{}'", query);
                return Optional.empty();
            }
            log.info("Jikan hit for '{}' -> {}", query, coverUrl);
            byte[] bytes = downloadBytes(coverUrl);
            if (bytes == null || bytes.length == 0) {
                log.warn("Failed to download cover for '{}' from {}", query, coverUrl);
                return Optional.empty();
            }
            String contentType = guessContentType(coverUrl);
            String neonUrl = neonStorageService.uploadBytes(folder, bytes, contentType);
            log.info("Uploaded cover for '{}' to {}", query, neonUrl);
            Thread.sleep(400);
            return Optional.of(neonUrl);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            return Optional.empty();
        } catch (Exception e) {
            log.warn("Cover fetch failed for '{}': {}", query, e.getMessage());
            return Optional.empty();
        }
    }

    private String fetchCoverUrl(String query) throws IOException, InterruptedException {
        String encoded = URLEncoder.encode(query, StandardCharsets.UTF_8);
        String url = JIKAN_BASE + "?q=" + encoded + "&limit=1&sfw=true&order_by=popularity&sort=desc";
        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(url))
                .header("Accept", "application/json")
                .timeout(TIMEOUT)
                .GET()
                .build();
        HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
        if (response.statusCode() != 200) {
            log.warn("Jikan API status {} for query '{}'", response.statusCode(), query);
            return null;
        }
        String body = response.body();
        int idx = body.indexOf("\"large_image_url\"");
        if (idx < 0) {
            idx = body.indexOf("\"image_url\"");
        }
        if (idx < 0) {
            return null;
        }
        int start = body.indexOf('"', idx + 16);
        if (start < 0) return null;
        int end = body.indexOf('"', start + 1);
        if (end < 0) return null;
        String imageUrl = body.substring(start + 1, end).replace("\\/", "/");
        if (imageUrl.isBlank() || imageUrl.contains("questionmark")) {
            return null;
        }
        return imageUrl;
    }

    private byte[] downloadBytes(String url) throws IOException, InterruptedException {
        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(url))
                .header("Accept", "image/*")
                .timeout(TIMEOUT)
                .GET()
                .build();
        HttpResponse<byte[]> response = httpClient.send(request, HttpResponse.BodyHandlers.ofByteArray());
        if (response.statusCode() != 200) {
            return null;
        }
        return response.body();
    }

    private String guessContentType(String url) {
        String lower = url.toLowerCase();
        if (lower.contains(".png")) return "image/png";
        if (lower.contains(".webp")) return "image/webp";
        return "image/jpeg";
    }
}
