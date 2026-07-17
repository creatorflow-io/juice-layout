# Feature Specification: Conditional Search Box

**Feature Branch**: `003-conditional-search-box`  
**Created**: 2026-07-17  
**Status**: Draft  
**Input**: User description: "improve the search box: it must be appear or disappear depends on the page support or not"

## Context

The application shell shows a single search box in the top toolbar. That box is shared by every page — it is mounted once by the shell, not by the pages themselves.

Today the box already appears and disappears per page, but the mechanism is fragile: a page must actively claim the search box at the moment it is created, and the shell revokes the claim at the start of every navigation. This produces correct results only when the timing works out, and it fails in several observable ways — a page that is re-entered rather than freshly created, a navigation that is cancelled, or a search term left over from the previous page.

This feature makes "does this page support search?" an explicit, declarable property of a page, and makes the toolbar's behaviour follow from that property predictably.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Search box reflects the page I am on (Priority: P1)

As a person using the application, when I land on a page that can search its contents, I see a search box in the toolbar. When I move to a page that has nothing to search, the search box is not there. I never see a search box that does nothing when I type in it, and I never have to wonder whether a page is searchable.

**Why this priority**: This is the core promise of the feature and everything else refines it. A search box that appears on a page it cannot serve is worse than no search box at all, because the user types a query and gets silence.

**Independent Test**: Navigate between a page declared as search-supporting and a page that is not, in both directions, and confirm the box appears and disappears accordingly. Delivers the full user-visible value on its own.

**Acceptance Scenarios**:

1. **Given** I am on a page that supports search, **When** the page finishes loading, **Then** the search box is visible in the toolbar.
2. **Given** I am on a page that does not support search, **When** the page finishes loading, **Then** no search box is present in the toolbar.
3. **Given** I am on a search-supporting page, **When** I navigate to a page that does not support search, **Then** the search box disappears and the space it occupied is reclaimed by the rest of the toolbar.
4. **Given** I am on a page that does not support search, **When** I navigate to a search-supporting page, **Then** the search box appears and is ready to accept input.
5. **Given** I am on a search-supporting page, **When** I type into the search box, **Then** that page receives what I typed.

---

### User Story 2 - Search state does not leak between pages (Priority: P1)

As a person using the application, when I search for something on one page and then move to another searchable page, the second page does not start out pre-filled with my previous query. Each page's search starts clean.

**Why this priority**: P1 alongside Story 1 because it is a correctness defect in current behaviour, not an enhancement. A leftover query is actively misleading: the box shows a term the new page has not actually filtered by, so the user believes they are looking at filtered results when they are not. A wrong answer presented confidently is the worst outcome here.

**Independent Test**: Search on page A, navigate to searchable page B, then inspect the box contents and what B received. Testable without Story 3.

**Acceptance Scenarios**:

1. **Given** I have typed a query on a search-supporting page, **When** I navigate to another search-supporting page, **Then** the search box is empty.
2. **Given** I have typed a query on a search-supporting page, **When** I navigate away and then return to that page, **Then** the search box is empty and the page shows unfiltered contents.
3. **Given** the search box is showing a query, **When** I clear it, **Then** the page is told the query is now empty and shows unfiltered contents.

---

### User Story 3 - Support survives re-entry and interrupted navigation (Priority: P2)

As a person using the application, the search box behaves the same on my tenth visit to a page as on my first, and an abandoned or failed navigation does not leave the toolbar in the wrong state.

**Why this priority**: P2 because the box is correct on first visit today, so this covers a narrower set of paths than Story 1. It is still a genuine defect rather than a nicety — the failure is silent and its cause is invisible to the user, who simply sees search missing on a page that had it a minute ago.

**Independent Test**: Visit a search-supporting page, leave, and return several times. Separately, start a navigation that is cancelled or fails and observe the toolbar.

**Acceptance Scenarios**:

1. **Given** I have already visited a search-supporting page once, **When** I return to it, **Then** the search box is visible exactly as on the first visit.
2. **Given** I am on a search-supporting page, **When** a navigation away is started but cancelled or fails and I remain on the page, **Then** the search box is still visible and still working.
3. **Given** I am on a search-supporting page, **When** I use the browser back and forward controls to arrive at it, **Then** the search box is visible.

