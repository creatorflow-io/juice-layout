# Feature Specification: Upgrade to Latest Angular

**Feature Branch**: `001-angular-upgrade`
**Created**: 2026-06-04
**Status**: Draft
**Input**: User description: "upgrade to latest angular"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Developer Installs Latest Angular Libraries (Priority: P1)

A developer working on the juice-layout monorepo runs the upgrade migration and all `@juice-js/*`
libraries, the host `app` project, and their transitive dependencies are updated to the latest
stable Angular version. Existing functionality continues to work without regressions.

**Why this priority**: Staying on a supported Angular version ensures access to security patches,
performance improvements, and ecosystem compatibility. This is the core value of the upgrade.

**Independent Test**: Check out the branch, run `npm install`, build each library, run the full
test suite, and start the dev server. All must succeed with zero errors.

**Acceptance Scenarios**:

1. **Given** the repo is on Angular 16, **When** the upgrade migration is applied and
   `npm install` completes, **Then** `package.json` lists the latest stable Angular version for
   all `@angular/*` and `@angular-devkit/*` packages.
2. **Given** upgraded dependencies, **When** each `@juice-js/*` library is built, **Then** the
   build completes with zero errors and zero warnings related to deprecated APIs.
3. **Given** upgraded dependencies, **When** the full unit test suite is run, **Then** all
   existing tests pass without changes to test logic.

---

### User Story 2 - Developer Resolves Breaking-Change API Updates (Priority: P2)

Where Angular migration guides identify breaking changes affecting existing source code
(deprecated APIs, removed symbols, changed module structure), all affected files across
`projects/juice-js/` and `projects/app/` are updated so the codebase compiles cleanly.

**Why this priority**: A version bump alone is insufficient if the codebase still references
removed or changed APIs. Compilation must succeed before the upgrade delivers value.

**Independent Test**: Build all projects in the workspace. Zero TypeScript compilation errors.
Zero Angular template errors.

**Acceptance Scenarios**:

1. **Given** the Angular version is bumped, **When** deprecated APIs are identified via the
   Angular update tool or migration schematics, **Then** all flagged usages in source files are
   updated to the recommended replacements.
2. **Given** source code updated to new APIs, **When** TypeScript compilation runs across all
   projects, **Then** there are zero errors.
3. **Given** Angular Material is upgraded alongside Angular, **When** Material component
   templates are compiled, **Then** there are no breaking changes in selectors, inputs, or
   outputs used in the codebase.

---

### User Story 3 - CI Pipeline Passes on Upgraded Branch (Priority: P3)

After the upgrade, the full build and test pipeline passes on the upgraded branch, confirming
the change is safe to merge into `master`.

**Why this priority**: Green build and tests are the final gate before merging.

**Independent Test**: Run the full build (`npm run build`) and test suite (`npm test`) locally.
Both complete with zero failures.

**Acceptance Scenarios**:

1. **Given** the upgraded branch, **When** the full build runs for all projects, **Then** all
   library build artifacts are produced in `dist/` with no errors.
2. **Given** a full test run, **When** all specs execute, **Then** zero test failures are
   reported.

---

### Edge Cases

- What happens if a third-party dependency (`@ngx-translate/core`, `angular-oauth2-oidc`) does
  not yet have a release compatible with the target Angular version?
- How are peer-dependency conflicts surfaced by `npm install` resolved?
- What if Angular migration schematics modify root config files (`tsconfig.json`,
  `.browserslistrc`) in unexpected ways?
- What if the Angular update tool requires incremental migration (e.g., 16 → 17 → 18) rather
  than a direct jump?

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: All `@angular/*` packages in `package.json` MUST be updated to the same latest
  stable major version.
- **FR-002**: All `@angular-devkit/*` and `@angular/cli` packages MUST match the target Angular
  version.
- **FR-003**: `@angular/material` MUST be upgraded to the corresponding Material version for the
  target Angular release.
- **FR-004**: All six `@juice-js/*` library projects MUST compile successfully after the upgrade.
- **FR-005**: All existing unit tests MUST pass without modification to test logic; only
  API-adaptation changes are permitted.
- **FR-006**: Breaking-change usages identified by Angular migration schematics MUST be resolved
  before the feature is considered complete.
- **FR-007**: Third-party libraries (`@ngx-translate/core`, `angular-oauth2-oidc`) MUST be
  updated to versions compatible with the target Angular release.
- **FR-008**: The `semantic-release` and `ng-packagr` configuration MUST remain functional
  after the upgrade with no changes to the release pipeline.

### Key Entities

- **Angular Workspace**: The monorepo (`angular.json`) defining all projects — `app`,
  `@juice-js/auth`, `@juice-js/layout`, `@juice-js/localize`, `@juice-js/core`,
  `@juice-js/tenant`.
- **Dependency Manifest**: `package.json` — the authoritative list of direct dependencies and
  version constraints.
- **Library Build Artifacts**: Output in `dist/juice-js/` consumed by the host `app` project.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: All six Angular projects in the workspace build without errors after the upgrade.
- **SC-002**: 100% of pre-existing unit tests pass on the upgraded branch with no test-logic
  changes.
- **SC-003**: The development server starts and the host application loads without runtime
  errors in the browser console.
- **SC-004**: The upgrade introduces zero regressions in existing user-facing behaviour across
  the main layout, auth, and menu flows (verified by running the app).
- **SC-005**: The upgrade is delivered as a conventional commit set that flows through
  `semantic-release` without pipeline configuration changes.

## Assumptions

- The target version is the latest stable Angular release available at migration time (to be
  confirmed via `ng update @angular/core` at execution time).
- `ng update` schematics handle the majority of automated code changes; manual fixes are limited
  to cases the schematics cannot auto-migrate.
- The project is already fully on Ivy (Angular 16+ default) — no View Engine opt-out flags
  are in use.
- Third-party packages (`@ngx-translate/core`, `angular-oauth2-oidc`) have compatible releases
  available at the time of migration.
- End-to-end tests are out of scope (no e2e framework is configured in the project).
- If the Angular update tool requires incremental migration (one major version at a time), each
  intermediate step is a separate commit but counts as part of this feature.
