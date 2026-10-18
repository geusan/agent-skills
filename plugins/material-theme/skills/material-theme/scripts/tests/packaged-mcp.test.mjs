import assert from 'node:assert/strict';
import { cp, mkdtemp, readFile, rm, writeFile, access } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, basename } from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

const sourcePlugin = fileURLToPath(new URL('../../../../', import.meta.url));

test('a relocated plugin starts both MCP configurations without npm or node_modules', { timeout: 30000 }, async t => {
  const sandbox = await mkdtemp(join(tmpdir(), 'material theme standalone '));
  const plugin = join(sandbox, 'installed plugin');
  try {
    await cp(sourcePlugin, plugin, {
      recursive: true,
      filter: path => !['node_modules', 'dist', '.git'].includes(basename(path)),
    });
    await assert.rejects(access(join(plugin, 'skills/material-theme/scripts/node_modules')));
    await assert.rejects(access(join(plugin, 'skills/material-theme/scripts/dist')));
    // Deliberately omit npm and package lookup paths from the child environment.
    const env = { PATH: '', NODE_PATH: '' };
    const target = join(sandbox, 'pubspec.yaml');
    await writeFile(target, 'name: sample\ndependencies:\n  flutter:\n    sdk: flutter\n');

    for (const [host, manifestPath, variable] of [
      ['Codex', '.codex-plugin/mcp.json', '${PLUGIN_ROOT}'],
      ['Claude Code', '.mcp.json', '${CLAUDE_PLUGIN_ROOT}'],
    ]) {
      await t.test(host, async () => {
        const config = JSON.parse(await readFile(join(plugin, manifestPath), 'utf8')).mcpServers['material-theme'];
        assert.equal(config.command, 'node');
        const args = config.args.map(argument => argument.replaceAll(variable, plugin));
        assert.ok(args.every(argument => !argument.includes('${')));
        const client = new Client({ name: 'packaged-material-theme-test', version: '1.0.0' });
        const cwd = config.cwd ? join(plugin, config.cwd) : sandbox;
        const transport = new StdioClientTransport({ command: process.execPath, args, cwd, env, stderr: 'pipe' });
        let errors = '';
        transport.stderr?.on('data', chunk => { errors += chunk.toString(); });
        try {
          await client.connect(transport);
          const catalog = await client.listTools();
          assert.equal(catalog.tools.length, 4);
          async function call(name, args) {
            const response = await client.callTool({ name, arguments: args });
            assert.notEqual(response.isError, true, JSON.stringify(response));
            return response.content.find(item => item.type === 'text').text;
          }
          const colors = JSON.parse(await call('convert_color', { color: '#FF0000' }));
          assert.deepEqual(colors.rgb, { r: 255, g: 0, b: 0 });
          const theme = JSON.parse(await call('generate_theme', { color: '#6750A4', harmony_mode: 'analogous' }));
          assert.ok(theme.schemes.light.primary.color);
          assert.ok(theme.schemes.dark.primary.color);
          const detected = JSON.parse(await call('detect_framework', { project_path: sandbox }));
          assert.equal(detected.framework, 'Flutter');
          for (const format of ['css', 'css-hsl', 'css-oklch', 'tailwind', 'shadcn', 'react-native', 'swift', 'kotlin-compose', 'flutter', 'json']) {
            assert.ok((await call('export_theme', { color: '#6750A4', format })).length > 0);
          }
          assert.equal(errors, '');
        } finally {
          await client.close();
          await transport.close();
        }
      });
    }

    const helper = spawnSync(process.execPath, [join(plugin, 'skills/material-theme/scripts/run-tool.mjs')], {
      cwd: sandbox,
      env,
      input: JSON.stringify({ tool: 'convert_color', arguments: { color: '#FF0000' } }),
      encoding: 'utf8',
      timeout: 10000,
    });
    assert.equal(helper.status, 0, helper.stderr);
    assert.deepEqual(JSON.parse(helper.stdout).rgb, { r: 255, g: 0, b: 0 });
  } finally {
    await rm(sandbox, { recursive: true, force: true });
  }
});
