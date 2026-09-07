---
name: flutter-clean-arch-migrate
description: Migrate an existing Flutter application toward the architecture used by geusan/flutter-clean-arch while preserving its behavior, identifiers, integrations, and user-owned changes. Use for restructuring an established Flutter project into Domain, Repository, Service, and Presentation layers; do not use for creating a new app or merely adding Fastlane.
---

# Flutter Clean Arch Migrate

Refactor an existing Flutter app incrementally. Never replace its `lib/`, `test/`, pubspec, or native folders with the reference repository. The reference defines architectural responsibilities; the target project's behavior and integrations remain authoritative.

Resolve `skill_root` to the directory containing this `SKILL.md` before running bundled scripts. Bundled paths are relative to `skill_root`, never to the target Flutter project's working directory.

## Establish context

Resolve the target Flutter project and the Clean Architecture ref. Default the ref to `main` so every migration run fetches the current repository. Use a branch, tag, or commit when the user requests reproducibility.

Before editing:

1. Confirm the target has `pubspec.yaml` and `lib/`.
2. Inspect repository instructions, Git root, branch, worktrees, and `git status --short`. Preserve all pre-existing changes and do not create a branch or commit unless requested.
3. Fetch the reference into a temporary directory:

   ```bash
   reference_root="$(mktemp -d /tmp/flutter-clean-arch-reference.XXXXXX)"
   "$skill_root/scripts/fetch_clean_arch_reference.sh" \
     --output "$reference_root/checkout" \
     --ref main
   ```

4. Read [references/reference-contract.md](references/reference-contract.md), then inspect the fetched README, pubspec, `lib/di.dart`, `lib/main.dart`, and representative files from every layer. The fetched source takes precedence over the reviewed snapshot when they differ.
5. Run the inventory helper and inspect its JSON rather than relying on directory names alone:

   ```bash
   "$skill_root/scripts/inventory_flutter_project.py" /absolute/path/to/app
   ```

Keep the fetched checkout outside the target repository and remove only that known temporary directory after recording the resolved commit.

## Choose the migration contract

Read [references/migration-playbook.md](references/migration-playbook.md) before changing code.

The default is a structural migration: adopt the reference layer responsibilities and dependency direction while retaining a working state-management, routing, networking, persistence, and DI stack already used by the app. If the target uses a materially different stack from Provider, Get/GetX routing, and GetIt, ask whether the user wants structural compatibility or strict stack parity before replacing those foundations. This choice changes scope too much to infer.

Capture a baseline with the project's own Flutter/FVM command, code-generation command, analyzer, and tests. Existing failures are baseline findings, not permission to weaken checks or rewrite unrelated code.

## Migrate incrementally

Build a file-level mapping, then move one small vertical feature at a time:

- Domain models and rules.
- Repository contracts, remote/local adapters, and mapping.
- Services/use cases.
- View models and screens.
- Composition-root registrations and routes.

Keep the project compiling after each slice. Prefer temporary forwarding exports, adapters, or deprecated aliases over a single repo-wide rename when callers cannot move together. Preserve route names, serialized field names, database keys/schema, API payloads, DI lifetimes, state restoration, error behavior, analytics, and native identifiers unless the user explicitly includes them in scope.

Do not copy the reference chat sample, localhost endpoint, credentials, native projects, generated files, package name, dependency versions, or Flutter pin into the target. Add a dependency only when migrated code consumes it. Regenerate outputs from the target's annotations rather than moving stale `.g.dart` files.

After each slice, format changed Dart files and run the narrowest relevant tests. Then run the layer check:

```bash
"$skill_root/scripts/check_layer_dependencies.py" /absolute/path/to/app
```

Treat reported forbidden internal imports as migration work; do not suppress them. The script accepts the reference's legacy `services -> di.dart` pattern, but prefer constructor injection for newly migrated code unless strict parity requires service-locator access.

## Complete the migration

Run the full project code generation, analyzer, unit/widget tests, and any platform or integration checks that were in the baseline. Compare against the baseline and do not claim success when behavior regressed or validation coverage decreased.

Remove old files and compatibility shims only after searches prove no remaining imports, routes, registrations, generated parts, or tests refer to them. Report:

- Reference repository, requested ref, and resolved commit.
- Baseline and final validation results.
- Features/layers migrated and compatibility shims retained.
- Intentional deviations from the reference stack.
- Remaining migration slices and blockers.
