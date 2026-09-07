#!/usr/bin/env python3

import argparse
import json
import re
import subprocess
from collections import Counter
from pathlib import Path


IMPORT_RE = re.compile(r"^\s*(?:import|export)\s+['\"]([^'\"]+)['\"]", re.MULTILINE)
KNOWN_LAYERS = (
    "common",
    "core",
    "data",
    "domain",
    "features",
    "presentation",
    "repository",
    "screens",
    "services",
    "values",
)
STACK_PACKAGES = (
    "auto_route",
    "bloc",
    "chopper",
    "dio",
    "drift",
    "flutter_bloc",
    "flutter_riverpod",
    "flutter_secure_storage",
    "get",
    "get_it",
    "go_router",
    "hive",
    "injectable",
    "isar",
    "provider",
    "retrofit",
    "riverpod",
    "shared_preferences",
    "sqflite",
)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Inventory an existing Flutter project.")
    parser.add_argument("project", type=Path)
    return parser.parse_args()


def parse_pubspec(pubspec: Path) -> dict:
    package_name = ""
    sdk_constraint = ""
    sections = {"dependencies": {}, "dev_dependencies": {}}
    current_section = ""

    for line in pubspec.read_text().splitlines():
        if line.startswith("name:"):
            package_name = line.split(":", 1)[1].strip().strip("'\"")
        elif line == "environment:":
            current_section = "environment"
        elif line in ("dependencies:", "dev_dependencies:"):
            current_section = line[:-1]
        elif line and not line[0].isspace() and not line.startswith("#"):
            current_section = ""

        if current_section == "environment" and line.startswith("  sdk:"):
            sdk_constraint = line.split(":", 1)[1].strip()
        elif current_section in sections:
            match = re.match(r"^  ([A-Za-z0-9_]+):(?:\s*(.*))?$", line)
            if match:
                sections[current_section][match.group(1)] = (match.group(2) or "").strip()

    return {
        "name": package_name,
        "sdk_constraint": sdk_constraint,
        **sections,
    }


def run_git(project: Path, *args: str) -> tuple[int, str]:
    try:
        result = subprocess.run(
            ["git", "-C", str(project), *args],
            text=True,
            stdout=subprocess.PIPE,
            stderr=subprocess.DEVNULL,
            check=False,
        )
    except FileNotFoundError:
        return 127, ""
    return result.returncode, result.stdout.strip()


def git_inventory(project: Path) -> dict:
    root_status, root = run_git(project, "rev-parse", "--show-toplevel")
    if root_status != 0:
        return {"is_repository": False}

    _, branch = run_git(project, "branch", "--show-current")
    _, head = run_git(project, "rev-parse", "HEAD")
    _, status = run_git(project, "status", "--short")
    changes = status.splitlines() if status else []
    return {
        "is_repository": True,
        "root": root,
        "branch": branch or "(detached)",
        "head": head,
        "change_count": len(changes),
        "changes": changes,
    }


def main() -> None:
    args = parse_args()
    project = args.project.expanduser().resolve()
    pubspec_path = project / "pubspec.yaml"
    lib_path = project / "lib"
    if not pubspec_path.is_file() or not lib_path.is_dir():
        raise SystemExit(f"not a Flutter application root: {project}")

    pubspec = parse_pubspec(pubspec_path)
    dart_files = sorted(lib_path.rglob("*.dart"))
    test_files = []
    for test_root_name in ("test", "integration_test"):
        test_root = project / test_root_name
        if test_root.is_dir():
            test_files.extend(sorted(test_root.rglob("*.dart")))

    package_imports: Counter[str] = Counter()
    import_count = 0
    for dart_file in dart_files:
        text = dart_file.read_text(errors="replace")
        for uri in IMPORT_RE.findall(text):
            import_count += 1
            if uri.startswith("package:"):
                package_imports[uri.removeprefix("package:").split("/", 1)[0]] += 1

    layer_counts = {
        layer: len(list((lib_path / layer).rglob("*.dart")))
        for layer in KNOWN_LAYERS
        if (lib_path / layer).is_dir()
    }
    dependencies = {
        **pubspec["dependencies"],
        **pubspec["dev_dependencies"],
    }
    generated_files = [
        str(path.relative_to(project))
        for path in dart_files
        if path.name.endswith((".g.dart", ".freezed.dart", ".gr.dart"))
    ]

    result = {
        "project": str(project),
        "package": pubspec["name"],
        "sdk_constraint": pubspec["sdk_constraint"],
        "git": git_inventory(project),
        "entrypoints": [
            str(path.relative_to(project))
            for path in dart_files
            if path.parent == lib_path and path.name.startswith("main")
        ],
        "dart_file_count": len(dart_files),
        "test_file_count": len(test_files),
        "import_count": import_count,
        "layer_directory_counts": layer_counts,
        "top_package_imports": dict(package_imports.most_common(20)),
        "detected_stack": sorted(name for name in STACK_PACKAGES if name in dependencies),
        "generated_file_count": len(generated_files),
        "generated_files": generated_files,
        "platforms": [
            platform
            for platform in ("android", "ios", "web", "macos", "windows", "linux")
            if (project / platform).is_dir()
        ],
    }
    print(json.dumps(result, indent=2, ensure_ascii=False))


if __name__ == "__main__":
    main()
