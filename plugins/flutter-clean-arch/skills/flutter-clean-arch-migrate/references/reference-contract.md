# Reference architecture contract

## Runtime source

Fetch [geusan/flutter-clean-arch](https://github.com/geusan/flutter-clean-arch) for every migration session. Default to `main` and record the exact resolved commit in the final report. The snapshot reviewed while authoring this skill was `559779db16aad5c3475a7a5b6fd84ebba4944d1b`; runtime source wins when it changes.

Inspect at least these files in the fetched checkout:

- `README.md` for stated architectural intent.
- `pubspec.yaml` for the demonstrated technology stack.
- `lib/main.dart` and `lib/di.dart` for composition.
- One model under `lib/domain/`.
- Remote and local adapters under `lib/repository/`.
- One use case under `lib/services/`.
- A screen and view model under `lib/screens/`.

## Layer responsibilities

| Reference path | Responsibility | Allowed inward dependencies |
|---|---|---|
| `lib/domain/` | Business models and domain values | Same layer and external serialization annotations when retained |
| `lib/repository/` | HTTP, socket, preferences, secure storage, SQL, DTO mapping | Domain, common, values |
| `lib/services/` | Use cases and business orchestration | Repository, domain, common; legacy source also resolves through `di.dart` |
| `lib/screens/` | Views and view models | Services and lower layers through injected collaborators |
| `lib/common/` | Shared keys and narrow cross-cutting definitions | Avoid feature/UI dependencies |
| `lib/values/` | Theme/design/constants utilities | Avoid services, repositories, and screens |
| `lib/di.dart` | Application composition root | May import concrete implementations from every assembled layer |
| `lib/main.dart` | Startup and top-level providers/router | Composition root and presentation entrypoints |

The conceptual dependency flow is Presentation → Service → Repository → Domain. `screens/` is the reference repository's presentation layer.

## Reference versus target authority

Use the reference for boundaries, naming, and composition patterns. The existing target remains authoritative for:

- Product features and UI behavior.
- Public Dart APIs used by other packages.
- Deep links and route names.
- API contracts, authentication semantics, and error mapping.
- Persistent keys, database schema and migrations, caches, and secure-storage behavior.
- Analytics events, notifications, background tasks, flavors, signing, Firebase files, and native capabilities.

The reviewed snapshot is a chat sample pinned to Flutter 3.19.1 with `com.example` identifiers and a localhost endpoint. Those are examples, not migration inputs. Do not copy its lockfile, generated outputs, platform directories, SDK pin, or dependency constraints.

## Stack parity

The reviewed reference demonstrates Provider, GetIt, Get/GetX routing, Dio/Retrofit, SharedPreferences, secure storage, SQLite, and JSON generation. Architecture conformance does not inherently require replacing an existing Riverpod, Bloc, go_router, AutoRoute, Chopper, Drift, Hive, or other functioning stack.

Use structural compatibility by default. Require a user decision before strict parity when replacing a foundational stack would materially expand the change, invalidate tests, or alter runtime behavior.
