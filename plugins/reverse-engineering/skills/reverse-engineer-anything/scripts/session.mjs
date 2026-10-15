#!/usr/bin/env node
import { Client } from '@modelcontextprotocol/client';
import { StdioClientTransport } from '@modelcontextprotocol/client/stdio';
import { mkdir, readFile, writeFile, stat } from 'node:fs/promises';
import { createInterface } from 'node:readline';
import { join, isAbsolute } from 'node:path';
import { parseArgs } from 'node:util';
import { checkNode, launchConfig } from './runtime.mjs';

const {values} = parseArgs({options:{output:{type:'string'},config:{type:'string'},batch:{type:'string'},'timeout-ms':{type:'string',default:'300000'},'max-message-mib':{type:'string',default:'64'},help:{type:'boolean'}}});
if (values.help) {
  console.log('Usage: node session.mjs --output /absolute/new-directory [--config launch.json] [--batch commands.jsonl]\nWithout --batch, accept JSONL commands on stdin in one live REA session.\nOperations: tools, schema(name), call(name, arguments), prompts, prompt(name, arguments), resources, templates, read-resource(uri), complete(params), on-close(name, arguments), close.\nEvery response is saved in full; stdout contains small receipts. tools supports query; listing supports cursor. Schema selection uses an exact tool name.');
  process.exit(0);
}
checkNode();
if (!isAbsolute(values.output ?? '')) throw new Error('--output must be an absolute NEW directory.');
const timeout = Number(values['timeout-ms']);
const maxMessage = Number(values['max-message-mib']);
if (!Number.isSafeInteger(timeout) || timeout < 1 || timeout > 2147483647) throw new Error('Invalid timeout-ms.');
if (!Number.isSafeInteger(maxMessage) || maxMessage < 1 || maxMessage > 1024) throw new Error('max-message-mib must be 1..1024 (local transport memory bound).');
const launch = await launchConfig(values.config, values.output);
const batch = values.batch ? (await readFile(values.batch,'utf8')).split(/\r?\n/).filter(x=>x.trim()).map(x=>JSON.parse(x)) : undefined;
await mkdir(values.output, {mode:0o700}); // Fail on reuse; never overwrite an investigation.
const client = new Client({name:'rea-skill-session',version:'0.3.0'});
const transport = new StdioClientTransport({...launch, stderr:'inherit', maxBufferSize:maxMessage*1024*1024});
let sequence=0, failed=false, connected=false, stopped=false, transportClosed=false, active;
const cleanup=[], records=[];
let lines;
const emit = value => console.log(JSON.stringify(value));
const errorValue = e => ({name:e?.name ?? 'Error',message:e?.message ?? String(e)});
async function save(kind, response, extra={}) {
  const file = `${String(++sequence).padStart(4,'0')}-${kind}.json`;
  const receipt={sequence,file:join(values.output,file),...extra};
  try {
    await writeFile(join(values.output,file),JSON.stringify(response,null,2)+'\n',{flag:'wx',mode:0o600});
  } catch(e) {
    failed=true; receipt.status='recording_failed'; receipt.recording_error=errorValue(e);
  }
  records.push(receipt);
  emit(receipt);
  return response;
}
function summary(r) {
  const e=r?.structuredContent;
  return {isError:r?.isError===true, ...(e?.evidence_id ? {evidence_id:e.evidence_id,operation:e.operation} : {}), ...(e?.normalized_result?.parent_evidence_id ? {parent_evidence_id:e.normalized_result.parent_evidence_id} : {})};
}
async function tool(name,args={},closing=false) {
  const options={timeout:closing ? Math.min(timeout,30000) : timeout};
  if (!closing) { active=new AbortController(); options.signal=active.signal; }
  try {
    const result=await client.callTool({name,arguments:args},options);
    await save('tool',result,{tool:name,...summary(result)});
    if (result.isError) failed=true;
    return result;
  } finally { if (!closing) active=undefined; }
}
async function dispatch(c) {
  if (!c || typeof c!=='object' || Array.isArray(c) || typeof c.op!=='string') throw new Error('Each command needs an op.');
  const allowed={tools:['query','cursor'],schema:['name'],call:['name','arguments'],prompts:['cursor'],prompt:['name','arguments'],resources:['cursor'],templates:['cursor'],'read-resource':['uri'],complete:['params'],'on-close':['name','arguments'],close:[]};
  if (!Object.hasOwn(allowed,c.op)) throw new Error(`Unknown operation: ${c.op}`);
  for (const k of Object.keys(c)) if (k!=='op' && !allowed[c.op].includes(k)) throw new Error(`Unknown command field: ${k}`);
  if (['schema','call','prompt','on-close'].includes(c.op) && (typeof c.name!=='string' || !c.name)) throw new Error('An exact name is required.');
  if (c.arguments !== undefined && (!c.arguments || typeof c.arguments!=='object' || Array.isArray(c.arguments))) throw new Error('arguments must be an object.');
  const page=c.cursor ? {cursor:c.cursor} : undefined;
  const options={timeout};
  switch(c.op) {
    case 'close': stopped=true; return;
    case 'on-close': cleanup.push({name:c.name,args:c.arguments ?? {}}); emit({registered_cleanup:c.name}); return;
    case 'call': return tool(c.name,c.arguments);
    case 'tools': {
      const r=await client.listTools(page,options);
      const matches=r.tools.filter(t=>!c.query || `${t.name} ${t.description ?? ''}`.toLowerCase().includes(String(c.query).toLowerCase()));
      return save('tools',r,{names:matches.map(t=>t.name),nextCursor:r.nextCursor ?? null,scope:'query filters receipt only; file retains complete page'});
    }
    case 'schema': {
      let cursor; const seen=new Set();
      do {
        const r=await client.listTools(cursor ? {cursor} : undefined,options);
        const t=r.tools.find(t=>t.name===c.name);
        if (t) return save('schema',t,{tool:t.name});
        cursor=r.nextCursor;
        if (cursor && seen.has(cursor)) throw new Error('Repeated tool catalog cursor.');
        seen.add(cursor);
      } while(cursor);
      throw new Error(`Tool is not advertised: ${c.name}`);
    }
    case 'prompts': { const r=await client.listPrompts(page,options); return save('prompts',r,{names:r.prompts.map(p=>p.name),nextCursor:r.nextCursor ?? null}); }
    case 'prompt': return save('prompt',await client.getPrompt({name:c.name,arguments:c.arguments},options),{prompt:c.name});
    case 'resources': return save('resources',await client.listResources(page,options));
    case 'templates': return save('templates',await client.listResourceTemplates(page,options));
    case 'read-resource': return save('resource',await client.readResource({uri:c.uri},options));
    case 'complete': return save('completion',await client.complete(c.params,options));
  }
}
for (const signal of ['SIGINT','SIGTERM']) process.on(signal,()=>{ failed=true; stopped=true; active?.abort(); lines?.close(); });
try {
  await client.connect(transport,{timeout}); connected=true;
  await save('server',{server:client.getServerVersion(),capabilities:client.getServerCapabilities()},{status:'ready'});
  if (batch) {
    for (const command of batch) {
      if (stopped || failed) break;
      await dispatch(command);
    }
  } else {
    lines=createInterface({input:process.stdin,crlfDelay:Infinity,terminal:false});
    for await (const line of lines) {
      if (stopped) break;
      if (!line.trim()) continue;
      try { await dispatch(JSON.parse(line)); }
      catch(e) { failed=true; await save('error',errorValue(e),{status:'error'}); }
      if (stopped) break;
    }
  }
} catch(e) {
  failed=true;
  await save('error',errorValue(e),{status:'error'});
} finally {
  lines?.close();
  // Registered cleanup is explicit and LIFO; never guess provider-owned IDs.
  if (connected) {
    for (const c of cleanup.reverse()) {
      try { await tool(c.name,c.args,true); }
      catch(e) { failed=true; await save('cleanup-error',errorValue(e),{tool:c.name,status:'cleanup_unverified'}); }
    }
    try {
      const r=await tool('export_evidence_bundle',{path:join(launch.serverOutputDir,'evidence-bundle.json')},true);
      if (!r.isError) {
        // A custom server path must really map to this local output directory.
        const info=await stat(join(values.output,'evidence-bundle.json'));
        if (!info.isFile()) throw new Error('Export did not produce a regular evidence bundle.');
      }
    } catch(e) { failed=true; await save('export-error',errorValue(e),{status:'bundle_export_unverified'}); }
    try { await tool('close_binary',{},true); }
    catch(e) { failed=true; await save('cleanup-error',errorValue(e),{status:'native_cleanup_unverified'}); }
  }
  try { await client.close(); transportClosed=true; }
  catch(e) { failed=true; await save('transport-error',errorValue(e),{status:'transport_cleanup_unverified'}); }
  try {
  await writeFile(join(values.output,'index.json'),JSON.stringify({status:failed?'failed':'completed',records,transport_closed:transportClosed,provider_cleanup:'See close responses; transport exit alone does not prove release of detached or GUI resources.'},null,2)+'\n',{flag:'wx',mode:0o600});
  } catch(e) { failed=true; emit({status:'index_write_failed',error:errorValue(e)}); }
  emit({status:failed?'failed':'completed',index:join(values.output,'index.json')});
  process.exitCode=failed?1:0;
}
