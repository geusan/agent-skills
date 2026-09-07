# Migration playbook

## Inventory and baseline

Identify all app entrypoints, flavors, route tables, DI registrations, state containers, repository/data-source abstractions, domain models, generated files, platform channels, tests, and build-time generators. Search imports and symbol references before classifying a file by its name.

Record baseline commands and results. Prefer the project's wrapper (`fvm flutter`, Melos, Make, or scripts) over a global Flutter binary. Run code generation before analysis only when that is the project's established workflow.

## File mapping

Use this as a decision guide rather than a mechanical rename:

| Existing responsibility | Target location |
|---|---|
| Entities, value objects, domain enums and pure rules | `lib/domain/` |
| HTTP clients, DTOs, mappers, local/remote data sources, caches | `lib/repository/` |
| Repository interfaces and implementations | `lib/repository/`, separated into clear subpaths when useful |
| Interactors, application services and use cases | `lib/services/` |
| Pages, screens, widgets and their view models/controllers | `lib/screens/<feature>/` |
| Storage keys and narrow shared primitives | `lib/common/` |
| Theme, spacing, colors and presentation constants | `lib/values/` |
| Dependency registrations | `lib/di.dart` or the target's existing composition-root module |

Do not move a generic `utils/` directory wholesale. Classify each file by what it knows and which direction it depends.

## Recommended sequence

1. Choose a small feature with useful tests and limited cross-feature coupling.
2. Extract or relocate its domain types while preserving serialization and equality behavior.
3. Move I/O behind repository contracts. Keep wire DTOs and persistence records out of presentation code.
4. Introduce a service/use case that owns orchestration previously embedded in widgets or controllers.
5. Move UI state into a view model appropriate to the chosen state-management mode.
6. Register dependencies with the same lifetime as before. Avoid changing singleton/factory/lazy behavior accidentally.
7. Route the existing screen through the migrated slice without renaming externally visible routes.
8. Validate, then repeat with the next feature.

## Compatibility techniques

- Leave a forwarding export at an old import path while downstream callers migrate.
- Keep a deprecated type alias or wrapper when another package consumes the old public type.
- Add an adapter implementing the old interface and delegating to the new repository or service.
- Preserve JSON keys, database columns, secure-storage keys, cache versions, and method-channel names.
- When moving generated sources, move annotated source first, update `part` directives, regenerate, and verify that stale outputs are gone.
- Use constructor injection for new code. Move service-locator reads toward the composition root gradually unless strict parity explicitly calls for the reference pattern.

Compatibility shims must have a named caller and a removal condition. Do not create speculative abstractions.

## Validation gates

For each feature slice:

- Format changed Dart files.
- Run focused unit and widget tests.
- Run code generation when annotations or `part` paths changed.
- Run `check_layer_dependencies.py` and resolve new violations.
- Search for old paths and symbols before deleting anything.

At the end:

- Run the same analyzer and test commands captured at baseline.
- Exercise startup, navigation, error paths, persistence, and authentication affected by the migration.
- Run relevant platform builds only when the environment supports them or the baseline included them.
- Compare route behavior, state restoration, API payloads, and persisted data behavior with the baseline.

Stop and report instead of guessing when a failing baseline hides the behavior being preserved, a generated schema would change, a public API consumer is unavailable, credentials are required, or the state-management parity choice remains unresolved.
