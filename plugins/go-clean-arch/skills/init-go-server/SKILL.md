---
name: init-go-server
description: Initialize a new Go backend with Clean Architecture when the user asks for Go 서버 만들어줘, 백엔드 초기화, or a Go server scaffold, even without naming this skill. Also use for init-go-server. Infer Go from the request or established project context; do not reinitialize an existing server to add an endpoint.
---

# Initialize Go Server

Make `init-go-server` alone sufficient to start a new server. Create and verify working files rather than responding with an architecture proposal. The bundled starter implements a standard-library HTTP server, `GET /health`, graceful shutdown, and an explicit domain/use-case/adapter layout. It is informed by `geusan/go-clean-arch-chat-server`, not a clone of the chat sample.

Resolve `skill_root` to the directory containing this file. Use Python 3.9+ and Go 1.22+ on the selected development toolchain. Bundled paths are relative to `skill_root`.

## Select from context

Use this workflow for a requested new Go server, not merely because an empty directory exists. For a feature in an existing Go backend, use [add-go-feature](../add-go-feature/SKILL.md). For a combined request such as "Go 서버 만들고 회원 API도 추가해줘", initialize first and continue with that feature in the same task. A generic backend request with no established language does not by itself select Go.

## Choose defaults without a setup interview

Read repository instructions and inspect the current directory, Git changes, and any `go.mod`/`go.work` before writing.

- **Destination:** Use the user-specified directory. Otherwise use the current directory when empty or containing only Git/README/instruction/license metadata. In an unrelated non-Go project, use an unoccupied `./server` and state that choice. Ask for a destination only if existing backend files make this ambiguous.
- **Existing Go server:** Do not rerun the initializer or replace source. Check its layout and instructions. If already initialized, verify it and continue the requested work. If adopting clean architecture requires migration, use the existing-code workflow in `go-clean-arch` rather than overwriting it.
- **Module:** Prefer the supplied module path. Otherwise the initializer derives it from the target's Git origin and repository-relative directory. With no usable origin, use `example.com/<directory-name>` as an explicitly reported local placeholder. Do not block local development on a publishing identifier.
- **Stack:** Default to `net/http`, no external dependencies, and `HTTP_ADDR=:8080`. Honor a requested Echo/Gin/database stack by adapting the generated adapters and composition root after initialization. Select compatible dependency versions and verify their APIs; keep the inner layers unchanged.

If existing instruction files prescribe another layout or stack, reconcile that with the user's request before appending contradictory guidance. The script preserves metadata text; it does not understand its semantics.

## Initialize and make development rules persistent

Run the bundled initializer for the selected new destination:

```bash
python3 "$skill_root/scripts/init_go_server.py" --dir /absolute/path/to/server
```

Pass `--module github.com/owner/project` when specified. `--go-bin` or `GO_BIN` selects a Go executable. No arguments beyond the script are required when the current directory is suitable.

The script validates the module with Go in a temporary directory before writing, creates only new application files, and rejects existing application source or a destination nested in an existing Go module. It preserves and appends to existing `README.md`, `AGENTS.md`, `CLAUDE.md`, and `.gitignore`. If it refuses a destination, inspect the reason; do not delete files or bypass the guard.

Verify these deliverables:

```text
cmd/api/main.go                   configuration, constructors, lifecycle
internal/domain/                 reserved for business entities and rules
internal/usecase/                reserved for feature use cases and ports
internal/repository/             reserved for persistence adapters
internal/transport/http/         router, health handler, HTTP tests
AGENTS.md                        architecture rules for every later feature
CLAUDE.md                        directs Claude Code to those same rules
README.md                        module, run/configuration, verification
```

`AGENTS.md` must explain inward imports, consumer-owned interfaces, constructor injection, context/errors, feature implementation order, and validation. These rules apply even when later requests only say "add login" or "add a room API". Keep the generated instructions aligned if you adapt the layout or stack. `add-go-feature` is the dedicated implementation skill, but the project instructions must remain usable when the plugin is unavailable.

Health is infrastructure liveness, so it has no fabricated entity/use case/repository. The reserved directories become real packages when a business feature needs them. If initialization includes a requested feature, continue immediately through [add-go-feature](../add-go-feature/SKILL.md) and implement it; do not stop after producing the scaffold.

For reference-specific decisions, consult [the inspected source contract](../go-clean-arch/references/reference-contract.md). There is no need to fetch the sample just to render this self-contained starter.

## Verify the result

Format generated or adapted Go files, then run `go build ./...`, `go test ./...`, and `go vet ./...` from the generated module. Review imports against `AGENTS.md`. If a parent workspace excludes the new module, validate with `GOWORK=off`; do not silently change unrelated workspace membership.

Smoke-test the server on an available local port, verify `GET /health` returns `200` and `{"status":"ok"}`, and stop only the process started for this check. If business features were requested, run their use-case/handler and relevant adapter tests too. Do not claim success if these checks fail.

Finish with destination, module (including any local placeholder), run command, checks performed, and a concrete next request such as `add-go-feature 사용자 등록 API 추가해줘`. Explain that ordinary feature requests in this project follow the saved architecture rules as well.
