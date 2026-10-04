# Existing-app review and migration

## Establish the actual project

Resolve the package containing the affected routes, not just the first `package.json`. Read the package manager/workspace configuration, Next.js configuration, aliases, CI, and adjacent tests. For a diff review, trace changed symbols into relevant callers without expanding into a repository-wide style audit.

Map one feature before proposing file moves:

| Evidence | Responsibility to identify |
|---|---|
| Page, layout, route handler, or action | Next runtime entrypoint and composition |
| Component, hook, query/mutation hook | Presentation state versus business orchestration |
| Validation/decision function | Transport validation versus domain invariant |
| Fetch/SDK/storage call | External adapter and DTO mapping |
| Repository interface/function parameter | Consumer contract and dependency injection |
| Provider/factory/module-level instance | Composition and resource/request lifetime |

Adopt equivalent boundaries in the existing naming scheme. A hook may remain responsible for React state and data-library integration; extract framework-independent decisions only when they exist. Avoid turning every function into a service or moving all code into a generic `shared` directory.

## Read-only review

Trace the concrete caller and impact for each concern. Useful questions include:

- Can a malformed response or rejected operation leave the UI in an incorrect state?
- Does business behavior require React, Next, a concrete HTTP client, or persistence merely to test it?
- Can a client import pull server-only credentials or a privileged adapter into its dependency graph?
- Are user-specific data or credentials captured by a global cache/singleton?
- Do route handlers/actions validate the actual operation, or does protection exist only in presentation?
- Do tests exercise the affected behavior or only mocked implementation calls?

Use severity proportional to the demonstrated effect. High-impact findings include concrete authorization/data exposure or destructive correctness failures; ordinary functional regressions are more important than a naming preference. Explain maintainability costs with an actual change/test consequence. Mark possible issues as hypotheses until the relevant execution path is established.

Report each finding as: `severity — file:line — trigger/impact — minimal fix`. Include relevant test evidence and uncertainty. Record reviewed routes/packages and unchecked integration boundaries. Do not claim an architecture review is a full security, accessibility, or performance audit.

## Refactoring baseline and compatibility

Before editing, record repository state, current check results, and the observable feature contract. Preserve user-owned changes. If current tests miss a significant behavior that could change during extraction, add a focused characterization test that fails if the behavior changes.

| Contract | Examples to preserve |
|---|---|
| Navigation | Paths, params, query strings, redirects, history, deep links |
| UI | Form submission, validation timing, loading/error/empty states, keyboard/focus behavior |
| Backend API | Methods, URLs, fields, nullability, status/error mapping, pagination |
| Authentication | Session/cookie behavior, CSRF mechanisms already used, refresh/logout semantics |
| Persistence | Browser storage keys/formats and server-side schema where relevant |
| Rendering | Server/client ownership, serialization, hydration, suspense/error boundaries |
| Data lifecycle | Cache keys/scope, invalidation, cancellation, optimistic updates |

Keep runtime/router/styling/state/test tools in place. If a required extraction reveals an actual defect, separate its behavior fix from the structural change and stay within the user's authorized scope. A structural refactor is not permission for an unrelated stack replacement.

## Move one vertical slice

1. Extract pure business values/decisions and meaningful errors without changing external representations.
2. Define the narrow port consumed by the operation. Pass it into a use-case function/factory; maintain existing async/error behavior.
3. Wrap existing I/O in an adapter, retaining its API configuration, credentials, cancellation, and DTO mapping. Avoid rewriting the HTTP/storage stack at the same time.
4. Change presentation to call the injected operation. Preserve React state, query-library lifecycle, and the server/client boundary.
5. Wire real adapters at the correct composition boundary, update routes/callers, and keep temporary compatibility exports only when needed.
6. Run affected tests and import review. Remove old paths only when searches cover source, tests, route references, generated imports, and dynamic imports.

For App Router, ensure extraction does not accidentally broaden `"use client"`, serialize functions/classes across an ordinary boundary, or import privileged server code into a client graph. For Pages Router, retain its data-fetching and routing entrypoints; converting routers is a separate change.

Continue through the requested scope with independently checkable slices. Record unresolved baseline failures instead of deleting tests or reducing checks. Complete required checks once after the final slice; repeat only for new changes or unresolved failures.

## Go + Next.js projects

Treat the frontend-to-Go API as a compatibility boundary. During a joint review, compare route registration and Go response types with the Next adapter/DTO parser and the UI's expected errors. Include cookies/headers, nullability, pagination, and WebSocket payloads only where relevant to the inspected feature.

For joint refactoring, keep the wire contract unchanged unless its change is requested. Go remains authoritative for permissions, persistence, and server business rules; frontend validation supports user experience and must not become the sole enforcement point. Extract backend and frontend boundaries using their respective workflows, then exercise the real interaction across both. Passing two isolated unit suites does not prove integration compatibility.

## Completion evidence

Use the repository's existing check commands and versions. Do not install the starter's Vitest/Tailwind stack just to run a review. If tests require unavailable infrastructure, report the specific missing check and use available evidence without presenting a mock as a live integration pass.

Review output should contain prioritized findings, assumptions, and scope/checks. Refactor output should contain the actual boundary changes, compatibility evidence against the baseline, checks, retained shims, and any remaining requested work.
