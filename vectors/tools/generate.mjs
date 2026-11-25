// Regenerates vectors/og-1.0-draft.1/ deterministically from fixed seeds.
// Run with `npm run vectors`; verify with `npm run vectors:check`.
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { sha256 } from '@noble/hashes/sha2.js';
import {
  utf8, hex, jcs, digest, key, proof, genesis, next, line, zip, cbor, envelope,
} from './lib.mjs';

const PROFILE = 'og:1.0-draft.1';
const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', PROFILE.replace(':', '-'));
const files = {};
const put = (path, data) => { files[path] = typeof data === 'string' ? utf8(data) : data; };
const json = (v) => JSON.stringify(v, null, 2) + '\n';
const synthHash = (label) => hex(sha256(utf8('originals-spec synthetic: ' + label)));

// ---------- Keys ----------
const authorUpdate = key('author did:webvh update key');
const authorSigning = key('author assertionMethod key-1');
const aliasUpdate = key('alias did:webvh update key');

// ---------- Author DID: a did:webvh 1.0 log with one entry ----------
const webvhSigner = (k) => (doc) => proof(k, doc, `did:key:${k.multikey}#${k.multikey}`, { created: doc.versionTime });
const authorDidTemplate = 'did:webvh:{SCID}:author.example';
const author = genesis({
  versionId: '{SCID}',
  versionTime: '2026-01-01T00:00:00Z',
  parameters: { method: 'did:webvh:1.0', scid: '{SCID}', updateKeys: [authorUpdate.multikey] },
  state: {
    '@context': ['https://www.w3.org/ns/did/v1', 'https://w3id.org/security/multikey/v1'],
    id: authorDidTemplate,
    verificationMethod: [{
      id: `${authorDidTemplate}#key-1`, type: 'Multikey', controller: authorDidTemplate, publicKeyMultibase: authorSigning.multikey,
    }],
    assertionMethod: [`${authorDidTemplate}#key-1`],
  },
}, webvhSigner(authorUpdate));
const AUTHOR = author.entry.state.id;
const authorRef = { did: AUTHOR, verificationMethod: `${AUTHOR}#key-1`, versionId: author.entry.versionId };
const authorLog = line(author.entry);
// Where resolving the author's did:webvh fetches its log (did:webvh 1.0, no
// path: /.well-known/did.jsonl), and when the vectors' resolution obtained it.
const AUTHOR_URL = 'https://author.example/.well-known/did.jsonl';
const RESOLVED_AT = '2026-01-06T00:00:00Z';

// ---------- Resources ----------
const v1 = utf8('# Field notes\n\nFirst draft.\n');
// Version 2 is large enough that the anchoring publication cannot fit in one
// inscription (P9.17), so it is published in two parts (P9.32).
const V2_SIZE = 346000;
let v2text = '# Field notes\n\n';
for (let i = 1; v2text.length < V2_SIZE; i++) v2text += `Observation ${String(i).padStart(5, '0')}: the tide was lower than the day before.\n`;
v2text = v2text.slice(0, V2_SIZE - 1) + '\n';
const v2 = utf8(v2text);
const desc = (b) => ({ mediaType: 'text/markdown', size: b.length, digest: digest(b) });

// ---------- The Original: did:og asset log ----------
const ogSign = (doc) => proof(authorSigning, doc, authorRef.verificationMethod);
const g = genesis({
  versionId: '{SCID}',
  versionTime: '2026-01-02T00:00:00Z',
  parameters: { method: PROFILE, scid: '{SCID}', updateKeys: [] },
  state: {
    id: 'did:og:{SCID}', operation: 'create', author: authorRef,
    asset: { name: 'Field notes', status: 'active', network: 'regtest', resource: desc(v1), aliases: [] },
    transitions: [{ from: null, to: digest(v1) }],
  },
}, ogSign);
const OG = g.entry.state.id;
const e1 = g.entry;
const e2 = next(e1, {
  versionTime: '2026-01-03T00:00:00Z', parameters: {},
  state: { ...e1.state, operation: 'update', asset: { ...e1.state.asset, resource: desc(v2) }, transitions: [{ from: digest(v1), to: digest(v2) }] },
}, ogSign);

