#!/usr/bin/env bash

set -euo pipefail

REPOSITORY="geusan/flutter-clean-arch"
REF="main"
OUTPUT=""

usage() {
  cat <<'USAGE'
Fetch a clean-architecture reference checkout without modifying the target app.

Usage:
  fetch_clean_arch_reference.sh --output <new-path> [options]

Options:
  --output <path>            Destination path; it must not already exist.
  --repo <owner/repository>  GitHub repository (default: geusan/flutter-clean-arch).
  --ref <ref>                Branch, tag, or commit (default: main).
  -h, --help                 Show help.
USAGE
}

die() {
  printf 'error: %s\n' "$*" >&2
  exit 1
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --output)
      [[ $# -ge 2 ]] || die "--output requires a value"
      OUTPUT="$2"
      shift 2
      ;;
    --repo)
      [[ $# -ge 2 ]] || die "--repo requires a value"
      REPOSITORY="$2"
      shift 2
      ;;
    --ref)
      [[ $# -ge 2 ]] || die "--ref requires a value"
      REF="$2"
      shift 2
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

[[ -n "$OUTPUT" ]] || die "--output is required"
[[ "$REPOSITORY" =~ ^[A-Za-z0-9_.-]+/[A-Za-z0-9_.-]+$ ]] || die "--repo must be owner/repository"
[[ "$REF" =~ ^[A-Za-z0-9][A-Za-z0-9._/-]*$ ]] || die "--ref contains unsupported characters"
[[ ! -e "$OUTPUT" ]] || die "output already exists: $OUTPUT"
command -v git >/dev/null 2>&1 || die "git is required"

OUTPUT_PARENT="$(dirname -- "$OUTPUT")"
OUTPUT_NAME="$(basename -- "$OUTPUT")"
mkdir -p "$OUTPUT_PARENT"
OUTPUT_PARENT="$(cd -- "$OUTPUT_PARENT" && pwd -P)"
OUTPUT="$OUTPUT_PARENT/$OUTPUT_NAME"

FETCH_DIR="$(mktemp -d "$OUTPUT_PARENT/.flutter-clean-arch-fetch.XXXXXX")"
trap 'if [[ -n "${FETCH_DIR:-}" && -d "$FETCH_DIR" ]]; then rm -rf -- "$FETCH_DIR"; fi' EXIT

git init --quiet "$FETCH_DIR"
git -C "$FETCH_DIR" remote add origin "https://github.com/$REPOSITORY.git"
git -C "$FETCH_DIR" fetch --quiet --depth 1 origin "$REF"
git -C "$FETCH_DIR" checkout --quiet --detach FETCH_HEAD

[[ -f "$FETCH_DIR/pubspec.yaml" ]] || die "reference has no pubspec.yaml: $REPOSITORY@$REF"
[[ -d "$FETCH_DIR/lib" ]] || die "reference has no lib/: $REPOSITORY@$REF"

RESOLVED_COMMIT="$(git -C "$FETCH_DIR" rev-parse HEAD)"
mv "$FETCH_DIR" "$OUTPUT"
FETCH_DIR=""

printf 'repository=%s\n' "$REPOSITORY"
printf 'requested_ref=%s\n' "$REF"
printf 'resolved_commit=%s\n' "$RESOLVED_COMMIT"
printf 'path=%s\n' "$OUTPUT"
