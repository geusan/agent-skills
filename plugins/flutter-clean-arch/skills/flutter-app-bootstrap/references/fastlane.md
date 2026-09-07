# Fastlane integration

The integration uses [geusan/fastlane-template](https://github.com/geusan/fastlane-template). The bootstrap script pins reviewed commit `78cfa31d1ce27aa3a6927abd344123176ae733a6` by default and accepts `--fastlane-ref` when the user deliberately selects another branch, tag, or commit. Inspect upstream changes before switching to a mutable ref such as `main`. It fetches the template through Git so existing GitHub credentials can access a private repository.

## Modes

### `files`

Runs the upstream installer with:

```bash
setup.sh --dir <app> --skip-gcp --skip-asc --non-interactive
```

This installs the root/platform Fastfiles, Gemfile, plugin files, `.env.example`, Android key-properties example, credential ignore rules, and a partially filled `fastlane/.env`. If Fastlane exists locally, the upstream installer may also install plugins and run `fastlane doctor`; missing credentials are expected at this stage.

### `configure`

This runs the upstream interactive configuration and requires the bootstrap script's `--allow-cloud-changes` acknowledgement. Depending on current state and user choices, it can:

- Enable Firebase and App Distribution APIs.
- Add Firebase to a GCP project.
- Register Android and iOS Firebase apps.
- Download Firebase platform configuration.
- Create a service account and JSON key.
- Add `roles/firebaseappdistro.admin` IAM binding.
- Initialize/check App Distribution and create a tester group.
- Collect App Store Connect metadata into `fastlane/.env`.

Before running, confirm the exact GCP/Firebase project, tester-group alias, Android application ID, and iOS bundle ID. The upstream script detects identifiers from generated native project files, so project creation must happen first.

## Readiness and manual work

Use `fastlane doctor` for a read-only status report. It reads project identifiers and makes live API probes when credentials are available. It does not upload a build.

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

Prefer `bundle exec fastlane ...` when dependencies were installed through Bundler. Never invoke `distribute`, `store`, `beta`, `firebase`, or `promote` without an explicit release request.
