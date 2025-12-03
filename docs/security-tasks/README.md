# Security Remediation Tasks

This directory contains task prompts for addressing security vulnerabilities identified in the December 2025 security audit.

## Task Priority

### ✅ Completed
- [TASK-001](./TASK-001-remove-hardcoded-secret.md) - ~~Remove hardcoded fallback secret key~~ ✅ (PR #45)

### 🔴 Critical (Immediate)
- [TASK-002](./TASK-002-rate-limiting.md) - Implement rate limiting on auth endpoints

### 🟠 High (This Week)
- [TASK-003](./TASK-003-remove-sensitive-logs.md) - Remove sensitive data from OAuth logs
- [TASK-004](./TASK-004-password-complexity.md) - Improve password complexity requirements
- [TASK-005](./TASK-005-security-headers.md) - Add security headers middleware
- [TASK-006](./TASK-006-restrict-image-domains.md) - Restrict image domains in Next.js config
- [TASK-007](./TASK-007-csrf-protection.md) - Enhance CSRF protection

### 🟡 Medium (This Month)
- [TASK-008](./TASK-008-user-enumeration.md) - Fix user enumeration vulnerability
- [TASK-009](./TASK-009-share-token-controls.md) - Add share token access controls
- [TASK-010](./TASK-010-structured-logging.md) - Implement structured logging
- [TASK-011](./TASK-011-input-sanitization.md) - Add input sanitization for text fields
- [TASK-012](./TASK-012-session-invalidation.md) - Session invalidation on password change
- [TASK-013](./TASK-013-account-lockout.md) - Implement account lockout mechanism

### 🔵 Low (Next Month)
- [TASK-014](./TASK-014-request-size-limits.md) - Add request size limits
- [TASK-015](./TASK-015-client-error-handling.md) - Improve client-side error handling
- [TASK-016](./TASK-016-session-refresh.md) - Implement session refresh mechanism
- [TASK-017](./TASK-017-oauth-timeout-ux.md) - Improve OAuth timeout UX

### ℹ️ Informational (Future)
- [TASK-018](./TASK-018-two-factor-auth.md) - Implement two-factor authentication
- [TASK-019](./TASK-019-password-reset.md) - Add password reset functionality
- [TASK-020](./TASK-020-dependency-scanning.md) - Set up dependency vulnerability scanning

## How to Use These Tasks

Each task document contains:
1. **Context** - Background on the security issue
2. **Requirements** - What needs to be implemented
3. **Implementation Guide** - Step-by-step instructions
4. **Acceptance Criteria** - How to verify the fix
5. **Testing Instructions** - How to test the implementation
6. **Files to Modify** - Specific files that need changes

Hand these documents to an AI agent with access to the codebase for implementation.
