#!/usr/bin/env node
import { readFileSync } from 'node:fs';

// Keep execution independent of the caller's working directory and use the
// bundled MCP tool implementations and validation without a permanent server.
const handlers = {
  generate_theme: ['generateTheme', 'generateThemeSchema'],
  export_theme: ['exportTheme', 'exportThemeSchema'],
  convert_color: ['convertColor', 'convertColorSchema'],
  detect_framework: ['detectFramework', 'detectFrameworkSchema'],
};

try {
  if (Number(process.versions.node.split('.')[0]) < 22) {
    throw new Error('Material Theme requires Node.js 22 or newer on PATH.');
  }
  const request = JSON.parse(readFileSync(0, 'utf8'));
  if (!request || typeof request !== 'object' || Array.isArray(request)) {
    throw new Error('Send one JSON object with tool and arguments on stdin.');
  }
  if (Object.keys(request).some(key => !['tool', 'arguments'].includes(key))) {
    throw new Error('Request fields must be tool and arguments.');
  }
  if (typeof request.tool !== 'string' || !Object.hasOwn(handlers, request.tool)) {
    throw new Error('Unknown tool. Choose ' + Object.keys(handlers).join(', ') + '.');
  }
  const [action, schema] = handlers[request.tool];
  const { default: module } = await import('./bundle/tools.cjs');
  const result = module[action](module[schema].parse(request.arguments));
  process.stdout.write(JSON.stringify(result, null, 2) + '\n');
} catch (error) {
  if (error.code === 'ERR_MODULE_NOT_FOUND') {
    console.error('The prebuilt runtime is missing. Reinstall the complete plugin, or run npm ci --include=dev and npm run build in this skill\'s scripts directory.');
  } else {
    console.error(error instanceof Error ? error.message : String(error));
  }
  process.exitCode = 1;
}
