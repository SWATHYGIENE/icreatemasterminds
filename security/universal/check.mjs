import {readFile,readdir} from 'node:fs/promises';
import path from 'node:path';
import {classify,VERSION} from './policy.mjs';
export async function inspect(root=process.cwd()){
 const policy=JSON.parse(await readFile(path.join(root,'security/project.json'),'utf8'));
 if(policy.schemaVersion!==1||!policy.project||!policy.scope||policy.productionApproval!==false)throw Error('Invalid project registration');
 const findings=[];const evidence=[];
 const skip=new Set(['node_modules','.git','.next','work','vendor','public','assets','data','generated','.data','.vercel']);
 async function walk(dir,depth=0){if(depth>12)return;for(const e of await readdir(dir,{withFileTypes:true})){
  if(skip.has(e.name)||e.isSymbolicLink())continue;const f=path.join(dir,e.name);if(e.isDirectory()){await walk(f,depth+1);continue;}
  if(!/\.(?:[cm]?[jt]sx?|json|ya?ml)$/.test(e.name))continue;
  const rel=path.relative(root,f);if(rel.startsWith('security/')||rel.startsWith('.github/'))continue;
  const text=await readFile(f,'utf8');
  for(const [id,re,severity,reason] of [
   ['tls-verification-disabled',/rejectUnauthorized\s*:\s*false/,'high','Database TLS certificate verification disabled'],
   ['email-admin-policy',/isAdminEmail\s*\(|ADMIN_EMAILS/,'high','Review email-derived administrator authorization'],
   ['provider-error-logging',/console\.error[^\n]*(?:await r\.text|error\.stack|\berr\))/,'high','Review raw provider/error logging for secret exposure'],
   ['build-migrations',/db:migrate\s*&&/,'high','Deployment build can mutate a database; verify isolation before deployment'],
  ])if(re.test(text))findings.push({id,severity,file:rel,reason,status:'needs-review'});
  if(/(?:requireAdmin|reviewer\(|isReviewer|permissions\.can)/.test(text))evidence.push({kind:'authorization-reference',file:rel});
 }}
 await walk(root);
 return {schemaVersion:1,frameworkVersion:VERSION,project:policy.project,scope:policy.scope,classification:classify(policy.capabilities),findings,evidence,claims:{runtimeSecurityVerified:false,hostedTested:false,productionApproved:false},limitations:['Pattern review is not proof of authorization coverage or vulnerability absence','No secrets, environment values or source excerpts are emitted']};
}
if(process.argv[1]&&path.resolve(process.argv[1])===path.resolve(new URL(import.meta.url).pathname)){
 try{console.log(JSON.stringify(await inspect(),null,2));}catch{console.error('Security registration or source inspection failed.');process.exitCode=1;}
}
