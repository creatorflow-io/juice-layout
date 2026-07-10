<!--
SYNC IMPACT REPORT
==================
Version change: [TEMPLATE] → 1.0.0 (initial ratification — all placeholders filled)

Modified principles: N/A (first-time fill; no prior named principles)

Added sections:
  - Core Principles (5 principles)
  - Technology Stack
  - Development Workflow
  - Governance

Removed sections: None

Templates reviewed:
  ✅ .specify/templates/plan-template.md — Constitution Check gate aligns with principles
  ✅ .specify/templates/spec-template.md — no constitution-specific constraints to propagate
  ✅ .specify/templates/tasks-template.md — task categories align with library-first and test discipline
  ⚠  .specify/templates/commands/ — no command files found; no updates required

Deferred items: None — all placeholders resolved.
-->

# JuiceLayout Constitution

## Core Principles

### I. Library-First

Every feature MUST be implemented as a standalone Angular library under `projects/juice-js/`.
Libraries MUST be:

- Self-contained and independently buildable (`ng build --project @juice-js/<name>`).
- Independently testable (`ng test --project @juice-js/<name>`).
- Exposing a clean public API through a `public-api.ts` barrel file.
- Free of circular dependencies between sibling libraries.

Rationale: The repo ships reusable UI/auth/tenant libraries to consuming applications. Coupling
libraries together or placing feature logic in the host `app` project breaks consumers and makes
isolated delivery impossible.

### II. Angular & TypeScript Discipline

All code MUST follow the [Angular Style Guide](https://angular.io/guide/styleguide).

- Components, directives, pipes, and services MUST use Angular's dependency-injection system —
  no manual instantiation.
- Modules (NgModules) MUST be used to declare and export library entry points.
- TypeScript strict mode MUST be respected; `any` types MUST be justified with an inline comment.
- SCSS styles MUST be scoped to their component; global styles belong in the host `app` only.

Rationale: Consistency across libraries reduces cognitive overhead for contributors and ensures
compatibility with Angular's ahead-of-time (AOT) compiler.

### III. Test Coverage (NON-NEGOTIABLE)

Unit tests via Karma/Jasmine MUST accompany every public component, directive, pipe, and service.

- Test files MUST live adjacent to the source file (`*.spec.ts`).
- Tests MUST exercise the component's public API, not internal implementation details.
- New public API surface introduced without a matching `.spec.ts` file MUST be flagged in review.
- The full suite MUST pass (`ng test --watch=false --browsers=ChromeHeadless`) before merge.

Rationale: Library consumers depend on behavioral stability. Test coverage is the contract between
the library and its consumers.

### IV. Semantic Versioning & Conventional Commits

All commits MUST follow the Conventional Commits specification (`feat:`, `fix:`, `docs:`,
`chore:`, `refactor:`, `test:`, `perf:`, `build:`).

- Breaking changes MUST use a `!` suffix or `BREAKING CHANGE:` footer.
- Release automation via `semantic-release` derives version bumps from commit messages — manual
  version edits in `package.json` are PROHIBITED.
- Each library package is versioned independently.

Rationale: `@juice-js/semantic-release-npm` is configured in `devDependencies`. Manual version
changes would desync the release pipeline and break changelogs.

### V. Multi-Tenancy & Auth Awareness

All features that involve routing, user identity, or data access MUST account for multi-tenancy.

- Tenant context MUST be resolved via `@juice-js/core` tenant services before rendering
  tenant-scoped content.
- Authentication MUST be handled exclusively through `@juice-js/auth` (OAuth2/OIDC via
  `angular-oauth2-oidc`). Custom auth flows MUST NOT be introduced.
- Components MUST NOT embed tenant identifiers as hard-coded values.

Rationale: The platform supports multiple tenants sharing the same deployment. Bypassing tenant
resolution causes cross-tenant data leakage or broken auth redirects.

## Technology Stack

| Concern | Technology | Version |
|---------|-----------|---------|
| Framework | Angular | 16.x |
| UI Components | Angular Material | 15.x |
| Internationalization | @ngx-translate/core | 14.x |
| Authentication | angular-oauth2-oidc | 15.x |
| Language | TypeScript | 5.1.x |
| Styling | SCSS | — |
| Unit Testing | Karma + Jasmine | 6.4 / 4.6 |
| Release Automation | semantic-release | 22.x |
| Build | Angular CLI / ng-packagr | 16.x |

Upgrades to major versions of Angular or Angular Material MUST be treated as a breaking change
and require a migration plan reviewed against all library public APIs.

## Development Workflow

### Local Development

1. Build a library in watch mode: `npm run watch:<lib>` (e.g., `watch:layout`, `watch:auth`).
2. The host `app` project reads built output from `dist/juice-js/` — run at least one library
   build before `npm start`.
3. Run per-library tests: `npm run test:<lib>`. Run the full suite: `npm test`.

### Feature Delivery

1. Branch from `master` using the pattern `<ticket>-<short-description>`.
2. Implement in the appropriate `projects/juice-js/<lib>/src/lib/` directory.
3. Update `public-api.ts` if new symbols are exported.
4. Write or update `.spec.ts` tests (Principle III).
5. Commit using Conventional Commits (Principle IV).
6. Open a PR to `master`; the reviewer MUST verify constitution compliance.

### Quality Gates

- All unit tests pass (`ng test --watch=false --browsers=ChromeHeadless`).
- No new TypeScript errors (`ng build --project @juice-js/<lib>`).
- No circular dependencies introduced between libraries.
- Conventional commit message on every commit.

## Governance

This constitution supersedes all informal practices and verbal agreements. It is the authoritative
source for how work is done in this repository.

**Amendment procedure**:
1. Propose change via PR with the description `docs: amend constitution to vX.Y.Z (summary)`.
2. At least one other contributor MUST review and approve.
3. Update `LAST_AMENDED_DATE` and bump `CONSTITUTION_VERSION` per semantic versioning rules:
   - **MAJOR**: Removal or incompatible redefinition of an existing principle.
   - **MINOR**: New principle or section added.
   - **PATCH**: Clarification, wording fix, or non-semantic refinement.
4. The merged PR commit is the ratification event.

**Versioning policy**: Managed manually in this file; follows semantic versioning as above.

**Compliance review**: Every PR reviewer is responsible for checking the Constitution Check
section of the relevant `plan.md` and ensuring no principle is violated without documented
justification in the Complexity Tracking table of that plan.

**Version**: 1.0.0 | **Ratified**: 2026-06-04 | **Last Amended**: 2026-06-04
