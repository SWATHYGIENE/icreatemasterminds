// Run manually in an authenticated, authorized team session. Does not read env
// values, create resources, deploy code, fetch arbitrary URLs or grant access.
import {execFileSync} from 'node:child_process';
const scope=process.argv[2];if(!scope||!/^[a-z0-9-]+$/.test(scope))throw Error('Explicit authorized team slug required');
let until,seen=new Set(),out=[];
do{
 const query='/v9/projects?limit=100'+(until?'&until='+encodeURIComponent(until):'');
 const page=JSON.parse(execFileSync('vercel',['api',query,'--scope',scope],{encoding:'utf8',maxBuffer:16*1024*1024}));
 if(!Array.isArray(page.projects))throw Error('Invalid discovery response');
 for(const p of page.projects){if(seen.has(p.id))continue;seen.add(p.id);out.push({id:p.id,name:p.name,scope,framework:p.framework??null,repository:p.link?`${p.link.org}/${p.link.repo}`:null,productionBranch:p.link?.productionBranch??null,state:'discovered',privileges:[],productionApproved:false});}
 const next=page.pagination?.next;if(next&&next===until)throw Error('Non-advancing pagination');until=next;
}while(until);
console.log(JSON.stringify({schemaVersion:1,scope,observedAt:new Date().toISOString(),coverage:'authorized team only; unlinked GitHub repositories and other scopes not enumerated',projects:out},null,2));
