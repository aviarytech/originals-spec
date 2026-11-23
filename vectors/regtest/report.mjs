// Computes a verification report (P7.17–P7.22, P14.25) for an anchored
// Original from a P9.18 evidence set: the anchoring sat's inscriptions as an
// ord index reports them at a stated network and tip, and nothing else.
//
// This is the verifier half of the regtest gate. It uses the checker's
// helpers (vectors/tools/verify-lib.mjs), never the generator's lib.mjs, and
// it covers what the gate exercises: one anchoring publication in parts on
// one sat, a did:webvh author whose log is resolved from its host and supplied
// as a signer-history input (P9.33), body `full`. Anything outside that is
// reported as a failure, not guessed at.
import {
  checkChain, checkOgLog, checkWebvh, counts, parseEnvelope, parseLines, resourceDigest, stats,
} from '../tools/verify-lib.mjs';
import {
  TRANSFER_DEPTH, confirmations, insufficientDepth, missingResources, offlineFrom, satReadProblems, sortDiagnostics, unreadInscriptions,
} from '../tools/report-lib.mjs';

const PROFILE = 'og:1.0-draft.1';

// A `signers` member, written before D22, is ignored only in an inscription on
// mainnet in a block at height 977,150 or lower (P14.12); anywhere else it
// makes the metadata invalid like any other unknown member.
export const LEGACY_SIGNERS_MAX_HEIGHT = 977150;
export const legacySignersAllowed = (network, height) => network === 'mainnet' && Number.isInteger(height) && height <= LEGACY_SIGNERS_MAX_HEIGHT;

// Whether one signer log is evidence (P9.33): it verifies whole, from the DID's
// genesis, as that DID's log. A log that fails anywhere is not evidence, and
// no verified prefix of it is used. Checked quietly: a log that is not
// evidence is an expected outcome, not a checker failure.
async function verifiesWhole(bytes, did) {
  const saved = { ...counts };
  const quiet = console.error; console.error = () => {};
  let log = null;
  try {
    log = parseLines(bytes, 'signer log');
    const doc = await checkWebvh(log, 'signer log');
    if (doc?.id !== did) counts.failures++;
  } catch { counts.failures++; }
  console.error = quiet;
  const good = counts.failures === saved.failures;
  Object.assign(counts, saved);
  return good ? log : null;
}
const vnum = (v) => Number(v.split('-')[0]);
const cp = (a, b) => (a < b ? -1 : a > b ? 1 : 0);
const NETWORK_PREFIX = { mainnet: '', signet: 'sig:', testnet: 'test:', regtest: 'reg:' };

