# Fastlane for an existing Flutter app

Use the source checkout resolved by `fastlane-setup`. The reviewed [geusan/fastlane-template](https://github.com/geusan/fastlane-template) commit is `78cfa31d1ce27aa3a6927abd344123176ae733a6`. Read the actual checkout before running it. This path requires a real Flutter application; native-only apps use [native.md](native.md).

## Local files

For a compatible project with no conflicting pipeline files, run the inspected installer from its checkout:

```bash
bash "$fastlane_reference/setup.sh" --dir /absolute/path/to/app \
  --skip-gcp --skip-asc --non-interactive
```

Set `fastlane_reference` to that checkout's absolute path. With an existing Gemfile or Fastlane configuration, merge the needed template files manually: the installer replaces differing files after writing `.bak` backups, and `--force` removes even that backup behavior.

The installer copies both platform pipelines, plugin files, `.env.example`, Android key-properties example, credential ignore rules, and a partially filled `fastlane/.env`. It may install plugins and run its custom `doctor` lane when Fastlane is available. For a single-platform app or a narrower build-only request, adapt only the applicable files manually; do not install an unused platform or unwanted Firebase dependency. The root dispatcher and doctor also need to reflect the selected platform.

## Cloud and account configuration

Only when the user's scope includes the specific external changes, run the installer configuration using the resolved project and group:

```bash
bash "$fastlane_reference/setup.sh" --dir /absolute/path/to/app \
  --project "$firebase_project" --group "$tester_group"
```

Set these values from verified project context before execution. Depending on current state and user choices, configuration can enable APIs, add Firebase to a GCP project, register apps, download platform configuration, create a service account and key, change IAM, initialize/check App Distribution, create a tester group, and collect App Store Connect metadata. Inspect the script and use skip flags to match the authorized scope. `--non-interactive` does not disable cloud mutations: always use `--skip-gcp --skip-asc` for file-only setup.

Before cloud configuration, resolve the exact GCP/Firebase project, tester-group alias, Android application ID and iOS bundle ID. Native project files must already exist; do not recreate the Flutter app to add Fastlane.

## Readiness and manual work

Use the inspected template's `bundle exec fastlane doctor` for a read-only status report. It reads project identifiers and makes live API probes when credentials are available. It does not upload a build.

Items that can still require console or human action:

- Click App Distribution **Get started** once when the product has not been initialized.
- Create/download an App Store Connect `.p8` key and retain its key and issuer IDs.
- Invite the service account in Play Console with release permissions.
- Upload the first Android App Bundle manually when Play API policy requires it.
- Create the Android upload keystore and configure release signing before any Play upload.
- Register tester device UDIDs for iOS Ad Hoc App Distribution, or prefer TestFlight for internal iOS distribution.

Changing Android signing keys after testers installed a debug-signed build forces uninstall/reinstall. If Play distribution is planned, settle the upload-keystore path before the first tester release.

## Secrets

Verify these remain ignored and never display their contents:

- `fastlane/.env` and platform-specific `.env` files.
- Service-account and Play JSON keys.
- `AuthKey_*.p8` files.
- `android/key.properties`, JKS, and keystore files.
- `google-services.json` and `GoogleService-Info.plist` when the project's policy treats them as untracked environment configuration.

Prefer `bundle exec fastlane ...` when dependencies were installed through Bundler. Do not invoke upload or promotion lanes during setup verification; execute them only within an authorized release request.
