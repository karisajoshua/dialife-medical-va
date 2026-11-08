# Dashboard data boundary

Anonymous visitors to `/dashboard` see the approved fictional preview. Preview
interactions stay in browser state and do not call the private platform API.
Signed-in users can explicitly select the same preview with `?mode=demo`.

Verified accounts see a live workspace. Supabase SSR refreshes the cookie session;
the server verifies signed JWT claims, then reads the account's current profile
through RLS. The role is never taken from user-editable metadata. Profile policies
also require a current, confirmed, non-anonymous account in `auth.users`.
Removed accounts and changed roles therefore take effect on subsequent requests.

Every `/api/platform/*` handler requires this identity, disables shared caching,
validates fields and uses the user's session with the publishable key. RLS enforces
record ownership, assigned cohorts, and employer organization membership, including
when the REST API is called directly. Database triggers protect sensitive fields
such as roles, grades and timesheet approvals. The deployed app has no service-role
or management key.

All 34 application tables have RLS enabled. Anonymous SELECT is denied on every
application table. Public intake allows INSERT only on safe input columns and
requires new status; it returns no stored rows. Submitted applicant records become
associated with the matching verified email account.

`Admin@dialifeva.com` is the approved bootstrap owner address. It grants no access
until Supabase verifies that address. New accounts otherwise start as applicants;
only administrators can assign staff roles. No owner password is preset.

Documents use the private `dialife-private` bucket, owner-scoped object paths,
validated metadata and five-minute signed download URLs. Other accounts cannot
retrieve their metadata or request signed downloads. Uploads are limited to 10 MB
and the configured document, image and audio MIME types.

## Verification

`tests/platform-rls.sql` passed 45 authorization checks on 2026-11-08, including
cross-account isolation, forged role metadata, protected grading, employer
isolation, VA self-approval denial, cohort capacity and anonymous intake. Its
synthetic fixtures are rolled back. Supabase security advisors were also checked.

`tests/platform-http.mjs` tests the actual authenticated HTTP workflows using
isolated, disposable identities. Secrets are supplied outside the repository.
See `docs/live-platform.md` for operational setup and the explicit Supabase Auth
callback URL configuration.

No patient records or real medical information are included in preview data or
integration fixtures. Simulation scenarios are fictional training material.
