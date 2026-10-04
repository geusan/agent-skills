---
name: go-clean-arch
description: Review or refactor existing Go backends toward Clean Architecture. Use for 코드 점검, 코드 리뷰, 리팩터링, 클린 아키텍처 전환, or dependency-boundary repairs when Go owns the target, even without naming this skill. Review is read-only; refactoring preserves behavior. Use init-go-server for new servers and add-go-feature for new features; do not use for frontend-only work.
---

# Go Clean Architecture

Use [geusan/go-clean-arch-chat-server](https://github.com/geusan/go-clean-arch-chat-server) as a concrete architectural reference. Preserve its useful interface and composition patterns while correcting the boundary leaks documented in [references/reference-contract.md](references/reference-contract.md). It is a learning project, not a production template to copy wholesale.

## Establish the scope

This skill handles existing-code migration and review. Route new-server requests to [init-go-server](../init-go-server/SKILL.md) and feature implementation to [add-go-feature](../add-go-feature/SKILL.md). Resolve the target directory and infer migration versus review from the request and files.

Before edits, read repository instructions, inspect Git status, and locate all `go.mod`, `go.work`, entrypoints, tests, generators, and CI commands. Inspect one complete request flow through handler, use case, persistence, and composition. Existing contracts, module paths, framework choices, and user changes remain authoritative.

- **Migration:** Capture behavior and validation baselines, then move one feature at a time. Keep working HTTP, ORM, DI, and test tooling unless replacement is requested or necessary for the scoped change.
- **Review:** Trace imports and runtime behavior, report file-level evidence and a minimal remedy, and leave source unchanged unless fixes are requested.

"점검해줘", "리뷰해줘", or "전환하려면 어떻게 해야 해?" selects read-only analysis or a plan. "리팩터링해줘" or "문제를 수정해줘" authorizes the relevant edits. When the user asks for both review and fixes, inspect and then carry out the scoped fixes without asking for the same authorization again. Honor a specified diff, feature, or file set; report sampled scope for broad reviews.

For review, inspect check scripts before running them. Avoid formatting/fix flags, generators, dependency or schema updates, and other tracked-file changes; use an isolated disposable copy if a useful check would rewrite project files. For refactoring, preserve the current Go version, frameworks, tooling, and module boundaries unless changing them is part of the request. Add focused characterization coverage before moving a significant untested behavior, and complete all requested slices rather than stopping after one example.

Read [references/implementation-playbook.md](references/implementation-playbook.md) for the selected workflow. Read [references/websocket.md](references/websocket.md) only when WebSocket or concurrent hub behavior is in scope.

## Apply the dependency contract

Compile-time dependencies point inward; request flow and package imports are different:

```text
HTTP / WebSocket adapter -> use case -> domain
repository adapter ------> domain + consumer-owned ports
composition root --------> concrete adapters + use cases
```

- **Domain:** Business entities, values, invariants, and errors. New domain code stays independent of Echo, GORM, SQL drivers, JWT implementations, sockets, and environment configuration.
- **Use cases:** Business decisions, authorization for the requested operation, and orchestration. Declare the small repository or infrastructure interfaces they consume here; depend on these interfaces instead of importing concrete adapters.
- **Inbound adapters:** Decode and validate transport input, obtain caller identity, call use cases, and map results/errors to the existing protocol. Keep framework contexts and request/response DTOs at this boundary.
- **Outbound adapters:** SQL/GORM, token signing, password hashing, external APIs, and infrastructure-specific mapping. Keep database models and driver errors here; translate them to the consumer's contract.
- **Composition root:** Assemble concrete dependencies with constructors, load configuration, own resource lifetimes, and start/stop servers. Existing `app/main.go` and `cmd/<service>/main.go` layouts are both valid.

For operations that can block, pass `context.Context` from the incoming request through use cases to adapters. Return explicit errors for expected failures; distinguish missing records from failed storage operations. Preserve error identity when wrapping and map it at the transport boundary. Avoid passing `*gorm.DB`, `echo.Context`, or `*websocket.Conn` through business interfaces.

Prefer interfaces owned by their consumers and concrete constructor return types. Go's structural interface satisfaction removes the need for a shared mega-interface package. Introduce transaction, clock, or token ports only when the feature needs that boundary; avoid scaffolding a generic repository or interface for every struct.

## Use the reference deliberately

The reference contract records an inspected commit and source paths. Fetch into a temporary directory when source details, current upstream behavior, or a specific ref matter. Record the resolved commit; do not replace target code with the checkout. If fetching is unavailable, identify the bundled contract as a historical snapshot and do not claim to have checked current upstream.

Separate observed source behavior from the recommended target design. Existing boundary leaks may need a compatibility adapter during migration; do not reproduce them in new code or describe them as clean architecture requirements. Preserve API and schema compatibility while extracting framework-specific concerns.

Do not inherit the sample's module names, Go/dependency pins, credentials, localhost URLs, Terraform, frontend, generated mocks/docs, or compiled server binary. Select dependencies from the target's constraints and verify version-specific APIs against official documentation when changing them.

## Verify and hand off

For each review finding, give severity, file/line evidence, the triggering condition and impact, and the smallest useful remedy. Distinguish confirmed defects, unverified concerns, and maintainability suggestions. Do not label different directory names as bugs, invent findings, or imply a full audit when only selected flows were checked.

If a Go backend and Next.js frontend are both in scope, use each stack's architecture workflow and inspect their shared wire contract. Preserve routes, payloads, status/error mapping, auth/cookies, and relevant event formats during structural refactoring. Keep server-side business rules authoritative in Go; verify actual integration after changes to both sides instead of relying only on isolated tests.

Run the project's checks from each affected Go module, not just the Git root. Format changed files, run relevant tests after each slice, then build, test, vet, and inspect imports as described in the playbook. For concurrent code, include race tests that exercise the affected lifecycle. Review generator directives before running them and regenerate only affected outputs using the project's tool versions.

Report the changed boundaries, preserved behavior, intentional deviations from the reference, reference commit if fetched, and exact checks/results. Distinguish pre-existing failures and unavailable infrastructure from regressions. A build passing without behavioral tests is not proof of migration compatibility. A review should prioritize actionable findings with file/line evidence over folder-name preferences.
