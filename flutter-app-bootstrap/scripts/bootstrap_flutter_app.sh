#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
ADAPTER="$SCRIPT_DIR/adapt_clean_arch.py"

APP_NAME=""
ORG=""
TARGET_DIR=""
PLATFORMS="android,ios"
DESCRIPTION="A new Flutter application."
CLEAN_ARCH_REPO="geusan/flutter-clean-arch"
CLEAN_ARCH_REF="main"
FASTLANE_MODE="files"
FASTLANE_REPO="geusan/fastlane-template"
FASTLANE_REF="78cfa31d1ce27aa3a6927abd344123176ae733a6"
FIREBASE_PROJECT=""
TESTER_GROUP="testers"
ALLOW_CLOUD_CHANGES=0
FLUTTER_BIN="${FLUTTER_BIN:-flutter}"
LEGACY_CLEAN_ARCH_COMMIT="559779db16aad5c3475a7a5b6fd84ebba4944d1b"

usage() {
  cat <<'USAGE'
Flutter app bootstrapper using runtime GitHub templates.

Usage:
  bootstrap_flutter_app.sh --name <snake_case> --org <reverse.domain> --dir <path> [options]

Required:
  --name <name>             Dart package/project name.
  --org <identifier>        Reverse-domain organization identifier.
  --dir <path>              New or empty target directory.

Options:
  --platforms <csv>         Flutter platforms (default: android,ios).
  --description <text>      pubspec description.
  --clean-arch-repo <owner/repo>
                             Clean Architecture source repository.
  --clean-arch-ref <ref>    Source branch, tag, or commit (default: main).
  --fastlane <mode>         none, files, or configure (default: files).
  --fastlane-repo <owner/repo>
                             Fastlane template repository.
  --fastlane-ref <ref>      Fastlane template branch, tag, or commit.
  --firebase-project <id>   GCP/Firebase project for configure mode.
  --tester-group <alias>    Firebase tester-group alias (default: testers).
  --allow-cloud-changes     Required acknowledgement for configure mode.
  -h, --help                Show help.

Environment:
  FLUTTER_BIN               Flutter executable path or command name.
USAGE
}

die() {
  printf 'error: %s\n' "$*" >&2
  exit 1
}

step() {
  printf '\n==> %s\n' "$*"
}

