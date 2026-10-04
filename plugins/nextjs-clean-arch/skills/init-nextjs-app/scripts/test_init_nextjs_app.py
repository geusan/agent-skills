"""Offline checks for overwrite protection, staged failure, and metadata merges."""

import json
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch

from init_nextjs_app import initialize, publish


class InitializeTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory(prefix="test-init-next-")
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)

    def test_existing_application_is_rejected_before_network(self):
        target = self.root / "existing"
        target.mkdir()
        package = target / "package.json"
        package.write_text('{"name":"user-owned"}\n')
        with patch("init_nextjs_app.run") as run:
            with self.assertRaisesRegex(ValueError, "refusing to overwrite"):
                initialize(target)
            run.assert_not_called()
        self.assertEqual(package.read_text(), '{"name":"user-owned"}\n')

    def test_invalid_name_is_rejected_before_network(self):
        target = self.root / "new"
        with patch("init_nextjs_app.run") as run:
            with self.assertRaisesRegex(ValueError, "npm package name"):
                initialize(target, "Invalid Name")
            run.assert_not_called()
        self.assertFalse(target.exists())

    def test_metadata_symlink_is_rejected(self):
        original = self.root / "instructions"
        original.write_text("Preserve this")
        target = self.root / "linked"
        target.mkdir()
        (target / "AGENTS.md").symlink_to(original)
        with self.assertRaisesRegex(ValueError, "regular file"):
            initialize(target)
        self.assertEqual(original.read_text(), "Preserve this")

    def test_install_failure_does_not_publish_partial_app(self):
        target = self.root / "app"
        target.mkdir()
        (target / "README.md").write_text("Existing project")

        def fake_run(args, cwd, capture=False):
            if args[0] == "node":
                return "v24.21.0"
            if args[:2] == ["npm", "view"]:
                return '"16.3.8"'
            if args[0] == "npx":
                scaffold = Path(args[4])
                (scaffold / "src/app").mkdir(parents=True)
                (scaffold / "tsconfig.json").write_text("{}")
                (scaffold / "package.json").write_text(json.dumps({
                    "dependencies": {"next": "16.3.8", "react": "19.2.0", "react-dom": "19.2.0"}
                }))
                return ""
            raise ValueError("Simulated package installation failure")

        with patch("init_nextjs_app.run", side_effect=fake_run):
            with self.assertRaisesRegex(ValueError, "installation failure"):
                initialize(target)
        self.assertEqual([p.name for p in target.iterdir()], ["README.md"])
        self.assertEqual((target / "README.md").read_text(), "Existing project")

    def test_publish_preserves_metadata_and_moves_source(self):
        target = self.root / "target"
        target.mkdir()
        (target / "AGENTS.md").write_text("Existing rules\n")
        (target / "README.md").write_text("Existing README")
        staging = self.root / "staging"
        staging.mkdir()
        (staging / "AGENTS.md").write_text("Architecture rules\n")
        (staging / "README.md").write_text("App instructions\n")
        (staging / "src").mkdir()
        (staging / "src/example.ts").write_text("export const value = 1;\n")
        merged = publish(staging, target)
        self.assertEqual(merged, ["AGENTS.md", "README.md"])
        self.assertTrue((target / "AGENTS.md").read_text().startswith("Existing rules\n"))
        self.assertTrue((target / "README.md").read_text().startswith("Existing README"))
        self.assertTrue((target / "src/example.ts").is_file())


if __name__ == "__main__":
    unittest.main()
