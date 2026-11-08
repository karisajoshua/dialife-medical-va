# Dashboard preview data boundary

The `/dashboard` route and all role workspaces import fictional records from
`src/app/dashboard/demo-data.ts`. There are no dashboard database requests,
service credentials, cookies used as roles, or live record endpoints. The sample
admin identity is display text and grants no permissions. All demo actions use
React state; reload resets them. CSV exports contain sample aggregate totals.

The existing `/api/intake` route remains POST-only, uses the publishable key and
requests `return=minimal`. It does not expose stored applicant or employer rows.
Do not add live dashboard reads until server-validated authentication and role /
record authorization are implemented. Never use a service-role key in a preview.

## Supabase verification — 2026-11-08

- All seven public tables have row level security enabled.
- No public-schema views or callable functions bypass those policies.
- Anonymous reads of applications and employer enquiries have no table grant.
- An anonymous-role transaction returned zero rows from all five workspace tables
  before permissions were tightened.
- Applied remote migration `restrict_anonymous_workspace_access` to remove all
  unnecessary anonymous privileges from the five workspace tables.
- Verified afterward: anonymous SELECT, UPDATE, DELETE and TRUNCATE are false on
  all seven tables. INSERT is allowed only on the two existing public intake tables,
  with existing policies restricting submitted rows to `status = 'new'`.
- Existing authenticated ownership policies were retained.
- Cohorts and training assignments intentionally deny reads until appropriate
  authenticated role policies are designed. The advisor's informational
  `RLS Enabled No Policy` notice for these tables is expected.

Applied SQL:

```sql
revoke all privileges on table
  public.platform_profiles,
  public.training_cohorts,
  public.cohort_enrollments,
  public.training_assignments,
  public.assignment_submissions
from anon;
```

No private record values were used to construct or test the interface.
