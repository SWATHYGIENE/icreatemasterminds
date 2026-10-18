import assert from'node:assert/strict';import{readFile}from'node:fs/promises';
// Run on a trusted operator host WITH deployment-host egress, not this sandbox.
// Only GET checks, no application write, login, rate-flood or migration requests.
const project=JSON.parse(await readFile('security/project.json','utf8')).project;
const base=new URL(process.env.SECURITY_PREVIEW_URL||'');
if(base.protocol!=='https:'||!base.hostname.endsWith('.vercel.app')||base.pathname!=='/'||base.search||base.username||base.password)throw Error('Exact HTTPS Preview origin required');
if(base.origin!==process.env.SECURITY_EXPECTED_PREVIEW_ORIGIN)throw Error('Owner-verified expected Preview origin required');
const headers={};if(process.env.VERCEL_AUTOMATION_BYPASS_SECRET)headers['x-vercel-protection-bypass']=process.env.VERCEL_AUTOMATION_BYPASS_SECRET;
const manifest=[{path:'/',statuses:[200],kind:'public'}];
if(project==='myreputationpro')for(const path of ['/api/admin/platforms','/api/admin/customers?q=synthetic','/api/admin/audit'])manifest.push({path,statuses:[401,403],kind:'private'});
if(project==='joinswat-com')manifest.push({path:'/api/review',statuses:[401,403],kind:'private'});
if(project==='ddsconnector')manifest.push({path:'/admin',statuses:[302,303,307,401,403],kind:'private'});
if(project==='agrarianexchange')manifest.push({path:'/admin',statuses:[302,303,307,401,403],kind:'private'});
let failed=0;for(const check of manifest){try{const r=await fetch(new URL(check.path,base),{headers,redirect:'manual',signal:AbortSignal.timeout(20000)});assert.ok(check.statuses.includes(r.status));if(check.kind==='public')assert.match(r.headers.get('x-content-type-options')||'',/^nosniff$/);else if(r.status<300||r.status>=400)assert.match(r.headers.get('cache-control')||'',/no-store/);console.log(JSON.stringify({project,path:check.path,result:'pass',status:r.status}));await r.body?.cancel();}catch{failed++;console.log(JSON.stringify({project,path:check.path,result:'fail',reason:'Unexpected status/headers or protected/network unavailable; no response bodies or credentials logged'}));}}
console.log(JSON.stringify({scope:'read-only unauthenticated smoke checks only',authenticatedTests:'NOT EXECUTED',databaseIsolation:'NOT VERIFIED',failed}));if(failed)process.exitCode=1;
