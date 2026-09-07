#!/usr/bin/env python3
"""Inventory Firebase Analytics integration signals in a Flutter project."""

from __future__ import annotations

import argparse
import json
import re
from pathlib import Path


DEPENDENCIES = ("firebase_core", "firebase_analytics")
SIGNALS = {
    "firebase_initialization": re.compile(r"\bFirebase\.initializeApp\s*\("),
    "analytics_instances": re.compile(r"\bFirebaseAnalytics\.(?:instance|instanceFor)\b"),
    "custom_event_calls": re.compile(r"\.logEvent\s*\("),
    "screen_view_calls": re.compile(r"\.(?:logScreenView|setCurrentScreen)\s*\("),
    "collection_controls": re.compile(r"\.setAnalyticsCollectionEnabled\s*\("),
    "consent_controls": re.compile(r"\.setConsent\s*\("),
    "user_id_calls": re.compile(r"\.setUserId\s*\("),
    "user_property_calls": re.compile(r"\.setUserProperty\s*\("),
    "analytics_observers": re.compile(r"\bFirebaseAnalyticsObserver\b"),
    "reset_calls": re.compile(r"\.resetAnalyticsData\s*\("),
}
LITERAL_EVENT = re.compile(
    r"\blogEvent\s*\(\s*(?:name\s*:\s*)?(['\"])(?P<name>[A-Za-z][A-Za-z0-9_]*)\1"
)
SDK_LOG_METHOD = re.compile(r"\.(?P<method>log[A-Z][A-Za-z0-9]*)\s*\(")


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Report Firebase Analytics dependencies, configuration, and call sites."
    )
    parser.add_argument("project", help="Flutter project root")
    return parser.parse_args()


def line_number(text: str, offset: int) -> int:
    return text.count("\n", 0, offset) + 1


def relative(path: Path, root: Path) -> str:
    return path.relative_to(root).as_posix()


def dependency_versions(pubspec: str) -> dict[str, str | None]:
    found: dict[str, str | None] = {}
    for name in DEPENDENCIES:
        match = re.search(rf"(?m)^\s{{2,}}{re.escape(name)}\s*:\s*([^#\n]*)", pubspec)
        found[name] = match.group(1).strip() or None if match else None
    return found


def occurrence(
    path: Path, root: Path, text: str, match: re.Match[str]
) -> dict[str, object]:
    return {"file": relative(path, root), "line": line_number(text, match.start())}


def scan_dart(root: Path) -> dict[str, object]:
    occurrences: dict[str, list[dict[str, object]]] = {name: [] for name in SIGNALS}
    imports: list[dict[str, object]] = []
    literal_events: list[dict[str, object]] = []
    sdk_log_methods: list[dict[str, object]] = []
    analytics_files: set[str] = set()

    for path in sorted((root / "lib").rglob("*.dart")):
        if path.name.endswith((".g.dart", ".freezed.dart")):
            continue
        try:
            contents = path.read_text(encoding="utf-8")
        except (OSError, UnicodeDecodeError):
            continue
        relative_path = relative(path, root)

        for match in re.finditer(r"import\s+['\"]package:firebase_analytics/", contents):
            imports.append(occurrence(path, root, contents, match))
            analytics_files.add(relative_path)

        for signal, pattern in SIGNALS.items():
            for match in pattern.finditer(contents):
                occurrences[signal].append(occurrence(path, root, contents, match))
                analytics_files.add(relative_path)

        for match in LITERAL_EVENT.finditer(contents):
            item = occurrence(path, root, contents, match)
            item["name"] = match.group("name")
            literal_events.append(item)

        for match in SDK_LOG_METHOD.finditer(contents):
            item = occurrence(path, root, contents, match)
            item["method"] = match.group("method")
            sdk_log_methods.append(item)

    return {
        "firebase_analytics_imports": imports,
        "signals": occurrences,
        "literal_custom_events": literal_events,
        "sdk_log_methods": sdk_log_methods,
        "analytics_related_files": sorted(analytics_files),
    }


def existing_paths(root: Path, candidates: list[str]) -> list[str]:
    return [candidate for candidate in candidates if (root / candidate).exists()]


def architecture_hints(root: Path) -> list[str]:
    layer_names = {"common", "domain", "repository", "services", "presentation", "screens"}
    hints = {
        relative(path, root)
        for path in (root / "lib").rglob("*")
        if path.is_dir() and path.name in layer_names
    }
    hints.update(
        relative(path, root)
        for path in (root / "lib").rglob("di.dart")
        if path.is_file()
    )
    return sorted(hints)


def main() -> None:
    args = parse_args()
    root = Path(args.project).expanduser().resolve()
    pubspec_path = root / "pubspec.yaml"
    lib_path = root / "lib"
    if not pubspec_path.is_file() or not lib_path.is_dir():
        raise SystemExit(f"Not a Flutter project (expected pubspec.yaml and lib/): {root}")

    pubspec = pubspec_path.read_text(encoding="utf-8")
    report = {
        "project_root": str(root),
        "dependencies": dependency_versions(pubspec),
        "configuration_files": {
            "flutterfire": sorted(
                relative(path, root)
                for path in lib_path.rglob("firebase_options*.dart")
            ),
            "native": existing_paths(
                root,
                [
                    "android/app/google-services.json",
                    "ios/Runner/GoogleService-Info.plist",
                    "macos/Runner/GoogleService-Info.plist",
                ],
            ),
        },
        "architecture_hints": architecture_hints(root),
        "dart": scan_dart(root),
    }
    print(json.dumps(report, indent=2, sort_keys=True))


if __name__ == "__main__":
    main()
