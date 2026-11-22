// Derives whole verification reports (P7.17–P7.23, P14.25) from evidence
// sets, independently of the generator (generate.mjs and lib.mjs are never
// imported). It covers what the vectors exercise: one branch, a did:webvh
// author, author entries only, no did:btco signers off Bitcoin. Anything the
// vectors don't exercise is reported `invalid` rather than guessed at, so a
// vector that needs more fails the check instead of passing by accident.
import { checkOgLog, checkWebvh, resourceDigest, stats, J, td } from './verify-lib.mjs';

export const PROFILE = 'og:1.0-draft.1';

// Canonical entry bytes for a writer comparison: JCS (P14.3) plus LF (P14.2).
// P14.2 leaves key order and string escapes free, so a writer's log matches a
// vector when its lines are equal in this form, not necessarily byte for byte.
export const canonicalLine = (entry) => td.decode(J(entry)) + '\n';
export const canonicalLog = (entries) => entries.map(canonicalLine).join('');

// Diagnostics (P14.25): one per missing or failed item, in the closed code
// list's order. `reason` is for people and is not compared.
export const CODES = [
  'target-missing', 'resource-missing', 'resource-mismatch', 'signer-history-missing', 'signer-version-missing',
  'proof-unchecked', 'entry-rejected', 'anchoring-sat-not-read', 'signer-sat-not-read',
  'inscription-unverifiable', 'publication-waiting', 'input-unusable', 'insufficient-depth',
];
// A `sat-read` evidence input (P14.25): exactly these members, at the evidence
// set's network and tip, each inscription's confirmations derived from the tip.
export const SAT_READ_MEMBERS = ['complete', 'holder', 'inscriptions', 'network', 'sat', 'tip'];
const ITEM_MEMBERS = ['confirmations', 'height', 'id', 'inscriptionIndex', 'txIndex'];
export function satReadProblems(r, network, tip) {
  const out = [];
  if (!r || typeof r !== 'object' || Array.isArray(r)) return ['not an object'];
  if (Object.keys(r).sort().join() !== SAT_READ_MEMBERS.join()) out.push(`members ${Object.keys(r).sort().join()}`);
  if (r.network !== network) out.push('network differs from the evidence set');
  if (JSON.stringify(r.tip) !== JSON.stringify(tip)) out.push('tip differs from the evidence set');
  if (!Number.isSafeInteger(r.sat) || r.sat < 0) out.push('sat is not a sat number');
  if (typeof r.complete !== 'boolean') out.push('complete is not a boolean');
  if (r.holder !== null && (typeof r.holder !== 'object' || Object.keys(r.holder).join() !== 'address')) out.push('holder is not {address} or null');
  if (!Array.isArray(r.inscriptions)) return [...out, 'inscriptions is not an array'];
  let prev = null;
  for (const x of r.inscriptions) {
    if (Object.keys(x).sort().join() !== ITEM_MEMBERS.join()) out.push(`${x.id}: members ${Object.keys(x).sort().join()}`);
    if (x.confirmations !== confirmations(tip.height, x.height)) out.push(`${x.id}: confirmations are not the tip's height less its height, plus one`);
    const pos = [x.height, x.txIndex, x.inscriptionIndex];
    if (prev && (pos[0] - prev[0] || pos[1] - prev[1] || pos[2] - prev[2]) <= 0) out.push(`${x.id}: not in chain order`);
    prev = pos;
  }
  return out;
}
// Inscriptions a sat-read lists that have no `inscription` input: unread (P14.25, P9.35).
export const unreadInscriptions = (r, inscriptionIds) => r.inscriptions.filter((x) => !inscriptionIds.has(x.id)).map((x) => x.id);
// The transfer depth (P7.22, P14.13): confirmations a publication needs for the transfer check.
export const TRANSFER_DEPTH = 6;
// Confirmations of a publication at a tip: the tip's height less the height of
// the block holding its final part, plus one (P7.22).
export const confirmations = (tipHeight, blockHeight) => tipHeight - blockHeight + 1;
export const insufficientDepth = (inscriptionId, n) => ({
  code: 'insufficient-depth', rule: 'P7.22', item: { kind: 'inscription', id: inscriptionId },
  reason: `The publication has ${n} confirmations at the tip, fewer than the transfer depth of ${TRANSFER_DEPTH}.`,
});

// The default acceptance check and the transfer check (P7.22), over a report.
export const defaultCheck = (r) => r.axes.outcome === 'verified' && r.axes.history === 'valid'
  && r.axes.authority === 'current' && ['current', 'valid-as-of'].includes(r.axes.state);
export const transferCheck = (r) => defaultCheck(r) && r.axes.bitcoin === 'anchored'
  && r.bitcoin.unverifiable.length === 0 && r.bitcoin.waiting.length === 0 && r.bitcoin.conflictingAnchors.length === 0
  && !r.diagnostics.some((d) => d.code === 'insufficient-depth');
