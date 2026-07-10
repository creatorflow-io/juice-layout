# Quickstart: Angular 16 → 22 Migration

**Feature**: 001-angular-upgrade
**Date**: 2026-06-04 (rev. 2026-07-10)

This document is the step-by-step validation guide for verifying the Angular upgrade is complete
and working correctly.

## Prerequisites

- **Node.js**: the requirement changes across the chain and there is **no single version that
  spans 16→22**:
  - Angular 16–19 do **not** support Node 24 → use **Node 20.19+** for those steps.
  - Angular **22 drops Node 20** and requires **Node 22.22.3+ / 24.15.0+ / 26** → move to
    **Node 24.15.0+** before the 21→22 step.
  - This migration was executed on Node 20.20.2 for steps 16→21, then Node **24.18.0** for 22.
- Git working tree is clean on branch `001-angular-upgrade`
- You are in the repo root: `D:\Workspaces\Juice\juice-layout`

## Step 1: Verify Starting State

```powershell
node --version          # Should be 20.19+ (NOT 24.x)
npx ng version          # Should show Angular CLI 16.x, Angular 16.x
git status              # Should be clean
```

## Step 2: Pre-Upgrade Dependency Audit

```powershell
npm outdated            # Review what will change
npx ng update           # Preview available updates (no --force)
```

## Step 3: Execute Sequential Upgrade

Repeat for each major version step (16→17, 17→18, 18→19, 19→20, 20→21, 21→22):

```powershell
# Example for 16 → 17 (repeat pattern for each version)
npx ng update @angular/core@17 @angular/cli@17

# After each ng update step:
npm run build           # Verify app builds
npm run watch:layout    # Or: ng build --project @juice-js/layout
npm test                # Run full test suite
git add -A
git commit -m "build: upgrade Angular core to v17"
```

## Step 4: Upgrade Third-Party Dependencies (after Angular 22)

```powershell
npm install angular-oauth2-oidc@^22
npm install @ngx-translate/core@^18
npm install                             # Let npm resolve remaining peer deps
```

## Step 5: Full Build Verification

```powershell
# Build all libraries
npx ng build --project @juice-js/core
npx ng build --project @juice-js/auth
npx ng build --project @juice-js/layout
npx ng build --project @juice-js/localize
npx ng build --project @juice-js/tenant

# Build host app
npx ng build --project app
```

Expected: zero errors, zero deprecated-API warnings in build output.

## Step 6: Full Test Suite

```powershell
npm test
# Equivalent: ng test --watch=false --browsers=ChromeHeadless --code-coverage
```

Expected: all tests pass, coverage thresholds met.

## Step 7: Dev Server Smoke Test

```powershell
npm start
# Or: npm run start:windows
```

Open the app in a browser and verify:
- [ ] Application loads without errors in browser console
- [ ] Navigation / menu renders correctly (tests `@juice-js/layout`, `@juice-js/core`)
- [ ] Auth flow initiates correctly (tests `@juice-js/auth`)
- [ ] Tenant resolution works (tests `@juice-js/tenant`)
- [ ] Language switching works (tests `@juice-js/localize`)

## Step 8: Verify Angular Version

```powershell
npx ng version
```

Expected output includes: `Angular: 22.x.x`, `Angular CLI: 22.x.x`, `TypeScript: 6.0.x`
(Angular 22 in this environment resolved to TypeScript 6.0.3).

## Acceptance Criteria Checklist

- [ ] `package.json` shows `@angular/core@^22.x.x`
- [ ] All six projects build with zero errors
- [ ] All unit tests pass (`npm test` exits 0)
- [ ] Dev server starts and app loads in browser without console errors
- [ ] `npx ng version` reports Angular 22
- [ ] `git log --oneline` shows one conventional commit per major version step (v17…v22)
