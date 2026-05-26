# Database Access Control Security Summary

Database access control is cited as "the #1 source of critical vulnerabilities in vibe-coded apps." Here are the core principles:

## Key Vulnerabilities to Avoid

**Row-Level Security (RLS):** Tables without RLS are "fully readable and writable by anyone with the anon key." Never use `USING (true)` policies—instead, scope access to row owners: `USING ((SELECT auth.uid()) = user_id)`.

**Missing WITH CHECK:** Always include `WITH CHECK` on INSERT/UPDATE operations. Without it, users can reassign row ownership or impersonate others.

**Sensitive Fields:** If users can update their own profiles, they'll set `is_admin = true`. Move sensitive data to private schema tables or use column-level privileges.

**Related Tables:** Junction tables, audit logs, and metadata often lack policies even when main tables have them. "Every table exposed via the REST API needs its own policies."

**SECURITY DEFINER Functions:** These bypass RLS entirely. Keep them in private schemas, set `search_path = ''`, and validate all inputs.

## Platform-Specific Guidance

- **Supabase:** Enable RLS on all tables; scope storage bucket policies to user UID folders
- **Firebase:** Never use default rules like `allow read, write: if true`. Use field-level protection and remember subcollections need explicit rules
- **Convex:** Call `ctx.auth.getUserIdentity()` in public functions and verify resource ownership, not just authentication
