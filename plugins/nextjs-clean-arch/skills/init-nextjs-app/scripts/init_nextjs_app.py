#!/usr/bin/env python3
"""Stage a Next.js/TypeScript/Tailwind/Vitest app, then publish into a new target."""

import argparse
import json
import os
from pathlib import Path
import re
import shutil
import subprocess
import sys
import tempfile


ASSETS = Path(__file__).resolve().parent.parent / "assets" / "app"
METADATA = {"README.md", "AGENTS.md", "CLAUDE.md", ".gitignore"}
ALLOWED = METADATA | {".git", "LICENSE", "LICENSE.md", ".DS_Store"}
TEST_PACKAGES = ["vitest", "vite", "@vitejs/plugin-react", "jsdom",
                 "@testing-library/react", "@testing-library/dom",
                 "@testing-library/jest-dom", "@testing-library/user-event"]


def run(args, cwd, capture=False):
    env = dict(os.environ, CI="1", NEXT_TELEMETRY_DISABLED="1", npm_config_engine_strict="true")
    result = subprocess.run(args, cwd=cwd, env=env, text=True, capture_output=capture)
    if result.returncode:
        raise ValueError((result.stderr or "").strip() or f"Command failed: {' '.join(args)}")
    return result.stdout.strip() if capture else ""


def check_target(target):
    if target.is_symlink():
        raise ValueError("Target must not be a symlink")
    if not target.exists():
        return
    if not target.is_dir():
        raise ValueError("Target must be a directory")
    unexpected = sorted(p.name for p in target.iterdir() if p.name not in ALLOWED)
    if unexpected:
        raise ValueError("Existing application files; refusing to overwrite: " + ", ".join(unexpected))
    for name in METADATA:
        path = target / name
        if path.is_symlink() or (path.exists() and not path.is_file()):
            raise ValueError(f"Cannot merge {name}: expected a regular file")


def append_text(original, addition):
    return original + ("\n" if original.endswith("\n") else "\n\n") + addition


def overlay(staging, name):
    package_path = staging / "package.json"
    package = json.loads(package_path.read_text())
    for dependency in ("next", "react", "react-dom"):
        if dependency not in package.get("dependencies", {}):
            raise ValueError(f"Unexpected create-next-app output: missing {dependency}")
    if not (staging / "src/app").is_dir() or not (staging / "tsconfig.json").is_file():
        raise ValueError("Unexpected create-next-app layout; expected TypeScript src/app")
    package["name"] = name
    package["private"] = True
    package.setdefault("scripts", {}).update({
        "lint": "eslint .", "typecheck": "next typegen && tsc --noEmit",
        "test": "vitest run", "test:watch": "vitest",
    })
    package_path.write_text(json.dumps(package, indent=2) + "\n")
    for asset in sorted(ASSETS.rglob("*.tmpl")):
        relative = asset.relative_to(ASSETS).as_posix().removesuffix(".tmpl")
        path = staging / relative
        content = asset.read_text().replace("{{PROJECT_NAME}}", name)
        if relative in {"AGENTS.md", "CLAUDE.md", ".gitignore"} and path.exists():
            content = append_text(path.read_text(), content)
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(content)
    for directory in ("src/features/home/domain", "src/features/home/application",
                      "src/features/home/infrastructure", "src/composition", "src/shared/ui"):
        path = staging / directory
        path.mkdir(parents=True, exist_ok=True)
        (path / ".gitkeep").touch()


def publish(staging, target):
    check_target(target)
    # Check every collision and prepare metadata merges before changing target.
    merged = {}
    for entry in staging.iterdir():
        destination = target / entry.name
        if destination.exists():
            if entry.name not in METADATA or not entry.is_file():
                raise ValueError(f"Refusing to replace {entry.name}")
            merged[entry.name] = append_text(destination.read_text(), entry.read_text())
    target.mkdir(parents=True, exist_ok=True)
    for entry in list(staging.iterdir()):
        if entry.name in merged:
            (target / entry.name).write_text(merged[entry.name])
        else:
            shutil.move(str(entry), str(target / entry.name))
    return sorted(merged)


def initialize(destination=".", name=None, cna_version="latest"):
    raw_target = Path(destination).expanduser().absolute()
    check_target(raw_target)
    target = raw_target.resolve()
    check_target(target)
    name = name or re.sub(r"[^a-z0-9-]+", "-", target.name.lower()).strip("-") or "next-app"
    if not re.fullmatch(r"[a-z0-9][a-z0-9._-]{0,213}", name) or name in {"node_modules", "favicon.ico"}:
        raise ValueError("App name must be a lowercase, unscoped npm package name")
    if not re.fullmatch(r"[A-Za-z0-9][A-Za-z0-9.+-]*", cna_version):
        raise ValueError("Use an npm version or tag for create-next-app")

    # Registry access and install happen outside the target; engine mismatch or
    # a failed download must not leave an application half-written there.
    with tempfile.TemporaryDirectory(prefix="init-nextjs-app-") as temp:
        temp_root = Path(temp)
        node = run(["node", "--version"], temp_root, capture=True)
        node_match = re.fullmatch(r"v(\d+)\.\d+\.\d+", node)
        if not node_match:
            raise ValueError("Use a released Node runtime")
        version = run(["npm", "view", f"create-next-app@{cna_version}", "version", "--json"],
                      temp_root, capture=True)
        version = json.loads(version)
        if not isinstance(version, str):
            raise ValueError("create-next-app version did not resolve to one release")
        staging = temp_root / "app"
        run(["npx", "--yes", f"--package=create-next-app@{version}", "create-next-app", str(staging),
             "--ts", "--tailwind", "--eslint", "--app", "--src-dir",
             "--import-alias", "@/*", "--use-npm", "--no-react-compiler",
             "--disable-git", "--skip-install", "--yes"], temp_root)
        overlay(staging, name)
        (staging / ".node-version").write_text(node.removeprefix("v") + "\n")
        run(["npm", "install", "--save-dev", "--save-exact", "--no-audit", "--no-fund",
             f"@types/node@{node_match.group(1)}", *TEST_PACKAGES], staging)
        lock = json.loads((staging / "package-lock.json").read_text())
        versions = {package: lock["packages"]["node_modules/" + package]["version"]
                    for package in ["next", "react", "tailwindcss", "typescript", "@types/node", "vitest", "jsdom"]}
        merged = publish(staging, target)
    return {"directory": str(target), "name": name, "node": node,
            "create_next_app": version, "versions": versions, "merged": merged}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--dir", default=".")
    parser.add_argument("--name", help="Defaults to the directory name")
    parser.add_argument("--create-next-app-version", default="latest")
    args = parser.parse_args()
    try:
        result = initialize(args.dir, args.name, args.create_next_app_version)
    except (ValueError, OSError, KeyError) as error:
        print(f"error: {error}", file=sys.stderr)
        return 1
    print(json.dumps(result, indent=2))
    return 0


if __name__ == "__main__":
    sys.exit(main())
