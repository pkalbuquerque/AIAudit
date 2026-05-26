# Authentication & Authorization Security Summary

## JWT Best Practices
The documentation emphasizes using `jwt.verify()` rather than `jwt.decode()` alone, since decode "reads the payload without checking the signature — an attacker can forge any payload." Additionally, systems must explicitly reject tokens with `"alg": "none"` and validate issuer, audience, and expiration claims beyond just signature verification.

## Next.js Middleware Limitations
While convenient, Next.js middleware alone is insufficient for security. The guidance notes that "middleware could be completely bypassed via a spoofed `x-middleware-subrequest` header." Authentication must be independently verified in Server Actions, Route Handlers, and data access functions.

## Server Actions Require Three Security Layers
Server Actions are public POST endpoints accessible via tools like curl. Each requires:
1. **Input validation** using runtime schemas (Zod)
2. **Authentication** confirming user login status
3. **Authorization** verifying resource ownership (not just login)

## API Route Handler Security
The same authentication and authorization requirements apply to `app/api/` route handlers as all endpoints are publicly accessible.

## Client-Side Data Protection
Never expose complete database objects to client components, as they may contain "sensitive fields (hashed passwords, internal IDs, admin flags)." Use field selection to pass only necessary data, and employ `import 'server-only'` to prevent accidental client-side imports.

## Token Storage
Store authentication tokens in "HttpOnly + Secure + SameSite=Lax" cookies rather than localStorage, since localStorage remains vulnerable to XSS attacks.
