---
name: add-go-feature
description: Add features to an existing Go backend with Clean Architecture when asked for 회원 API 추가, 채팅 기능 구현, or a new endpoint/use case, even without naming this skill. Infer Go from the request, owning module, or established project context. Also use for add-go-feature; do not select for frontend features, new-server scaffolding, or review-only work.
---

# Add Go Feature

Implement the requested feature all the way through its required layers. Preserve the target's architecture and public contracts. An ordinary request such as "사용자 등록 API 추가해줘" in an initialized server is enough; do not ask the user to confirm Clean Architecture again.

If no server exists and the user also requested a new Go backend, use [init-go-server](../init-go-server/SKILL.md) first, then return here. Never rerun initialization for an existing backend. In a mixed frontend/backend repository, identify the owning module before applying this skill; an unrelated `go.mod` elsewhere is not sufficient evidence.

## Understand the operation in context

Read `AGENTS.md`/`CLAUDE.md`, Git status, the owning `go.mod`, existing feature packages, transport routes, persistence, composition root, and relevant tests. Determine the affected module; do not assume the Git root is the Go root. In a project created by `init-go-server`, the default mapping is:

| Responsibility | Default location |
|---|---|
| Entities, values, business rules/errors | `internal/domain/` |
| Feature orchestration and consumed interfaces | `internal/usecase/<feature>/` |
| Database/external persistence implementation | `internal/repository/<store>/` |
| HTTP handler, request/response mapping | `internal/transport/http/` |
| Concrete construction and lifecycle | `cmd/api/main.go` |

In an existing differently named layout, keep its equivalent packages. This workflow also applies to the reference's top-level `auth/` and `chat/` services and `internal/rest/`; do not rename packages just to match the table.

Infer routes, error conventions, identity types, and persistence from nearby features and project requirements. Ask only when consequential product behavior cannot be inferred, such as who can access a resource or whether records must survive restarts. Do not invent an in-memory store for a feature that requires durable data, or add a database to a stateless operation. If the user invokes only `add-go-feature` with no feature description or surrounding context, ask which feature to implement while inspecting the project.

## Implement one complete vertical feature

1. **Contract and baseline:** Establish inputs, success output, expected failures, authorization, and storage effects. Reuse the API's current conventions. Run affected existing checks before changes and distinguish baseline failures.
2. **Domain:** Add or reuse business entities, invariants, and stable business errors. Keep HTTP DTOs, GORM rows/tags, JWT implementation details, and environment lookups outside this layer.
3. **Use case and ports:** Implement business decisions and orchestration in the feature package. Declare only the repository, token, clock, or external-service interfaces consumed by this operation. Accept them via constructors; return concrete service types. Pass `context.Context` through blocking operations and preserve explicit error semantics.
4. **Adapters:** Implement ports using the selected storage/integration. Translate driver errors and row types, honor cancellation, and define atomic transaction behavior when several writes must succeed together. Do not expose `*gorm.DB`, `*sql.Tx`, framework contexts, or socket connections in business signatures.
5. **Transport:** Parse input, obtain authenticated identity, invoke the use case, and map outputs/errors to the existing protocol. Authenticate at the edge and enforce business permissions in the use case. The handler must not query a concrete repository directly or contain the operation's business decisions.
6. **Composition:** Build concrete adapters and use cases in the composition root, inject the handler, and register the actual route. Implement and wire the behavior, not just disconnected interfaces or files. Remove `.gitkeep` when a reserved directory receives real source files.
7. **Tests and docs:** Exercise business success/failure behavior with a fake port, HTTP contracts with `httptest`, and changed storage semantics with the target's test strategy. Update affected API/configuration documentation and generated outputs when applicable.

Skip a layer only when the operation has no responsibility there; for example, a pure calculation needs no repository. Keep the dependency direction `transport -> use case -> domain`, with concrete repository adapters implementing inward contracts. Never make the use case import its concrete adapter to obtain a helper; move the capability behind an appropriate port.

For migration compatibility, transactions, generators, and check details, read the applicable sections of [the implementation playbook](../go-clean-arch/references/implementation-playbook.md). For WebSocket features, also read [socket ownership and lifecycle](../go-clean-arch/references/websocket.md). Do not add socket infrastructure to unrelated features.

## Complete and verify

Format changed files and run relevant tests, then the owning module's build, full tests, vet, and import review. Use `go test -race` for changes involving shared state or goroutines. Test existing affected routes as well as the new one. Keep schema changes explicit and separate from startup; integration tests must use the intended isolated environment.

Review every changed import against the project rules, including helper packages that could hide an outward dependency. Search route registrations and constructors to verify the new feature is reachable. Do not replace the stack, regenerate unrelated code, or migrate unrelated features as a side effect.

Report implemented behavior/routes, the files fulfilling each relevant layer, checks/results, and any remaining prerequisite. If a required dependency is unavailable, identify the incomplete path instead of presenting an in-memory stub or an unwired handler as the completed feature.