// ---------- did:webvh alias on the host (P3.6, P14.11) ----------
const aliasTemplate = 'did:webvh:{SCID}:host.example:field-notes';
const alias = genesis({
  versionId: '{SCID}',
  versionTime: '2026-01-03T12:00:00Z',
  parameters: { method: 'did:webvh:1.0', scid: '{SCID}', updateKeys: [aliasUpdate.multikey] },
  state: { '@context': ['https://www.w3.org/ns/did/v1'], id: aliasTemplate, alsoKnownAs: [OG] },
}, webvhSigner(aliasUpdate));
const ALIAS = alias.entry.state.id;

const e3 = next(e2, {
  versionTime: '2026-01-04T00:00:00Z', parameters: {},
  state: { ...e2.state, asset: { ...e2.state.asset, aliases: [ALIAS] }, transitions: [] },
}, ogSign);
// A competing candidate with the same parent, refused by the host as stale.
const e3stale = next(e2, {
  versionTime: '2026-01-04T00:00:01Z', parameters: {},
  state: { ...e2.state, asset: { ...e2.state.asset, metadata: { location: 'North beach' } }, transitions: [] },
}, ogSign);

// ---------- Anchoring entry (P9.10): adds the did:btco alias, body full ----------
const SAT = 1234567890;
const BTCO = `did:btco:reg:${SAT}`;
const e4 = next(e3, {
  versionTime: '2026-01-05T00:00:00Z', parameters: {},
  state: { ...e3.state, asset: { ...e3.state.asset, aliases: [ALIAS, BTCO], body: 'full' }, transitions: [] },
}, ogSign);

const logOf = (...es) => es.map(line).join('');
const vid = (e) => e.versionId;

// ---------- Evidence package (P14.10) ----------
const signerDir = (did) => `signers/${hex(sha256(utf8(did)))}/did.jsonl`;
function pkg(entries) {
  const last = entries[entries.length - 1];
  const manifest = {
    format: 'originals-evidence/0.1', profile: PROFILE, original: OG,
    checkpoint: vid(last), head: vid(last), completeness: 'complete', missing: [],
  };
  const contents = {
    'originals-evidence.json': utf8(jcs(manifest)),
    'asset/did.jsonl': utf8(logOf(...entries)),
    [signerDir(AUTHOR)]: utf8(authorLog),
  };
  const seen = new Set();
  for (const e of entries) for (const t of e.state.transitions) seen.add(t.to);
  for (const b of [v1, v2]) if (seen.has(digest(b))) contents[`resources/${digest(b)}`] = b;
  return { manifest, contents, bytes: zip(contents) };
}

const COMMON = { profile: PROFILE, original: OG, author: AUTHOR };
const entryLabel = (e, i, all, extra = {}) => ({
  versionId: vid(e), status: 'accepted', authority: 'current-key',
  endorsed: all.slice(i + 1).some((x) => !x.state.editor), ...extra,
});

// Diagnostics and offline (P14.25, P7.21), written out here independently of
// the checker's report-lib.mjs: offline is derived from the dependency codes.
const DEPENDENCY = ['resource-missing', 'resource-mismatch', 'signer-history-missing', 'signer-version-missing', 'anchoring-sat-not-read', 'signer-sat-not-read'];
const offlineOf = (diagnostics) => (diagnostics.some((d) => DEPENDENCY.includes(d.code)) ? 'needs-external' : 'self-contained');
const missingDiag = (bytes, e) => ({
  code: 'resource-missing', rule: 'P7.4', item: { kind: 'resource', id: digest(bytes), versionId: vid(e) },
  reason: 'The evidence set does not hold the bytes of this resource version.',
});

