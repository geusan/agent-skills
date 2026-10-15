#!/usr/bin/env node
// Exact CLI passthrough: argument arrays and inherited streams, never a shell.
import { spawn } from 'node:child_process';
import { checkNode, reaEntry } from './runtime.mjs';
checkNode();
const child = spawn(process.execPath, [reaEntry(), ...process.argv.slice(2)], {stdio:'inherit'});
for (const signal of ['SIGINT','SIGTERM']) process.on(signal, () => { if (child.exitCode === null && child.signalCode === null) child.kill(signal); });
child.on('error', error => { console.error(error.message); process.exitCode=1; });
child.on('exit', (code, signal) => { process.exitCode=code ?? (signal === 'SIGINT' ? 130 : 1); });
