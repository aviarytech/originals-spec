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
  'resource-missing', 'resource-mismatch', 'signer-history-missing', 'signer-version-missing',
  'proof-unchecked', 'entry-rejected', 'anchoring-sat-not-read', 'signer-sat-not-read',
  'inscription-unverifiable', 'publication-waiting', 'input-unusable',
];
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
    changes: [], // no prior result in these evidence sets
  };
}

// The report after a reorganization removed the anchoring publication
// (P9.5, P9.36): the prior result was anchored; the evidence set reads the
// anchoring sat in full at the new tip and finds no Originals inscription on
// it, and supplies a copy of the log, the author's history and the bytes.
//   satRead: { network, sat, tip, inscriptions } as an index reports it
export async function reorgReport({ evidenceSet, prior, log, authorLog, resources, satRead }) {
  const before = stats().failures;
  const problems = [];
  const authorDoc = await checkWebvh(authorLog, 'reorg report: author history');
  const { did } = checkOgLog(log, authorDoc, resources, 'reorg report');
  const prefix = { mainnet: '', signet: 'sig:', testnet: 'test:', regtest: 'reg:' }[satRead.network];
  const btco = `did:btco:${prefix}${satRead.sat}`;
  const anchorAt = log.findIndex((e) => e.state.asset.aliases.includes(btco));
  if (anchorAt < 1) problems.push('the copy has no anchoring entry for the read sat');
  if (satRead.inscriptions.some((x) => x.metaprotocol === 'og')) problems.push('the sat still holds Originals inscriptions; outside what this deriver covers');
  if (satRead.network !== evidenceSet.network || JSON.stringify(satRead.tip) !== JSON.stringify(evidenceSet.tip)) problems.push('sat read is not at the evidence set\'s network and tip');
  if (!prior || prior.axes.bitcoin !== 'anchored' || prior.bitcoin?.sat !== btco) problems.push('prior result is not anchored on this sat');
  if (evidenceSet.original !== did) problems.push('evidence set names another did:og');
  if (log.some((e) => e.state.editor)) problems.push('editor entries are outside what this deriver covers');
  const failed = problems.length > 0 || stats().failures > before;
  for (const p of problems) console.error('FAIL reorg report:', p);

  // Not anchored: the anchoring entry and every later entry of the copy are
  // ignored; the state is valid as of the entry before it (P9.5, P7.19).
  const kept = log.slice(0, anchorAt);
  const checkpoint = kept[kept.length - 1].versionId;
  const labels = kept.map((e) => (authorDoc.assertionMethod.includes(e.proof[0].verificationMethod) ? 'current-key' : 'key-removed-since'));
  const endorsed = kept.map((_, i) => kept.slice(i + 1).some((x, k) => !x.state.editor && labels[i + 1 + k] === 'current-key'));
  const { versions, diagnostics: missing } = missingResources(kept, resources);
  const history = evidenceSet.signerHistories.find((h) => h.did === log[0].state.author.did);
  const diagnostics = sortDiagnostics(missing);

  // Change records against the prior result (P14.25): the head moved back,
  // and the holder was lost with the anchor; the prior's anchoring
  // inscriptions are gone from a sat read in full, so the cause is a reorganization.
  const changes = [];
  if (prior.checkpoint !== checkpoint) changes.push({ kind: 'head', from: prior.checkpoint, to: checkpoint, cause: 'reorganization' });
  changes.push({ kind: 'holder', from: { sat: prior.bitcoin.sat, address: prior.bitcoin.holder.address }, to: null, cause: 'reorganization' });

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
    changes,
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
    changes: [],
  };
}

export { resourceDigest };
