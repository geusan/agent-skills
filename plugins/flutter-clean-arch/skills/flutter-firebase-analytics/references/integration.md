# Facade integration

Use this reference when installing Firebase Analytics or changing Flutter instrumentation. Re-check the current [FlutterFire setup](https://firebase.google.com/docs/flutter/setup), [Analytics Flutter quickstart](https://firebase.google.com/docs/analytics/flutter/get-started), and [`FirebaseAnalytics` API](https://pub.dev/documentation/firebase_analytics/latest/firebase_analytics/FirebaseAnalytics-class.html) before relying on package-specific signatures.

## Installation and configuration

1. Preserve the target's Flutter/FVM wrapper and existing Firebase project/flavor mapping.
2. Add only missing packages with the target's Flutter executable:

   ```bash
   flutter pub add firebase_core firebase_analytics
   ```

3. If Firebase is not configured, confirm the external Firebase project, platforms, bundle/application IDs, and environment separation before running `flutterfire configure`. Re-run it when platforms or Firebase products change. Do not silently create a production project or attach a development build to production Analytics.
4. Initialize the selected `FirebaseApp` once in the existing startup path before analytics is resolved. Reuse existing `firebase_options.dart` and initialization when present.
5. Rebuild the affected platforms after adding the plugin.

Do not pin a remembered package version. Let the target SDK and dependency constraints resolve a compatible release, then retain the generated lockfile according to the repository policy.

## Clean Architecture placement

Use responsibilities rather than exact folder names when the target differs:

| Responsibility | Suggested reference location | Constraint |
|---|---|---|
| `AnalyticsEvent` and `AnalyticsRepository` port | `lib/domain/analytics/` | Pure Dart; no Firebase or widget imports |
| `FirebaseAnalyticsRepository` and no-op adapter | `lib/repository/analytics/` | The only Firebase Analytics SDK boundary |
| `AnalyticsFacade` | `lib/services/analytics/` | Best-effort semantic methods tied to product outcomes |
| Bootstrap and screen/router bridge | App/presentation boundary | Stable screen names; calls the facade |
| Registration | `lib/di.dart` or existing composition root | Preserve existing lifetimes and flavor selection |

The domain port should stay vendor-neutral:

```dart
final class AnalyticsEvent {
  const AnalyticsEvent(this.name, [this.parameters = const {}]);

  final String name;
  final Map<String, Object> parameters;
}

abstract interface class AnalyticsRepository {
  Future<void> logEvent(AnalyticsEvent event);
  Future<void> logScreen({required String name, String? screenClass});
  Future<void> setCollectionEnabled(bool enabled);
}
```

Adjust methods to real requirements. Add identity, user-property, or reset operations only when the product actually uses them. Do not expose `FirebaseAnalytics`, `AnalyticsEventItem`, or SDK constants in the port. Allow only Firebase-supported scalar parameter values and reject or normalize unsupported values at the event or adapter boundary; do not assume booleans or arbitrary objects are accepted without checking the current SDK.

The repository adapter delegates to the current `firebase_analytics` API. The service-layer facade owns product names and parameters and prevents provider failures from interrupting user flows:

```dart
final class AnalyticsFacade {
  AnalyticsFacade(this._repository, {this.onError});

  final AnalyticsRepository _repository;
  final void Function(Object, StackTrace)? onError;

  Future<void> checkoutStarted({required String source}) => _bestEffort(
    () => _repository.logEvent(
      AnalyticsEvent('begin_checkout', {'source': source}),
    ),
  );

  Future<void> _bestEffort(Future<void> Function() operation) async {
    try {
      await operation();
    } catch (error, stack) {
      onError?.call(error, stack);
    }
  }
}
```

Prefer the exact GA4 recommended event and parameter definitions when the product action matches them. Provide a no-op repository for unsupported/unconfigured platforms and tests when useful. Analytics failures must not reverse a successful business operation; make the facade's error policy observable in development and test it instead of scattering `try/catch` through features.

## Trigger placement

- Log intent events at the presentation boundary only when the question is about intent.
- Log success events after the authoritative operation succeeds, usually in an application service or immediately after its result.
- Log failure events only with a bounded, non-sensitive error category. Never send exception messages, response bodies, tokens, or stack traces to Analytics.
- Centralize screen-view tracking in the router/navigation integration. Use stable logical screen names and strip IDs or user-entered route data. Avoid double-logging automatic and manual screen views.
- Keep development, staging, and production distinguishable. Prefer separate Firebase projects/properties for materially different environments; otherwise apply a bounded environment dimension consistently and exclude non-production traffic in analysis.

## Consent and identity

Follow the app's legal and product requirements rather than inventing a consent policy. When prior consent is required, disable collection before the first event at the native configuration level and enable it only after consent through `setAnalyticsCollectionEnabled`. Keep the choice persistent through the app's existing consent store and test grant, denial, withdrawal, logout, and reset flows.

Never use an email address, phone number, advertising identifier, database primary key, or other directly identifying value as an event parameter or user property. Use `setUserId` only for a policy-approved pseudonymous identifier and clear it on logout. Call reset only when the product's privacy/data-reset semantics require a new app instance identity.

## Verification

Add focused tests for:

- Exact event name, parameter keys, types, and allowed enum values.
- Successful operations logging once and failed operations not logging success.
- Consent-disabled and no-op behavior.
- User-ID clearing and collection changes.
- DI resolving the facade expected for each flavor.
- Stable screen names without dynamic or sensitive values.

Then run the project's formatter, analyzer, unit/widget tests, and relevant build. Use [Firebase DebugView](https://firebase.google.com/docs/analytics/debugview) on a real device/emulator to verify event receipt and parameters. Record the tested package/bundle ID, platform, build flavor, event names, and whether debug mode was disabled afterward.