// The codes that make `offline` `needs-external` (P7.21).
export const DEPENDENCY_CODES = new Set([
  'resource-missing', 'resource-mismatch', 'signer-history-missing', 'signer-version-missing',
  'anchoring-sat-not-read', 'signer-sat-not-read',
]);
export const sortDiagnostics = (ds) => [...ds].sort((a, b) =>
  CODES.indexOf(a.code) - CODES.indexOf(b.code)
  || (a.item.id < b.item.id ? -1 : a.item.id > b.item.id ? 1 : 0)
  || ((a.item.versionId ?? '') < (b.item.versionId ?? '') ? -1 : (a.item.versionId ?? '') > (b.item.versionId ?? '') ? 1 : 0));
// P7.21: derived from the diagnostics, never declared.
export const offlineFrom = (ds) => (ds.some((d) => DEPENDENCY_CODES.has(d.code)) ? 'needs-external' : 'self-contained');
const resourceMissing = ({ digest, versionId }) => ({
  code: 'resource-missing', rule: 'P7.4', item: { kind: 'resource', id: digest, versionId },
  reason: `Resource version ${digest} is not in the evidence set.`,
});
// Resource versions through a checkpoint whose bytes the evidence set lacks.
export function missingResources(log, resources) {
  const vs = [];
  for (const e of log) for (const t of e.state.transitions) vs.push({ digest: t.to, versionId: e.versionId });
  return { versions: vs, diagnostics: vs.filter((v) => !resources[v.digest]).map(resourceMissing) };
}
const availabilityOf = (versions, ds) => {
  const n = ds.filter((d) => d.code === 'resource-missing').length;
  return n === 0 ? 'complete' : n === versions.length ? 'none' : 'partial';
};

// Two reports are the same when equal as JSON values (JCS), ignoring each
// diagnostic's `reason` (P14.25).
export function sameReport(a, b) {
  const strip = (r) => ({ ...r, diagnostics: (r.diagnostics ?? []).map(({ reason, ...d }) => d) });
  return td.decode(J(strip(a))) === td.decode(J(strip(b)));
}

// Off-Bitcoin report for an asset log plus its author's did:webvh history.
//   evidenceSet: the vector's evidence-set.json (P7.17)
//   log: the asset log entries; authorLog: the author's did:webvh entries
//   resources: { digest: bytes } available in the evidence set
export async function offChainReport({ evidenceSet, log, authorLog, resources }) {
  const before = stats().failures;
  const problems = [];
  const authorDoc = await checkWebvh(authorLog, 'report: author history');
  const { did, anchored } = checkOgLog(log, authorDoc, resources, 'report');
  if (anchored) problems.push('an anchored log is outside the off-Bitcoin report');
  if (log.some((e) => e.state.editor)) problems.push('editor entries are outside what this deriver covers');
  if (evidenceSet.original !== did) problems.push('evidence set names another did:og');
  if (authorLog[authorLog.length - 1].parameters?.deactivated) problems.push('a deactivated author is outside what this deriver covers');
  const failed = problems.length > 0 || stats().failures > before;
  for (const p of problems) console.error('FAIL report:', p);

  const latestAuthor = authorDoc; // didwebvh-ts resolves to the latest version
  const authority = (e) => (latestAuthor.assertionMethod.includes(e.proof[0].verificationMethod) ? 'current-key' : 'key-removed-since');
  const labels = log.map(authority);
  // P7.20: endorsed when a later accepted author entry on the branch is current-key.
  const endorsed = log.map((_, i) => log.slice(i + 1).some((x, k) => !x.state.editor && labels[i + 1 + k] === 'current-key'));

  const { versions, diagnostics: missing } = missingResources(log, resources);
  const history = evidenceSet.signerHistories.find((h) => h.did === log[0].state.author.did);
  const diagnostics = sortDiagnostics([
    ...missing,
    ...(history ? [] : [{ code: 'signer-history-missing', rule: 'P5.6', item: { kind: 'signer', id: log[0].state.author.did }, reason: 'The author DID history is not in the evidence set.' }]),
  ]);
  const checkpoint = evidenceSet.checkpoint ?? log[log.length - 1].versionId;

  return {
    type: 'OriginalsVerificationReport',
    profile: PROFILE,
    original: did,
    checkpoint,
    evidence: { inputs: evidenceSet.inputs, network: evidenceSet.network, tip: evidenceSet.tip, depth: evidenceSet.depth },
    axes: failed ? { outcome: 'invalid' } : {
      outcome: 'verified',
      binding: 'bound',
      history: 'valid',
      identity: history ? 'complete' : 'incomplete',
      authority: labels.every((l, i) => l === 'current-key' || endorsed[i]) ? 'current' : 'historical',
      state: 'valid-as-of', // never `current` off Bitcoin (P7.10)
      availability: availabilityOf(versions, diagnostics),
      offline: offlineFrom(diagnostics), // derived from the evidence set (P7.21)
      bitcoin: 'not-read',
    },
    entries: log.map((e, i) => ({ versionId: e.versionId, status: 'accepted', authority: labels[i], endorsed: endorsed[i], ordering: 'claimed' })),
    signers: history ? [{
      did: history.did, role: 'author', latestVersionId: authorLog[authorLog.length - 1].versionId,
      source: history.source, obtained: history.obtained, freshness: 'not-established',
    }] : [],
    diagnostics,
  };
}