// evidence = {
//   network, tip: { height, hash }, depth,
//   satRead: { source, bytes: Uint8Array },   // the `sat-read` input (P14.25)
//   inscriptions: [{ id, envelope: Uint8Array, metaprotocol, contentType }],  // `inscription` inputs
//   signerHistories: [{ did, source, obtained, bytes: Uint8Array }],  // resolved `signer-history` inputs
// }
// The sat, the inscriptions' positions and confirmations and the holder come
// from the sat-read input alone (P7.17, P14.25), never from elsewhere. A
// did:vh or did:webvh signer's log comes from a signer-history input alone,
// never from the inscriptions (P9.33, P14.12).
export async function computeReport(evidence) {
  const before = stats().failures;
  const problems = [];
  const fail = (msg) => problems.push(msg);

  const read = JSON.parse(new TextDecoder().decode(evidence.satRead.bytes));
  for (const q of satReadProblems(read, evidence.network, evidence.tip)) fail(`sat-read: ${q} (P14.25)`);
  if (read.complete !== true) fail('the anchoring sat is not read in full (P9.35)');
  const byId = new Map(evidence.inscriptions.map((x) => [x.id, x]));
  for (const id of unreadInscriptions(read, new Set(byId.keys()))) fail(`${id}: listed by the sat-read with no inscription input, so unread (P14.25)`);
  for (const x of evidence.inscriptions) if (!read.inscriptions.some((y) => y.id === x.id)) fail(`${x.id}: an inscription input the sat-read does not list`);
  // Chain order (P9.13) as the sat-read gives it: height, transaction index, inscription index.
  const ins = read.inscriptions.filter((y) => byId.has(y.id)).map((y) => ({ ...byId.get(y.id), ...y }));
  for (const x of ins) if (x.metaprotocol !== 'og') fail(`${x.id}: index reports metaprotocol ${x.metaprotocol}, not og (P9.31)`);
  const parts = ins.map((x) => ({ x, p: parseEnvelope(x.envelope) }));
  for (const { x, p } of parts) if ((p.contentType ?? null) !== (x.contentType ?? null)) fail(`${x.id}: index content type differs from the envelope`);

  // One publication in parts (P9.32): consecutive, part [i, n], body on the last only.
  const n = parts.length;
  parts.forEach(({ x, p }, i) => {
    const part = p.metadata.part ?? [1, 1];
    if (part[0] !== i + 1 || part[1] !== n) fail(`${x.id}: part ${JSON.stringify(part)} out of sequence`);
    if (i < n - 1 && (p.body !== null || p.contentType !== null)) fail(`${x.id}: a part before the last has a body`);
  });
  // Metadata is {entries, part?}; a `signers` member is ignored and never
  // evidence only on mainnet at height 977,150 or lower; anywhere else, like
  // any other member, it makes the metadata invalid (P14.12).
  for (const { x, p } of parts) {
    const allowed = ['entries', 'part', ...(legacySignersAllowed(evidence.network, x.height) ? ['signers'] : [])];
    const extra = Object.keys(p.metadata).filter((k) => !allowed.includes(k));
    if (extra.length) fail(`${x.id}: metadata member ${extra.join()} (P14.12)`);
  }
  const final = parts[n - 1];
  const entries = parts.flatMap(({ p }) => p.metadata.entries);

  // The author's logs from signer-history inputs only (P9.33). Each log that
  // verifies whole is evidence, one that fails anywhere is not, and the
  // entries are checked at the versionId they name in any log that is
  // evidence and holds it (P5.3, P9.15 rows 3, 4 and 7). The order of the
  // inputs never matters.
  const anchor = entries[entries.length - 1];
  const authorDid = anchor.state.author.did;
  const logs = [];
  for (const h of (evidence.signerHistories ?? []).filter((h) => h.did === authorDid)) {
    const log = await verifiesWhole(h.bytes, authorDid);
    if (log) logs.push({ ...h, log });
  }
  const named = anchor.state.author.versionId;
  const holding = logs.filter((h) => h.log.some((e) => e.versionId === named)).sort((a, b) => cp(a.source, b.source));
  // Missing evidence, never accepting and never a rejection: no log that is
  // evidence is signer-history-missing; logs that end short of the named
  // number, or hold another versionId there (a fork), are
  // signer-version-missing (P9.33).
  const gap = !logs.length
    ? { code: 'signer-history-missing', rule: 'P5.6', item: { kind: 'signer', id: authorDid }, reason: 'No author DID log that verifies is in the evidence set.' }
    : !holding.length
      ? { code: 'signer-version-missing', rule: 'P7.8', item: { kind: 'signer', id: authorDid, versionId: named }, reason: 'No verifying author log holds the version the entries name.' }
      : null;
  if (gap) return incompleteReport(evidence, read, ins, entries, gap, problems, before);
  const withNamed = holding[0].log;
  const authorDoc = await checkWebvh(withNamed.slice(0, withNamed.findIndex((e) => e.versionId === named) + 1), 'regtest: author log at the named version');
  // The latest version reported (P7.8): the highest-numbered among the logs
  // that are evidence, ties by code-point order of the versionId, with the
  // source and time obtained of the first log, by source, that holds it.
  const latest = logs.map((h) => h.log[h.log.length - 1].versionId).sort((a, b) => vnum(b) - vnum(a) || cp(a, b))[0];
  const history = logs.filter((h) => h.log.some((e) => e.versionId === latest)).sort((a, b) => cp(a.source, b.source))[0];

  // Resource bytes the inscriptions carry (P9.17): only a `full` body is a version.
  const resources = {};
  if (anchor.state.asset.body === 'full' && final.p.body) resources[resourceDigest(final.p.body)] = final.p.body;
  if (anchor.state.asset.body === 'full' && resourceDigest(final.p.body ?? new Uint8Array()) !== anchor.state.asset.resource.digest) fail('body is not the signed full version');
  if (anchor.state.asset.body === 'full' && final.p.contentType !== anchor.state.asset.resource.mediaType) fail('content type is not the version\'s mediaType');

  const { did } = authorDoc ? checkOgLog(entries, authorDoc, resources, 'regtest') : { did: null };

  // Binding to the sat and network (P9.10, P9.34).
  const btco = `did:btco:${NETWORK_PREFIX[evidence.network]}${read.sat}`;
  if (entries[0].state.asset.network !== evidence.network) fail('genesis network is not the evidence network');
  const anchorIndex = entries.findIndex((e) => e.state.asset.aliases.includes(btco));
  if (anchorIndex !== entries.length - 1) fail('anchoring entry is not the last entry of the anchoring publication');
  if (entries.some((e) => e.state.asset.aliases.some((a) => a.startsWith('did:btco:') && a !== btco))) fail('a did:btco alias names another sat');

  const failed = problems.length > 0 || stats().failures > before;
  for (const p of problems) console.error('FAIL', p);

  const block = final.x.height;
  // The evidence is the sat read in full at the tip (P9.18), so the only
  // dependencies P7.21 can find are resource versions the inscriptions lack.
  const { diagnostics: missing } = missingResources(entries, resources);
  // The transfer depth (P7.22): the publication's confirmations at the tip,
  // counted from the block holding its final part.
  const confs = confirmations(evidence.tip.height, final.x.height);
  const depth = confs < TRANSFER_DEPTH ? [insufficientDepth(parts[0].x.id, confs)] : [];
  const diagnostics = sortDiagnostics([...missing, ...depth]);

  return {
    type: 'OriginalsVerificationReport', profile: PROFILE, original: did, checkpoint: anchor.versionId,
    evidence: {
      inputs: [
        { kind: 'sat-read', source: evidence.satRead.source, digest: resourceDigest(evidence.satRead.bytes) },
        ...ins.map((x) => ({ kind: 'inscription', source: `index:${x.id}`, digest: resourceDigest(x.envelope) })),
        ...historyInputs(evidence),
      ],
      network: evidence.network, tip: evidence.tip, depth: evidence.depth,
    },
    axes: failed
      ? { outcome: 'invalid' }
      : {
        outcome: 'verified', binding: 'bound', history: 'valid', identity: 'complete', authority: 'current',
        state: 'current', availability: missing.length ? 'partial' : 'complete', offline: offlineFrom(diagnostics), bitcoin: 'anchored',
      },
    entries: entries.map((e, i) => ({
      versionId: e.versionId, status: 'accepted', authority: 'current-key',
      endorsed: entries.slice(i + 1).some((x) => !x.state.editor),
      ordering: i < entries.length - 1 ? 'existed-by-block' : 'chain-ordered', block,
    })),
    signers: [{
      did: authorDid, role: 'author', latestVersionId: latest,
      source: history.source, obtained: history.obtained, freshness: 'not-established',
    }],
    diagnostics,
    bitcoin: {
      sat: btco, holder: { address: read.holder?.address ?? null, uniqueness: 'provisional' },
      conflictingAnchors: [], unverifiable: [], waiting: [],
    },
  };
}

