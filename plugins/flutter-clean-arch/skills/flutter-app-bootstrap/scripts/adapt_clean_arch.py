#!/usr/bin/env python3

import argparse
import json
from pathlib import Path


LEGACY_COMMIT = "559779db16aad5c3475a7a5b6fd84ebba4944d1b"


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Adapt a fetched flutter-clean-arch tree to a new package."
    )
    parser.add_argument("--target", required=True, type=Path)
    parser.add_argument("--generated-pubspec", required=True, type=Path)
    parser.add_argument("--name", required=True)
    parser.add_argument("--description", required=True)
    parser.add_argument("--source-commit", required=True)
    return parser.parse_args()


def read_package_name(pubspec: Path) -> str:
    for line in pubspec.read_text().splitlines():
        if line.startswith("name:"):
            name = line.split(":", 1)[1].strip()
            if name:
                return name
    raise ValueError(f"package name not found in {pubspec}")


def read_sdk_constraint(pubspec: Path) -> str:
    in_environment = False
    for line in pubspec.read_text().splitlines():
        if line == "environment:":
            in_environment = True
            continue
        if in_environment and line.startswith("  sdk:"):
            return line.split(":", 1)[1].strip()
        if in_environment and line and not line[0].isspace():
            break
    raise ValueError(f"Dart SDK constraint not found in {pubspec}")


def rewrite_pubspec(
    pubspec: Path, name: str, description: str, sdk_constraint: str
) -> None:
    lines = pubspec.read_text().splitlines()
    in_environment = False
    found_sdk = False

    for index, line in enumerate(lines):
        if line.startswith("name:"):
            lines[index] = f"name: {name}"
        elif line.startswith("description:"):
            lines[index] = f"description: {json.dumps(description, ensure_ascii=False)}"

        if line == "environment:":
            in_environment = True
            continue
        if in_environment and line.startswith("  sdk:"):
            lines[index] = f"  sdk: {sdk_constraint}"
            found_sdk = True
            in_environment = False
        elif in_environment and line and not line[0].isspace():
            in_environment = False

    if not found_sdk:
        raise ValueError(f"Dart SDK constraint not found in {pubspec}")
    pubspec.write_text("\n".join(lines) + "\n")


def rewrite_package_imports(target: Path, source_name: str, target_name: str) -> int:
    old = f"package:{source_name}/"
    new = f"package:{target_name}/"
    changed = 0
    for root_name in ("lib", "test", "integration_test"):
        root = target / root_name
        if not root.exists():
            continue
        for dart_file in root.rglob("*.dart"):
            original = dart_file.read_text()
            updated = original.replace(old, new)
            if updated != original:
                dart_file.write_text(updated)
                changed += 1
    return changed


def repair_legacy_test(target: Path, package_name: str) -> bool:
    test_file = target / "test/widget_test.dart"
    if not test_file.exists():
        return False
    test_file.write_text(
        f"""import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:provider/provider.dart';
import 'package:{package_name}/screens/home/home.screen.dart';
import 'package:{package_name}/screens/home/home.viewmodel.dart';

void main() {{
  testWidgets('Counter increments smoke test', (tester) async {{
    await tester.pumpWidget(
      ChangeNotifierProvider(
        create: (_) => HomeViewModel(),
        child: const MaterialApp(home: HomeScreen()),
      ),
    );

    expect(find.textContaining('Home screen 0'), findsOneWidget);

    await tester.tap(find.byIcon(Icons.add));
    await tester.pump();

    expect(find.textContaining('Home screen 1'), findsOneWidget);
  }});
}}
"""
    )
    return True


def main() -> None:
    args = parse_args()
    pubspec = args.target / "pubspec.yaml"
    source_name = read_package_name(pubspec)
    sdk_constraint = read_sdk_constraint(args.generated_pubspec)
    rewrite_pubspec(pubspec, args.name, args.description, sdk_constraint)
    import_count = rewrite_package_imports(args.target, source_name, args.name)
    repaired_test = False
    if args.source_commit == LEGACY_COMMIT:
        repaired_test = repair_legacy_test(args.target, args.name)

    print(f"source package: {source_name}")
    print(f"rewritten Dart files: {import_count}")
    print(f"Dart SDK constraint: {sdk_constraint}")
    if repaired_test:
        print(f"applied compatibility adapter for {LEGACY_COMMIT}")


if __name__ == "__main__":
    main()