// The report when the anchoring sat, read in full at the evidence set's tip,
// holds no anchoring publication of the Original, as after a reorganization
// removed it (P9.5): the copy's anchoring entry and every later entry are
// ignored, and the state is valid as of the entry before it. No earlier report
// is an input (P7.17).
//   satRead: { network, sat, tip, inscriptions } as an index reports it
export async function anchorAbsentReport({ evidenceSet, log, authorLog, resources, satRead }) {
  const before = stats().failures;
  const problems = [];
  const authorDoc = await checkWebvh(authorLog, 'anchor-absent report: author history');
  const { did } = checkOgLog(log, authorDoc, resources, 'anchor-absent report');
  const prefix = { mainnet: '', signet: 'sig:', testnet: 'test:', regtest: 'reg:' }[satRead.network];
  const btco = `did:btco:${prefix}${satRead.sat}`;
  const anchorAt = log.findIndex((e) => e.state.asset.aliases.includes(btco));
  if (anchorAt < 1) problems.push('the copy has no anchoring entry for the read sat');
  if (satRead.inscriptions.length) problems.push('the sat still holds inscriptions; outside what this deriver covers');
  for (const q of satReadProblems(satRead, evidenceSet.network, evidenceSet.tip)) problems.push(`sat-read: ${q}`);
  if (!satRead.complete) problems.push('the sat is not read in full (P9.35)');
  if ('prior' in evidenceSet) problems.push('an evidence set has no prior result (P7.17)');
  if (evidenceSet.original !== did) problems.push('evidence set names another did:og');
  if (log.some((e) => e.state.editor)) problems.push('editor entries are outside what this deriver covers');
  const failed = problems.length > 0 || stats().failures > before;
  for (const p of problems) console.error('FAIL anchor-absent report:', p);

  const kept = log.slice(0, anchorAt);
  const checkpoint = kept[kept.length - 1].versionId;
  const labels = kept.map((e) => (authorDoc.assertionMethod.includes(e.proof[0].verificationMethod) ? 'current-key' : 'key-removed-since'));
  const endorsed = kept.map((_, i) => kept.slice(i + 1).some((x, k) => !x.state.editor && labels[i + 1 + k] === 'current-key'));
  const { versions, diagnostics: missing } = missingResources(kept, resources);
  const history = evidenceSet.signerHistories.find((h) => h.did === log[0].state.author.did);
  const diagnostics = sortDiagnostics(missing);

  return {
    type: 'OriginalsVerificationReport',
    profile: PROFILE,
    original: did,
    checkpoint,
    evidence: { inputs: evidenceSet.inputs, network: evidenceSet.network, tip: evidenceSet.tip, depth: evidenceSet.depth },
    axes: failed ? { outcome: 'invalid' } : {
      outcome: 'verified',
      binding: 'bound',
      history: 'valid',
      identity: history ? 'complete' : 'incomplete',
      authority: labels.every((l, i) => l === 'current-key' || endorsed[i]) ? 'current' : 'historical',
      state: 'valid-as-of',
      availability: availabilityOf(versions, diagnostics),
      offline: offlineFrom(diagnostics), // the sat is read in full (P7.21)
      bitcoin: 'not-anchored',
    },
    entries: [
      ...kept.map((e, i) => ({ versionId: e.versionId, status: 'accepted', authority: labels[i], endorsed: endorsed[i], ordering: 'claimed' })),
      ...log.slice(anchorAt).map((e) => ({ versionId: e.versionId, status: 'ignored' })),
    ],
    signers: history ? [{
      did: history.did, role: 'author', latestVersionId: authorLog[authorLog.length - 1].versionId,
      source: history.source, obtained: history.obtained, freshness: 'not-established',
    }] : [],
    diagnostics,
  };
}

// The report for a log under a method value this draft does not implement
// (P14.1): outcome `unsupported`, and nothing else is reported about it.
export function unsupportedReport({ inputs, network }) {
  return {
    type: 'OriginalsVerificationReport',
    profile: PROFILE,
    original: null,
    checkpoint: null,
    evidence: { inputs, network, tip: null, depth: null },
    axes: { outcome: 'unsupported' },
    entries: [],
    signers: [],
    diagnostics: [],
  };
}

export { resourceDigest };
