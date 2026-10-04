# Reference architecture contract

## Source and reproducibility

Repository: [geusan/go-clean-arch-chat-server](https://github.com/geusan/go-clean-arch-chat-server).

Reviewed on 2026-10-04 at commit [`cbaa31ae412bc39c522af0721f39897695000816`](https://github.com/geusan/go-clean-arch-chat-server/tree/cbaa31ae412bc39c522af0721f39897695000816). This is a source-inspection snapshot, not a claim that its tests or deployment pass.

When current source is needed, fetch it outside the target repository:

```bash
reference_root="$(mktemp -d "${TMPDIR:-/tmp}/go-clean-arch-reference.XXXXXX")"
git clone --depth 1 --branch main \
  https://github.com/geusan/go-clean-arch-chat-server.git \
  "$reference_root/checkout"
git -C "$reference_root/checkout" rev-parse HEAD
```

For a requested tag, branch, or commit, fetch and check out that exact ref and record its resolved SHA. A fetch failure must not silently substitute another ref. Reconcile changed source with the observations below, while retaining the skill's inward dependency contract. Remove only the known temporary checkout after use.

## Actual module and package layout

The Git root has no Go module. `server/` declares module `api-server`; `chat-server/` declares module `chat-server`. Both snapshots specify Go 1.22.4. There is also a Next.js `frontend/` and root Terraform configuration. These are sample deployment choices, not requirements for a new backend.

| Reference path | Observed responsibility | Reusable pattern |
|---|---|---|
| `server/domain/` | User/chat/chatroom models, auth claims, some API DTOs | Identify business concepts, then separate framework concerns |
| `server/auth/service.go`, `server/chat/service.go` | Feature services and their repository interfaces | Consumer-owned ports, feature packages, constructor injection |
| `server/internal/rest/` | Echo handlers, routes, service interfaces, response types | Small inbound adapters depending on injected services |
| `server/internal/middleware/` | HTTP authentication and identity attachment | Keep transport authentication at the edge |
| `server/internal/repository/rdb/` | GORM/MySQL persistence | Concrete adapters satisfying feature interfaces |
| `server/internal/repository/consistent_hash/` | In-process consistent hashing of chat servers | Isolate routing infrastructure behind a port |
| `server/app/main.go` | Database, adapters, services, middleware, routes | Explicit composition root |
| `server/cli/migration.go` | GORM `AutoMigrate` executable | Separate schema tooling from request handling |
| `chat-server/chat/` | Service, hub, WebSocket client and pumps | Inspect concurrency ownership before reuse |
| `chat-server/internal/rest/chat_socket.go` | Socket upgrade and room endpoints | Transport-specific entrypoints |
| `chat-server/app/main.go` | Socket server wiring and API registration | Explicit wiring; registration is an external side effect |

The snapshot uses Echo v4, GORM/MySQL, JWT, Mockery/Testify, SQLMock, Swaggo, and Gorilla WebSocket. `consistent_hash` is not a Redis implementation despite names/comments elsewhere. Neither two Go modules nor these dependencies are intrinsic to Clean Architecture.

Inspect the files above for the feature at hand, its corresponding tests, and each affected `go.mod`. Do not assume a `usecase/` folder exists: the reference's `auth` and `chat` feature services play that role.

## Observed limitations and target decisions

These observations explain where copying the sample would undermine the intended architecture. They are not authorization for a wholesale rewrite of an existing application.

| Source evidence | Limitation in the snapshot | Guidance for new or scoped refactored code |
|---|---|---|
| `server/domain/user.go`, `domain/auth.go` | Domain embeds `gorm.Model`, defines JWT claims, and reads `SECRET_KEY` while signing tokens | Keep persistence rows and token implementation in adapters; inject a token capability where needed |
| `server/auth/service.go` | Use case imports `internal/repository/rdb` to call `Salt` | Inject a password verification capability; no service-to-concrete-repository dependency |
| `server/internal/repository/rdb/user.go` | `Salt` is unsalted SHA-256; methods panic or obscure failures | For new authentication use a password-specific algorithm via an adapter; existing hashes require a compatibility/rehash plan, not a silent switch |
| `server/domain/user.go`, `domain/chatroom.go` | GORM metadata and additional `Id` fields coexist | Preserve existing IDs, table/column names, timestamps, and soft-delete behavior when introducing separate database models |
| `server/internal/repository/rdb/connection.go` | Database connection parameters are hardcoded | Load validated configuration at startup and inject the connection |
| `server/auth/service.go`, `server/chat/service.go` | Interfaces omit context and often omit errors | Evolve scoped callers/adapters together toward cancellation and explicit errors |
| `server/auth/service_test.go`, `internal/rest/auth_test.go` | Some mocked methods/arguments differ from implementation | Establish an actual baseline and regenerate/update tests from the target contract |
| `chat-server/chat/service.go`, `hub.go` | Shared map access is unsynchronized, existing hubs can start another loop, and close/count bypass loop ownership | Use a single owner or coordinated locking, with explicit lifecycle and race tests |
| `chat-server/chat/client.go` | Gorilla connection lives under the feature package; origin logic checks the request host for `localhost` | Keep socket I/O in an adapter and validate the actual Origin according to the application's policy |
| `server/cli/migration.go` | Schema change is a direct `AutoMigrate` against the configured database | Preserve the target's migration process; do not run this executable as a build check |

## Authority during migration

The target remains authoritative for routes, JSON fields, status codes, cookies/claims, password compatibility, WebSocket message framing, database schema, transaction semantics, and deployment boundaries. Separate structural edits from changes to these contracts. If a behavior change is necessary, identify and implement it within the user's requested scope rather than hiding it in a file move.

Keep a working router, ORM, dependency wiring approach, and module layout when they already satisfy the boundaries. A `net/http`, Chi, Gin, SQLC, or `database/sql` project can adopt the same architecture without converting to Echo/GORM. Do not split a single service into the sample's two services solely to match its tree.