// Signer-history inputs in code-point order of source, then digest, so that
// the order in which they were supplied does not change the report (P7.17).
const historyInputs = (evidence) => (evidence.signerHistories ?? [])
  .map((h) => ({ kind: 'signer-history', source: h.source, digest: resourceDigest(h.bytes) }))
  .sort((a, b) => cp(a.source, b.source) || cp(a.digest, b.digest));

// The anchoring publication with its author's log missing or short: identity
// evidence is incomplete (P5.6, P9.33), so nothing is accepted, the anchor is
// not decided (P9.16) and the outcome is incomplete, never verified.
function incompleteReport(evidence, read, ins, entries, gap, problems, before) {
  checkChain(entries, 'regtest: inscribed entries');
  const failed = problems.length > 0 || stats().failures > before;
  for (const p of problems) console.error('FAIL', p);
  const unchecked = entries.map((e) => ({ code: 'proof-unchecked', rule: 'P7.19', item: { kind: 'entry', id: e.versionId }, reason: 'The signer\'s DID log needed to check this proof is not in the evidence set.' }));
  const diagnostics = sortDiagnostics([gap, ...unchecked]);
  return {
    type: 'OriginalsVerificationReport', profile: PROFILE, original: entries[0].state.id, checkpoint: null,
    evidence: {
      inputs: [
        { kind: 'sat-read', source: evidence.satRead.source, digest: resourceDigest(evidence.satRead.bytes) },
        ...ins.map((x) => ({ kind: 'inscription', source: `index:${x.id}`, digest: resourceDigest(x.envelope) })),
        ...historyInputs(evidence),
      ],
      network: evidence.network, tip: evidence.tip, depth: evidence.depth,
    },
    axes: failed ? { outcome: 'invalid' } : {
      outcome: 'incomplete', binding: 'bound', history: 'valid', identity: 'incomplete', authority: 'current',
      state: 'none', availability: 'none', offline: offlineFrom(diagnostics), bitcoin: 'undetermined',
    },
    entries: entries.map((e) => ({ versionId: e.versionId, status: 'unchecked' })),
    signers: [],
    diagnostics,
  };
}
