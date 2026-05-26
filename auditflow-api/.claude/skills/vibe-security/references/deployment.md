# Deployment Security

## Key Configuration Points

**Debug and Source Protection**: Disable debug mode and source maps in production. Debug pages often leak stack traces, environment variables, and internal paths. Verify your `.git` directory remains inaccessible via HTTP.

**Environment Management**: Maintain separate configurations across production, preview, and development environments. Preview deployments should never use production credentials.

**Security Headers**: Implement a restrictive Content Security Policy as your baseline. Apply headers across all responses:
- `Strict-Transport-Security: max-age=31536000; includeSubDomains`
- `X-Frame-Options: DENY`
- `X-Content-Type-Options: nosniff`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy: camera=(), microphone=(), geolocation=()`

**Pre-Deployment Checklist**:
- Run `gitleaks detect` to scan for leaked secrets in version history
- Confirm `.env` files are gitignored
- Validate that error messages don't expose sensitive stack traces
- Disable verbose logging (`show-sql`, debug logs) in production

**CORS Safeguards**: Never apply wildcard origins (`*`) to authenticated endpoints. Whitelist specific domains explicitly. When using credentials, pair them only with exact origins.
