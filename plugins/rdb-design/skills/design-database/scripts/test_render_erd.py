import json
from pathlib import Path
import shlex
import subprocess
import sys
import tempfile
import unittest
from unittest.mock import patch

from render_erd import check, diagrams, render


class RenderTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory(prefix="test-erd-")
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)
        self.source = self.root / "erd.md"
        self.source.write_text('# Example\n\n```mermaid\nerDiagram\n  USER {\n    int id PK\n  }\n```\n')
        self.output = self.root / "diagrams"
        renderer = self.root / "renderer.py"
        renderer.write_text('''import pathlib, sys
if "--version" in sys.argv:
    print("test-renderer")
else:
    source = pathlib.Path(sys.argv[sys.argv.index("-i") + 1]).read_text()
    if "FAIL" in source:
        print("invalid diagram", file=sys.stderr)
        sys.exit(1)
    pathlib.Path(sys.argv[sys.argv.index("-o") + 1]).write_text('<svg xmlns="http://www.w3.org/2000/svg"><text>Example</text></svg>')
''')
        self.renderer = shlex.join([sys.executable, str(renderer)])

    def test_fences_and_non_erd_diagrams(self):
        text = '````text\n```mermaid\nerDiagram\n```\n````\n```mermaid\nflowchart LR\n A --> B\n```\n'
        self.assertEqual(len(diagrams(text + self.source.read_text())), 1)
        self.assertEqual(len(diagrams('%% a comment\nerDiagram\n USER\n')), 1)
        with self.assertRaisesRegex(ValueError, 'Unclosed'):
            diagrams('```mermaid\nerDiagram\n')

    def test_render_check_and_source_drift(self):
        render(self.source, self.output, self.renderer)
        self.assertEqual(check(self.source, self.output)['renderer_version'], 'test-renderer')
        original = self.source.read_text()
        self.source.write_text(original.replace('USER', 'ACCOUNT'))
        with self.assertRaisesRegex(ValueError, 'source changed'):
            check(self.source, self.output)
        self.source.write_text(original)
        (self.output / 'erd-1.svg').write_text('<svg/>')
        with self.assertRaisesRegex(ValueError, 'missing or changed'):
            check(self.source, self.output)

    def test_failed_render_does_not_replace_previous_outputs(self):
        render(self.source, self.output, self.renderer)
        previous = {p.name: p.read_bytes() for p in self.output.iterdir()}
        self.source.write_text(self.source.read_text() + '\n```mermaid\nerDiagram\n FAIL\n```\n')
        with self.assertRaises(subprocess.CalledProcessError):
            render(self.source, self.output, self.renderer)
        self.assertEqual(previous, {p.name: p.read_bytes() for p in self.output.iterdir()})

    def test_unmanaged_and_symlink_outputs_are_protected(self):
        self.output.mkdir()
        image = self.output / 'erd-1.svg'
        image.write_text('user image')
        with self.assertRaisesRegex(ValueError, 'unmanaged'):
            render(self.source, self.output, self.renderer)
        self.assertEqual(image.read_text(), 'user image')
        image.unlink()
        image.symlink_to(self.source)
        with self.assertRaisesRegex(ValueError, 'Unsafe'):
            render(self.source, self.output, self.renderer)

    def test_only_stale_managed_images_are_removed(self):
        original = self.source.read_text()
        self.source.write_text(original + '\n```mermaid\nerDiagram\n ACCOUNT\n```\n')
        render(self.source, self.output, self.renderer)
        unrelated = self.output / 'keep.txt'
        unrelated.write_text('user notes')
        self.source.write_text(original)
        render(self.source, self.output, self.renderer)
        self.assertFalse((self.output / 'erd-2.svg').exists())
        self.assertEqual(unrelated.read_text(), 'user notes')
        check(self.source, self.output)

    def test_manifest_cannot_escape_output_directory(self):
        render(self.source, self.output, self.renderer)
        manifest = self.output / 'erd-render.json'
        record = json.loads(manifest.read_text())
        record['artifacts']['../outside.svg'] = 'anything'
        manifest.write_text(json.dumps(record))
        with self.assertRaisesRegex(ValueError, 'Unexpected'):
            check(self.source, self.output)

    def test_source_change_during_render_does_not_publish(self):
        real_run = subprocess.run

        def change_source(args, **kwargs):
            result = real_run(args, **kwargs)
            if '-o' in args:
                self.source.write_text(self.source.read_text() + '\nChanged while rendering.\n')
            return result

        with patch('render_erd.subprocess.run', side_effect=change_source):
            with self.assertRaisesRegex(ValueError, 'changed during rendering'):
                render(self.source, self.output, self.renderer)
        self.assertFalse(self.output.exists())


if __name__ == '__main__':
    unittest.main()
