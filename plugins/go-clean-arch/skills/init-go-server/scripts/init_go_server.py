#!/usr/bin/env python3
"""Create the bundled Go server without replacing existing application files."""

import argparse
import json
import os
from pathlib import Path
import re
import subprocess
import sys
import tempfile
from urllib.parse import urlsplit


ASSETS = Path(__file__).resolve().parent.parent / "assets" / "server"
MERGEABLE = {"README.md", "AGENTS.md", "CLAUDE.md", ".gitignore"}
ALLOWED = MERGEABLE | {".git", "LICENSE", "LICENSE.md", ".DS_Store"}


def command(args, cwd, env=None):
    result = subprocess.run(args, cwd=cwd, env=env, text=True, capture_output=True)
    if result.returncode:
        raise ValueError(result.stderr.strip() or f"Command failed: {args[0]}")
    return result.stdout.strip()


def infer_module(target):
    """Use this target's Git origin, including its repository-relative suffix."""
    existing = target
    while not existing.exists():
        existing = existing.parent
    try:
        root = Path(command(["git", "rev-parse", "--show-toplevel"], existing)).resolve()
        suffix = target.relative_to(root).as_posix()
        remote = command(["git", "remote", "get-url", "origin"], root)
        if "://" in remote:
            url = urlsplit(remote)
            if url.scheme not in {"https", "http", "ssh", "git"} or not url.hostname:
                raise ValueError("Not a hosted Git remote")
            host, path = url.hostname, url.path.strip("/")
        else:
            match = re.fullmatch(r"(?:[^/@:]+@)?([^/:]+):(.+)", remote)
            if not match:
                raise ValueError("Not a hosted Git remote")
            host, path = match.groups()
        if "." not in host or not path:
            raise ValueError("Remote does not identify a module host")
        module = f"{host}/{path.removesuffix('.git')}"
        if suffix != ".":
            module += "/" + suffix
        return module, "git-origin"
    except (ValueError, OSError):
        name = re.sub(r"[^a-z0-9-]+", "-", target.name.lower()).strip("-") or "go-server"
        return f"example.com/{name}", "local-placeholder"


def check_target(target):
    if target.is_symlink():
        raise ValueError("Target must not be a symlink")
    if target.exists():
        if not target.is_dir():
            raise ValueError("Target is not a directory")
        unexpected = sorted(p.name for p in target.iterdir() if p.name not in ALLOWED)
        if unexpected:
            raise ValueError("Target contains application files; refusing to overwrite: " + ", ".join(unexpected))
        for name in MERGEABLE:
            path = target / name
            if path.is_symlink() or (path.exists() and not path.is_file()):
                raise ValueError(f"Cannot merge {name}: expected a regular file")
    for parent in target.parents:
        if (parent / "go.mod").exists():
            raise ValueError("Target is inside an existing Go module; use its feature workflow instead")


def initialize(destination, module=None, go_bin="go"):
    raw_target = Path(destination).expanduser().absolute()
    check_target(raw_target)
    target = raw_target.resolve()
    # Also check resolved parents so a symlink in the path cannot hide a module.
    check_target(target)
    inferred, source = infer_module(target) if module is None else (module, "explicit")
    if not inferred or inferred.startswith("-"):
        raise ValueError("Module path must be non-empty and cannot start with '-'")
    name = re.sub(r"[^a-z0-9-]+", "-", target.name.lower()).strip("-") or "go-server"

    # Validate with Go itself, before writing anything in the target. No network
    # dependencies are required by the starter or this module initialization.
    env = dict(os.environ, GOWORK="off", GO111MODULE="on", GOTOOLCHAIN="local")
    with tempfile.TemporaryDirectory(prefix="init-go-server-") as staging:
        version = command([go_bin, "env", "GOVERSION"], staging, env)
        match = re.search(r"go(\d+)\.(\d+)", version)
        if not match or tuple(map(int, match.groups())) < (1, 22):
            raise ValueError("The starter requires Go 1.22 or newer")
        command([go_bin, "mod", "init", inferred], staging, env)
        files = {"go.mod": (Path(staging) / "go.mod").read_text()}
    for asset in sorted(ASSETS.rglob("*.tmpl")):
        relative = asset.relative_to(ASSETS).as_posix().removesuffix(".tmpl")
        files[relative] = asset.read_text().replace("{{MODULE_PATH}}", inferred).replace("{{PROJECT_NAME}}", name)
    for relative in ("internal/domain/.gitkeep", "internal/usecase/.gitkeep", "internal/repository/.gitkeep"):
        files[relative] = ""

    # Prepare all merges before the first write; preserve existing instruction
    # and README text verbatim. The skill checks their semantic compatibility.
    merged = []
    for relative, content in list(files.items()):
        path = target / relative
        if path.exists():
            if relative not in MERGEABLE:
                raise ValueError(f"Refusing to replace {relative}")
            original = path.read_text()
            files[relative] = original + ("\n" if original.endswith("\n") else "\n\n") + content
            merged.append(relative)

    target.mkdir(parents=True, exist_ok=True)
    for relative, content in files.items():
        path = target / relative
        path.parent.mkdir(parents=True, exist_ok=True)
        if relative in merged:
            path.write_text(content)
        else:
            with path.open("x") as stream:
                stream.write(content)
    return {"directory": str(target), "module": inferred, "module_source": source,
            "go_version": version, "files": sorted(files), "merged": sorted(merged)}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--dir", default=".", help="New, empty, or metadata-only project directory")
    parser.add_argument("--module", help="Module path; default: Git origin or example.com/<directory>")
    parser.add_argument("--go-bin", default=os.environ.get("GO_BIN", "go"), help="Go executable")
    args = parser.parse_args()
    try:
        result = initialize(args.dir, args.module, args.go_bin)
    except (ValueError, OSError) as error:
        print(f"error: {error}", file=sys.stderr)
        return 1
    print(json.dumps(result, indent=2))
    return 0


if __name__ == "__main__":
    sys.exit(main())
