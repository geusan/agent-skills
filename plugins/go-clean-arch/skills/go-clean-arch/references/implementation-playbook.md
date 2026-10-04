# Implementation playbook

## Inspect and map

Discover modules and relevant build tooling from the target root:

```bash
git status --short
rg --files --hidden -g '!vendor/**' -g '!.git/**' \
  -g 'go.mod' -g 'go.work' -g '*_test.go' -g 'Makefile' \
  -g 'Taskfile*' -g '.mockery*' -g '.github/workflows/**'
```

In each affected module, inspect `go.mod`, `go env GOMOD GOWORK GOVERSION`, startup configuration, and the project's own build/test commands. Identify local `replace` directives and workspace siblings. Do not run `go mod init` at a multi-module repository root or turn local module relationships into published dependencies accidentally.

Map one feature's existing files to domain, use case, inbound adapter, outbound adapter, and composition root. Verify responsibilities from imports and behavior, not directory names. Read test setup and generator directives before executing commands that might use databases or external services.

## New server

Use [init-go-server](../../init-go-server/SKILL.md) for executable initialization and persistent project instructions. Its standard-library starter uses `internal/usecase/<feature>/`; the alternative feature-package layout below remains valid for existing projects.

Use a new/empty target, or add files alongside an existing scaffold without overwriting it. Resolve a real module path from the user's repository or explicit input. Use the selected toolchain and only dependencies consumed by the requested feature; do not copy the reference `go.mod` or `go.sum`.

For a new server without an established layout, a compact adaptation is:

```text
cmd/api/main.go                # configuration, constructors, lifecycle
internal/domain/              # entities, invariants, business errors
internal/<feature>/           # use cases and the ports they consume
internal/transport/http/      # handlers, DTOs, HTTP error mapping
internal/repository/<store>/  # persistence adapter and row mapping
```

Create only the directories needed by the first feature. This layout is an adaptation, not the reference repository's literal tree. Keeping its top-level `domain/`, feature packages, `internal/rest/`, and `app/` is also valid when requested. See [Go's module layout guidance](https://go.dev/doc/modules/layout) for `internal` visibility and multiple commands.

Implement one runnable request through all required layers, with explicit constructor wiring. Configure server timeouts and graceful shutdown at the composition root; close owned resources. Use a health endpoint or a requested business feature to demonstrate startup. Do not invent chat, registration, JWT, or a database merely because the reference includes them. Document local run/configuration commands with placeholders for secrets.

## Add a feature or migrate one slice

1. Capture the feature contract: HTTP method/path, payload, identity/authorization rules, error/status mapping, and persistence effects. For migration, run the existing relevant checks and record failures before editing.
2. Extract domain values/rules and use-case input/output types. Keep transport DTOs and database rows separate when their concerns differ. Reuse simple types where appropriate; avoid mechanical copies with no boundary benefit.
3. Declare the narrow capabilities the use case consumes. For example, a room lookup needs `FindByID(ctx context.Context, id RoomID) (Room, error)`, not a framework query builder or generic CRUD interface. Constructors accept those capabilities.
4. Implement the adapter and map rows/errors. Propagate context into driver calls (for example, `db.WithContext(ctx)` for the applicable GORM API). Define not-found, conflict, and failure behavior consistently with the target contract.
5. Move business decisions out of handlers and storage adapters into the use case. Authentication middleware supplies identity; the use case still enforces business permissions such as room membership or ownership.
6. Wire dependencies in the composition root, adapt the existing handler, and preserve route/middleware order and response shape. Use temporary wrappers for callers that cannot migrate together; remove them after caller searches and checks pass.
7. Verify the slice before expanding. Do not combine a router replacement, ORM replacement, schema migration, and layer extraction unless the request requires all of them.

Ports should follow [Go's consumer-side interface guidance](https://go.dev/wiki/CodeReviewComments#interfaces). A handler may own a small service interface; a use case may own a different repository interface. An adapter can satisfy multiple small interfaces without an artificial shared package or importing each consumer. Add a compile-time assertion only where it will not create an import cycle.

For context propagation, follow the [context package contract](https://pkg.go.dev/context): pass it explicitly to operations, cancel derived contexts when finished, and avoid storing request context on long-lived services. Do not replace request cancellation with `context.Background()` inside an adapter.

### Persistence and transactions

If multiple writes must succeed together, define the atomic business operation first. Use an adapter operation or a transaction port whose callback exposes the repositories needed by that use case. Do not leak `*gorm.DB` or `*sql.Tx` into domain/use-case signatures. Test rollback on a later failure as well as successful commit; avoid unrelated repositories with separate connections masquerading as one transaction.

When removing GORM from domain types, explicitly preserve table/column mapping, primary keys, indexes, nullability, timestamps, associations, and soft-delete behavior. Structural cleanup is not itself a database migration. Generate a migration only when schema changes are in scope, and apply it only to the intended environment under the user's authorization. Use the target's migration tooling instead of copying the reference's `AutoMigrate` executable.

### Generation

Inspect `//go:generate`, `.mockery.yaml`, tool pins, Swagger annotations, and existing generation commands. The reference demonstrates Mockery and Swaggo, but its checked-in generated files can be stale. Regenerate from changed target interfaces/annotations using compatible pinned tools; do not install every generator at `@latest` or blindly run all directives.

The reference's Swagger entrypoint is `app/main.go`, so a command that assumes root `main.go` may fail. Confirm the installed tool's flags and target layout before choosing a command such as `swag init -g app/main.go --parseDependency --parseInternal`. Handwritten fakes are sufficient for small new ports when the target has no generator convention.

## Architecture review

For a review request, prioritize dependency violations with concrete effects: use cases importing storage adapters, framework types in business APIs, swallowed storage failures, broken transaction boundaries, and unowned goroutines. Explain which caller or behavior is affected and give the smallest repair. A different folder name or a missing interface for a concrete value is not automatically a defect. Read-only review does not imply authorization to migrate the application.

## Validation

Format changed Go files with `gofmt`. Run narrow feature tests during implementation, followed by the project's required checks. In each affected module, the baseline checks are:

```bash
go build ./...
go test ./...
go vet ./...
go list -f '{{.ImportPath}} -> {{join .Imports " "}}' ./...
```

Inspect the listed direct imports against the mapped boundaries, including intermediate local packages that might reintroduce an outward dependency. The `go list` command is evidence to review, not an automated architecture pass/fail check. Check relevant build tags and platform-specific files when they are part of the target; a default build does not cover every configuration. Nested modules need separate commands even when a workspace exists.

Tests should cover the behavior affected by the change:

| Boundary | Useful checks |
|---|---|
| Domain/use case | Invariants, denied business operations, missing records, propagated repository failures, cancellation |
| HTTP adapter | Existing payload/status contract, invalid input, identity mapping, error mapping via `httptest` |
| Persistence adapter | Row/domain mapping, not-found translation, constraints and rollback using the target's test strategy |
| Composition | Requested routes wired to real use cases; a local smoke test with test configuration |
| Concurrent code | Exercised connect/use/disconnect/shutdown paths under `go test -race` |

Do not add boilerplate tests for trivial forwarding or mocks that merely repeat method calls. SQL mocks verify query interactions, not real database constraint or transaction behavior; run the target's integration tests on an isolated database when those semantics changed. Do not start the reference applications as a harmless smoke check: startup opens MySQL and the socket server registers with an HTTP API.

Use the target's supported toolchain, tags, and CGO settings. Report skipped integration/race checks and missing prerequisites precisely. Compare final failures with the baseline; do not delete failing tests or weaken checks to declare the migration complete.
