#!/usr/bin/env node
// Local checkpoint consistency check. It does not run code or certify equivalence.
import { createHash } from 'node:crypto';
import { createReadStream } from 'node:fs';
import { readFile, readdir, lstat, realpath } from 'node:fs/promises';
import { resolve, relative, isAbsolute, sep } from 'node:path';
import { pathToFileURL } from 'node:url';

const digest = text => createHash('sha256').update(text).digest('hex');
const hashPattern = /^[a-f0-9]{64}$/;
const text = v => typeof v === 'string' && v.trim().length > 0;
const list = v => Array.isArray(v);
function requireValue(ok, message) { if (!ok) throw new Error(message); }
function object(value, keys, label) {
  requireValue(value && typeof value === 'object' && !list(value), `${label}: expected object`);
  for (const key of Object.keys(value)) requireValue(keys.includes(key), `${label}: unknown field ${key}`);
}
export async function fileHash(path) {
  const before = await lstat(path);
  requireValue(before.isFile() && !before.isSymbolicLink(), `Not a regular file: ${path}`);
  const h = createHash('sha256');
  for await (const chunk of createReadStream(path)) h.update(chunk);
  const after = await lstat(path);
  requireValue(before.size === after.size && before.mtimeMs === after.mtimeMs && before.ino === after.ino, `File changed while hashing: ${path}`);
  return h.digest('hex');
}
// Hash explicitly selected input trees, including newly added/deleted files.
export async function candidateSnapshot(candidate) {
  object(candidate, ['root','include','exclude','snapshot'], 'candidate');
  requireValue(isAbsolute(candidate.root ?? ''), 'candidate.root must be absolute');
  requireValue(list(candidate.include) && candidate.include.length > 0 && candidate.include.every(text), 'candidate.include must select files/directories');
  requireValue(list(candidate.exclude) && candidate.exclude.every(text), 'candidate.exclude must be an array');
  const root = await realpath(resolve(candidate.root));
  const inside = value => {
    requireValue(!isAbsolute(value), 'Candidate input paths must be relative');
    const p = resolve(root, value), rel = relative(root,p);
    requireValue(rel !== '..' && !rel.startsWith(`..${sep}`), 'Candidate input escapes root');
    return rel.split(sep).join('/');
  };
  const excluded = candidate.exclude.map(inside);
  requireValue(!excluded.includes(''), 'Cannot exclude the entire candidate root');
  const files = new Map();
  let visited = 0;
  async function walk(rel) {
    if (excluded.some(x=>rel === x || rel.startsWith(x+'/'))) return;
    requireValue(++visited <= 100000, 'Snapshot traversal exceeds 100000 entries; narrow include/exclude');
    const path = resolve(root,rel), info = await lstat(path);
    requireValue(!info.isSymbolicLink() && await realpath(path) === path, `Select real inputs instead of symlinks: ${rel}`);
    if (info.isDirectory()) {
      for (const name of (await readdir(path)).sort()) await walk(rel ? `${rel}/${name}` : name);
    } else {
      requireValue(info.isFile(), `Unsupported candidate input: ${rel}`);
      files.set(rel,{path:rel,sha256:await fileHash(path),mode:info.mode & 0o777});
    }
  }
  for (const path of candidate.include.map(inside)) await walk(path);
  requireValue(files.size > 0, 'Candidate snapshot contains no files');
  const entries = [...files.values()].sort((a,b)=>a.path < b.path ? -1 : a.path > b.path ? 1 : 0);
  return {root:candidate.root,resolved_root:root,digest:digest(JSON.stringify(entries)),files:entries};
}
export function comparisonContext(state, example) {
  return digest(JSON.stringify({
    goal:state.goal, scope:state.scope, non_goals:state.non_goals,
    original:{kind:state.original.kind,identity:state.original.identity},
    candidate_inputs:{root:state.candidate.root,include:state.candidate.include,exclude:state.candidate.exclude},
    obligations:state.obligations.filter(o=>o.case_ids.includes(example.id)),
    case:{id:example.id,scenario:example.scenario},
  }));
}
function validateState(s) {
  object(s,['version','goal','scope','non_goals','original','candidate','obligations','cases','unknowns','blockers','cleanup','iterations','next_action'],'state');
  requireValue(s.version === 1 && text(s.goal), 'version=1 and goal required');
  for (const key of ['scope','non_goals']) requireValue(list(s[key]) && s[key].every(text), `${key} must be a string array`);
  requireValue(s.scope.length > 0, 'A finite scope is required');
  object(s.original,['kind','identity','observation'],'original');
  requireValue(['artifact','observed-service'].includes(s.original.kind) && text(s.original.identity),'Original identity and kind required');
  for (const key of ['obligations','cases','unknowns','blockers','iterations']) requireValue(list(s[key]),`${key} must be an array`);
  for (const key of ['obligations','cases','unknowns','blockers']) {
    const seen=new Set();
    for (const item of s[key]) { requireValue(text(item?.id) && !seen.has(item.id), `${key}: duplicate or missing id`); seen.add(item.id); }
  }
  for (const o of s.obligations) {
    object(o,['id','description','required','case_ids'],'obligation');
    requireValue(text(o.description) && typeof o.required==='boolean' && list(o.case_ids) && o.case_ids.every(text),'Malformed obligation');
    requireValue(new Set(o.case_ids).size===o.case_ids.length,'Duplicate case binding');
  }
  for (const c of s.cases) {
    object(c,['id','scenario','status','candidate_snapshot','original_result','candidate_result','comparison'],'case');
    requireValue(text(c.scenario) && ['pending','pass','fail','unknown','blocked'].includes(c.status),'Malformed case');
  }
  for (const u of s.unknowns) {
    object(u,['id','question','required','status','resolution'],'unknown');
    requireValue(text(u.question) && typeof u.required==='boolean' && ['open','resolved','blocked','out-of-scope'].includes(u.status),'Malformed unknown');
  }
  for (const b of s.blockers) {
    object(b,['id','reason','required','resolved','resolution'],'blocker');
    requireValue(text(b.reason) && typeof b.required==='boolean' && typeof b.resolved==='boolean','Malformed blocker');
  }
  object(s.cleanup,['status','reason','evidence'],'cleanup');
  requireValue(['pending','done','not-needed','failed'].includes(s.cleanup.status) && text(s.cleanup.reason),'Malformed cleanup');
  for (const i of s.iterations) {
    object(i,['number','question','action','finding','next_action'],'iteration');
    requireValue(Number.isInteger(i.number) && i.number>0 && [i.question,i.action,i.finding,i.next_action].every(text),'Malformed iteration');
  }
  requireValue(text(s.next_action),'next_action is required for resumption');
}
export async function checkState(s, stateDirectory) {
  validateState(s);
  const gaps=[], actions=[];
  const gap = (code, detail, next) => { gaps.push({code,detail}); if(next) actions.push(next); };
  async function proof(ref, label) {
    try {
      object(ref,['path','sha256'],label);
      requireValue(text(ref.path) && hashPattern.test(ref.sha256 ?? ''),'A file path and SHA-256 are required');
      const path=resolve(stateDirectory,ref.path);
      requireValue(await fileHash(path)===ref.sha256, 'Evidence file digest changed');
      return {path,sha256:ref.sha256};
    } catch(e) { gap('evidence_unverified',`${label}: ${e.message}`,`Recover or recapture ${label}`); return null; }
  }
  const original=await proof(s.original.observation,'original observation');
  let current;
  try { current=await candidateSnapshot(s.candidate); }
  catch(e) { gap('candidate_unavailable',e.message,'Build or identify the actual candidate inputs'); }
  if (current && s.candidate.snapshot!==current.digest) gap('candidate_changed','Recorded candidate snapshot does not match current inputs','Record the new candidate snapshot and rerun affected comparisons');
  const required=s.obligations.filter(o=>o.required), cases=new Map(s.cases.map(c=>[c.id,c]));
  if (!required.length) gap('no_required_obligations','No required behavior has been declared','Define finite required behaviors and discriminating cases');
  const requiredCases=new Set();
  for (const o of s.obligations) {
    if(o.required && !o.case_ids.length) gap('missing_cases',o.id,`Add original/candidate scenarios for ${o.id}`);
    for (const id of o.case_ids) {
      requireValue(cases.has(id),`Unknown case binding: ${id}`);
      if(o.required) requiredCases.add(id);
    }
  }
  for (const id of requiredCases) {
    const c=cases.get(id);
    if(c.status!=='pass') { gap(`case_${c.status}`,id, c.status==='fail' ? `Localize and repair the mismatch in ${id}` : `Investigate or compare ${id}`); continue; }
    if(!current || c.candidate_snapshot!==current.digest) gap('stale_case',id,`Rerun ${id} against the current candidate`);
    const left=await proof(c.original_result,`${id} original result`);
    const right=await proof(c.candidate_result,`${id} candidate result`);
    const comparison=await proof(c.comparison,`${id} comparison`);
    if(left && right && left.path===right.path) gap('same_observation',id,'Keep separate observations of original and candidate');
    if(comparison) {
      try {
        const r=JSON.parse(await readFile(comparison.path,'utf8'));
        object(r,['version','case_id','status','candidate_snapshot','original_observation_sha256','original_result_sha256','candidate_result_sha256','case_context_sha256','method'],'comparison receipt');
        requireValue(r.version===1 && r.case_id===id && r.status==='pass' && text(r.method),'Comparison receipt does not establish this passing case');
        requireValue(r.case_context_sha256===comparisonContext(s,c), 'Comparison scenario or declared scope changed');
        requireValue(r.candidate_snapshot===c.candidate_snapshot && original && r.original_observation_sha256===original.sha256 && left && r.original_result_sha256===left.sha256 && right && r.candidate_result_sha256===right.sha256,'Comparison is bound to different inputs');
      } catch(e) { gap('comparison_unverified',`${id}: ${e.message}`,`Recompare ${id} using its actual observations`); }
    }
  }
  for(const u of s.unknowns.filter(u=>u.required)) {
    if(u.status!=='resolved') gap('required_unknown',u.id,`Resolve ${u.id} with evidence or obtain an explicit scope decision`);
    else await proof(u.resolution,`${u.id} resolution`);
  }
  for(const b of s.blockers.filter(b=>b.required)) {
    if(!b.resolved) gap('required_blocker',`${b.id}: ${b.reason}`,`Resolve blocker ${b.id}; continue independent work meanwhile`);
    else await proof(b.resolution,`${b.id} resolution`);
  }
  if(s.cleanup.status==='done') await proof(s.cleanup.evidence,'cleanup');
  else if(s.cleanup.status!=='not-needed') gap('cleanup_pending',s.cleanup.reason,'Finish owned-resource cleanup or report it unverified');
  return {status:gaps.length?'incomplete':'complete',scope:s.scope,candidate_snapshot:current?.digest ?? null,case_contexts:Object.fromEntries(s.cases.map(c=>[c.id,comparisonContext(s,c)])),required_obligations:required.length,required_cases:requiredCases.size,gaps,next_actions:[...new Set(actions)],checkpoint_next_action:s.next_action,qualification:'Local record integrity and declared-scope completion check; not independent verification of behavioral equivalence, live freshness, or input-manifest coverage.'};
}
async function main() {
  const [command,path,...extra]=process.argv.slice(2);
  if(command==='--help' || !command) {
    console.log('Usage: node reconstruction.mjs snapshot|check /absolute/reconstruction.json\nsnapshot prints the current candidate input manifest; check validates proof bindings and required-case completion. Neither command executes candidate code or modifies state.\nExit: 0 complete/snapshot, 1 incomplete, 2 invalid state.'); return;
  }
  requireValue(['snapshot','check'].includes(command) && path && !extra.length,'Expected snapshot|check and a state JSON path');
  const s=JSON.parse(await readFile(path,'utf8'));
  validateState(s);
  const result=command==='snapshot' ? {...await candidateSnapshot(s.candidate),case_contexts:Object.fromEntries(s.cases.map(c=>[c.id,comparisonContext(s,c)]))} : await checkState(s,resolve(path,'..'));
  console.log(JSON.stringify(result,null,2));
  if(result.status==='incomplete') process.exitCode=1;
}
if(process.argv[1] && import.meta.url===pathToFileURL(resolve(process.argv[1])).href) {
  main().catch(e=>{ console.error(JSON.stringify({status:'invalid',error:e.message}));process.exitCode=2; });
}
