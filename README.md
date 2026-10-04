# Agent Skills

Reusable Flutter, Go, and Next.js development and App Store review workflows packaged for both Codex and Claude Code.

The `flutter-clean-arch` plugin includes:

- `flutter-app-bootstrap`: create a new Flutter app from `geusan/flutter-clean-arch`, with optional Fastlane preparation.
- `flutter-clean-arch-migrate`: incrementally migrate an existing Flutter app while preserving behavior and integrations.
- `flutter-firebase-analytics`: add a facade-based Firebase Analytics integration, design a measurement plan, validate collection, and analyze GA4 or BigQuery events.

The `go-clean-arch` plugin includes:

- `init-go-server`: initialize a runnable server with `net/http`, `/health`, a clean architecture layout, and persistent `AGENTS.md`/`CLAUDE.md` development instructions. Infers the module from Git origin or uses a local placeholder; no setup interview is needed for the default starter.
- `add-go-feature`: implement a feature through domain, use case, adapters, route wiring, and tests. Also applies to ordinary Go feature requests in initialized projects.
- `go-clean-arch`: review or incrementally migrate an existing backend while preserving behavior. Shared guidance is informed by [geusan/go-clean-arch-chat-server](https://github.com/geusan/go-clean-arch-chat-server), with its sample-specific limitations documented.

After installing the plugin, request `init-go-server` in the target workspace. Then request, for example, `add-go-feature 사용자 등록 API 추가해줘`. Saved project instructions also guide later feature requests that do not explicitly name a skill. These are agent requests, not shell commands.

All Go skills allow implicit selection. A request for a new Go server selects `init-go-server`; a feature request in an existing Go backend selects `add-go-feature`; code review or structural refactoring selects `go-clean-arch`. A combined creation/feature request initializes first and then implements the feature. Selection depends on the installed skill descriptions and project context, so the skill names are optional.

The `nextjs-clean-arch` plugin includes:

- `init-nextjs-app`: initialize Next.js App Router, React, Tailwind CSS, TypeScript, and Vitest with feature-level domain/application/infrastructure/presentation boundaries, basic architecture lint rules, and persistent development instructions.
- `add-nextjs-feature`: implement frontend features with server/client boundaries, use-case ports, adapters, accessible UI, and tests. Selects from ordinary feature requests when the owning application is Next.js.
- `nextjs-clean-arch`: review existing code without changes or incrementally refactor it while preserving routes, behavior, API contracts, and the established stack. Does not impose the starter's router, styling, or testing tools on an existing app.

Request `Next.js 프론트엔드 만들어줘` to initialize, then `로그인 화면 추가해줘` to add a feature. All three skills allow implicit selection; in mixed Go/Next.js projects they distinguish frontend work from backend endpoints. `vite test` is implemented as **Vitest**; the app still uses Next.js for development and production builds.

The `app-store` plugin includes:

- `app-store-review`: prepare TestFlight builds, store metadata and screenshots, privacy disclosures, content rights, age ratings, and release settings using verified app behavior. Includes a dated Hisohiso case reference.

## Review and refactor existing projects

Use `go-clean-arch` for an existing Go backend and `nextjs-clean-arch` for an existing Next.js frontend. These workflows also apply to projects created before this plugin was installed. Skill names are optional when the language/framework is clear from context.

| Request | Behavior |
|---|---|
| `코드 수정 없이 현재 프로젝트를 점검해줘.` | Read-only findings with severity, file/line evidence, impact, and suggested fixes |
| `이 프로젝트를 클린 아키텍처로 전환하려면 어떻게 해야 해?` | Read-only migration assessment and plan |
| `기존 동작과 API를 유지하면서 클린 아키텍처로 리팩터링해줘.` | Baseline checks, feature-by-feature changes, then regression verification |
| `점검하고 확인된 문제를 수정해줘.` | Review first, then implement fixes within the requested scope |

For Go + Next.js projects, both workflows review their own code and the shared API contract. Refactoring preserves the wire contract by default and ends with relevant integration checks. Keep existing router, package manager, styling/state libraries, and test tools unless replacing them is explicitly part of the request; never run an initializer over existing source.

Explicit Codex examples:

```text
$go-clean-arch:go-clean-arch 코드 수정 없이 인증과 채팅 API를 점검해줘.
$nextjs-clean-arch:nextjs-clean-arch 기존 동작을 유지하면서 상품 목록 기능을 클린 아키텍처로 리팩터링해줘.
```

In Claude Code, use `/go-clean-arch:go-clean-arch` or `/nextjs-clean-arch:nextjs-clean-arch` with the same request.

## Install in Codex

Add this repository as a marketplace and install the plugin:

```bash
codex plugin marketplace add geusan/agent-skills
codex plugin add flutter-clean-arch@personal
codex plugin add go-clean-arch@personal
codex plugin add nextjs-clean-arch@personal
codex plugin add app-store@personal
```

Start a new Codex session, run `/skills` to confirm discovery, and invoke a bundled skill:

```text
$flutter-clean-arch:flutter-app-bootstrap Create a mobile app named sample_app with organization com.example.
```

```text
$flutter-clean-arch:flutter-clean-arch-migrate Migrate the current Flutter project without changing behavior.
```

```text
$flutter-clean-arch:flutter-firebase-analytics Add Firebase Analytics behind a facade and design the events needed to measure activation.
```

```text
$go-clean-arch:init-go-server
```

```text
$go-clean-arch:add-go-feature 사용자 등록 API를 추가해줘.
```

```text
$nextjs-clean-arch:init-nextjs-app
```

```text
$nextjs-clean-arch:add-nextjs-feature 상품 목록 화면을 기존 API와 연결해줘.
```

```text
$app-store:app-store-review 이 앱의 App Store 심사 준비 상태를 확인하고, 한국어 메타데이터와 개인정보 신고를 준비해줘.
```

## Install in Claude Code

```bash
claude plugin marketplace add geusan/agent-skills
claude plugin install flutter-clean-arch@geusan-flutter
claude plugin install go-clean-arch@geusan-flutter
claude plugin install nextjs-clean-arch@geusan-flutter
claude plugin install app-store@geusan-flutter
```

Start a new Claude Code session or run `/reload-plugins`, then invoke a bundled skill:

```text
/flutter-clean-arch:flutter-app-bootstrap Create a mobile app named sample_app with organization com.example.
```

```text
/flutter-clean-arch:flutter-clean-arch-migrate Migrate the current Flutter project without changing behavior.
```

```text
/flutter-clean-arch:flutter-firebase-analytics Analyze the checkout funnel from the available GA4 or BigQuery event data.
```

```text
/go-clean-arch:init-go-server
```

```text
/go-clean-arch:add-go-feature Add a room creation API with the existing authentication and persistence conventions.
```

```text
/nextjs-clean-arch:init-nextjs-app
```

```text
/nextjs-clean-arch:add-nextjs-feature Add a login screen using the existing authentication API.
```

```text
/app-store:app-store-review Explain the correct selections in this App Store Connect screenshot using the actual release build.
```

## Local development

Test the Claude Code plugin directly from this repository:

```bash
claude --plugin-dir ./plugins/flutter-clean-arch
claude --plugin-dir ./plugins/go-clean-arch
claude --plugin-dir ./plugins/nextjs-clean-arch
```

Validate the plugin manifests:

```bash
claude plugin validate ./plugins/flutter-clean-arch
claude plugin validate ./plugins/go-clean-arch
claude plugin validate ./plugins/nextjs-clean-arch
claude plugin validate ./plugins/app-store
```

Test the Go initializer's overwrite guards and metadata preservation:

```bash
PYTHONDONTWRITEBYTECODE=1 python3 -m unittest discover \
  -s plugins/go-clean-arch/skills/init-go-server/scripts -p 'test_*.py'
```

To exercise the starter directly in a new directory (Python 3.9+ and Go 1.22+):

```bash
python3 plugins/go-clean-arch/skills/init-go-server/scripts/init_go_server.py \
  --dir /tmp/sample-go-server --module example.com/sample-go-server
```

Test the Next.js initializer's overwrite guards and staged-failure behavior:

```bash
PYTHONDONTWRITEBYTECODE=1 python3 -m unittest discover \
  -s plugins/nextjs-clean-arch/skills/init-nextjs-app/scripts -p 'test_*.py'
```

Initialize a new frontend with Python 3.9+, npm, and a compatible Node runtime
(use a current Node 24 LTS release for the current testing tools):

```bash
python3 plugins/nextjs-clean-arch/skills/init-nextjs-app/scripts/init_nextjs_app.py \
  --dir /tmp/sample-nextjs-app
```

The script stages the official scaffold and installs dependencies before writing
application files to the destination. It reports resolved versions and keeps
the npm lockfile. Generated app checks are `npm run lint`, `npm run typecheck`,
`npm test`, and `npm run build`. Vitest separates Node unit tests from jsdom
component tests; async Server Components need runtime/integration or E2E checks.
