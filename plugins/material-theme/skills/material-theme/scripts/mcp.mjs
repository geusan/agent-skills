#!/usr/bin/env node
// Only MCP protocol messages belong on stdout. Startup errors go to stderr.
try {
  if (Number(process.versions.node.split('.')[0]) < 22) {
    throw new Error('Material Theme requires Node.js 22 or newer on PATH.');
  }
  await import('./bundle/server.cjs');
} catch (error) {
  console.error('Material Theme MCP: ' + (error instanceof Error ? error.message : String(error)));
  process.exitCode = 1;
}
