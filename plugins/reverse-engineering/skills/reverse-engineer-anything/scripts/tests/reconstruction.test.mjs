import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, readFile, rm, symlink } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { spawnSync } from 'node:child_process';
import { candidateSnapshot, checkState, fileHash, comparisonContext } from '../reconstruction.mjs';
async function fixture(t) {
  const root=await mkdtemp(join(tmpdir(),'reconstruction-loop-'));t.after(()=>rm(root,{recursive:true,force:true}));
  const app=join(root,'app');await mkdir(app);
  await writeFile(join(root,'original.mjs'),'console.log(JSON.stringify(Number(process.argv[2])*2));\n');
  await writeFile(join(app,'main.mjs'),'console.log(JSON.stringify(Number(process.argv[2])*3));\n');
  const ref=async path=>({path,sha256:await fileHash(path)});
  const s={version:1,goal:'Reproduce doubling for the selected inputs',scope:['Double the numeric input'],non_goals:['Other arithmetic'],original:{kind:'artifact',identity:'owned doubling fixture',observation:await ref(join(root,'original.mjs'))},candidate:{root:app,include:['.'],exclude:[],snapshot:null},obligations:[{id:'double',description:'Return twice the input',required:true,case_ids:['positive','zero']}],cases:['positive','zero'].map(id=>({id,scenario:`input ${id==='positive'?3:0}`,status:'pending',candidate_snapshot:null,original_result:null,candidate_result:null,comparison:null})),unknowns:[],blockers:[],cleanup:{status:'not-needed',reason:'Synchronous owned child processes have exited; no persistent resources.',evidence:null},iterations:[],next_action:'Run original/candidate comparisons'};
  let n=0;
  async function compare() {
    const snapshot=await candidateSnapshot(s.candidate);s.candidate.snapshot=snapshot.digest;
    for(const c of s.cases){
      const input=c.id==='positive'?'3':'0';
      const a=spawnSync(process.execPath,[join(root,'original.mjs'),input],{encoding:'utf8'});
      const b=spawnSync(process.execPath,[join(app,'main.mjs'),input],{encoding:'utf8'});
      assert.equal(a.status,0);assert.equal(b.status,0);
      const left=join(root,`${++n}-original.json`),right=join(root,`${n}-candidate.json`),receipt=join(root,`${n}-comparison.json`);
      await writeFile(left,a.stdout);await writeFile(right,b.stdout);
      c.status=a.stdout===b.stdout?'pass':'fail';c.candidate_snapshot=snapshot.digest;
      c.original_result=await ref(left);c.candidate_result=await ref(right);
      await writeFile(receipt,JSON.stringify({version:1,case_id:c.id,status:c.status,candidate_snapshot:snapshot.digest,original_observation_sha256:s.original.observation.sha256,original_result_sha256:c.original_result.sha256,candidate_result_sha256:c.candidate_result.sha256,case_context_sha256:comparisonContext(s,c),method:'Executed both owned Node programs with the same argument; exact stdout comparison.'}));
      c.comparison=await ref(receipt);
    }
  }
  async function fix(){await writeFile(join(app,'main.mjs'),'console.log(JSON.stringify(Number(process.argv[2])*2));\n');}
  return {root,app,s,compare,fix,ref};
}
test('real iteration: failure -> code repair -> stale evidence -> recompare -> scoped completion',async t=>{
 const f=await fixture(t);await f.compare();let r=await checkState(f.s,f.root);
 assert.equal(r.status,'incomplete');assert.ok(r.gaps.some(g=>g.code==='case_fail'));
 await f.fix();r=await checkState(f.s,f.root);assert.ok(r.gaps.some(g=>g.code==='candidate_changed'));
 await f.compare();r=await checkState(f.s,f.root);assert.equal(r.status,'complete');assert.equal(r.required_cases,2);
});
test('new implementation file invalidates previous passing comparisons',async t=>{
 const f=await fixture(t);await f.fix();await f.compare();await writeFile(join(f.app,'new-module.mjs'),'export const value=1;');
 const r=await checkState(f.s,f.root);assert.equal(r.status,'incomplete');assert.ok(r.gaps.some(g=>g.code==='stale_case'));
});
test('changing a comparison or its input cannot retain pass',async t=>{
 const f=await fixture(t);await f.fix();await f.compare();await writeFile(f.s.cases[0].candidate_result.path,'999\n');
 const r=await checkState(f.s,f.root);assert.equal(r.status,'incomplete');assert.ok(r.gaps.some(g=>g.code==='evidence_unverified'));
});
test('rehashed comparison for a different original is rejected',async t=>{
 const f=await fixture(t);await f.fix();await f.compare();const c=f.s.cases[0];
 const receipt=JSON.parse(await readFile(c.comparison.path,'utf8'));receipt.original_observation_sha256='0'.repeat(64);
 await writeFile(c.comparison.path,JSON.stringify(receipt));c.comparison=await f.ref(c.comparison.path);
 assert.ok((await checkState(f.s,f.root)).gaps.some(g=>g.code==='comparison_unverified'));
});
test('required unknowns, blocked cases, and failed cleanup prevent completion',async t=>{
 const f=await fixture(t);await f.fix();await f.compare();
 f.s.unknowns=[{id:'overflow',question:'How is overflow handled?',required:true,status:'out-of-scope',resolution:null}];
 f.s.cases[0].status='blocked';f.s.cleanup={status:'failed',reason:'Worker release unverified',evidence:null};
 const r=await checkState(f.s,f.root);assert.equal(r.status,'incomplete');
 for(const code of ['required_unknown','case_blocked','cleanup_pending'])assert.ok(r.gaps.some(g=>g.code===code));
});
test('empty obligation set and missing original observation cannot pass',async t=>{
 const f=await fixture(t);f.s.obligations=[];f.s.original.observation=null;
 const r=await checkState(f.s,f.root);assert.equal(r.status,'incomplete');assert.ok(r.gaps.some(g=>g.code==='no_required_obligations'));
});
test('duplicate IDs and dangling case bindings are malformed rather than absent',async t=>{
 const f=await fixture(t);f.s.cases.push({...f.s.cases[0]});await assert.rejects(checkState(f.s,f.root),/duplicate/);
 f.s.cases.pop();f.s.obligations[0].case_ids=['not-present'];await assert.rejects(checkState(f.s,f.root),/Unknown case binding/);
});
test('snapshot excludes explicit generated evidence but refuses symlink inputs',async t=>{
 const f=await fixture(t);await mkdir(join(f.app,'results'));await writeFile(join(f.app,'results/a'),'one');
 f.s.candidate.exclude=['results'];const a=await candidateSnapshot(f.s.candidate);
 await writeFile(join(f.app,'results/a'),'two');assert.equal((await candidateSnapshot(f.s.candidate)).digest,a.digest);
 await symlink(join(f.root,'original.mjs'),join(f.app,'external.mjs'));await assert.rejects(candidateSnapshot(f.s.candidate),/symlink/i);
});

test('changing a scenario or scope invalidates an old passing receipt',async t=>{
 const f=await fixture(t);await f.fix();await f.compare();const originalScenario=f.s.cases[0].scenario;f.s.cases[0].scenario='a different input';
 assert.ok((await checkState(f.s,f.root)).gaps.some(g=>g.code==='comparison_unverified'));
 f.s.cases[0].scenario=originalScenario;f.s.scope.push('New error behavior');
 assert.ok((await checkState(f.s,f.root)).gaps.some(g=>g.code==='comparison_unverified'));
});
