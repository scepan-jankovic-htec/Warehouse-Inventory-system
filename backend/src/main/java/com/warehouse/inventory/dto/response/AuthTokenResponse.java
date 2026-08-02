package com.warehouse.inventory.dto.response;

public record AuthTokenResponse(
        String token,
        String tokenType,
        long expiresInMs
) {
}
