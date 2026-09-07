#!/usr/bin/env python3

import argparse
import json
import re
from pathlib import Path
from typing import Optional


IMPORT_RE = re.compile(r"^\s*(?:import|export)\s+['\"]([^'\"]+)['\"]", re.MULTILINE)
ALIASES = {"presentation": "screens"}
ALLOWED = {
    "domain": {"domain"},
    "repository": {"repository", "domain", "common", "values"},
    "services": {"services", "repository", "domain", "common", "values", "di"},
    "screens": {"screens", "services", "domain", "common", "values", "di"},
    "common": {"common", "domain", "values"},
    "values": {"values", "common"},
}


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Check internal imports against flutter-clean-arch layer direction."
    )
    parser.add_argument("project", type=Path)
    parser.add_argument("--json", action="store_true", dest="as_json")
    return parser.parse_args()


def package_name(pubspec: Path) -> str:
    for line in pubspec.read_text().splitlines():
        if line.startswith("name:"):
            return line.split(":", 1)[1].strip().strip("'\"")
    raise ValueError(f"package name not found in {pubspec}")


def layer_for(relative_path: Path) -> Optional[str]:
    if len(relative_path.parts) == 1:
        return "di" if relative_path.stem == "di" else None
    return ALIASES.get(relative_path.parts[0], relative_path.parts[0])


def internal_target(
    uri: str, source_file: Path, lib_path: Path, app_package: str
) -> Optional[Path]:
    package_prefix = f"package:{app_package}/"
    if uri.startswith(package_prefix):
        return Path(uri.removeprefix(package_prefix))
    if ":" not in uri:
        resolved = (source_file.parent / uri).resolve()
        try:
            return resolved.relative_to(lib_path)
        except ValueError:
            return None
    return None


def main() -> None:
    args = parse_args()
    project = args.project.expanduser().resolve()
    pubspec = project / "pubspec.yaml"
    lib_path = project / "lib"
    if not pubspec.is_file() or not lib_path.is_dir():
        raise SystemExit(f"not a Flutter application root: {project}")

    app_package = package_name(pubspec)
    checked_edges = 0
    violations = []

    for source_file in sorted(lib_path.rglob("*.dart")):
        source_relative = source_file.relative_to(lib_path)
        source_layer = layer_for(source_relative)
        if source_layer not in ALLOWED:
            continue
        for uri in IMPORT_RE.findall(source_file.read_text(errors="replace")):
            target_relative = internal_target(uri, source_file, lib_path, app_package)
            if target_relative is None:
                continue
            target_layer = layer_for(target_relative)
            if target_layer is None:
                continue
            checked_edges += 1
            if target_layer not in ALLOWED[source_layer]:
                violations.append(
                    {
                        "source": str(source_relative),
                        "source_layer": source_layer,
                        "target": str(target_relative),
                        "target_layer": target_layer,
                        "import": uri,
                    }
                )

    result = {
        "project": str(project),
        "package": app_package,
        "checked_internal_edges": checked_edges,
        "violation_count": len(violations),
        "violations": violations,
    }
    if args.as_json:
        print(json.dumps(result, indent=2, ensure_ascii=False))
    else:
        print(f"checked internal edges: {checked_edges}")
        if violations:
            for item in violations:
                print(
                    "forbidden: "
                    f"{item['source']} ({item['source_layer']}) -> "
                    f"{item['target']} ({item['target_layer']})"
                )
        else:
            print("layer dependency check passed")

    raise SystemExit(1 if violations else 0)


if __name__ == "__main__":
    main()
