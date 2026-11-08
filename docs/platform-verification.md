# Live platform verification — 2026-11-08

## Deployed source

- Production: https://dialife-medical-va.vercel.app
- Deployment: `dpl_3QbggpQFHQy3vkKLswN1ZPBVCrRi`, READY.
- Application commit: `03a0f9c8617aee7fdff1dfbb9882d11fa216e262`.
- Pull request: https://github.com/karisajoshua/dialife-medical-va/pull/4

## Completed checks

- Production build, TypeScript and ESLint passed without lint findings.
- Database assertions: 45 passed, zero failed. All 34 application tables have
  RLS; anonymous SELECT is denied on every table; file storage is private.
- Production HTTP assertions: 69 passed using seven disposable, verified test
  identities. Tested lesson completion, enrollment, trainer grading, certificates,
  employer requests, candidate matching, interviews, placements, task completion,
  shifts, timesheet approvals, support replies, calendar events, notification
  acknowledgements, simulation evaluations, file upload and signed downloads.
- Negative checks rejected anonymous access, another learner's records, unrelated
  employer access, self-assigned admin roles, self-grading and VA self-approval.
- Server-rendered dashboard recognized the verified session. Live overview totals
  and authorized form relation choices reflected the saved fixtures.
- The 29 tracked workflow fixtures and all seven test identities were removed.
  Verification returned zero remaining test accounts, zero test programs and zero
  private storage objects. No emails were sent by the integration tests.
- Production browser inspection retained the approved navy navigation, pastel
  metrics, workspace cards, activity, pipeline and right rail. See
  `docs/qa/live-platform-production.jpg`. The capture is 1363 × 936; the original
  approved reference is 1672 × 941. The earlier same-viewport comparisons and
  responsive evidence remain in `design-qa.md` and `docs/qa`.
- This inspection found no new layout regressions. Minor reference font and
  background texture differences remain as previously documented.
- Browser logs contained extension metadata errors only; no app warning or error
  appeared in the inspected production preview.

## Remaining configuration / verification gaps

The Supabase management connector cannot read or edit Auth URL configuration.
The browser dashboard required sign-in; the secure sign-in request timed out
without a confirmed authenticated session. The Site URL and allowed confirmation /
recovery redirects therefore remain unverified. The exact required values are in
`docs/live-platform.md`. Email delivery and recovery have not been tested end to
end, although password sign-in with confirmed identities passed.

Supabase's security advisor also reported leaked-password protection disabled.
This is an Auth setting rather than a missing table policy. Availability may depend
on the project's plan. Remediation:
https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection

External voice calling and automated AI scoring are not connected. The platform
stores synthetic practice scenarios, transcripts, recordings and trainer feedback.
