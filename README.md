# Agent Skills

Reusable Flutter development and App Store review workflows packaged for both Codex and Claude Code.

The `flutter-clean-arch` plugin includes:

- `flutter-app-bootstrap`: create a new Flutter app from `geusan/flutter-clean-arch`, with optional Fastlane preparation.
- `flutter-clean-arch-migrate`: incrementally migrate an existing Flutter app while preserving behavior and integrations.
- `flutter-firebase-analytics`: add a facade-based Firebase Analytics integration, design a measurement plan, validate collection, and analyze GA4 or BigQuery events.

The `app-store` plugin includes:

- `app-store-review`: prepare TestFlight builds, store metadata and screenshots, privacy disclosures, content rights, age ratings, and release settings using verified app behavior. Includes a dated Hisohiso case reference.

## Install in Codex

Add this repository as a marketplace and install the plugin:

```bash
codex plugin marketplace add geusan/agent-skills
codex plugin add flutter-clean-arch@personal
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
$app-store:app-store-review 이 앱의 App Store 심사 준비 상태를 확인하고, 한국어 메타데이터와 개인정보 신고를 준비해줘.
```

## Install in Claude Code

```bash
claude plugin marketplace add geusan/agent-skills
claude plugin install flutter-clean-arch@geusan-flutter
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
/app-store:app-store-review Explain the correct selections in this App Store Connect screenshot using the actual release build.
```

## Local development

Test the Claude Code plugin directly from this repository:

```bash
claude --plugin-dir ./plugins/flutter-clean-arch
```

Validate the plugin manifests:

```bash
claude plugin validate ./plugins/flutter-clean-arch
claude plugin validate ./plugins/app-store
```