// ---------- genesis/ (P14.1, P14.27–P14.29): the genesis entry alone ----------
{
  const prelim = {
    versionId: '{SCID}', versionTime: e1.versionTime, parameters: { method: PROFILE, scid: '{SCID}', updateKeys: [] },
    state: JSON.parse(JSON.stringify(e1.state).replaceAll(g.scid, '{SCID}')),
  };
  const { proof: _p, ...unsigned } = e1;
  const hashInput = { ...unsigned, versionId: g.scid };
  put('genesis/did.jsonl', line(e1));
  put('genesis/scid-input.json', jcs(prelim));
  put('genesis/entry-hash-input.json', jcs(hashInput));
  put('genesis/resources/v1.md', v1);
  put('genesis/author/did.jsonl', authorLog);
  const inputs = [
    { kind: 'log', source: 'genesis/did.jsonl', digest: digest(utf8(line(e1))) },
    { kind: 'signer-history', source: 'genesis/author/did.jsonl', digest: digest(utf8(authorLog)) },
    { kind: 'resource', source: 'genesis/resources/v1.md', digest: digest(v1) },
  ];
  put('genesis/derivation.json', json({
    note: 'How the genesis entry is derived (P14.28, P14.29). scid-input.json and entry-hash-input.json are the exact JCS bytes hashed.',
    scid: g.scid, scidInput: 'genesis/scid-input.json', scidMultihash: 'sha2-256 (0x12, 0x20), base58btc, no multibase prefix',
    entryHash: e1.versionId.split('-')[1], entryHashInput: 'genesis/entry-hash-input.json', versionId: e1.versionId,
    signer: { verificationMethod: authorRef.verificationMethod, key: authorSigning.label },
  }));
  const evidence = { original: OG, checkpoint: null, inputs, signerHistories: [{ did: AUTHOR, source: 'genesis/author/did.jsonl', obtained: '2026-01-06T00:00:00Z' }], network: null, tip: null, depth: null };
  put('genesis/evidence-set.json', json(evidence));
  put('genesis/expected-report.json', json({
    type: 'OriginalsVerificationReport', profile: PROFILE, original: OG, checkpoint: vid(e1),
    evidence: { inputs, network: null, tip: null, depth: null },
    axes: {
      outcome: 'verified', binding: 'bound', history: 'valid', identity: 'complete', authority: 'current',
      state: 'valid-as-of', availability: 'complete', offline: offlineOf([]), bitcoin: 'not-read',
    },
    entries: [entryLabel(e1, 0, [e1], { ordering: 'claimed' })],
    signers: [{ did: AUTHOR, role: 'author', latestVersionId: vid(author.entry), source: 'genesis/author/did.jsonl', obtained: '2026-01-06T00:00:00Z', freshness: 'not-established' }],
    diagnostics: [],
  }));
}

// ---------- local/ ----------
{
  const p = pkg([e1, e2]);
  put('local/author/did.jsonl', authorLog);
  put('local/asset/did.jsonl', logOf(e1, e2));
  put('local/resources/v1.md', v1);
  put('local/resources/v2.md', v2);
  put('local/package/originals-evidence.json', p.contents['originals-evidence.json']);
  put('local/package/evidence.zip', p.bytes);
  const evidence = {
    original: OG, checkpoint: null,
    inputs: [{ kind: 'package', source: 'local/package/evidence.zip', digest: digest(p.bytes) }],
    signerHistories: [{ did: AUTHOR, source: 'package', obtained: '2026-01-06T00:00:00Z' }],
    network: null, tip: null, depth: null,
  };
  put('local/evidence-set.json', json(evidence));
  put('local/expected-report.json', json({
    type: 'OriginalsVerificationReport', profile: PROFILE, original: OG, checkpoint: vid(e2),
    evidence: { inputs: evidence.inputs, network: null, tip: null, depth: null },
    axes: {
      outcome: 'verified', binding: 'bound', history: 'valid', identity: 'complete', authority: 'current',
      state: 'valid-as-of', availability: 'complete', offline: offlineOf([]), bitcoin: 'not-read',
    },
    entries: [e1, e2].map((e, i, a) => entryLabel(e, i, a, { ordering: 'claimed' })),
    signers: [{ did: AUTHOR, role: 'author', latestVersionId: vid(author.entry), source: 'package', obtained: '2026-01-06T00:00:00Z', freshness: 'not-established' }],
    diagnostics: [],
  }));
}

