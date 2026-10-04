---
name: nextjs-clean-arch
description: Review or refactor existing Next.js/React applications toward Clean Architecture. Use for 코드 점검, 코드 리뷰, 구조 검토, 리팩터링, or 클린 아키텍처 전환 when Next.js owns the target, even without naming this skill. Review is read-only; refactoring preserves behavior and existing tooling. Do not use for new-app scaffolding, new features, or unrelated Vite projects.
---

# Next.js Architecture Review and Refactor

Inspect existing code or change its structure according to the user's request. Use the [architecture contract](../init-nextjs-app/references/architecture.md) for responsibility boundaries, not as a template to overwrite the target. Never run the initializer on an existing application.

## Select the mode and scope

- **Review:** "점검해줘", "리뷰해줘", "문제 찾아줘", or "전환하려면 어떻게 해야 해?" requests analysis. Leave source, configuration, lockfiles, and generated outputs unchanged. Provide findings or a migration plan, not unsolicited fixes.
- **Refactor:** "리팩터링해줘", "클린 아키텍처로 바꿔줘", or an explicit request to fix findings authorizes the relevant edits. Establish a baseline and implement the requested scope incrementally; a plan alone is not completion.
- **Review and fix:** When both are requested, inspect first and then fix confirmed issues within the stated scope. No additional confirmation is needed for those authorized edits.

Honor a specified diff, branch comparison, feature, or file set. For an unspecified whole-project review, identify the relevant app and cover its main boundaries and critical flows; report what was sampled rather than implying every file was audited. If Next.js and Go are both in scope, use the respective architecture workflows and inspect their shared API contracts. Do not review or rewrite unrelated services just because they share the repository.

For new applications use [init-nextjs-app](../init-nextjs-app/SKILL.md); for implementing new product behavior use [add-nextjs-feature](../add-nextjs-feature/SKILL.md). An existing React frontend without Next.js is not permission to migrate frameworks.

## Inspect before deciding

Read repository instructions and inspect Git status, owning package/workspace, lockfile, Next/React versions, App versus Pages Router, aliases, runtime configuration, generation, CI, and test scripts. Trace at least one complete user interaction through route/presentation, business orchestration, external adapter, and composition; choose additional flows according to scope and impact.

Inspect both imports and behavior. Directory names alone cannot prove conformance. Follow barrels, dynamic imports, shared helpers, and client/server imports far enough to establish the actual dependency. Distinguish a framework concern from a business rule before recommending extraction.

The target's existing Next/React versions, router, JavaScript/TypeScript choice, styling system, state/data libraries, package manager, and test runner remain authoritative. Structural refactoring does not implicitly authorize App Router migration, a version upgrade, Tailwind adoption, or replacing Jest with Vitest. The starter's tool versions and folder names are examples for new apps.

Read [the review and migration playbook](references/review-and-migration.md) for the selected mode.

## Review with evidence

Prioritize defects and consequential coupling: broken state/error flows, framework-dependent business logic, adapter construction in UI, missing operation-level authorization, private data crossing a client boundary, invalid cache scope, and regressions that tests miss. A different folder name or a component with local display state is not automatically a defect.

For every finding, report severity, file/line evidence, a triggering condition, concrete impact, and the smallest useful remedy. Mark an unverified concern as such and state what would confirm it. Separate functional defects from maintainability improvements. If no actionable issues were found, say so along with inspected scope and validation gaps; do not invent findings or award an unsupported architecture score.

Inspect scripts before running checks. For review, avoid fix flags, generators, dependency updates, and migrations. If a useful check would modify tracked files, use an isolated disposable copy or report that it was not run. Cache/build artifacts may be created only when they do not overwrite user-owned work.

## Refactor while preserving behavior

Capture existing checks and observable contracts first. When a risky flow lacks tests, add focused characterization coverage before moving it. Map current files to responsibilities and change one complete feature slice at a time: extract rules, inject ports, isolate adapters, adapt presentation, then update composition and route imports.

Preserve routes, request/response formats, auth/cookies, storage keys, URL/query behavior, UI interactions, SSR/CSR behavior, loading/error boundaries, caching, and relevant accessibility semantics. Keep Pages Router and existing client boundaries unless changing them is explicitly part of the task. Do not duplicate server-authoritative business rules into the frontend.

Use temporary exports/adapters when callers cannot move together. Remove them only after caller searches and checks prove they are unnecessary. Keep schema and API changes explicit and separate from structural moves. Do not weaken tests, lint, types, or production-build checks to make the refactor pass.

Complete all requested slices, not just the first example. If an external prerequisite prevents completion, identify the remaining files/flows and unverified behavior precisely. Update existing development instructions only to reflect the agreed architecture; preserve other project rules.

## Verify and report

Use the target's existing lint, typecheck, test, and production-build commands. Run focused checks per slice, then required app/workspace checks. Exercise relevant runtime/E2E flows for navigation, auth, async Server Components, or hydration changes; unit tests alone do not establish compatibility there.

Compare against the baseline. For review, lead with findings and their evidence, followed by scope/checks. For refactoring, report changed boundaries, preserved contracts, baseline versus final results, compatibility shims retained, and remaining work. Do not claim full compatibility from a successful build alone.
