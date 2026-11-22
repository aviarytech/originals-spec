// Computes a verification report (P7.17–P7.22, P14.25) for an anchored
// Original from a P9.18 evidence set: the anchoring sat's inscriptions as an
// ord index reports them at a stated network and tip, and nothing else.
//
// This is the verifier half of the regtest gate. It uses the checker's
// helpers (vectors/tools/verify-lib.mjs), never the generator's lib.mjs, and
// it covers what the gate exercises: one anchoring publication in parts on
// one sat, an author with an inscribed did:webvh history, body `full`.
// Anything outside that is reported as a failure, not guessed at.
import {
  checkOgLog, checkWebvh, parseEnvelope, resourceDigest, stats,
} from '../tools/verify-lib.mjs';

const PROFILE = 'og:1.0-draft.1';
const NETWORK_PREFIX = { mainnet: '', signet: 'sig:', testnet: 'test:', regtest: 'reg:' };

// evidence = {
//   network, tip: { height, hash }, depth, sat,
//   inscriptions: [{ id, envelope: Uint8Array, height, txIndex, inscriptionIndex,
//                    sat, metaprotocol, contentType, holder }],
// }
export async function computeReport(evidence) {
  const before = stats().failures;
  const problems = [];
  const fail = (msg) => problems.push(msg);

  // Chain order (P9.13): block height, transaction index, inscription index.
  const ins = [...evidence.inscriptions].sort((a, b) =>
    a.height - b.height || a.txIndex - b.txIndex || a.inscriptionIndex - b.inscriptionIndex);
  for (const x of ins) {
    if (x.sat !== evidence.sat) fail(`${x.id}: not on the anchoring sat`);
    if (x.metaprotocol !== 'og') fail(`${x.id}: index reports metaprotocol ${x.metaprotocol}, not og (P9.31)`);
  }
  const parts = ins.map((x) => ({ x, p: parseEnvelope(x.envelope) }));
  for (const { x, p } of parts) if ((p.contentType ?? null) !== (x.contentType ?? null)) fail(`${x.id}: index content type differs from the envelope`);

  // One publication in parts (P9.32): consecutive, part [i, n], body on the last only.
  const n = parts.length;
  parts.forEach(({ x, p }, i) => {
    const part = p.metadata.part ?? [1, 1];
    if (part[0] !== i + 1 || part[1] !== n) fail(`${x.id}: part ${JSON.stringify(part)} out of sequence`);
    if (i < n - 1 && (p.body !== null || p.contentType !== null)) fail(`${x.id}: a part before the last has a body`);
  });
  const final = parts[n - 1];
  const entries = parts.flatMap(({ p }) => p.metadata.entries);
  const signers = parts.flatMap(({ x, p }) => (p.metadata.signers ?? []).map((s) => ({ ...s, source: `inscribed:${x.id}` })));

  // Signer state from inscribed histories only (P9.33).
  const anchor = entries[entries.length - 1];
  const authorDid = anchor.state.author.did;
  const history = signers.find((s) => s.did === authorDid);
  if (!history) fail('no inscribed history for the author (P9.33)');
  const authorDoc = history ? await checkWebvh(history.log, 'regtest: inscribed author history') : null;
  if (history && !history.log.some((e) => e.versionId === anchor.state.author.versionId)) fail('named author version is not inscribed');

  // Resource bytes the inscriptions carry (P9.17): only a `full` body is a version.
  const resources = {};
  if (anchor.state.asset.body === 'full' && final.p.body) resources[resourceDigest(final.p.body)] = final.p.body;
  if (anchor.state.asset.body === 'full' && resourceDigest(final.p.body ?? new Uint8Array()) !== anchor.state.asset.resource.digest) fail('body is not the signed full version');
  if (anchor.state.asset.body === 'full' && final.p.contentType !== anchor.state.asset.resource.mediaType) fail('content type is not the version\'s mediaType');

  const { did } = authorDoc ? checkOgLog(entries, authorDoc, resources, 'regtest') : { did: null };

  // Binding to the sat and network (P9.10, P9.34).
  const btco = `did:btco:${NETWORK_PREFIX[evidence.network]}${evidence.sat}`;
  if (entries[0].state.asset.network !== evidence.network) fail('genesis network is not the evidence network');
  const anchorIndex = entries.findIndex((e) => e.state.asset.aliases.includes(btco));
  if (anchorIndex !== entries.length - 1) fail('anchoring entry is not the last entry of the anchoring publication');
  if (entries.some((e) => e.state.asset.aliases.some((a) => a.startsWith('did:btco:') && a !== btco))) fail('a did:btco alias names another sat');

  const failed = problems.length > 0 || stats().failures > before;
  for (const p of problems) console.error('FAIL', p);

  const block = final.x.height;
  const versions = [];
  for (const e of entries) for (const t of e.state.transitions) versions.push({ digest: t.to, versionId: e.versionId });
  const missing = versions.map((v, i) => ({ kind: 'resource', version: i + 1, ...v }))
    .filter((v) => !resources[v.digest])
    .map(({ kind, version, digest, versionId }) => ({ kind, version, digest, versionId }));

  return {
    type: 'OriginalsVerificationReport', profile: PROFILE, original: did, checkpoint: anchor.versionId,
    evidence: {
      inputs: ins.map((x) => ({ kind: 'inscription', source: `index:${x.id}`, digest: resourceDigest(x.envelope) })),
      network: evidence.network, tip: evidence.tip, depth: evidence.depth,
    },
    axes: failed
      ? { outcome: 'invalid' }
      : {
        outcome: 'verified', binding: 'bound', history: 'valid', identity: 'complete', authority: 'current',
        state: 'current', availability: missing.length ? 'partial' : 'complete', offline: 'needs-external', bitcoin: 'anchored',
      },
    entries: entries.map((e, i) => ({
      versionId: e.versionId, status: 'accepted', authority: 'current-key',
      endorsed: entries.slice(i + 1).some((x) => !x.state.editor),
      ordering: i < entries.length - 1 ? 'existed-by-block' : 'chain-ordered', block,
    })),
    signers: history ? [{
      did: authorDid, role: 'author', latestVersionId: history.log[history.log.length - 1].versionId,
      source: history.source, freshness: 'established',
    }] : [],
    missing,
    dependencies: [{ kind: 'anchoring-sat', did: btco }],
    bitcoin: {
      sat: btco, holder: { address: final.x.holder, uniqueness: 'provisional' },
      conflictingAnchors: [], unverifiable: [], waiting: [],
    },
  };
}
