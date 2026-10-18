import {createHmac,timingSafeEqual} from 'node:crypto';
export const VERSION='1.0.0';
export const controls={
 infrastructure:['deployment-isolation','secrets','dependency-monitoring','headers','incident-owner'],
 public_form:['input-validation','abuse-limits','safe-errors','outbound-destination-policy'],
 accounts:['verified-identity','recovery','session-revocation','csrf','tenant-isolation'],
 privileged:['admin-mfa','fresh-auth','admin-idle-15m','admin-absolute-8h','server-authorization','append-only-audit','privilege-revocation'],
 financial:['transactional-authorization','idempotency','financial-limits','independent-review'],
};
export function requirements(capabilities){
 if(!Array.isArray(capabilities)||capabilities.some(c=>!Object.hasOwn(controls,c)))throw Error('Unknown capability');
 return [...new Set(['infrastructure',...capabilities].flatMap(c=>controls[c]))];
}
export function classify(observation){
 const c=['infrastructure'];
 if(observation.publicForms)c.push('public_form');if(observation.accounts)c.push('accounts');
 if(observation.administration)c.push('privileged');if(observation.financial)c.push('financial');
 return {capabilities:c,risk:observation.financial?'critical':observation.administration?'high':observation.accounts?'high':observation.publicForms?'moderate':'low',required:requirements(c)};
}
// This function accepts only server-verified identity and server-loaded grants.
// It does not verify tokens, perform I/O or accept browser claims as trusted.
export function authorize({identity,grant,session,project,tenant,action,now,privileged=true}){
 if(!identity||identity.verified!==true||!Number.isSafeInteger(now))return false;
 if(!grant||grant.subject!==identity.subject||grant.issuer!==identity.issuer||grant.project!==project||grant.tenant!==tenant||grant.revoked||!Number.isSafeInteger(grant.expiresAt)||grant.expiresAt<=now)return false;
 if(!Array.isArray(grant.actions)||!grant.actions.includes(action)||action==='*')return false;
 if(!session||session.subject!==identity.subject||session.issuer!==identity.issuer||session.project!==project||session.tenant!==tenant||session.revoked)return false;
 for(const k of ['createdAt','lastSeen','expiresAt'])if(!Number.isSafeInteger(session[k]))return false;
 if(session.createdAt>now||session.lastSeen>now||session.lastSeen<session.createdAt||session.expiresAt<=now||now-session.createdAt>=28800||now-session.lastSeen>=900)return false;
 if(privileged&&(!Number.isSafeInteger(session.verifiedAt)||session.verifiedAt>now||now-session.verifiedAt>=300||session.mfa!=='webauthn'))return false;
 return true;
}
export function onboarding(project){
 if(!project||typeof project.id!=='string'||!project.id||typeof project.scope!=='string'||!project.scope)throw Error('Scoped project required');
 return {id:project.id,scope:project.scope,state:'discovered',privileges:[],productionApproved:false,stagingApproved:false,identityLinkApproved:false};
}
const eventFields=['id','actor','project','tenant','platform','customer','action','outcome','reason','beforeRef','afterRef','timestamp'];
export function auditEnvelope(event){
 const out={};for(const key of eventFields)if(event[key]!==undefined){if(typeof event[key]!=='string'||event[key].length>500)throw Error('Invalid audit metadata');out[key]=event[key];}
 for(const key of ['id','actor','project','action','outcome','timestamp'])if(!out[key])throw Error('Incomplete audit event');
 return out;
}
export function verifyWebhook(raw,signature,secret,provider){
 if(!Buffer.isBuffer(raw)||raw.length>1048576||typeof secret!=='string'||secret.length<32||typeof signature!=='string')return false;
 const algorithm=provider==='vercel'?'sha1':provider==='github'?'sha256':null;if(!algorithm)return false;
 const supplied=provider==='github'?signature.replace(/^sha256=/,''):signature;
 const hex=createHmac(algorithm,secret).update(raw).digest('hex');
 return /^[a-f0-9]+$/.test(supplied)&&supplied.length===hex.length&&timingSafeEqual(Buffer.from(supplied),Buffer.from(hex));
}
// Replay storage must atomically claim the authenticated event ID. A valid
// signature alone never authorizes scanning, fetching URLs or adding privileges.
export async function acceptDiscovery({raw,signature,secret,provider,scope,claim}){
 if(!verifyWebhook(raw,signature,secret,provider))throw Error('Invalid webhook');
 const e=JSON.parse(raw.toString('utf8'));
 if(!e||typeof e.id!=='string'||e.id.length>200||e.scope!==scope||e.type!=='project.discovered'||typeof e.projectId!=='string')throw Error('Invalid scoped normalized event');
 if(!await claim(provider+':'+scope+':'+e.id))throw Error('Replay');
 return onboarding({id:e.projectId,scope});
}
