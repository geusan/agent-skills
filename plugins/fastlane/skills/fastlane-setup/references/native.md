# Native platform setup

Keep native build tools and project layout authoritative. The reviewed `geusan/fastlane-template` is Flutter-specific; reuse its release-channel ideas and credential naming only where useful. Do not import its `deploy_helpers.rb` unchanged into a native app.

## iOS

1. Find the actual `.xcworkspace` or `.xcodeproj`, shared scheme, app target and Release configuration. Use `xcodebuild -list` with the selected workspace/project and inspect its build settings for bundle ID, team, version and signing. Honor XcodeGen/Tuist or other generated-project workflows when present.
2. Put `fastlane/` alongside the existing native project, or retain its current location. Resolve paths explicitly from the Fastfile directory; do not assume a repository-root `ios/` directory, `Runner`, or CocoaPods. Use `workspace:` for an actual workspace and `project:` otherwise, not both.
3. Implement a build-only lane with `build_app` for the chosen scheme/configuration and existing signing/export settings. Derive version and build number from the native target's settings/plist or its established versioning tool. Do not introduce pubspec parsing, Flutter commands or generated Flutter xcconfig dependencies.
4. If TestFlight is requested, add an upload lane that builds (or accepts the explicit artifact) and calls `upload_to_testflight` with the project's authentication. Preserve existing signing management. Adding Fastlane does not require migrating to `match`, generating certificates, or enabling provisioning updates. Resolve credentials inside the upload lane, not at file load time.
5. If Firebase distribution is requested, configure that plugin and the selected iOS app only. Adapt its artifact path and signing to the actual project. Keep device registration and profile creation out of setup verification.

For example, after resolving real project values, a Fastfile under `<native-root>/fastlane/` can anchor paths with `File.expand_path("..", __dir__)`. Pass the selected workspace/project path and shared scheme explicitly to `build_app`. Use the action's produced IPA path for upload, avoiding the template's hardcoded Flutter output directories.

Validation: syntax-check Fastfile/Appfile/Gymfile as applicable, list lanes, and verify project/scheme discovery. If signing is unavailable, perform a suitable local simulator build when possible and report the signed archive/export as unverified; do not claim a simulator build proves distribution readiness.

References: [iOS setup and Bundler](https://docs.fastlane.tools/getting-started/ios/setup/), [build_app](https://docs.fastlane.tools/actions/build_app/), [TestFlight upload](https://docs.fastlane.tools/actions/upload_to_testflight/).

## Android

1. Locate the Gradle root containing `settings.gradle`/`settings.gradle.kts`, its wrapper, and the module applying the Android application plugin. Inspect product flavors, build types, `applicationId`/suffixes, version settings, and signing. Do not confuse `namespace` with the release application ID.
2. Put `fastlane/` at that native root, or use the existing layout. Set `project_dir` explicitly and invoke the project's wrapper through Fastlane's `gradle` action. Resolve the actual module and variant instead of assuming `android/app` or a universal `Release` output.
3. Add a build-only lane using the appropriate module-qualified assemble or bundle task. Use native Gradle versioning; a Gradle property override works only if that build script consumes it. Do not copy `flutter build`, pubspec versions, or `build/app/outputs/flutter-apk` paths.
4. Use the Gradle action's output paths (APK/AAB lane context) or verified variant-specific outputs. Multi-module or multi-flavor projects can produce multiple artifacts; select the requested app variant explicitly before wiring an upload.
5. For requested Play uploads, add `upload_to_play_store` with the verified package name, AAB, authentication and requested track. For requested Firebase distribution, add the plugin and its actual app ID/artifact. Separate both from build validation. Preserve the existing keystore and signing configuration; absence of `key.properties` does not imply a native app is debug-signed.

For a standard single-app variant, `gradle(task: "assemble", flavor: selected_flavor, build_type: "Release", project_dir: native_root)` illustrates the action parameters. Use the project's exact task (for example, `:mobile:assembleDemoRelease`) when module qualification is required, and verify the artifact path for that task. Do not pass a made-up flavor.

Validation: syntax-check the Fastfile/Appfile, list lanes, inspect wrapper tasks for the chosen app, then run an appropriate local build. Do not silently substitute debug signing for a release configuration. Missing store credentials can remain documented while local setup is completed.

References: [Android setup](https://docs.fastlane.tools/getting-started/android/setup/), [Gradle action and outputs](https://docs.fastlane.tools/actions/gradle/), [Play upload](https://docs.fastlane.tools/actions/upload_to_play_store/).
