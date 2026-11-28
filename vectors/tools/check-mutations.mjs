// Mutation cases for the independent checker (T14-091): logs that break a rule the
// checker claims to cover must fail it, and valid logs it used to refuse must pass.
// Signing uses the generator's helpers; what is under test is verify-lib.mjs.
import { utf8, digest, key, proof, genesis, next } from './lib.mjs';
import { checkOgLog, checkWebvh, webvhVersions, counts } from './verify-lib.mjs';

let checks = 0, failures = 0;
// Runs one checker call and reports whether it failed, without counting its failures as this run's.
function fails(f) {
  const before = { ...counts }, error = console.error;
  console.error = () => {};
  try { f(); } catch { counts.failures++; } finally { console.error = error; }
  const failed = counts.failures > before.failures;
  Object.assign(counts, before);
  return failed;
}
const expect = (label, wantFail, f) => { checks++; const got = fails(f); if (got !== wantFail) { failures++; console.error(`FAIL ${label}: checker ${got ? 'refused' : 'accepted'} it`); } };

const updateKey = key('mutation author update key');
const key1 = key('mutation author key-1'), key2 = key('mutation author key-2');
const webvhSigner = (k) => (doc) => proof(k, doc, `did:key:${k.multikey}#${k.multikey}`, { created: doc.versionTime });
const T = 'did:webvh:{SCID}:author.example';
const a1 = genesis({ versionId: '{SCID}', versionTime: '2026-01-01T00:00:00Z',
  parameters: { method: 'did:webvh:1.0', scid: '{SCID}', updateKeys: [updateKey.multikey] },
  state: { '@context': ['https://www.w3.org/ns/did/v1', 'https://w3id.org/security/multikey/v1'], id: T,
    verificationMethod: [{ id: `${T}#key-1`, type: 'Multikey', controller: T, publicKeyMultibase: key1.multikey }], assertionMethod: [`${T}#key-1`] } }, webvhSigner(updateKey)).entry;
const AUTHOR = a1.state.id;
// Version 2 of the author DID replaces key-1 with key-2.
const a2 = next(a1, { versionTime: '2026-01-02T12:00:00Z', parameters: {}, state: { ...a1.state,
  verificationMethod: [{ id: `${AUTHOR}#key-2`, type: 'Multikey', controller: AUTHOR, publicKeyMultibase: key2.multikey }], assertionMethod: [`${AUTHOR}#key-2`] } }, webvhSigner(updateKey));
const v1only = await webvhVersions([a1], 'mutation author');
const rotated = await webvhVersions([a1, a2], 'mutation author');
await checkWebvh([a1, a2], 'mutation author v2');

const body = utf8('# fixture\n');
const desc = (mediaType = 'text/markdown', size = body.length) => ({ mediaType, size, digest: digest(body) });
const ref1 = (versionId = a1.versionId) => ({ did: AUTHOR, verificationMethod: `${AUTHOR}#key-1`, versionId });
const ref2 = { did: AUTHOR, verificationMethod: `${AUTHOR}#key-2`, versionId: a2.versionId };
const sign = (k, ref) => (doc) => proof(k, doc, ref.verificationMethod);
const create = (ref) => genesis({ versionId: '{SCID}', versionTime: '2026-01-02T00:00:00Z', parameters: { method: 'og:1.0-draft.1', scid: '{SCID}', updateKeys: [] },
  state: { id: 'did:og:{SCID}', operation: 'create', author: ref, asset: { name: 'x', status: 'active', network: 'regtest', resource: desc(), aliases: [] }, transitions: [{ from: null, to: digest(body) }] } }, sign(key1, ref)).entry;
const g = create(ref1());
const update = (state, k = key1, ref = ref1()) => next(g, { versionTime: '2026-01-03T00:00:00Z', parameters: {}, state: { ...g.state, operation: 'update', ...state } }, sign(k, ref));
const res = { [digest(body)]: body };

expect('baseline genesis passes', false, () => checkOgLog([g], v1only, res, 'm'));
expect('entry naming an author versionId the author log does not contain (P5.3)', true,
  () => checkOgLog([create(ref1('9-QmNotInTheAuthorLogNotInTheAuthorLogNotIn'))], v1only, res, 'm'));
expect('genesis signed with key-1 at v1, after the author moved to key-2 in v2 (T7-005)', false, () => checkOgLog([g], rotated, res, 'm'));
expect('later entry signed with key-2 naming v2 (T5-039)', false,
  () => checkOgLog([g, update({ author: ref2, asset: { ...g.state.asset, name: 'y' }, transitions: [] }, key2, ref2)], rotated, res, 'm'));
expect('later entry naming an older author version than the previous one (T5-012)', true, () => {
  const e2 = update({ author: ref2, asset: { ...g.state.asset, name: 'y' }, transitions: [] }, key2, ref2);
  const e3 = next(e2, { versionTime: '2026-01-04T00:00:00Z', parameters: {}, state: { ...e2.state, author: ref1(), asset: { ...e2.state.asset, name: 'z' } } }, sign(key1, ref1()));
  checkOgLog([g, e2, e3], rotated, res, 'm');
});
expect('mediaType change with the transition {d, d} (T4-009, P14.6)', false,
  () => checkOgLog([g, update({ asset: { ...g.state.asset, resource: desc('text/plain') }, transitions: [{ from: digest(body), to: digest(body) }] })], v1only, res, 'm'));
expect('mediaType change with no transition (P14.6)', true,
  () => checkOgLog([g, update({ asset: { ...g.state.asset, resource: desc('text/plain') }, transitions: [] })], v1only, res, 'm'));
expect('size change with the digest unchanged, no bytes supplied (P14.6)', true,
  () => checkOgLog([g, update({ asset: { ...g.state.asset, resource: desc('text/markdown', 999) }, transitions: [] })], v1only, {}, 'm'));

console.log(`${checks} mutation checks, ${failures} failures`);
process.exit(failures ? 1 : 0);