// ---------- missing-resource/: loose inputs without version 1 (P7.21) ----------
{
  put('missing-resource/asset/did.jsonl', logOf(e1, e2));
  put('missing-resource/author/did.jsonl', authorLog);
  put('missing-resource/resources/v2.md', v2);
  const inputs = [
    { kind: 'log', source: 'missing-resource/asset/did.jsonl', digest: digest(utf8(logOf(e1, e2))) },
    { kind: 'signer-history', source: 'missing-resource/author/did.jsonl', digest: digest(utf8(authorLog)) },
    { kind: 'resource', source: 'missing-resource/resources/v2.md', digest: digest(v2) },
  ];
  const evidence = { original: OG, checkpoint: null, inputs, signerHistories: [{ did: AUTHOR, source: 'missing-resource/author/did.jsonl', obtained: '2026-01-06T00:00:00Z' }], network: null, tip: null, depth: null };
  put('missing-resource/evidence-set.json', json(evidence));
  const diagnostics = [missingDiag(v1, e1)];
  put('missing-resource/expected-report.json', json({
    type: 'OriginalsVerificationReport', profile: PROFILE, original: OG, checkpoint: vid(e2),
    evidence: { inputs, network: null, tip: null, depth: null },
    axes: {
      outcome: 'verified', binding: 'bound', history: 'valid', identity: 'complete', authority: 'current',
      state: 'valid-as-of', availability: 'partial', offline: offlineOf(diagnostics), bitcoin: 'not-read',
    },
    entries: [e1, e2].map((e, i, a) => entryLabel(e, i, a, { ordering: 'claimed' })),
    signers: [{ did: AUTHOR, role: 'author', latestVersionId: vid(author.entry), source: 'missing-resource/author/did.jsonl', obtained: '2026-01-06T00:00:00Z', freshness: 'not-established' }],
    diagnostics,
  }));
}

// ---------- hosted/ ----------
{
  const p = pkg([e1, e2, e3]);
  const base = 'https://host.example/field-notes/';
  put('hosted/served/did.jsonl', line(alias.entry));
  for (const [name, data] of Object.entries(p.contents)) put(`hosted/served/originals/${name}`, data);
  put('hosted/layout.json', json({
    alias: ALIAS, aliasLog: `${base}did.jsonl`, packageRoot: `${base}originals/`,
    resources: [v1, v2].map((b) => ({
      url: `${base}originals/resources/${digest(b)}`,
      headers: { 'Content-Type': 'text/markdown', 'X-Content-Type-Options': 'nosniff' },
    })),
    note: 'served/ is the state after the exchanges in exchanges.json. Headers beyond Content-Type follow P9.7; text/markdown is not active content.',
  }));
  const submit = (e) => ({ original: OG, entry: line(e), resources: [], identities: [] });
  put('hosted/exchanges.json', json({
    note: 'Applied in order to a shared host (P6.7) whose accepted head is entry 2.',
    initialHead: vid(e2),
    exchanges: [
      { request: submit(e3), response: { result: 'accepted', checkpoint: vid(e3), head: vid(e3) } },
      { request: submit(e3stale), response: { result: 'stale-parent', head: vid(e3) } },
      { request: submit(e3), response: { result: 'already-accepted', checkpoint: vid(e3), head: vid(e3) } },
    ],
  }));
}

