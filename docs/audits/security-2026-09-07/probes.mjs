import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const root = '/Users/kevinx/Developer/Projects/OBSIDIA/Discord-Bot-Open-Source';
const require = createRequire(`${root}/backend/package.json`);
const { Job } = require('bullmq');
const { assertSafeUrl, isBlockedIPv6 } = await import(`${root}/backend/src/core/http/safeImageFetch.ts`);
const { assertActorOutranksMember } = await import(`${root}/backend/src/core/authz/guildPolicy.ts`);
const { assertAssignableRoleIdsViaGateway } = await import(`${root}/backend/src/modules/autoroles/assignable.ts`);
const { RestGateway } = await import(`${root}/backend/src/core/discord/restGateway.ts`);
const { sendTextMessage } = await import(`${root}/backend/src/modules/messages/http/controller.ts`);
const { resolvePublicUploadPath } = await import(`${root}/backend/src/lib/dataPaths.ts`);
const evidence = [];
for (const jobId of ['reminder:123', 'scheduled-message:123:2026-09-07T17:00:00.000Z', 'giveaway:123:active']) {
  try {
    Job.prototype.validateOptions.call({opts:{jobId}}, {data:'{}'});
    evidence.push({probe:'BullMQ installed validator', jobId, result:'accepted'});
  } catch(error) {
    evidence.push({probe:'BullMQ installed validator', jobId, result:error.message});
  }
}
assert.throws(() => Job.prototype.validateOptions.call({opts:{jobId:'reminder:123'}},{data:'{}'}), /Custom Id/);
const url = assertSafeUrl('https://127.0.0.1:443/image.png');
evidence.push({probe:'SSRF URL validation', hostname:url.hostname, result:'accepted private literal IPv4'});
assert.equal(isBlockedIPv6('::ffff:7f00:1'),false);
evidence.push({probe:'IPv6 mapped loopback', address:'::ffff:7f00:1', blocked:isBlockedIPv6('::ffff:7f00:1')});
let memberLookups=0;
const authority = {owner:false,administrator:true,bits:8n};
const result = await assertActorOutranksMember({getMember(){memberLookups++;throw Error('must check hierarchy');}},authority,'guild','actor','higher-target');
assert.equal(result.ok,true);
assert.equal(memberLookups,0);
evidence.push({probe:'Administrator hierarchy', result, memberLookups});
await assertAssignableRoleIdsViaGateway({isReady:()=>true,getRoleAdminContext:async()=>({roles:[{id:'role',managed:false,position:5,permissions:8n,name:'Admin'}],bot:{highestPosition:10}})},'guild',['role']);
evidence.push({probe:'Autorole validator', result:'Administrator role below bot accepted; no actor supplied'});
const calls=[];
const gateway=new RestGateway();
gateway.isReady=()=>true;
gateway.restClient=()=>({post:async(route,options)=>{calls.push({route,options});return {id:'99999999999999999',channel_id:'22222222222222222'};},get:async()=>{throw Error('must validate channel ownership');}});
await sendTextMessage(gateway,{channelId:'22222222222222222',content:'audit mock only'},'11111111111111111');
assert.equal(calls.length,1);
evidence.push({probe:'Cross-guild message authorization', result:'Direct REST POST without channel ownership lookup',calls});
const crossPath=resolvePublicUploadPath('/uploads/images/11111111111111111/../22222222222222222/example.png');
assert.match(crossPath,/images\/22222222222222222\/example.png$/);
evidence.push({probe:'Upload path guild escape',authorizedGuild:'11111111111111111',decodedFilename:'../22222222222222222/example.png',resolved:crossPath});
const expressRequire=createRequire(require.resolve('express'));
const routerRequire=createRequire(expressRequire.resolve('router'));
const {match}=routerRequire('path-to-regexp');
const matched=match('/uploads/:kind/:guildId/:filename',{decode:decodeURIComponent})('/uploads/images/11111111111111111/..%2F22222222222222222%2Fexample.png');
assert.equal(matched.params.guildId,'11111111111111111');
assert.equal(matched.params.filename,'../22222222222222222/example.png');
evidence.push({probe:'Installed Express route parser',params:matched.params});
// Inspección del runtime local, sin abrir sockets ni acceder a servicios privados.
const netSource=process.binding('natives').net;
const at=netSource.indexOf('const addressType = isIP(host)');
evidence.push({probe:'Node IP literal path', source:at>=0 ? netSource.slice(at,at+530) : 'see official Node net documentation'});
console.log(JSON.stringify({node:process.version,bullmq:require('bullmq/package.json').version,evidence},null,2));
