import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, readFile, readdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';
import { createInterface } from 'node:readline';
const scripts=dirname(dirname(fileURLToPath(import.meta.url)));
const read=async p=>JSON.parse(await readFile(p,'utf8'));
async function workspace(t) { const p=await mkdtemp(join(tmpdir(),'rea-skill-test-')); t.after(()=>rm(p,{recursive:true,force:true})); return p; }
function start(args, env={}) {
  const child=spawn(process.execPath,[join(scripts,'session.mjs'),...args],{stdio:['pipe','pipe','pipe'],env:{...process.env,...env}});
  let stderr=''; child.stderr.on('data',b=>{stderr+=b.toString();});
  const queue=[],waiters=[];
  const lines=createInterface({input:child.stdout});
  lines.on('line',line=>{const r=JSON.parse(line); const w=waiters.shift(); if(w)w(r); else queue.push(r);});
  const done=new Promise(resolve=>child.once('close',code=>resolve({code,stderr})));
  return {child,done,send:c=>child.stdin.write(JSON.stringify(c)+'\n'),next:()=>queue.length?Promise.resolve(queue.shift()):new Promise(resolve=>waiters.push(resolve))};
}
async function batch(root, commands, config, timeout) {
  const plan=join(root,'plan.jsonl'); await writeFile(plan,commands.map(c=>JSON.stringify(c)).join('\n'));
  const args=['--output',join(root,'out'),'--batch',plan];
  if(config)args.push('--config',config);
  if(timeout)args.push('--timeout-ms',String(timeout));
  const run=start(args); const result=await run.done;
  return {...result,index:await read(join(root,'out/index.json'))};
}
test('real REA: discovery includes session-only tools and six prompts', {timeout:30000}, async t=>{
  const root=await workspace(t);
  const r=await batch(root,[{op:'tools'},{op:'schema',name:'record_unknown'},{op:'prompts'}]);
  assert.equal(r.code,0,r.stderr);
  const catalog=await read(r.index.records.find(x=>x.names?.includes('open_binary')).file);
  for(const name of ['open_binary','record_unknown','verify_reconstruction','analyze_javascript_application']) assert.ok(catalog.tools.some(t=>t.name===name));
  assert.equal((await read(r.index.records.find(x=>x.tool==='record_unknown').file)).name,'record_unknown');
  const prompts=await read(r.index.records.find(x=>x.names?.includes('investigate_feature')).file);
  assert.equal(prompts.prompts.length,6);
  assert.ok(Array.isArray((await read(join(root,'out/evidence-bundle.json'))).records));
});
test('real REA: adaptive calls retain Evidence, then export canonical bundle; no ambient environment persistence', {timeout:60000},async t=>{
  const root=await workspace(t), app=join(root,'app'); await mkdir(app);
  await writeFile(join(app,'package.json'),JSON.stringify({name:'fixture',main:'main.js'}));
  await writeFile(join(app,'main.js'),'export function add(a,b) { return a+b; }\n');
  const run=start(['--output',join(root,'out')],{REA_SKILL_SECRET_CANARY:'must-not-persist-88723'});
  t.after(()=>{if(run.child.exitCode===null)run.child.kill('SIGTERM');});
  assert.equal((await run.next()).status,'ready');
  run.send({op:'call',name:'analyze_javascript_application',arguments:{input_path:app,detail:'summary'}});
  const receipt=await run.next(); assert.equal(receipt.isError,false);
  const observation=await read(receipt.file); const id=observation.structuredContent.normalized_result.parent_evidence_id;
  assert.match(id,/^ev_[a-f0-9]{64}$/);
  run.send({op:'call',name:'inspect_analysis_view',arguments:{source:{kind:'retained-evidence',evidence_id:id},view:{kind:'summary'}}});
  const view=await run.next(); assert.equal(view.isError,false);
  run.send({op:'close'});
  const result=await run.done; assert.equal(result.code,0,result.stderr);
  const bundle=await read(join(root,'out/evidence-bundle.json')); assert.ok(bundle.records.some(r=>r.evidence_id===id));
  for(const f of await readdir(join(root,'out'))) assert.ok(!(await readFile(join(root,'out',f),'utf8')).includes('must-not-persist-88723'));
});
test('batch stops after a failed tool, preserves error and cleanup receipts', {timeout:30000},async t=>{
  const root=await workspace(t);
  const r=await batch(root,[{op:'call',name:'not_a_real_tool',arguments:{}},{op:'prompts'}]);
  assert.notEqual(r.code,0);
  assert.equal(r.index.status,'failed');
  assert.ok(!r.index.records.some(x=>x.file.endsWith('-prompts.json')));
  assert.ok(r.index.records.some(x=>x.tool==='close_binary'));
});
test('fresh output required; existing caller files cannot be overwritten', {timeout:10000},async t=>{
  const root=await workspace(t), out=join(root,'out'); await mkdir(out); await writeFile(join(out,'keep'),'original');
  const run=start(['--output',out]); run.child.stdin.end();
  assert.notEqual((await run.done).code,0); assert.equal(await readFile(join(out,'keep'),'utf8'),'original');
});
// Protocol/lifecycle fixture only: it establishes no native-provider behavior.
async function fakeConfig(root,failCleanup=false) {
  const server=join(root,'protocol-fixture.mjs');
  await writeFile(server,`import {createInterface} from 'node:readline'; import{writeFile}from'node:fs/promises';
let cancelled=false; const send=(id,result)=>console.log(JSON.stringify({jsonrpc:'2.0',id,result}));
for await(const line of createInterface({input:process.stdin})){const m=JSON.parse(line);
if(m.method==='notifications/cancelled'){cancelled=true;continue;}
if(m.id===undefined)continue;
if(m.method==='initialize')send(m.id,{protocolVersion:m.params.protocolVersion,capabilities:{tools:{}},serverInfo:{name:'fixture',version:'1'}});
else if(m.method==='tools/list')send(m.id,{tools:['slow','export_evidence_bundle','close_binary'].map(name=>({name,inputSchema:{type:'object'}}))});
else if(m.method==='tools/call'){
const n=m.params.name;
if(n==='slow')continue;
if(n==='export_evidence_bundle')await writeFile(m.params.arguments.path,JSON.stringify({cancelled,records:[]}));
send(m.id,{content:[{type:'text',text:'{}'}],isError:n==='close_binary'&&${failCleanup}});
}else send(m.id,{});
}`);
  const config=join(root,'launch.json'); await writeFile(config,JSON.stringify({command:process.execPath,args:[server],serverOutputDir:join(root,'out')})); return config;
}
test('deadline cancellation is delivered and export/cleanup still attempted', {timeout:15000},async t=>{
  const root=await workspace(t); const config=await fakeConfig(root);
  const r=await batch(root,[{op:'call',name:'slow',arguments:{}}],config,1000);
  assert.notEqual(r.code,0); assert.equal((await read(join(root,'out/evidence-bundle.json'))).cancelled,true);
  assert.ok(r.index.records.some(x=>x.tool==='close_binary'));
});
test('cleanup failure cannot be reported as completion', {timeout:15000},async t=>{
  const root=await workspace(t); const config=await fakeConfig(root,true);
  const r=await batch(root,[{op:'close'}],config);
  assert.equal(r.code,1); assert.equal(r.index.status,'failed');
  assert.equal(r.index.records.find(x=>x.tool==='close_binary').isError,true);
});
test('recording failure still attempts native cleanup and reports failure', {timeout:30000},async t=>{
  const root=await workspace(t); const run=start(['--output',join(root,'out')]);
  t.after(()=>{if(run.child.exitCode===null)run.child.kill('SIGTERM');});
  assert.equal((await run.next()).status,'ready');
  const {rename}=await import('node:fs/promises');
  await rename(join(root,'out'),join(root,'retained'));
  run.send({op:'close'});
  const receipts=[]; let end;
  do { end=await run.next(); receipts.push(end); } while(!end.index);
  assert.equal((await run.done).code,1);
  assert.ok(receipts.some(r=>r.tool==='close_binary'));
  assert.ok(receipts.some(r=>r.status==='recording_failed'));
});
test('CLI passes literal special-character paths to real static analysis', {timeout:30000},async t=>{
  const root=await workspace(t), app=join(root,'app literal $(echo ignored);'); await mkdir(app);
  await writeFile(join(app,'main.js'),'export const answer=42;\n');
  const child=spawn(process.execPath,[join(scripts,'rea.mjs'),'analyze-javascript-application',app,'--json'],{stdio:['ignore','pipe','pipe']});
  let out='',err='';child.stdout.on('data',b=>out+=b);child.stderr.on('data',b=>err+=b);
  const code=await new Promise(resolve=>child.once('close',resolve));
  assert.equal(code,0,err);
  const evidence=JSON.parse(out);assert.match(evidence.evidence_id,/^ev_/);assert.equal(evidence.operation,'analyze_javascript_application');
});
test('registered cleanup runs in reverse order before export and native close', {timeout:30000},async t=>{
  const root=await workspace(t);
  const r=await batch(root,[{op:'on-close',name:'binary_session',arguments:{}},{op:'on-close',name:'get_evidence_bundle',arguments:{detail:'summary'}},{op:'close'}]);
  assert.equal(r.code,0,r.stderr);
  assert.deepEqual(r.index.records.filter(x=>x.tool).map(x=>x.tool),['get_evidence_bundle','binary_session','export_evidence_bundle','close_binary']);
});
