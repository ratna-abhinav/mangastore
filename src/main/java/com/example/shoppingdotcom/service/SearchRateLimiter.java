package com.example.shoppingdotcom.service;

import com.example.shoppingdotcom.config.CustomUser;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Component;

import java.time.Clock;
import java.time.Instant;
import java.util.ArrayDeque;
import java.util.Deque;
import java.util.Iterator;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicLong;

@Component
public class SearchRateLimiter {

    private static final Logger log = LoggerFactory.getLogger(SearchRateLimiter.class);

    private static final long MINUTE_MS = 60_000L;
    private static final long DAY_MS = 24L * 60 * 60 * 1000L;
    private static final long IDLE_EVICT_MS = 60 * 60 * 1000L;
    private static final int MAX_TRACKED_IDENTITIES = 10_000;

    private final Clock clock;
    private final int anonPerMinute;
    private final int anonPerDay;
    private final int userPerMinute;
    private final int userPerDay;
    private final int globalPerDay;

    private final Map<String, IdentityWindow> windows = new ConcurrentHashMap<>();
    private final AtomicLong globalCount = new AtomicLong();
    private volatile long globalDayStart = 0;
    private volatile boolean globalWarned = false;
    private volatile long lastSweep = System.currentTimeMillis();

    public SearchRateLimiter(
            Clock clock,
            @Value("${gemini.ratelimit.anonymous.per-minute:5}") int anonPerMinute,
            @Value("${gemini.ratelimit.anonymous.per-day:30}") int anonPerDay,
            @Value("${gemini.ratelimit.user.per-minute:10}") int userPerMinute,
            @Value("${gemini.ratelimit.user.per-day:75}") int userPerDay,
            @Value("${gemini.ratelimit.global.per-day:200}") int globalPerDay) {
        this.clock = clock;
        this.anonPerMinute = anonPerMinute;
        this.anonPerDay = anonPerDay;
        this.userPerMinute = userPerMinute;
        this.userPerDay = userPerDay;
        this.globalPerDay = globalPerDay;
        log.info("SearchRateLimiter active: anon {}/min {}/day, user {}/min {}/day, global {}/day",
                anonPerMinute, anonPerDay, userPerMinute, userPerDay, globalPerDay);
    }

    public boolean tryAcquireSemantic(Authentication authentication, String sessionId) {
        if (isAdmin(authentication)) {
            return true;
        }

        long nowMs = clock.millis();
        sweepIfDue(nowMs);

        boolean authenticated = authentication != null
                && authentication.getPrincipal() instanceof CustomUser;
        String key;
        if (authenticated) {
            CustomUser principal = (CustomUser) authentication.getPrincipal();
            key = "u:" + principal.user.getId();
        } else {
            key = "s:" + Integer.toHexString(sessionId == null ? 0 : sessionId.hashCode());
        }
        int maxPerMinute = authenticated ? userPerMinute : anonPerMinute;
        int maxPerDay = authenticated ? userPerDay : anonPerDay;

        boolean allowed = acquire(key, nowMs, maxPerMinute, maxPerDay);
        if (!allowed) {
            log.warn("Semantic search rate-limited for {} (used {}/{} today); keyword-only results served",
                    mask(key), dayUsage(key), maxPerDay);
            return false;
        }
        if (!consumeGlobal(nowMs)) {
            refund(key, nowMs);
            return false;
        }
        return true;
    }

    private void refund(String key, long stampMs) {
        IdentityWindow win = windows.get(key);
        if (win == null) {
            return;
        }
        synchronized (win) {
            win.minute.removeLastOccurrence(stampMs);
            win.day.removeLastOccurrence(stampMs);
        }
    }

    private boolean acquire(String key, long nowMs, int maxPerMinute, int maxPerDay) {
        boolean[] allowed = {false};
        windows.compute(key, (k, existing) -> {
            if (existing == null && windows.size() >= MAX_TRACKED_IDENTITIES) {
                return null;
            }
            IdentityWindow win = existing == null ? new IdentityWindow() : existing;
            win.lastSeen = nowMs;
            synchronized (win) {
                purge(win.minute, nowMs - MINUTE_MS);
                purge(win.day, nowMs - DAY_MS);
                if (win.minute.size() < maxPerMinute && win.day.size() < maxPerDay) {
                    win.minute.addLast(nowMs);
                    win.day.addLast(nowMs);
                    allowed[0] = true;
                }
            }
            return win;
        });
        return allowed[0];
    }

    private boolean consumeGlobal(long nowMs) {
        long todayStart = alignedUtcDay(nowMs);
        if (globalDayStart == 0 || todayStart > globalDayStart) {
            globalCount.set(0);
            globalDayStart = todayStart;
            globalWarned = false;
        }
        if (globalCount.incrementAndGet() > globalPerDay) {
            globalCount.decrementAndGet();
            if (!globalWarned) {
                log.warn("Global semantic budget exhausted ({}/day); semantic signal disabled until next UTC day", globalPerDay);
                globalWarned = true;
            }
            return false;
        }
        return true;
    }

    private void sweepIfDue(long nowMs) {
        if (nowMs - lastSweep < MINUTE_MS || windows.isEmpty()) {
            return;
        }
        lastSweep = nowMs;
        windows.values().removeIf(w -> nowMs - w.lastSeen > IDLE_EVICT_MS);
    }

    private long dayUsage(String key) {
        IdentityWindow win = windows.get(key);
        if (win == null) {
            return 0;
        }
        synchronized (win) {
            return win.day.size();
        }
    }

    private boolean isAdmin(Authentication authentication) {
        return authentication != null && authentication.getAuthorities().stream()
                .anyMatch(a -> "ROLE_ADMIN".equals(a.getAuthority()));
    }

    private static void purge(Deque<Long> stamps, long cutoff) {
        Iterator<Long> it = stamps.iterator();
        while (it.hasNext()) {
            if (it.next() < cutoff) {
                it.remove();
            } else {
                break;
            }
        }
    }

    private static String mask(String key) {
        return key.length() <= 4 ? key : key.substring(0, 2) + ":" + key.substring(2, 6) + "…";
    }

    private static long alignedUtcDay(long epochMs) {
        return Instant.ofEpochMilli(epochMs).toEpochMilli() / DAY_MS * DAY_MS;
    }

    private static final class IdentityWindow {
        final Deque<Long> minute = new ArrayDeque<>();
        final Deque<Long> day = new ArrayDeque<>();
        volatile long lastSeen;
    }
}
