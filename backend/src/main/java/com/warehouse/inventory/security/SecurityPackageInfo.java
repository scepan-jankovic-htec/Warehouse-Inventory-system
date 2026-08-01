package com.warehouse.inventory.security;

/**
 * Package for authentication, authorization, and security filters.
 * 
 * This package contains:
 * 
 * 1. JWT Utilities:
 *    - JwtTokenProvider: Generates and validates JWT tokens
 *    - Token generation includes user ID, role, and expiration
 *    - Token validation checks signature and expiration
 *    - Handles JWT parsing errors gracefully
 * 
 * 2. Security Filters:
 *    - JwtAuthenticationFilter: Runs on every request, extracts bearer token
 *      from Authorization header, validates it, and sets Spring Security context
 *    - Skips filter for public endpoints (e.g., /api/auth/login)
 *    - Returns 401 Unauthorized if token is invalid or missing
 * 
 * 3. User Details:
 *    - CustomUserDetails: Implements UserDetails for Spring Security
 *    - Holds user ID, username, role, and authority information
 *    - Used to populate SecurityContext after token validation
 * 
 * 4. UserDetailsService:
 *    - CustomUserDetailsService: Loads user by username from database
 *    - Used by Spring Security for authentication
 *    - Raises UsernameNotFoundException if user not found or inactive
 * 
 * Security policy:
 * - All endpoints except /api/auth/* require a valid bearer token
 * - Authorization is role-based using UserRole enum
 * - Password is hashed with BCrypt, never stored or transmitted in plaintext
 * - JWT token secret and expiration are configured in application.properties
 * - Correlation IDs are tracked for all security-related events
 */
class SecurityPackageInfo {
}
