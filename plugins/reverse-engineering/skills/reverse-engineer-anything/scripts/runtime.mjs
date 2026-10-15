import { createRequire } from 'node:module';
import { readFile } from 'node:fs/promises';
import { dirname, join, isAbsolute } from 'node:path';
const require = createRequire(import.meta.url);
export const reaEntry = () => join(dirname(require.resolve('rea-agents/package.json')), 'scripts/rea.mjs');
export function checkNode() {
  const [major, minor] = process.versions.node.split('.').map(Number);
  if (!((major === 22 && minor >= 19) || (major === 24 && minor >= 11) || major >= 26))
    throw new Error('REA requires Node 22.19+, 24.11+, or 26+. Select an existing supported Node; this script does not upgrade it.');
}
export async function launchConfig(path, output) {
  if (!path) return {command: process.execPath, args: [reaEntry(), 'mcp'], env: process.env, serverOutputDir: output};
  const c = JSON.parse(await readFile(path, 'utf8'));
  if (!c || typeof c !== 'object' || Array.isArray(c)) throw new Error('Launch config must be an object.');
  for (const k of Object.keys(c)) if (!['command','args','env','cwd','serverOutputDir'].includes(k)) throw new Error(`Unknown launch field: ${k}`);
  if (typeof c.command !== 'string' || !c.command || !Array.isArray(c.args) || c.args.some(x=>typeof x!=='string')) throw new Error('Launch config needs command and a string args array. No shell command strings.');
  if (!isAbsolute(c.serverOutputDir ?? '')) throw new Error('Custom launch requires absolute serverOutputDir mounted to --output.');
  if (c.cwd !== undefined && !isAbsolute(c.cwd)) throw new Error('cwd must be absolute.');
  if (c.env !== undefined && (!c.env || typeof c.env !== 'object' || Array.isArray(c.env) || Object.values(c.env).some(x=>typeof x!=='string'))) throw new Error('env must contain string values.');
  return {...c, env: {...process.env, ...c.env}};
}
