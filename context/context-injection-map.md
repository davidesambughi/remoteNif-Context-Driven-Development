# Context Injection Map

Which files to inject per feature session, in addition to the five always-injected files.

## Always Injected (Every Session)

- `context/AGENTS.md`
- `context/progress-tracker.md`
- `context/code-standards.md`
- `context/ai-workflow-rules.md`
- `context/architecture-context.md`

---

## Situational Files

| File | Inject when |
|------|-------------|
| `context/ui-context.md` | Any session building UI components |
| `context/tech-spec.md` | Any session touching DB, Stripe, Auth, or Storage |
| `context/user-flows.md` | Any session building multi-step user journeys |
| `context/project-overview.md` | Copy decisions about fiscal rep (Feature 18), SEO strategy (Feature 19), or scope questions |
| `context/architecture-reference.md` | Infrastructure changes, deployment, queue logic, or scalability decisions |

---

## Per-Feature Breakdown

| Feature | + ui-context | + tech-spec | + user-flows | + overview | + arch-reference |
|---------|:---:|:---:|:---:|:---:|:---:|
| 06b — Pricing Deadline Logic | ✓ | | | | |
| 06c — Marketing Button Audit | ✓ | | | | |
| 07 — Checkout | ✓ | ✓ | ✓ | | |
| 08 — Customer Dashboard | ✓ | ✓ | ✓ | | |
| 09 — Personal Details | ✓ | ✓ | ✓ | | |
| 10 — Document Uploads | ✓ | ✓ | ✓ | | |
| 11 — Document Review | ✓ | ✓ | ✓ | | |
| 12 — Customer Emails | | ✓ | ✓ | | |
| 13 — Admin Panel | ✓ | ✓ | ✓ | | |
| 14 — Operator Queue | ✓ | ✓ | ✓ | | |
| 15 — NIF Delivery | ✓ | ✓ | ✓ | | |
| 16 — Delivery Emails | | ✓ | ✓ | | |
| 17 — Account Settings | ✓ | | ✓ | | |
| 18 — Renewal Flow | ✓ | ✓ | ✓ | ✓ | |
| 19 — SEO & Metadata | | | | ✓ | |
| 20 — UI Polish | ✓ | | | | |

---

## Notes

- `project-overview.md` is dropped from the default reading order. The one critical piece of
  unique content it contains — the July 2026 fiscal rep regulatory change — is noted in
  `progress-tracker.md` under Architecture Decisions for reference.
- `architecture-reference.md` contains Background Tasks, Refactoring Safety, Development
  Workflow, Deployment, Performance, Security, Monitoring, Known Limitations, and Future
  Architecture sections split from the original `architecture-context.md`.
- Feature specs must declare which files to inject in their header. The spec is the
  enforcement mechanism — do not rely on agent memory across sessions.
