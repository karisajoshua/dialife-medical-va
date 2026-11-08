# Dialife Medical VA

> Connecting Healthcare Talent with Global Opportunities.

**Dialife Medical VA** is a healthcare virtual-assistant training, assessment, recruitment and workforce-management platform developed under **Dialife Ltd**. The platform aims to prepare healthcare-background professionals in Africa for remote medical administrative roles and help international healthcare organizations identify qualified talent.

**Status:** Early-stage development. The marketing website is the first milestone. Candidate registration, employer onboarding, secure portals, payments, AI voice training and placements are planned features, **not currently operational**.

## Product vision

Build a credible, accessible, internationally oriented medical VA ecosystem that combines structured training, realistic simulated practice, competency-based assessment, employer matching and post-placement quality management.

### Audiences

| Audience | Intended experience |
| --- | --- |
| Prospective trainees | Learn about eligibility and curriculum, apply, enroll, train and track progress |
| Graduates / medical VAs | Manage verified skills, availability, job applications and placements |
| Healthcare employers | Request staffing, verify organization, shortlist candidates and manage hires |
| Trainers | Deliver lessons, mark assessments and review simulations |
| Dialife operations | Manage applications, cohorts, employers, quality, billing and reporting |

## Delivery roadmap

### Phase 1 — Marketing website (in progress)

- Responsive homepage aligned to the approved navy, teal and white concept
- Public information on the academy, employer solutions, benefits and process
- Distinct calls to action for candidates and healthcare employers
- Accessible mobile navigation, metadata and search-friendly page structure
- Dedicated entry routes: `/apply`, `/academy`, `/employers/register`, `/login`
- Contact information, privacy disclosures and policy pages after approval

**Current limitation:** The entry routes are informational placeholders; they do not yet collect data or authenticate users.

### Phase 2 — Applications, authentication and administration

- Candidate applications, eligibility screening and document verification
- Employer inquiries, verification and staffing requests
- Role-based authentication, access control and secure account recovery
- Admin dashboard, application review, notifications and audit events

### Phase 3 — Four-week academy

- Week 1: Healthcare administration, terminology, confidentiality and remote work
- Week 2: Scheduling, EHR sandbox workflows, referrals and insurance basics
- Week 3: Patient communication, AI-assisted administration and simulation practice
- Week 4: Practical assessment, professional readiness and final evaluation
- Course content, cohorts, quizzes, instructor feedback and verifiable completion certificates

### Phase 4 — AI simulation lab

- Synthetic patient personas and configurable administrative scenarios
- Simulated voice calls, transcripts, evaluation rubrics and instructor review
- Escalation practice and safeguards against unauthorized clinical advice
- Usage tracking, consent notices and retention controls

### Phase 5 — Recruitment and workforce operations

- Employer profiles, job requests, candidate matching and interviews
- Placement workflow, contracts, schedules, timesheets and performance feedback
- Billing, support tickets, operational reporting and ongoing development

## Technology stack

| Layer | Current / planned choice |
| --- | --- |
| Frontend | Next.js App Router, React, TypeScript |
| Styling | CSS; component library may be added as the product grows |
| Icons | lucide-react |
| Hosting | Vercel (planned; not yet connected) |
| Database / auth | Supabase (planned; not configured) |
| Voice simulation | Provider integration to be evaluated; ElevenLabs is a candidate |
| Payments | Provider selection pending market, entity and fee validation |

## Local development

**Prerequisites:** Node.js 20+ and npm.

```bash
git clone https://github.com/karisajoshua/dialife-medical-va.git
cd dialife-medical-va
git checkout feat/marketing-homepage
npm install
npm run dev
```

Open `http://localhost:3000`.

Other commands:

```bash
npm run build
npm run start
npm run lint
```

There is no database configuration or environment secret required for the initial static marketing site. A lockfile and automated CI checks should be committed before production release.

## Repository structure

```text
src/
  app/
    page.tsx                 # Marketing homepage
    globals.css              # Responsive site styles
    layout.tsx               # Metadata and shared document
    academy/page.tsx         # Academy information placeholder
    apply/page.tsx           # Candidate application placeholder
    employers/register/page.tsx # Employer intake placeholder
    login/page.tsx           # Authentication placeholder
```

## Design direction

The approved concept uses deep navy, medical teal, aqua accents, bright white backgrounds, spacious typography, strong call-to-action buttons, and a healthcare-professional hero image. The site should communicate **training and healthcare staffing** as equal business pillars. All pages should be responsive and keyboard accessible.

The original approved mockup is a design reference, not a deployed screenshot. Image licensing and the final approved brand assets must be verified before launch.

## Privacy, safety and compliance

The current marketing site must not collect patient data. Future healthcare-facing functionality requires a documented legal and security review for applicable jurisdictions (including HIPAA-related obligations for US engagements, relevant Canadian and UK requirements, and Kenya's Data Protection Act).

Before processing protected or sensitive information, confirm the controller/processor roles, contracts and any required business associate agreements, hosting and subprocessors, encryption, least-privilege access, logging, breach response, data retention and deletion, and training procedures.

- Training completion is **not** government-issued HIPAA certification.
- Medical VA training does **not** confer clinical licensure.
- No employment, placement rate, accreditation or employer partnership is guaranteed.
- Use **synthetic patient data** in training simulations.
- AI assistants must not autonomously diagnose, prescribe or make clinical decisions.

## Product decisions still to confirm

1. Final logo and brand assets
2. Domain and verified company contact details
3. Training fee, eligibility rules, admissions dates and refund policy
4. Supported employer markets and contracting model
5. Privacy policy, terms and employer agreements
6. Production hosting and data-processing arrangements
7. Approved imagery and content ownership

## Contribution workflow

Use feature branches and pull requests. Do not push unfinished portal functionality directly to `main`. Run a production build and check mobile layout, navigation, accessibility and copy before merge. Never commit API keys, credentials or patient records.

## Ownership

Dialife Medical VA is a Dialife Ltd initiative. Business and legal details are subject to confirmation.

---
**Current milestone:** Marketing homepage and navigation foundations. **Next:** Preview deployment, visual review, and functional application flows.


## Approved dashboard implementation

Open `/dashboard` for the responsive Operations Command Center. The marketing
header and footer remain on public pages; dashboards have dedicated navigation.
The portal preview entry point at `/login` links to the dashboard.

- All five role workspaces are available under `/dashboard/{role}`.
- Sidebar modules cover applications, cohorts, programs, assessments, placements
  and reports; the employer partners list opens from its metric card.
- Search, filtering, sample application review, cohort / employer demo creation,
  task completion, event details and sample CSV downloads work with fictional data.
- Demo actions use page state and reset on reload; no private records are fetched.
- See [design QA](design-qa.md), [visual comparison](docs/qa/comparison.jpg),
  and [data boundary](docs/dashboard-security.md).

Run `npm ci`, `npm run dev` and `npm run build`. The dev wrapper accepts normal
Next flags plus preview-host `--host`, `--port` and `--strictPort` flags.
Development builds use `.next-dev` so QA does not collide with production builds.
