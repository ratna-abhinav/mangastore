package com.example.shoppingdotcom.service;

import com.example.shoppingdotcom.config.CustomUser;
import com.example.shoppingdotcom.model.Users;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.security.authentication.TestingAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;

import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.List;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.atomic.AtomicInteger;

import static org.assertj.core.api.Assertions.assertThat;

class SearchRateLimiterTest {

    private MutableClock clock;
    private SearchRateLimiter limiter;

    static final class MutableClock extends Clock {
        volatile long millisUtc = Instant.parse("2026-01-01T00:00:00Z").toEpochMilli();

        @Override
        public ZoneOffset getZone() {
            return ZoneOffset.UTC;
        }

        @Override
        public Clock withZone(java.time.ZoneId zone) {
            return this;
        }

        @Override
        public Instant instant() {
            return Instant.ofEpochMilli(millisUtc);
        }
    }

    @BeforeEach
    void setUp() {
        clock = new MutableClock();
        limiter = new SearchRateLimiter(clock, 2, 4, 3, 6, 10);
    }

    private Authentication anonymous() {
        return new TestingAuthenticationToken("anonymousUser", "n/a");
    }

    private Authentication user(long id, String role) {
        Users users = new Users();
        users.setId((int) id);
        users.setRole(role);
        return new TestingAuthenticationToken(new CustomUser(users), "n/a",
                List.of(new SimpleGrantedAuthority(role)));
    }

    @Test
    void allowsUpToPerMinuteThenBlocksAndRecovers() {
        Authentication anon = anonymous();
        assertThat(limiter.tryAcquireSemantic(anon, "sess-1")).isTrue();
        assertThat(limiter.tryAcquireSemantic(anon, "sess-1")).isTrue();
        assertThat(limiter.tryAcquireSemantic(anon, "sess-1")).isFalse();

        clock.millisUtc += 61_000;
        assertThat(limiter.tryAcquireSemantic(anon, "sess-1")).isTrue();
    }

    @Test
    void dayWindowBlocksAcrossMinuteRolls() {
        Authentication anon = anonymous();
        for (int i = 0; i < 4; i++) {
            clock.millisUtc += 61_000;
            assertThat(limiter.tryAcquireSemantic(anon, "sess-day")).as("attempt " + i).isTrue();
        }
        clock.millisUtc += 61_000;
        assertThat(limiter.tryAcquireSemantic(anon, "sess-day")).isFalse();
    }

    @Test
    void userAndAnonymousBucketsAreIndependent() {
        Authentication u1 = user(1, "ROLE_USER");
        Authentication anon = anonymous();
        assertThat(limiter.tryAcquireSemantic(u1, "ignored")).isTrue();
        assertThat(limiter.tryAcquireSemantic(anon, "shared-session")).isTrue();
        assertThat(limiter.tryAcquireSemantic(u1, "ignored")).isTrue();
        assertThat(limiter.tryAcquireSemantic(anon, "other-session")).isTrue();
    }

    @Test
    void adminAlwaysPasses() {
        Authentication admin = user(9, "ROLE_ADMIN");
        for (int i = 0; i < 25; i++) {
            assertThat(limiter.tryAcquireSemantic(admin, "whatever")).isTrue();
            clock.millisUtc += 1000;
        }
    }

    @Test
    void identityDeniedRequestsDoNotConsumeGlobalBudget() {
        Authentication spammer = anonymous();
        assertThat(limiter.tryAcquireSemantic(spammer, "spam-session")).isTrue();
        assertThat(limiter.tryAcquireSemantic(spammer, "spam-session")).isTrue();
        assertThat(limiter.tryAcquireSemantic(spammer, "spam-session")).isFalse();
        assertThat(limiter.tryAcquireSemantic(spammer, "spam-session")).isFalse();

        int freshAccepted = 0;
        for (int i = 0; i < 9; i++) {
            if (limiter.tryAcquireSemantic(anonymous(), "innocent-" + i)) {
                freshAccepted++;
            }
        }
        assertThat(freshAccepted).isEqualTo(8);
    }

    @Test
    void globalBreakerTripsThenResetsNextUtcDay() {
        Authentication anon = anonymous();
        int accepted = 0;
        for (int i = 0; i < 15; i++) {
            if (limiter.tryAcquireSemantic(anon, "s" + i)) {
                accepted++;
            }
            clock.millisUtc += 61_000;
        }
        assertThat(accepted).isEqualTo(10);

        clock.millisUtc += 24L * 60 * 60 * 1000;
        assertThat(limiter.tryAcquireSemantic(anon, "fresh-day")).isTrue();
    }

    @Test
    void concurrentAcquiresNeverExceedLimit() throws Exception {
        SearchRateLimiter shared = new SearchRateLimiter(clock, 5, 5, 5, 5, 1000);
        int threads = 8;
        int perThread = 10;
        CountDownLatch start = new CountDownLatch(1);
        AtomicInteger successes = new AtomicInteger();
        Thread[] workers = new Thread[threads];
        for (int t = 0; t < threads; t++) {
            workers[t] = new Thread(() -> {
                try {
                    start.await();
                } catch (InterruptedException e) {
                    Thread.currentThread().interrupt();
                }
                for (int i = 0; i < perThread; i++) {
                    if (shared.tryAcquireSemantic(anonymous(), "one-shared-session")) {
                        successes.incrementAndGet();
                    }
                }
            });
            workers[t].start();
        }
        start.countDown();
        for (Thread w : workers) {
            w.join();
        }
        assertThat(successes.get()).isEqualTo(5);
    }
}