fetch_repo() {
  local checkout="$1"
  local repository="$2"
  local ref="$3"

  git init --quiet "$checkout"
  git -C "$checkout" remote add origin "https://github.com/$repository.git"
  git -C "$checkout" fetch --quiet --depth 1 origin "$ref"
  git -C "$checkout" checkout --quiet --detach FETCH_HEAD
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --name)
      [[ $# -ge 2 ]] || die "--name requires a value"
      APP_NAME="$2"
      shift 2
      ;;
    --org)
      [[ $# -ge 2 ]] || die "--org requires a value"
      ORG="$2"
      shift 2
      ;;
    --dir)
      [[ $# -ge 2 ]] || die "--dir requires a value"
      TARGET_DIR="$2"
      shift 2
      ;;
    --platforms)
      [[ $# -ge 2 ]] || die "--platforms requires a value"
      PLATFORMS="$2"
      shift 2
      ;;
    --description)
      [[ $# -ge 2 ]] || die "--description requires a value"
      DESCRIPTION="$2"
      shift 2
      ;;
    --clean-arch-repo)
      [[ $# -ge 2 ]] || die "--clean-arch-repo requires a value"
      CLEAN_ARCH_REPO="$2"
      shift 2
      ;;
    --clean-arch-ref)
      [[ $# -ge 2 ]] || die "--clean-arch-ref requires a value"
      CLEAN_ARCH_REF="$2"
      shift 2
      ;;
    --fastlane)
      [[ $# -ge 2 ]] || die "--fastlane requires a value"
      FASTLANE_MODE="$2"
      shift 2
      ;;
    --fastlane-repo)
      [[ $# -ge 2 ]] || die "--fastlane-repo requires a value"
      FASTLANE_REPO="$2"
      shift 2
      ;;
    --fastlane-ref)
      [[ $# -ge 2 ]] || die "--fastlane-ref requires a value"
      FASTLANE_REF="$2"
      shift 2
      ;;
    --firebase-project)
      [[ $# -ge 2 ]] || die "--firebase-project requires a value"
      FIREBASE_PROJECT="$2"
      shift 2
      ;;
    --tester-group)
      [[ $# -ge 2 ]] || die "--tester-group requires a value"
      TESTER_GROUP="$2"
      shift 2
      ;;
    --allow-cloud-changes)
      ALLOW_CLOUD_CHANGES=1
      shift
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      die "unknown option: $1"
      ;;
  esac
done

[[ -n "$APP_NAME" ]] || die "--name is required"
[[ -n "$ORG" ]] || die "--org is required"
[[ -n "$TARGET_DIR" ]] || die "--dir is required"
[[ "$APP_NAME" =~ ^[a-z][a-z0-9_]*$ ]] || die "--name must be lowercase snake_case"
[[ "$ORG" =~ ^[a-z][a-z0-9]*(\.[a-z][a-z0-9]*)+$ ]] || die "--org must be a lowercase reverse-domain identifier"
[[ "$CLEAN_ARCH_REPO" =~ ^[A-Za-z0-9_.-]+/[A-Za-z0-9_.-]+$ ]] || die "--clean-arch-repo must be owner/repository"
[[ "$CLEAN_ARCH_REF" =~ ^[A-Za-z0-9][A-Za-z0-9._/-]*$ ]] || die "--clean-arch-ref contains unsupported characters"
[[ "$FASTLANE_MODE" =~ ^(none|files|configure)$ ]] || die "--fastlane must be none, files, or configure"
[[ "$FASTLANE_REPO" =~ ^[A-Za-z0-9_.-]+/[A-Za-z0-9_.-]+$ ]] || die "--fastlane-repo must be owner/repository"
[[ "$FASTLANE_REF" =~ ^[A-Za-z0-9][A-Za-z0-9._/-]*$ ]] || die "--fastlane-ref contains unsupported characters"
[[ -f "$ADAPTER" ]] || die "Clean Architecture adapter is missing: $ADAPTER"

IFS=',' read -r -a platform_items <<< "$PLATFORMS"
[[ ${#platform_items[@]} -gt 0 ]] || die "--platforms cannot be empty"
for platform in "${platform_items[@]}"; do
  case "$platform" in
    android|ios|web|windows|linux|macos|darwin) ;;
    *) die "unsupported platform: $platform" ;;
  esac
done

if [[ "$FASTLANE_MODE" == "configure" && "$ALLOW_CLOUD_CHANGES" -ne 1 ]]; then
  die "configure mode can change GCP/Firebase resources; pass --allow-cloud-changes only after explicit authorization"
fi

command -v git >/dev/null 2>&1 || die "git is required"
command -v python3 >/dev/null 2>&1 || die "python3 is required"
if [[ "$FLUTTER_BIN" == */* ]]; then
  [[ -x "$FLUTTER_BIN" ]] || die "Flutter executable is not executable: $FLUTTER_BIN"
  FLUTTER_EXEC="$FLUTTER_BIN"
else
  FLUTTER_EXEC="$(command -v "$FLUTTER_BIN" || true)"
  [[ -n "$FLUTTER_EXEC" ]] || die "Flutter was not found: $FLUTTER_BIN"
fi

DART_EXEC="$(dirname -- "$FLUTTER_EXEC")/dart"
if [[ ! -x "$DART_EXEC" ]]; then
  DART_EXEC="$(command -v dart || true)"
fi
[[ -n "$DART_EXEC" && -x "$DART_EXEC" ]] || die "Dart executable was not found next to Flutter or on PATH"

if [[ -L "$TARGET_DIR" ]]; then
  die "target directory must not be a symbolic link: $TARGET_DIR"
fi
if [[ -e "$TARGET_DIR" && ! -d "$TARGET_DIR" ]]; then
  die "target exists and is not a directory: $TARGET_DIR"
fi
if [[ -d "$TARGET_DIR" ]] && [[ -n "$(find "$TARGET_DIR" -mindepth 1 -maxdepth 1 -print -quit)" ]]; then
  die "target directory is not empty: $TARGET_DIR"
fi

TARGET_PARENT="$(dirname -- "$TARGET_DIR")"
TARGET_BASENAME="$(basename -- "$TARGET_DIR")"
mkdir -p "$TARGET_PARENT"
TARGET_PARENT="$(cd -- "$TARGET_PARENT" && pwd -P)"
TARGET_DIR="$TARGET_PARENT/$TARGET_BASENAME"

TEMP_DIR="$(mktemp -d)"
trap 'if [[ -n "${TEMP_DIR:-}" && -d "$TEMP_DIR" ]]; then rm -rf -- "$TEMP_DIR"; fi' EXIT
CLEAN_ARCH_CHECKOUT="$TEMP_DIR/flutter-clean-arch"

step "Fetch Clean Architecture source $CLEAN_ARCH_REPO@$CLEAN_ARCH_REF"
fetch_repo "$CLEAN_ARCH_CHECKOUT" "$CLEAN_ARCH_REPO" "$CLEAN_ARCH_REF"
CLEAN_ARCH_COMMIT="$(git -C "$CLEAN_ARCH_CHECKOUT" rev-parse HEAD)"
[[ -d "$CLEAN_ARCH_CHECKOUT/lib" ]] || die "lib/ was not found in $CLEAN_ARCH_REPO@$CLEAN_ARCH_REF"
[[ -f "$CLEAN_ARCH_CHECKOUT/pubspec.yaml" ]] || die "pubspec.yaml was not found in $CLEAN_ARCH_REPO@$CLEAN_ARCH_REF"
printf 'resolved Clean Architecture commit: %s\n' "$CLEAN_ARCH_COMMIT"

step "Flutter SDK"
"$FLUTTER_EXEC" --version
FLUTTER_VERSION="$("$FLUTTER_EXEC" --version | awk 'NR == 1 {print $2}')"
[[ -n "$FLUTTER_VERSION" ]] || die "could not determine the selected Flutter version"

step "Create Flutter project"
"$FLUTTER_EXEC" create \
  --empty \
  --org "$ORG" \
  --project-name "$APP_NAME" \
  --description "$DESCRIPTION" \
  --platforms "$PLATFORMS" \
  "$TARGET_DIR"

GENERATED_PUBSPEC="$TEMP_DIR/generated-pubspec.yaml"
cp "$TARGET_DIR/pubspec.yaml" "$GENERATED_PUBSPEC"

step "Apply fetched Clean Architecture source"
cp -R "$CLEAN_ARCH_CHECKOUT/lib/." "$TARGET_DIR/lib/"
cp "$CLEAN_ARCH_CHECKOUT/pubspec.yaml" "$TARGET_DIR/pubspec.yaml"
if [[ -f "$CLEAN_ARCH_CHECKOUT/analysis_options.yaml" ]]; then
  cp "$CLEAN_ARCH_CHECKOUT/analysis_options.yaml" "$TARGET_DIR/analysis_options.yaml"
fi
for source_path in test integration_test assets fonts .vscode; do
  if [[ -d "$CLEAN_ARCH_CHECKOUT/$source_path" ]]; then
    mkdir -p "$TARGET_DIR/$source_path"
    cp -R "$CLEAN_ARCH_CHECKOUT/$source_path/." "$TARGET_DIR/$source_path/"
  fi
done
for source_file in build.yaml l10n.yaml LICENSE LICENSE.md NOTICE; do
  if [[ -f "$CLEAN_ARCH_CHECKOUT/$source_file" ]]; then
    cp "$CLEAN_ARCH_CHECKOUT/$source_file" "$TARGET_DIR/$source_file"
  fi
done

python3 "$ADAPTER" \
  --target "$TARGET_DIR" \
  --generated-pubspec "$GENERATED_PUBSPEC" \
  --name "$APP_NAME" \
  --description "$DESCRIPTION" \
  --source-commit "$CLEAN_ARCH_COMMIT"

printf '{\n  "flutter": "%s"\n}\n' "$FLUTTER_VERSION" > "$TARGET_DIR/.fvmrc"
if ! grep -qxF '.fvm/' "$TARGET_DIR/.gitignore"; then
  printf '\n# FVM SDK cache\n.fvm/\n' >> "$TARGET_DIR/.gitignore"
fi

step "Resolve source dependencies"
(
  cd -- "$TARGET_DIR"
  if [[ "$CLEAN_ARCH_COMMIT" == "$LEGACY_CLEAN_ARCH_COMMIT" ]]; then
    if grep -qE '^  intl:' pubspec.yaml; then
      "$FLUTTER_EXEC" pub add intl
    else
      "$FLUTTER_EXEC" pub get
    fi
    if grep -qE '^  retrofit_generator:' pubspec.yaml; then
      "$FLUTTER_EXEC" pub add --dev retrofit_generator
    fi
  else
    "$FLUTTER_EXEC" pub get
  fi
)

if grep -qE '^  build_runner:' "$TARGET_DIR/pubspec.yaml"; then
  step "Regenerate source outputs"
  (
    cd -- "$TARGET_DIR"
    "$DART_EXEC" run build_runner build --delete-conflicting-outputs
  )
fi

step "Format and validate application source"
(
  cd -- "$TARGET_DIR"
  format_paths=(lib)
  [[ ! -d test ]] || format_paths+=(test)
  [[ ! -d integration_test ]] || format_paths+=(integration_test)
  "$DART_EXEC" format "${format_paths[@]}"
  "$FLUTTER_EXEC" analyze --no-fatal-infos --no-fatal-warnings
  if [[ -d test ]]; then
    "$FLUTTER_EXEC" test
  fi
)

FASTLANE_COMMIT=""
if [[ "$FASTLANE_MODE" != "none" ]]; then
  FASTLANE_CHECKOUT="$TEMP_DIR/fastlane-template"

  step "Fetch Fastlane template $FASTLANE_REPO@$FASTLANE_REF"
  fetch_repo "$FASTLANE_CHECKOUT" "$FASTLANE_REPO" "$FASTLANE_REF"
  FASTLANE_COMMIT="$(git -C "$FASTLANE_CHECKOUT" rev-parse HEAD)"
  FASTLANE_SETUP="$FASTLANE_CHECKOUT/setup.sh"
  [[ -f "$FASTLANE_SETUP" ]] || die "setup.sh was not found in $FASTLANE_REPO@$FASTLANE_REF"

  fastlane_args=(--dir "$TARGET_DIR" --group "$TESTER_GROUP")
  if [[ "$FASTLANE_MODE" == "files" ]]; then
    fastlane_args+=(--skip-gcp --skip-asc --non-interactive)
  elif [[ -n "$FIREBASE_PROJECT" ]]; then
    fastlane_args+=(--project "$FIREBASE_PROJECT")
  fi

  step "Install Fastlane pipeline ($FASTLANE_MODE)"
  TEMPLATE_REPO="$FASTLANE_REPO" TEMPLATE_REF="$FASTLANE_REF" \
    bash "$FASTLANE_SETUP" "${fastlane_args[@]}"
fi

if [[ -n "$FASTLANE_COMMIT" ]]; then
  FASTLANE_SOURCE_JSON="{\"repository\":\"$FASTLANE_REPO\",\"requested_ref\":\"$FASTLANE_REF\",\"resolved_commit\":\"$FASTLANE_COMMIT\"}"
else
  FASTLANE_SOURCE_JSON="null"
fi
printf '{\n  "clean_arch": {"repository":"%s","requested_ref":"%s","resolved_commit":"%s"},\n  "fastlane": %s\n}\n' \
  "$CLEAN_ARCH_REPO" "$CLEAN_ARCH_REF" "$CLEAN_ARCH_COMMIT" "$FASTLANE_SOURCE_JSON" \
  > "$TARGET_DIR/.bootstrap-sources.json"

step "Ready"
ANDROID_APP_ID=""
if [[ -f "$TARGET_DIR/android/app/build.gradle.kts" ]]; then
  ANDROID_APP_ID="$(awk -F'"' '/^[[:space:]]*applicationId[[:space:]]*=/ {print $2; exit}' "$TARGET_DIR/android/app/build.gradle.kts")"
elif [[ -f "$TARGET_DIR/android/app/build.gradle" ]]; then
  ANDROID_APP_ID="$(awk -F'"' '/^[[:space:]]*applicationId[[:space:]]+/ {print $2; exit}' "$TARGET_DIR/android/app/build.gradle")"
fi

IOS_BUNDLE_ID=""
if [[ -f "$TARGET_DIR/ios/Runner.xcodeproj/project.pbxproj" ]]; then
  IOS_BUNDLE_ID="$(awk '/PRODUCT_BUNDLE_IDENTIFIER = / && $0 !~ /RunnerTests/ {value=$0; sub(/^.*= /, "", value); sub(/;.*/, "", value); print value; exit}' "$TARGET_DIR/ios/Runner.xcodeproj/project.pbxproj")"
fi

printf 'project: %s\n' "$TARGET_DIR"
printf 'package: %s\n' "$APP_NAME"
[[ -z "$ANDROID_APP_ID" ]] || printf 'android applicationId: %s\n' "$ANDROID_APP_ID"
[[ -z "$IOS_BUNDLE_ID" ]] || printf 'iOS bundle ID: %s\n' "$IOS_BUNDLE_ID"
printf 'platforms: %s\n' "$PLATFORMS"
printf 'Flutter: %s\n' "$FLUTTER_VERSION"
printf 'Clean Architecture: %s@%s (%s)\n' "$CLEAN_ARCH_REPO" "$CLEAN_ARCH_REF" "$CLEAN_ARCH_COMMIT"
if [[ -n "$FASTLANE_COMMIT" ]]; then
  printf 'Fastlane: %s@%s (%s)\n' "$FASTLANE_REPO" "$FASTLANE_REF" "$FASTLANE_COMMIT"
else
  printf 'Fastlane: none\n'
fi
