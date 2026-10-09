---
name: fastlane-setup
description: Set up or adapt Fastlane in existing native iOS (Swift/Objective-C), native Android (Kotlin/Java), or Flutter apps. Use for Fastlane setup, fastlane 초기화, or adding build and release lanes without creating or restructuring an app. Does not submit builds or perform App Store review work unless separately requested.
---

# Fastlane Setup

Add working Fastlane configuration to the existing application. Infer the platform from its build files; Flutter is one supported project type, not a prerequisite. Preserve application code, identifiers, signing choices, and existing lanes.

## Inspect the target and choose the path

Read project instructions and Git status, then inspect the existing Gemfile/lockfile, Fastfiles, CI commands, and native build configuration. Resolve the target from the user's path or current workspace. A supplied `fastlane-template` directory is a template source, not necessarily the application to modify; ask for the application path if none is identifiable.

| Project evidence | Setup path |
|---|---|
| `.xcodeproj` or `.xcworkspace`, Swift/Objective-C sources | [Native iOS](references/native.md#ios) |
| Gradle settings/build files, Android application module, `gradlew` | [Native Android](references/native.md#android) |
| `pubspec.yaml` declaring the Flutter SDK plus native platform directories | [Flutter template integration](references/flutter.md) |

Use only the requested or present platforms. For a monorepo, determine the owning app and native build root before choosing where `fastlane/` lives. Do not create `pubspec.yaml`, run `flutter create`, or introduce Flutter to satisfy a template guard. An existing Flutter app requires no architecture migration or bootstrap to add Fastlane.

Resolve actual iOS project/workspace, shared scheme, configuration, team and bundle IDs; for Android resolve Gradle root, application module, variants, application ID and signing setup. Reuse values from the selected target/variant, not a test target or library namespace. Ask only for inputs that materially block configuration and cannot be inferred.

## Use the template as a reference

Use the user-supplied `geusan/fastlane-template` checkout when available. Inspect its README, installer and relevant Fastfiles/helpers; record its commit and whether local changes affect the reference. Otherwise fetch the reviewed commit into a temporary directory:

```bash
fastlane_reference="$(mktemp -d /tmp/fastlane-reference.XXXXXX)"
git -C "$fastlane_reference" init --quiet
git -C "$fastlane_reference" remote add origin https://github.com/geusan/fastlane-template.git
git -C "$fastlane_reference" fetch --depth 1 origin 78cfa31d1ce27aa3a6927abd344123176ae733a6
git -C "$fastlane_reference" checkout --detach FETCH_HEAD
git -C "$fastlane_reference" rev-parse HEAD
```

Honor a user-selected ref and inspect its differences. At the reviewed commit, `setup.sh` requires `pubspec.yaml`, helpers assume `android/` and `ios/`, and release lanes call `flutter build`, read pubspec versions, and use `Runner`. Run that installer only for a compatible Flutter app. For native apps, adapt the applicable conventions into project-specific files using the native reference; copying the installer or its helpers unchanged does not produce native support.

## Implement the requested setup

- Merge Fastlane into the existing Gemfile and preserve other gems and their constraints. Reuse the project's Ruby manager; use Bundler and retain its lockfile. Include a Pluginfile only for plugins actually used by the requested lanes.
- Create or update `fastlane/Fastfile`, applicable Appfile/Gymfile, non-secret `.env.example`, and narrowly scoped ignore rules. Make builds callable separately from upload lanes. Keep authentication inside the lanes that need it so local validation works without release credentials.
- For a plain setup request, configure local build automation and document optional release inputs. Add TestFlight, Play, or Firebase lanes when those channels are requested or already part of the project's pipeline; do not assume both stores and Firebase are required.
- Preserve existing files by merging changes. The reference installer can replace files even without `--force` (after creating `.bak` files), so inspect collisions and merge manually when it would overwrite existing pipeline configuration or a Gemfile.
- Setup alone does not authorize cloud resource creation, IAM changes, signing-key replacement, tester invitations, or uploads. Continue any such work already authorized in the conversation; otherwise complete local setup before asking about the specific remaining external action.
- Keep credentials in existing ignored files or the project's secret store. Do not echo secret values. Verify ignore rules for actual key/env paths, including any backups; `.env.example` must stay trackable.

Check current official Fastlane action documentation when selecting parameters or adapting to the installed version. Read only the relevant platform reference.

## Validate and hand off

Run `bundle install` using the project's Ruby, then syntax-check changed Ruby configuration (`ruby -c`) and run `bundle exec fastlane lanes` from the documented invocation directory. Inspect top-level code and hooks first so lane discovery cannot trigger an upload or require secrets. Run a local build lane when the selected SDK and signing prerequisites are available; otherwise state the exact unverified build step.

`doctor` is a custom lane in the template, not a Fastlane built-in. Run it only if present and inspected; the template version makes live read-only probes when credentials exist and assumes both platforms. Do not run release lanes as setup validation.

Finish with the detected project type/platforms, modified paths, template commit (if used), commands and invocation directory, checks performed, and missing release inputs. Distinguish configuration validation from a successful build or upload.
