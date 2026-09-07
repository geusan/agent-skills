---
name: flutter-firebase-analytics
description: Install, architect, instrument, validate, and analyze Firebase Analytics in a Flutter app through a Clean Architecture-compatible facade. Use for adding firebase_analytics, defining a measurement plan and typed event taxonomy, wiring consent-aware event or screen collection, verifying DebugView, or analyzing GA4 and BigQuery event data; do not use for Crashlytics-only or generic application logging work.
---

# Flutter Firebase Analytics

Build an analytics system that answers explicit product questions without coupling business or presentation code to Firebase. Preserve the target app's behavior, architecture, environments, privacy choices, and existing analytics contracts.

Resolve `skill_root` to the directory containing this `SKILL.md` before using bundled scripts or references. Bundled paths are relative to `skill_root`, never to the target Flutter project's working directory.

## Select the work mode

- For SDK setup, facade implementation, DI, screen tracking, consent, or tests, read [references/integration.md](references/integration.md).
- For event taxonomy, KPIs, parameters, ownership, or a measurement plan, read [references/measurement-plan.md](references/measurement-plan.md).
- For DebugView verification, GA4 reporting, exported files, or BigQuery analysis, read [references/analysis.md](references/analysis.md).
- For an end-to-end request, use all three in that order. Do not load unrelated references for a narrower request.

## Establish the baseline

Before changing an app:

1. Confirm `pubspec.yaml` and `lib/`, then inspect repository instructions, Git status, Flutter/FVM tooling, flavors, supported platforms, DI, routing, current Firebase initialization, consent controls, and existing tracking code.
2. Run the bundled inventory and inspect its JSON:

   ```bash
   skill_root="/absolute/path/to/flutter-firebase-analytics"
   "$skill_root/scripts/inventory_analytics.py" /absolute/path/to/flutter-app
   ```

3. Capture the project's established format, analyze, and test baseline. Existing failures are findings, not permission to weaken checks.
4. Identify the decisions analytics must support. If the user has not supplied business questions, propose a small measurement plan and get agreement before instrumenting a broad event catalog.

## Preserve the architecture boundary

Keep Firebase types and calls inside one concrete adapter. Put the pure-Dart `AnalyticsEvent` and `AnalyticsRepository` port in the domain boundary, implement that port with `FirebaseAnalyticsRepository` at the repository/infrastructure boundary, and expose a best-effort `AnalyticsFacade` from the service layer. Register the implementation in the composition root. Widgets and use cases call semantic facade methods instead of constructing raw event names or parameter maps.

Adapt paths to the target's established architecture rather than creating parallel layers. Domain code must not import Firebase, Flutter, routing, or analytics SDK types. Do not add empty abstractions that have no caller.

## Control external changes

Installing Dart packages and editing the target repository are in scope when implementation is requested. Creating or selecting a Firebase project, registering apps, running `flutterfire configure` against an external project, enabling Analytics, registering GA4 custom definitions or key events, and linking or querying billed BigQuery resources can change external state or cost. Confirm the exact project, environments, platforms, data region, and authorization immediately before those actions. When access is unavailable, finish the local implementation and provide exact pending console or CLI steps without claiming data is flowing.

Never place service-account keys, downloaded credentials, or unrelated Firebase configuration in source control. Firebase client configuration files contain identifiers rather than server secrets, but still follow the target repository's existing policy for committing them.

## Validate collection and analysis

Use recommended GA4 events where their semantics fit; otherwise use stable lowercase `snake_case` custom names and centralized typed factories. Never send PII, secrets, raw free text, precise location, or unbounded identifiers in names, parameters, screen names, or user properties. Make consent and collection state explicit and testable.

Validate in layers: event contract tests, facade/DI tests, analyzer and project tests, platform build when in scope, then device DebugView. DebugView proves receipt and parameter shape, not production volumes. For analysis, name the source, property/dataset, date range, timezone, environment filters, identity basis, denominator, late-arrival window, and known data-quality limitations. Never invent findings when the requested dataset or report is inaccessible.

Finish with:

- Files and architectural boundaries changed.
- Measurement-plan additions and intentional exclusions.
- Consent, environment, and privacy handling.
- Local tests and DebugView evidence.
- Analysis source, query/report definition, findings, caveats, and recommended decisions.
- External configuration or data-access work still pending.
