# Data Model: Upgrade to Latest Angular

**Feature**: 001-angular-upgrade
**Date**: 2026-06-04

This feature is a dependency-version migration, not a data feature. There are no new domain
entities, database schemas, or persistent data structures introduced.

## Dependency Version Map

The authoritative "data model" for this upgrade is the set of version constraints in
`package.json`. The table below defines the target state after the full 16→21 migration.

### Direct Dependencies (Target State)

| Package | Current Version | Target Version | Notes |
|---------|----------------|---------------|-------|
| `@angular/animations` | ^16.2.12 | ^22.x.x | Angular core package |
| `@angular/common` | ^16.2.12 | ^22.x.x | Angular core package |
| `@angular/compiler` | ^16.2.12 | ^22.x.x | Angular core package |
| `@angular/core` | ^16.2.12 | ^22.x.x | Angular core package |
| `@angular/forms` | ^16.2.12 | ^22.x.x | Angular core package |
| `@angular/material` | 15.2.9 | ^22.x.x | Material Design components |
| `@angular/platform-browser` | ^16.2.12 | ^22.x.x | Angular core package |
| `@angular/platform-browser-dynamic` | ^16.2.12 | ^22.x.x | Angular core package |
| `@angular/router` | ^16.2.12 | ^22.x.x | Angular core package |
| `@ngx-translate/core` | ^14.0.0 | ^18.0.0 | i18n library |
| `angular-oauth2-oidc` | ^15.0.1 | ^22.0.0 | OAuth2/OIDC authentication |
| `rxjs` | ~7.8.0 | ~7.8.0 | No change expected |
| `tslib` | ^2.3.0 | ^2.x.x | May auto-update |
| `zone.js` | ~0.13.0 | ~0.16.x | Auto-updated by Angular schematics |

### Dev Dependencies (Target State)

| Package | Current Version | Target Version | Notes |
|---------|----------------|---------------|-------|
| `@angular-devkit/build-angular` | ^16.2.11 | ^22.x.x | Build toolchain |
| `@angular/cli` | ~16.2.11 | ^22.x.x | Angular CLI |
| `@angular/compiler-cli` | ^16.2.11 | ^22.x.x | AOT compiler |
| `ng-packagr` | ^16.0.0 | ^22.0.0 | Library build tool |
| `typescript` | ~5.1.3 | ~5.9.x | Required by Angular 22 |
| `@types/jasmine` | ~4.3.0 | ~5.x.x or latest | May auto-update |
| `jasmine-core` | ~4.6.0 | latest compatible | May auto-update |
| `karma` | ~6.4.0 | latest compatible | May auto-update |

### angular.json Builder Migration

| Project | Current Builder | Target Builder |
|---------|----------------|---------------|
| `app` | `@angular-devkit/build-angular:browser` | `@angular-devkit/build-angular:application` |
| `@juice-js/auth` | `@angular-devkit/build-angular:ng-packagr` | `@angular-devkit/build-angular:ng-packagr` (unchanged) |
| `@juice-js/layout` | `@angular-devkit/build-angular:ng-packagr` | `@angular-devkit/build-angular:ng-packagr` (unchanged) |
| `@juice-js/localize` | `@angular-devkit/build-angular:ng-packagr` | `@angular-devkit/build-angular:ng-packagr` (unchanged) |
| `@juice-js/core` | `@angular-devkit/build-angular:ng-packagr` | `@angular-devkit/build-angular:ng-packagr` (unchanged) |
| `@juice-js/tenant` | `@angular-devkit/build-angular:ng-packagr` | `@angular-devkit/build-angular:ng-packagr` (unchanged) |

*Exact version numbers for Angular 22.x will be resolved at execution time by running
`ng update @angular/core@22 @angular/cli@22 --dry-run`.*

### Runtime (Node.js)

| Tool | Machine default | Migration target | Notes |
|------|-----------------|------------------|-------|
| Node.js | 24.x | 20.19+ (Node 20 LTS) | Supported by Angular 16–22; Node 24 unsupported by Angular 16–19 |
