---
name: flutter-app-bootstrap
description: Create a new development-ready Flutter application by fetching and adapting geusan/flutter-clean-arch at runtime. Use for bootstrapping a fresh app or empty target directory; do not use for refactoring an established Flutter codebase or setting up Fastlane on an existing Flutter or native app.
---

# Flutter App Bootstrap

Create a fresh, buildable Flutter application whose identifiers are correct from the first native project generation. Fetch the architecture source at runtime and record its resolved commit.

Resolve `skill_root` to the directory containing this `SKILL.md` before running bundled scripts. Bundled paths are relative to `skill_root`, never to the target Flutter project's working directory.

## Collect the immutable inputs

Resolve these before creating native files:

- Target directory.
- Dart package name: lowercase `snake_case`.
- Organization identifier: reverse-domain form such as `com.example`. Do not silently accept the Flutter default for a real app because it becomes the Android namespace/application ID and iOS bundle-ID prefix.
- Platforms. Default to `android,ios` only when the user asks for a mobile app without narrowing the target.
- Clean Architecture ref. Default to `main` so each run fetches the repository's current source; accept a branch, tag, or commit when reproducibility is preferred.

Derive the package name from the requested target name when unambiguous, but state the derivation. Ask one concise question when the organization identifier or destination cannot be safely inferred.

## Create the project

Read [references/architecture.md](references/architecture.md) before creating or extending the application layers.

Use the bundled bootstrap script for a new target:

```bash
skill_root="/absolute/path/to/flutter-app-bootstrap"
"$skill_root/scripts/bootstrap_flutter_app.sh" \
  --name sample_app \
  --org com.example \
  --dir /absolute/path/to/sample_app \
  --platforms android,ios \
  --clean-arch-ref main
```

The script deliberately refuses a non-empty target. Never bypass that guard to retrofit an existing project. For an existing project, inspect it and propose a separate migration instead of replacing its source or platform files.

The script fetches the Clean Architecture repository before creating the target. A fetch failure stops without leaving a partial Flutter project. It then generates fresh native platform files, overlays the fetched Dart sources, tests, pubspec, lint configuration, and conventional asset directories, rewrites the Dart package import prefix, and applies narrowly scoped SDK compatibility fixes. It does not copy stale native platform directories, lockfiles, `.metadata`, `.fvmrc`, or Git history from the source repository.

Set `FLUTTER_BIN` to an executable path when Flutter is not the desired binary on `PATH`. The script records the selected SDK version in a tracked `.fvmrc` and ignores `.fvm/`. If the user requests a particular FVM version, select/install it first and pass its resolved Flutter executable; do not inherit the source repository's Flutter pin.

## Separate release setup

This skill and its script only create the Flutter application. For a request that also includes Fastlane, finish app creation first, then use the independently installed `fastlane-setup` skill on that project. If that skill is unavailable, report that release setup remains outstanding; do not restore the removed bootstrap installer. A request to add Fastlane to an existing Flutter, native iOS, or native Android app belongs directly to `fastlane-setup` and must not create or migrate an app.

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

Finish with the target path, package/application identifiers, selected platforms, Flutter version, resolved Clean Architecture commit, validations performed, and any requested follow-up work still outstanding.
