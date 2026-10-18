import{execFileSync}from'node:child_process';import{readFile}from'node:fs/promises';
// High-confidence tracked-file check, not a replacement for GitHub secret scanning
// or a full history/entropy scanner. Never print matched values.
export function credentialKinds(text){return [
 ['private-key',/-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/],
 ['github-token',/\b(?:gh[pousr]_[A-Za-z0-9]{36,}|github_pat_[A-Za-z0-9_]{50,})\b/],
 ['aws-access-key',/\b(?:AKIA|ASIA)[A-Z0-9]{16}\b/],
 ['stripe-live-key',/\bsk_live_[A-Za-z0-9]{20,}\b/],
 ].filter(([,re])=>re.test(text)).map(([kind])=>kind);}
export async function scan(){const paths=execFileSync('git',['ls-files','-z'],{encoding:'utf8'}).split('\0').filter(Boolean),findings=[];for(const path of paths){if(/(?:package-lock\.json|pnpm-lock\.yaml|\.(?:png|jpg|webp|mp4|bin|woff2?|ico|pdf))$/.test(path))continue;const b=await readFile(path);if(b.length>2*1024*1024||b.includes(0))continue;for(const kind of credentialKinds(b.toString()))findings.push({path,kind});}return findings;}
if(process.argv[1]?.endsWith('/secret-scan.mjs')){const findings=await scan();console.log(JSON.stringify({scope:'tracked working-tree files only',findings}));if(findings.length)process.exitCode=1;}
