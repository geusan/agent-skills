"""Behavioral checks for initialization defaults and existing-file protection."""

from pathlib import Path
import subprocess
import tempfile
import unittest

from init_go_server import infer_module, initialize


class InitializeTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory(prefix="test-init-go-")
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name).resolve()

    def git(self, *args):
        subprocess.run(["git", "-C", str(self.root), *args], check=True, capture_output=True)

    def test_default_module_and_complete_scaffold(self):
        target = self.root / "sample-server"
        result = initialize(target)
        self.assertEqual(result["module"], "example.com/sample-server")
        self.assertEqual(result["module_source"], "local-placeholder")
        self.assertIn('httpapi "example.com/sample-server/internal/transport/http"',
                      (target / "cmd/api/main.go").read_text())
        self.assertTrue((target / "internal/domain").is_dir())
        self.assertTrue((target / "internal/usecase").is_dir())
        self.assertTrue((target / "internal/repository").is_dir())
        for file in ("AGENTS.md", "CLAUDE.md", "README.md", ".gitignore"):
            self.assertTrue((target / file).is_file())

    def test_existing_metadata_is_preserved(self):
        target = self.root / "server"
        target.mkdir()
        originals = {"AGENTS.md": "Keep existing API compatibility.\n",
                     "CLAUDE.md": "Existing instructions without a newline",
                     "README.md": "# Existing project\n", ".gitignore": "/private/\n"}
        for name, content in originals.items():
            (target / name).write_text(content)
        result = initialize(target, "example.org/company/server")
        self.assertEqual(set(result["merged"]), set(originals))
        for name, content in originals.items():
            self.assertTrue((target / name).read_text().startswith(content))

    def test_existing_source_and_repeated_initialization_are_unchanged(self):
        occupied = self.root / "occupied"
        occupied.mkdir()
        (occupied / "main.go").write_text("user-owned source")
        with self.assertRaisesRegex(ValueError, "refusing to overwrite"):
            initialize(occupied)
        self.assertEqual((occupied / "main.go").read_text(), "user-owned source")
        self.assertFalse((occupied / "go.mod").exists())

        generated = self.root / "generated"
        initialize(generated)
        before = {p.relative_to(generated): p.read_bytes() for p in generated.rglob('*') if p.is_file()}
        with self.assertRaises(ValueError):
            initialize(generated)
        after = {p.relative_to(generated): p.read_bytes() for p in generated.rglob('*') if p.is_file()}
        self.assertEqual(before, after)

    def test_invalid_module_writes_nothing(self):
        target = self.root / "invalid"
        with self.assertRaises(ValueError):
            initialize(target, "example.com/invalid path")
        self.assertFalse(target.exists())

    def test_nested_module_and_metadata_symlink_are_rejected(self):
        (self.root / "go.mod").write_text("module example.com/parent\n\ngo 1.22\n")
        with self.assertRaisesRegex(ValueError, "existing Go module"):
            initialize(self.root / "nested")
        self.assertFalse((self.root / "nested").exists())
        (self.root / "go.mod").unlink()

        external = self.root / "external-instructions"
        external.write_text("Do not change")
        target = self.root / "linked"
        target.mkdir()
        (target / "AGENTS.md").symlink_to(external)
        with self.assertRaisesRegex(ValueError, "regular file"):
            initialize(target)
        self.assertEqual(external.read_text(), "Do not change")
        self.assertFalse((target / "go.mod").exists())

    def test_module_comes_from_target_repository_and_subdirectory(self):
        self.git("init", "--quiet")
        self.git("remote", "add", "origin", "git@github.com:owner/project.git")
        self.assertEqual(infer_module(self.root), ("github.com/owner/project", "git-origin"))
        self.assertEqual(infer_module(self.root / "server"),
                         ("github.com/owner/project/server", "git-origin"))
        self.git("remote", "set-url", "origin", "https://github.com/owner/other.git")
        self.assertEqual(infer_module(self.root), ("github.com/owner/other", "git-origin"))


if __name__ == "__main__":
    unittest.main()
