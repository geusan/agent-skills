import assert from 'node:assert/strict';
import { mkdtemp, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

const runner = fileURLToPath(new URL('../run-tool.mjs', import.meta.url));
const server = fileURLToPath(new URL('../dist/index.js', import.meta.url));

function request(tool, args) {
  return spawnSync(process.execPath, [runner], {
    cwd: tmpdir(),
    input: JSON.stringify({ tool, arguments: args }),
    encoding: 'utf8',
    timeout: 15000,
  });
}

function result(tool, args) {
  const response = request(tool, args);
  assert.equal(response.status, 0, response.stderr || response.error?.message);
  assert.equal(response.stderr, '');
  return JSON.parse(response.stdout);
}

test('generates light and dark themes outside the installation directory', () => {
  const theme = result('generate_theme', { color: '#6750A4' });
  assert.equal(theme.themeColor, '#6750A4');
  for (const mode of ['light', 'dark']) {
    for (const role of ['primary', 'secondary', 'tertiary', 'error', 'background', 'surface']) {
      assert.match(theme.schemes[mode][role].color, /^#[0-9a-f]{6}$/i);
      assert.match(theme.schemes[mode][role].onColor, /^#[0-9a-f]{6}$/i);
    }
  }
  assert.notEqual(theme.schemes.light.primary.color, theme.schemes.dark.primary.color);
});

test('forwards harmony and separate dark-color options', () => {
  const base = result('generate_theme', { color: '#6750A4' });
  const harmony = result('generate_theme', { color: '#6750A4', harmony_mode: 'triadic' });
  assert.notEqual(base.schemes.light.secondary.color, harmony.schemes.light.secondary.color);
  const split = result('generate_theme', { color: '#6750A4', dark_color: '#006C4C' });
  assert.deepEqual(split.schemes.light, base.schemes.light);
  assert.notDeepEqual(split.schemes.dark, base.schemes.dark);
});

test('exports every advertised format through the stdin interface', async t => {
  const formats = ['css', 'css-hsl', 'css-oklch', 'tailwind', 'shadcn', 'react-native', 'swift', 'kotlin-compose', 'flutter', 'json'];
  for (const format of formats) {
    await t.test(format, () => {
      const exported = result('export_theme', { color: '#6750A4', format });
      assert.ok(exported.code.length > 0);
      assert.ok(exported.file_path_suggestion.length > 0);
      assert.ok(exported.instructions.length > 0);
      assert.doesNotMatch(exported.code, /\bundefined\b|\bNaN\b/);
      if (format === 'json') {
        const theme = JSON.parse(exported.code);
        assert.ok(theme.schemes.light.primary.color);
        assert.ok(theme.schemes.dark.primary.color);
      }
    });
  }
});

test('converts a known color and returns harmony candidates', () => {
  const color = result('convert_color', { color: '#FF0000' });
  assert.deepEqual(color.rgb, { r: 255, g: 0, b: 0 });
  assert.deepEqual(color.hsl, { h: 0, s: 100, l: 50 });
  assert.equal(color.analogous.length, 2);
  assert.equal(color.triadic.length, 2);
  assert.match(color.complementary, /^#[0-9a-f]{6}$/i);
  assert.equal(typeof color.oklch, 'string');
});

test('detects a target app without modifying its files', async () => {
  const project = await mkdtemp(join(tmpdir(), 'material-theme-target-'));
  try {
    const pkg = JSON.stringify({ dependencies: { next: '15.0.0' } });
    await writeFile(join(project, 'package.json'), pkg);
    await writeFile(join(project, 'components.json'), '{}');
    const detected = result('detect_framework', { project_path: project });
    assert.equal(detected.framework, 'shadcn/ui');
    assert.equal(detected.recommended_format, 'shadcn');
    assert.deepEqual((await readdir(project)).sort(), ['components.json', 'package.json']);
    assert.equal(await readFile(join(project, 'package.json'), 'utf8'), pkg);
    assert.equal(await readFile(join(project, 'components.json'), 'utf8'), '{}');
  } finally {
    await rm(project, { recursive: true, force: true });
  }
});

test('rejects invalid requests without success output', async t => {
  const cases = [
    ['invalid color', 'generate_theme', { color: 'purple' }],
    ['invalid dark color', 'generate_theme', { color: '#6750A4', dark_color: '#123' }],
    ['invalid harmony', 'generate_theme', { color: '#6750A4', harmony_mode: 'random' }],
    ['unsupported format', 'export_theme', { color: '#6750A4', format: 'unknown' }],
    ['missing project path', 'detect_framework', {}],
    ['unknown tool', '__proto__', {}],
  ];
  for (const [name, tool, args] of cases) {
    await t.test(name, () => {
      const response = request(tool, args);
      assert.equal(response.status, 1);
      assert.equal(response.stdout, '');
      assert.ok(response.stderr.length > 0);
    });
  }
  const response = spawnSync(process.execPath, [runner], { input: '{', encoding: 'utf8', timeout: 15000 });
  assert.equal(response.status, 1);
  assert.equal(response.stdout, '');
  assert.ok(response.stderr.length > 0);
});

test('bundled server exposes four tools over real stdio MCP', { timeout: 20000 }, async () => {
  const client = new Client({ name: 'material-theme-integration', version: '1.0.0' });
  const transport = new StdioClientTransport({
    command: process.execPath,
    args: [server],
    cwd: tmpdir(),
    stderr: 'pipe',
  });
  try {
    await client.connect(transport);
    const catalog = await client.listTools();
    assert.deepEqual(catalog.tools.map(tool => tool.name).sort(), ['convert_color', 'detect_framework', 'export_theme', 'generate_theme']);
    const generated = await client.callTool({ name: 'generate_theme', arguments: { color: '#6750A4' } });
    assert.notEqual(generated.isError, true);
    const theme = JSON.parse(generated.content.find(item => item.type === 'text').text);
    assert.ok(theme.schemes.light.primary.color);
    assert.ok(theme.schemes.dark.primary.color);
    const exported = await client.callTool({ name: 'export_theme', arguments: { color: '#6750A4', format: 'css' } });
    assert.notEqual(exported.isError, true);
    assert.match(exported.content.find(item => item.type === 'text').text, /--primary:/);
    const invalid = await client.callTool({ name: 'generate_theme', arguments: { color: 'invalid' } });
    assert.equal(invalid.isError, true);
  } finally {
    await client.close();
    await transport.close();
  }
});
