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

  const versions = [];
  for (const e of log) for (const t of e.state.transitions) versions.push({ digest: t.to, versionId: e.versionId });
  const missing = versions.map((v, i) => ({ kind: 'resource', version: i + 1, digest: v.digest, versionId: v.versionId }))
    .filter((v) => !resources[v.digest]);
  const history = evidenceSet.signerHistories.find((h) => h.did === log[0].state.author.did);
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
      availability: missing.length === 0 ? 'complete' : (missing.length === versions.length ? 'none' : 'partial'),
      offline: 'self-contained', // no did:btco signer and no anchor (P7.21)
      bitcoin: 'not-read',
    },
    entries: log.map((e, i) => ({ versionId: e.versionId, status: 'accepted', authority: labels[i], endorsed: endorsed[i], ordering: 'claimed' })),
    signers: history ? [{
      did: history.did, role: 'author', latestVersionId: authorLog[authorLog.length - 1].versionId,
      source: history.source, obtained: history.obtained, freshness: 'not-established',
    }] : [],
    missing,
    dependencies: [],
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
    missing: [],
    dependencies: [],
  };
}

export { resourceDigest };
