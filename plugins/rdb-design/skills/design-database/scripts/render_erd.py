#!/usr/bin/env python3
"""Render Mermaid ERDs locally and check source/image freshness, not schema semantics."""

import argparse
import hashlib
import json
import os
from pathlib import Path
import re
import shlex
import subprocess
import sys
import tempfile
import xml.etree.ElementTree as ET


MANIFEST = "erd-render.json"


def digest(data):
    return hashlib.sha256(data).hexdigest()


def diagrams(text):
    """Accept a bare ERD or Mermaid fenced blocks; ignore other fenced content."""
    lines = text.splitlines()
    meaningful = [line.strip() for line in lines if line.strip() and not line.lstrip().startswith("%%")]
    if meaningful and meaningful[0] == "erDiagram":
        return [text.strip() + "\n"]
    result, opening, language, body = [], None, None, []
    for line in lines:
        if opening is None:
            match = re.fullmatch(r" {0,3}(`{3,}|~{3,})([^\r\n]*)", line)
            if match:
                opening = match.group(1)
                language = match.group(2).strip()
                body = []
        elif re.fullmatch(r" {0,3}" + re.escape(opening[0]) + "{" + str(len(opening)) + r",}\s*", line):
            if language == "mermaid":
                code = "\n".join(body).strip()
                statements = [line.strip() for line in body if line.strip() and not line.lstrip().startswith("%%")]
                if statements and statements[0] == "erDiagram":
                    result.append(code + "\n")
            opening = None
        else:
            body.append(line)
    if opening is not None:
        raise ValueError("Unclosed Markdown code fence")
    if not result:
        raise ValueError("No Mermaid ERD found; use erDiagram as the first non-comment statement")
    return result


def load_manifest(output):
    path = output / MANIFEST
    if path.is_symlink():
        raise ValueError("Render manifest must not be a symlink")
    if not path.exists():
        return None
    record = json.loads(path.read_text())
    if not isinstance(record, dict) or record.get("format") != 1 or not isinstance(record.get("artifacts"), dict):
        raise ValueError("Unsupported render manifest")
    for name in record["artifacts"]:
        if not re.fullmatch(r"erd-[1-9][0-9]*\.svg", name):
            raise ValueError("Unexpected generated image name in manifest")
    return record


def check(source, output):
    source, output = Path(source).resolve(), Path(output).resolve()
    record = load_manifest(output)
    if record is None:
        raise ValueError("No render manifest; render the ERD first")
    if record.get("source") != os.path.relpath(source, output):
        raise ValueError("Manifest belongs to another source document")
    if record.get("source_sha256") != digest(source.read_bytes()):
        raise ValueError("ERD source changed; review and regenerate its images")
    expected = {f"erd-{index}.svg" for index, _ in enumerate(diagrams(source.read_text()), 1)}
    if set(record["artifacts"]) != expected:
        raise ValueError("Rendered image count does not match the ERD source")
    for name, checksum in record["artifacts"].items():
        path = output / name
        if path.is_symlink() or not path.is_file() or digest(path.read_bytes()) != checksum:
            raise ValueError(f"Generated image is missing or changed: {name}")
    return record


def render(source, output, renderer="mmdc", puppeteer_config=None):
    source = Path(source).resolve()
    raw_output = Path(output).absolute()
    if raw_output.is_symlink():
        raise ValueError("Output directory must not be a symlink")
    output = raw_output.resolve()
    source_bytes = source.read_bytes()
    text = source_bytes.decode("utf-8")
    blocks = diagrams(text)
    old = load_manifest(output)
    if old and old.get("source") != os.path.relpath(source, output):
        raise ValueError("Output directory is already owned by another ERD document")
    names = [f"erd-{index}.svg" for index in range(1, len(blocks) + 1)]
    for name in set(names) | set((old or {}).get("artifacts", {})):
        destination = output / name
        if destination == source or destination.is_symlink():
            raise ValueError(f"Unsafe output path: {name}")
        if destination.exists() and name not in (old or {}).get("artifacts", {}):
            raise ValueError(f"Refusing to overwrite unmanaged image: {name}")
    if source == output / MANIFEST:
        raise ValueError("Source cannot be the render manifest")
    command = shlex.split(renderer)
    if not command:
        raise ValueError("Renderer command is empty")
    version = subprocess.run([*command, "--version"], check=True, capture_output=True, text=True).stdout.strip()
    with tempfile.TemporaryDirectory(prefix="render-erd-") as temporary:
        staging = Path(temporary)
        config = staging / "mermaid.json"
        config.write_text(json.dumps({"securityLevel": "strict", "theme": "default", "fontFamily": "Arial", "htmlLabels": False,
                                      "deterministicIds": True, "deterministicIDSeed": "versioned-erd"}))
        images = {}
        for index, block in enumerate(blocks, 1):
            input_path, svg = staging / f"erd-{index}.mmd", staging / f"erd-{index}.svg"
            input_path.write_text(block)
            args = [*command, "-i", str(input_path), "-o", str(svg), "-c", str(config)]
            if puppeteer_config:
                args.extend(["-p", str(Path(puppeteer_config).resolve())])
            subprocess.run(args, check=True, capture_output=True, text=True)
            content = svg.read_bytes()
            if ET.fromstring(content).tag.split("}")[-1] != "svg":
                raise ValueError("Renderer did not produce SVG")
            images[svg.name] = content
        if source.read_bytes() != source_bytes:
            raise ValueError("ERD source changed during rendering; outputs were not published")
        record = {"format": 1, "source": os.path.relpath(source, output),
                  "source_sha256": digest(source_bytes), "renderer_version": version,
                  "artifacts": {name: digest(data) for name, data in images.items()}}
        output.mkdir(parents=True, exist_ok=True)
        for name, content in images.items():
            (output / name).write_bytes(content)
        for name in set((old or {}).get("artifacts", {})) - set(images):
            (output / name).unlink(missing_ok=True)
        (output / MANIFEST).write_text(json.dumps(record, indent=2) + "\n")
    return record


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("source", help="Markdown containing Mermaid ERDs, or a bare .mmd file")
    parser.add_argument("--output-dir", required=True, help="Dedicated directory for this document's SVGs")
    parser.add_argument("--renderer", default="mmdc", help="Command prefix, split without a shell")
    parser.add_argument("--puppeteer-config", help="Local Puppeteer config for a chosen browser")
    parser.add_argument("--check", action="store_true", help="Read-only freshness check; no renderer needed")
    args = parser.parse_args()
    try:
        if args.check:
            check(args.source, args.output_dir)
            print("ERD source and SVGs match. ORM/migration/schema semantics were not checked.")
        else:
            print(json.dumps(render(args.source, args.output_dir, args.renderer, args.puppeteer_config), indent=2))
    except (ValueError, OSError, KeyError, ET.ParseError, subprocess.CalledProcessError) as error:
        detail = error.stderr if isinstance(error, subprocess.CalledProcessError) else str(error)
        print(f"error: {detail}", file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
