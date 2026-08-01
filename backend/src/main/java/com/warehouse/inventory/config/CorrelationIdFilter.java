package com.warehouse.inventory.config;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.slf4j.MDC;
import org.springframework.core.annotation.Order;
import org.springframework.lang.NonNull;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.UUID;

/**
 * Servlet filter that runs once per request to:
 * <ul>
 *   <li>Generate (or propagate) a correlation ID</li>
 *   <li>Place it in the MDC so all log statements in the request include it</li>
 *   <li>Return it in the {@code X-Correlation-Id} response header</li>
 *   <li>Log incoming request method, path, and authenticated actor at INFO level</li>
 * </ul>
 *
 * <p>Ordered first ({@code @Order(1)}) so correlation ID is available for every
 * downstream component including the security filter chain.</p>
 */
@Component
@Order(1)
public class CorrelationIdFilter extends OncePerRequestFilter {

    private static final Logger log = LoggerFactory.getLogger(CorrelationIdFilter.class);

    static final String CORRELATION_ID_HEADER = "X-Correlation-Id";
    static final String MDC_KEY = "correlationId";

    @Override
    protected void doFilterInternal(
            @NonNull HttpServletRequest request,
            @NonNull HttpServletResponse response,
            @NonNull FilterChain filterChain) throws ServletException, IOException {

        String correlationId = request.getHeader(CORRELATION_ID_HEADER);
        if (correlationId == null || correlationId.isBlank()) {
            correlationId = UUID.randomUUID().toString();
        }

        MDC.put(MDC_KEY, correlationId);
        response.setHeader(CORRELATION_ID_HEADER, correlationId);

        try {
            logIncomingRequest(request);
            filterChain.doFilter(request, response);
        } finally {
            MDC.remove(MDC_KEY);
        }
    }

    private void logIncomingRequest(HttpServletRequest request) {
        String actor = resolveActor();
        log.info("Incoming request: [{} {}] actor={}",
                request.getMethod(), request.getRequestURI(), actor);
    }

    private String resolveActor() {
        try {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            if (auth != null && auth.isAuthenticated() && !"anonymousUser".equals(auth.getPrincipal())) {
                return auth.getName();
            }
        } catch (Exception ignored) {
            // Security context may not be populated yet at filter stage
        }
        return "anonymous";
    }
}