// ---------- bitcoin/ (synthetic regtest) ----------
{
  const all = [e1, e2, e3, e4];
  // Metadata is {entries, part?}: no signer DID history is inscribed (P14.12,
  // D22). The author's did:webvh log is resolved from its host (P9.33, P8.5)
  // and is an evidence-set input with its source and the time obtained (P7.17).
  const meta = (o) => cbor(o);
  const single = meta({ entries: all }).length + v2.length;
  if (single <= 350000) throw new Error('anchoring publication fits in one inscription; parts not justified');
  const m1 = meta({ entries: [e1, e2, e3], part: [1, 2] });
  const m2 = meta({ entries: [e4], part: [2, 2] });
  if (m1.length > 350000 || m2.length + v2.length > 350000) throw new Error('part over 350,000 bytes');
  const env1 = envelope({ metaprotocol: 'og', metadata: m1 });
  const env2 = envelope({ contentType: 'text/markdown', metaprotocol: 'og', metadata: m2, body: v2 });
  put('bitcoin/inscriptions/part-1.metadata.cbor', m1);
  put('bitcoin/inscriptions/part-2.metadata.cbor', m2);
  put('bitcoin/inscriptions/part-1.envelope.bin', env1);
  put('bitcoin/inscriptions/part-2.envelope.bin', env2);
  const tx1 = synthHash('reveal part 1'), tx2 = synthHash('reveal part 2');
  const tip = { height: 110, hash: synthHash('tip') };
  // What the index read at the tip, as a `sat-read` input (P14.25): the
  // inscriptions' positions and confirmations and the holder are in the
  // evidence set, not only in the fixture (SDK finding F13).
  const satRead = {
    network: 'regtest', sat: SAT, tip, complete: true,
    holder: { address: 'bcrt1p' + synthHash('holder').slice(0, 58) },
    inscriptions: [
      { id: `${tx1}i0`, height: 101, txIndex: 1, inscriptionIndex: 0, confirmations: tip.height - 101 + 1 },
      { id: `${tx2}i0`, height: 102, txIndex: 1, inscriptionIndex: 0, confirmations: tip.height - 102 + 1 },
    ],
  };
  put('bitcoin/sat-read.json', json(satRead));
  // The fixture only says where each inscription's envelope bytes are.
  const chain = {
    synthetic: true,
    note: 'Synthetic chain fixture: no real regtest chain produced these transactions. Hashes are SHA-256 of labels. What a verifier is given is evidence-set.json: sat-read.json and the envelopes as inscription inputs (P7.17, P14.25).',
    network: 'regtest', ordRelease: '0.29.1',
    inscriptions: [
      { id: `${tx1}i0`, envelope: 'inscriptions/part-1.envelope.bin' },
      { id: `${tx2}i0`, envelope: 'inscriptions/part-2.envelope.bin' },
    ],
  };
  // The transfer depth (P7.22, P14.13): the publication's final part, in block
  // 102, has tip − 102 + 1 confirmations, at least 6, so no insufficient-depth diagnostic.
  if (tip.height - 102 + 1 < 6) throw new Error('bitcoin vector below the transfer depth');
  put('bitcoin/chain.json', json(chain));
  // The author's log as resolving its did:webvh returned it (P9.33, P8.5): the
  // response body is author/did.jsonl; resolved.json only says where it is.
  put('bitcoin/author/did.jsonl', authorLog);
  put('bitcoin/resolved.json', json({
    note: 'Where the bytes of each resolved signer-history input are. The source is the URL resolution fetched (did:webvh, no redirects, P8.5); the bytes are the response body.',
    responses: [{ source: AUTHOR_URL, file: 'author/did.jsonl' }],
  }));
  const inputs = [
    { kind: 'sat-read', source: 'bitcoin/sat-read.json', digest: digest(files['bitcoin/sat-read.json']) },
    ...chain.inscriptions.map((x) => ({ kind: 'inscription', source: `index:${x.id}`, digest: digest(files[`bitcoin/${x.envelope}`]) })),
    { kind: 'signer-history', source: AUTHOR_URL, digest: digest(utf8(authorLog)) },
  ];
  put('bitcoin/evidence-set.json', json({
    original: OG, checkpoint: null, inputs, signerHistories: [{ did: AUTHOR, source: AUTHOR_URL, obtained: RESOLVED_AT }], network: 'regtest', tip, depth: 1,
    note: 'The P9.18 evidence set: the index read of the anchoring sat and its inscriptions at the stated network and tip, and the author\'s did:webvh log as resolved from its host (P9.33), and nothing else.',
  }));
  put('bitcoin/expected-report.json', json({
    type: 'OriginalsVerificationReport', profile: PROFILE, original: OG, checkpoint: vid(e4),
    evidence: { inputs, network: 'regtest', tip, depth: 1 },
    axes: {
      outcome: 'verified', binding: 'bound', history: 'valid', identity: 'complete', authority: 'current',
      state: 'current', availability: 'partial', offline: offlineOf([missingDiag(v1, e1)]), bitcoin: 'anchored',
    },
    entries: all.map((e, i, a) => entryLabel(e, i, a, i < 3 ? { ordering: 'existed-by-block', block: 102 } : { ordering: 'chain-ordered', block: 102 })),
    signers: [{ did: AUTHOR, role: 'author', latestVersionId: vid(author.entry), source: AUTHOR_URL, obtained: RESOLVED_AT, freshness: 'not-established' }],
    diagnostics: [missingDiag(v1, e1)],
    bitcoin: { sat: BTCO, holder: { address: satRead.holder.address, uniqueness: 'provisional' }, conflictingAnchors: [], unverifiable: [], waiting: [] },
  }));
}

