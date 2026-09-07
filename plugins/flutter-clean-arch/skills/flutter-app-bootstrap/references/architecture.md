# Architecture baseline

## Source interpretation

Every bootstrap run fetches [geusan/flutter-clean-arch](https://github.com/geusan/flutter-clean-arch). The default ref is `main`; the runtime records the exact resolved commit in `.bootstrap-sources.json`. The initial runtime adapter was verified against commit `559779db16aad5c3475a7a5b6fd84ebba4944d1b`.

That repository provides the application-layer source: MVVM with four named layers, Provider for presentation state, GetIt for dependency assembly, API/local persistence adapters, and services as use cases. The bootstrapper adapts it rather than cloning it as the final native project because the reviewed commit contains:

- It is pinned to Flutter `3.19.1` and Dart `>=3.3.0 <4.0.0`.
- Native identifiers contain `com.example.geusan`.
- The application code is a chat sample coupled to a localhost API.
- Dependency constraints that conflict with current Flutter SDK-pinned packages.
- A widget test that does not install its required Provider.

Generate native files with the selected Flutter SDK, then apply the fetched repository's `lib/`, `test/`, `pubspec.yaml`, `analysis_options.yaml`, conventional `assets/`, `fonts/`, `integration_test/`, and `.vscode/` content, and license/notice files when present. Rewrite the source package import prefix to the requested Dart package name. Do not copy source native folders, lockfile, `.metadata`, `.fvmrc`, or `.git/`.

Preserve source dependency constraints by default. For reviewed legacy commit `559779d`, refresh only its constraints proven to conflict with the selected SDK: let Flutter resolve its SDK-pinned `intl` version and align `retrofit_generator` with the resolved Retrofit API. Unknown commits keep their own dependency constraints and must resolve without this legacy repair. Always use the selected SDK constraint rather than the source repository's older constraint, then regenerate checked-in generated Dart files when `build_runner` is present.

For the reviewed legacy commit, the adapter repairs its known Provider widget-test harness. Do not apply that content-specific repair to unknown commits. Unknown source changes must pass their own tests or fail visibly; never substitute bundled application code.

## Dependency direction

```text
Presentation  ->  Service  ->  Repository  ->  Domain
      \                composition root (lib/di.dart)
       `---------------------------------------------^
```

- `domain/`: immutable business values and rules. No Flutter widgets, network clients, storage plugins, or platform APIs.
- `repository/`: data-source contracts and implementations. Convert transport or persistence details into domain values here.
- `services/`: application use cases. Coordinate repositories and business operations; do not render UI or read widget context.
- `presentation/`: screens and view models. View models expose UI state and invoke services. Widgets render state and forward user intent.
- `di.dart`: the only composition root. Register implementations and factories here rather than resolving global dependencies throughout business code.

The fetched sample domain is source-controlled by the Clean Architecture repository. Do not independently replace it during bootstrap unless the user also asks for product-specific adaptation.

## Adding capabilities

Add packages only with a concrete consumer:

- HTTP: add Dio or another client in `repository/`; expose domain-oriented results above it.
- Persistence: keep SharedPreferences, secure storage, or SQLite adapters in `repository/`.
- Serialization: keep transport models and generated JSON code at the repository boundary; do not make domain logic depend on wire formats.
- Routing: select a router based on actual navigation needs. The source repository's GetX routing is not a requirement.
- Code generation: add `build_runner` and the relevant generator only with annotated source, then generate and verify outputs with the selected SDK.

Do not create empty speculative layers for features that do not exist. A small working vertical slice is more useful than a wide directory tree of placeholders.