---

### Edge Cases

- **Page is entered directly by URL or refresh**: the box's presence must match the destination page, with no dependence on having navigated there from somewhere else.
- **Navigation is cancelled or rejected** (access is denied, required data fails to load, the user aborts): the toolbar must end in the state matching the page the user actually ends up on, not an intermediate state.
- **Rapid consecutive navigations**: the box's final state must match the final page, and must not be decided by whichever page's claim happened to arrive last.
- **A page declares support but never handles what is typed**: this must be detectable during development rather than surfacing to users as a silently inert box.
- **Unknown, error, or not-found pages**: treated as not supporting search unless declared otherwise.
- **Appearance and disappearance during transition**: the box must not flicker into view on a page that does not support it, nor briefly vanish while the user stays on a page that does.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: A page MUST be able to declare whether it supports search as a property of the page itself, without the shell needing to know about individual pages.
- **FR-002**: The shell MUST show the search box when, and only when, the currently displayed page declares that it supports search.
- **FR-003**: Pages that make no declaration MUST be treated as not supporting search, so the box is absent by default and appears only on deliberate opt-in.
- **FR-004**: The shell MUST deliver what the user types to the page currently displayed, and to no other page.
- **FR-005**: The search box's contents MUST be reset when the displayed page changes, so no query carries from one page to the next.
- **FR-006**: The shell MUST resolve the box's visibility from the destination page on every navigation, including re-entry to a previously visited page, direct URL entry, refresh, and browser history navigation.
- **FR-007**: If a navigation does not complete, the shell MUST leave the box in the state matching the page the user remains on.
- **FR-008**: The transition between visible and hidden MUST be resolved once per navigation, with no intermediate state visible to the user.
- **FR-009**: A page declaring search support MUST also declare how what is typed reaches it, so support and handling cannot be declared apart from each other.
- **FR-010**: Clearing the search box MUST inform the displayed page that the query is now empty, distinctly from the box being absent.
- **FR-011**: The pages that support search today MUST continue to support it after this change, with no change to what the user sees on them.

### Key Entities

- **Page search support**: a declared property of a page stating whether the shell should offer search while that page is displayed, and how the typed query reaches the page. Absent by default.
- **Active search query**: what the user has currently typed for the displayed page. Scoped to that page and discarded when the displayed page changes.
- **Search box**: the single shell-owned control whose presence is derived from the displayed page's declared support, never set independently of it.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: On every page in the application, the search box's presence matches that page's declared support 100% of the time, across first visit, repeat visit, direct URL entry, refresh, and browser back/forward.
- **SC-002**: Users never encounter a search box that accepts typing without the page responding to it — zero such occurrences across all pages.
- **SC-003**: A query typed on one page never appears on another page — zero leaks across all navigation paths between searchable pages.
- **SC-004**: The search box reaches its correct final state within the same page transition the user perceives, with no visible flicker or delayed appearance.
- **SC-005**: A person can make a new page searchable, or stop an existing page from being searchable, by changing that page's own declaration only, touching no shell code.
- **SC-006**: The pages that offer search today offer it identically after the change, verified by walking each one.

## Assumptions

- The search box remains a single shell-owned control in the toolbar, shared across pages. Giving pages their own independent search controls is out of scope.
- What search actually *does* on a page — the querying, filtering, and presentation of results — remains each page's own concern. This feature covers whether the box is offered and how the typed query reaches the page, not what happens next. The pages that declare support today do not yet act on the query in a user-visible way, and this feature does not change that.
- "This page supports search" is a static property of a page, knowable without running the page. Support that varies at runtime based on a page's own state or on user permissions is out of scope; a page needing that can declare support and handle the empty case itself.
- Only the innermost displayed page decides search support. Nested layouts where an intermediate parent also wants a say are out of scope.
- The default is off: a page is not searchable unless it says so. This matches current behaviour and keeps the box absent when a page author simply has not considered search.
- Search support is not access-controlled — declaring it requires no permission checks beyond whatever already governs access to the page itself.
- The change is expected to be visible to page authors, since pages must declare support in a new way. Migrating the pages that support search today is part of this feature's scope.