// ---------- anchor-absent/ (synthetic regtest): no anchoring publication on the sat ----------
// The anchored log as a copy, with the anchoring sat read in full at a tip that
// holds no inscription on it, as after a reorganization removed the anchoring
// publication (P9.5). No earlier report is an input (P7.17).
{
  put('anchor-absent/did.jsonl', logOf(e1, e2, e3, e4));
  put('anchor-absent/author/did.jsonl', authorLog);
  put('anchor-absent/resources/v1.md', v1);
  put('anchor-absent/resources/v2.md', v2);
  const tip = { height: 111, hash: synthHash('anchor-absent tip') };
  // Synthetic: the index reads the anchoring sat in full at this tip and lists
  // no inscription on it, as after a reorganization from block 101 removed the
  // anchoring publication (P9.5, P9.31, P9.35). Form: P14.25.
  const satRead = { network: 'regtest', sat: SAT, tip, complete: true, holder: null, inscriptions: [] };
  put('anchor-absent/sat-read.json', json(satRead));
  const inputs = [
    { kind: 'log', source: 'anchor-absent/did.jsonl', digest: digest(utf8(logOf(e1, e2, e3, e4))) },
    { kind: 'signer-history', source: 'anchor-absent/author/did.jsonl', digest: digest(utf8(authorLog)) },
    { kind: 'resource', source: 'anchor-absent/resources/v1.md', digest: digest(v1) },
    { kind: 'resource', source: 'anchor-absent/resources/v2.md', digest: digest(v2) },
    { kind: 'sat-read', source: 'anchor-absent/sat-read.json', digest: digest(files['anchor-absent/sat-read.json']) },
  ];
  put('anchor-absent/evidence-set.json', json({
    original: OG, checkpoint: null, inputs,
    signerHistories: [{ did: AUTHOR, source: 'anchor-absent/author/did.jsonl', obtained: '2026-01-06T00:00:00Z' }],
    network: 'regtest', tip, depth: 1,
  }));
  const diagnostics = [];
  put('anchor-absent/expected-report.json', json({
    type: 'OriginalsVerificationReport', profile: PROFILE, original: OG, checkpoint: vid(e3),
    evidence: { inputs, network: 'regtest', tip, depth: 1 },
    axes: {
      outcome: 'verified', binding: 'bound', history: 'valid', identity: 'complete', authority: 'current',
      state: 'valid-as-of', availability: 'complete', offline: offlineOf(diagnostics), bitcoin: 'not-anchored',
    },
    entries: [
      ...[e1, e2, e3].map((e, i, a) => entryLabel(e, i, a, { ordering: 'claimed' })),
      { versionId: vid(e4), status: 'ignored' },
    ],
    signers: [{ did: AUTHOR, role: 'author', latestVersionId: vid(author.entry), source: 'anchor-absent/author/did.jsonl', obtained: '2026-01-06T00:00:00Z', freshness: 'not-established' }],
    diagnostics,
  }));
}

put('index.json', json({
  ...COMMON,
  description: 'Provisional test vectors for did:og ' + PROFILE + '. See README.md.',
  alias: ALIAS, anchoringAlias: BTCO,
  entries: { e1: vid(e1), e2: vid(e2), e3: vid(e3), e3stale: vid(e3stale), e4: vid(e4) },
  keys: Object.fromEntries([authorUpdate, authorSigning, aliasUpdate].map((k) => [k.label, { seed: `SHA-256("originals-spec test vector seed: ${k.label}")`, multikey: k.multikey }])),
}));

rmSync(ROOT, { recursive: true, force: true });
for (const [path, data] of Object.entries(files)) {
  const p = join(ROOT, path);
  mkdirSync(dirname(p), { recursive: true });
  writeFileSync(p, data);
}
console.log(`wrote ${Object.keys(files).length} files to ${ROOT}`);
