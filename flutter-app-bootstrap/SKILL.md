---
name: flutter-app-bootstrap
description: Create a new development-ready Flutter application by fetching and adapting geusan/flutter-clean-arch at runtime, with optional deployment files fetched from geusan/fastlane-template. Use for bootstrapping a fresh app or empty target directory; do not use for refactoring an established Flutter codebase or merely troubleshooting an existing release pipeline.
---

# Flutter App Bootstrap

Create a fresh, buildable Flutter application whose identifiers are correct from the first native project generation. Fetch both source repositories at runtime so the result records and applies their resolved commits.

## Collect the immutable inputs

Resolve these before creating native files:

- Target directory.
- Dart package name: lowercase `snake_case`.
- Organization identifier: reverse-domain form such as `com.example`. Do not silently accept the Flutter default for a real app because it becomes the Android namespace/application ID and iOS bundle-ID prefix.
- Platforms. Default to `android,ios` only when the user asks for a mobile app without narrowing the target.
- Clean Architecture ref. Default to `main` so each run fetches the repository's current source; accept a branch, tag, or commit when reproducibility is preferred.
- Fastlane level: `none`, `files`, or `configure`. Default to `files` when deployment preparation is in scope.

Derive the package name from the requested target name when unambiguous, but state the derivation. Ask one concise question when the organization identifier or destination cannot be safely inferred.

## Create the project

Read [references/architecture.md](references/architecture.md) before creating or extending the application layers.

Use the bundled bootstrap script for a new target:

```bash
./scripts/bootstrap_flutter_app.sh \
  --name sample_app \
  --org com.example \
  --dir /absolute/path/to/sample_app \
  --platforms android,ios \
  --clean-arch-ref main \
  --fastlane files
```

The script deliberately refuses a non-empty target. Never bypass that guard to retrofit an existing project. For an existing project, inspect it and propose a separate migration instead of replacing its source or platform files.

The script fetches the Clean Architecture repository before creating the target. A fetch failure stops without leaving a partial Flutter project. It then generates fresh native platform files, overlays the fetched Dart sources, tests, pubspec, lint configuration, and conventional asset directories, rewrites the Dart package import prefix, and applies narrowly scoped SDK compatibility fixes. It does not copy stale native platform directories, lockfiles, `.metadata`, `.fvmrc`, or Git history from the source repository.

Set `FLUTTER_BIN` to an executable path when Flutter is not the desired binary on `PATH`. The script records the selected SDK version in a tracked `.fvmrc` and ignores `.fvm/`. If the user requests a particular FVM version, select/install it first and pass its resolved Flutter executable; do not inherit the source repository's Flutter pin.

## Handle Fastlane separately

Read [references/fastlane.md](references/fastlane.md) whenever `--fastlane` is not `none`.

- `files` installs the pipeline with GCP/Firebase and App Store Connect configuration skipped. It is the safe preparation default.
- `configure` can enable cloud APIs, register Firebase apps, create a service account and key, change IAM, and create a tester group. Use it only after the user explicitly authorizes those external changes, and pass `--allow-cloud-changes`.
- Never run a distribution or store lane merely to prove initialization. `fastlane doctor` is the read-only readiness check, although it makes live API probes when credentials are present.

Do not print or commit `.env`, service-account JSON, `.p8`, keystore passwords, or signing files. Confirm the generated `.gitignore` covers them before reporting deployment readiness.

## Adapt and verify

Keep dependency direction `Presentation -> Service -> Repository -> Domain`; use `di.dart` only as the composition root. Domain code must remain independent of Flutter, HTTP, storage, and platform packages.

Treat the fetched source as authoritative application code. If a newly fetched commit fails adaptation, dependency resolution, generation, analysis, or tests, report the resolved commit and failure instead of silently falling back to bundled code or an older commit.

After any project-specific edits, run from the app root:

```bash
flutter pub get
dart format --output=none --set-exit-if-changed lib test
flutter analyze
flutter test
```

Use the same resolved Flutter/Dart SDK chosen for creation. When platform compilation is explicitly in scope, add a debug Android build and, on macOS, an unsigned iOS simulator build. Do not treat `flutter doctor` warnings for unrequested platforms as application failures.

Finish with the target path, package/application identifiers, selected platforms, Flutter version, resolved Clean Architecture and Fastlane commits, validations performed, and any manual release-console work still outstanding.
