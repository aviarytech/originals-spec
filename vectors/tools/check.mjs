// Verifies vectors/og-1.0-draft.1/ without using the generator's code:
// SCIDs, entry hashes, proofs, digests, the ZIP layout, CBOR metadata and ord
// envelopes are all re-derived here, and the did:webvh logs are verified with
// didwebvh-ts, an independent did:webvh implementation.
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  ASSET_OPT, ASSET_REQ, J, STATE, bytesEq, checkChain, checkOgLog, checkPackage, checkWebvh, counts, decodeCbor, decodeMultikey, eq, multihash, ok, parseEnvelope, parseLines, readZip, resourceDigest, sha, stats, td, te, verifyProof,
} from './verify-lib.mjs';
import { CODES, TRANSFER_DEPTH, anchorAbsentReport, canonicalLog, defaultCheck, offChainReport, sameReport, satReadProblems, transferCheck, unreadInscriptions, unsupportedReport } from './report-lib.mjs';
// Whole-report comparison (P14.25): equal as JSON values, ignoring each diagnostic's reason.
const sameAs = (derived, expected, msg) => ok(sameReport(derived, expected), `${msg}: ${JSON.stringify(derived)} != ${JSON.stringify(expected)}`);
// P14.25 shape: diagnostics; no manifest-style missing or dependencies, and no
// change records, since no earlier report is an input (P7.17).
const shape = (r, label) => {
  ok(!('missing' in r) && !('dependencies' in r) && !('changes' in r) && Array.isArray(r.diagnostics), `${label}: report has diagnostics, and no missing, dependencies or changes (P14.25)`);
  for (const d of r.diagnostics ?? []) eq(Object.keys(d).sort(), ['code', 'item', 'reason', 'rule'], `${label}: diagnostic members`), ok(CODES.includes(d.code), `${label}: diagnostic code ${d.code} is in the closed list`);
};
const noPrior = (ev, label) => ok(!('prior' in ev) && !ev.inputs.some((x) => x.kind === 'prior-result'), `${label}: the evidence set has no prior result (P7.17)`);
import { computeReport, legacySignersAllowed } from '../regtest/report.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', 'og-1.0-draft.1');
const read = (p) => new Uint8Array(readFileSync(join(ROOT, p)));
const readJSON = (p) => JSON.parse(readFileSync(join(ROOT, p), 'utf8'));

// ======================= run =======================
const authorEntries = parseLines(read('local/author/did.jsonl'), 'author log');
const authorDoc = await checkWebvh(authorEntries, 'author did:webvh');
ok(authorDoc.verificationMethod[0].publicKeyMultibase !== authorEntries[0].parameters.updateKeys[0], 'author: signing key is not an updateKey (P5.3)');

// local
const v1 = read('local/resources/v1.md'), v2 = read('local/resources/v2.md');
const resources = { [resourceDigest(v1)]: v1, [resourceDigest(v2)]: v2 };
const localLog = parseLines(read('local/asset/did.jsonl'), 'local asset log');
const { did: OG } = checkOgLog(localLog, authorDoc, resources, 'local');
const zipBytes = read('local/package/evidence.zip');
const zfiles = readZip(zipBytes);
const lp = checkPackage(zfiles, OG, 'local package');
ok(bytesEq(zfiles['asset/did.jsonl'], read('local/asset/did.jsonl')), 'local: package log equals asset/did.jsonl');
ok(bytesEq(zfiles['originals-evidence.json'], read('local/package/originals-evidence.json')), 'local: manifest file equals the packaged one');
eq(lp.authorLog, authorEntries, 'local: packaged author log');
const lr = readJSON('local/expected-report.json');
const lev = readJSON('local/evidence-set.json');
ok(lev.inputs[0].digest === resourceDigest(zipBytes), 'local: evidence-set digest of the package');
{
  // The whole report, derived from the evidence set alone: the package's log,
  // its author history and the resource bytes it carries (P7.17, P14.25).
  const pkgResources = Object.fromEntries(Object.entries(zfiles).filter(([k]) => k.startsWith('resources/')).map(([k, v]) => [k.slice('resources/'.length), v]));
  const derived = await offChainReport({ evidenceSet: lev, log: lp.log, authorLog: lp.authorLog, resources: pkgResources });
  sameAs(derived, lr, 'local report: whole report derived from the evidence set (P14.25)'); shape(lr, 'local report');
  ok(lr.checkpoint === lp.manifest.checkpoint, 'local report: checkpoint is the manifest checkpoint');
}
ok(canonicalLog(localLog) === td.decode(read('local/asset/did.jsonl')), 'local: asset log lines are their canonical form, JCS plus LF (P14.2, P14.3)');

// hosted
const served = (p) => read(`hosted/served/${p}`);
const aliasEntries = parseLines(served('did.jsonl'), 'alias log');
const aliasDoc = await checkWebvh(aliasEntries, 'alias did:webvh');
ok(aliasDoc.alsoKnownAs?.includes(OG), 'alias: DID document lists the did:og (P3.6)');
const walk = (d) => readdirSync(d).flatMap((n) => statSync(join(d, n)).isDirectory() ? walk(join(d, n)) : [join(d, n)]);
const servedPkg = Object.fromEntries(walk(join(ROOT, 'hosted/served/originals')).map((p) => [relative(join(ROOT, 'hosted/served/originals'), p), new Uint8Array(readFileSync(p))]));
const hp = checkPackage(servedPkg, OG, 'hosted package');
checkOgLog(hp.log, authorDoc, resources, 'hosted');
ok(hp.log[2].state.asset.aliases.includes(aliasDoc.id), 'hosted: entry 3 lists the alias, completing P3.6');
const ex = readJSON('hosted/exchanges.json');
const reqEntry = (k) => JSON.parse(ex.exchanges[k].request.entry);
let head = ex.initialHead;
ok(hp.log[1].versionId === head, 'hosted: initial head is entry 2');
{
  const e3 = reqEntry(0), stale = reqEntry(1);
  // Parent of an entry = predecessor versionId: recompute from its hash input.
  const parentOk = (e, parent) => { const { proof, ...x } = e; return multihash(J({ ...x, versionId: parent })) === e.versionId.split('-')[1]; };
  ok(parentOk(e3, head) && ex.exchanges[0].response.result === 'accepted', 'hosted: entry 3 extends the head and is accepted');
  checkOgLog([...hp.log.slice(0, 2), stale], authorDoc, resources, 'hosted stale candidate');
  head = e3.versionId;
  ok(parentOk(stale, ex.initialHead) && !parentOk(stale, head) && ex.exchanges[1].response.result === 'stale-parent' && ex.exchanges[1].response.head === head, 'hosted: stale candidate refused with the head');
  ok(ex.exchanges[2].request.entry === ex.exchanges[0].request.entry && ex.exchanges[2].response.result === 'already-accepted', 'hosted: byte-identical resubmission already accepted');
  ok(ex.exchanges[0].request.entry === td.decode(served('originals/asset/did.jsonl')).split('\n')[2] + '\n', 'hosted: served log holds the accepted entry');
}

// bitcoin
const chain = readJSON('bitcoin/chain.json');
ok(chain.synthetic === true && chain.network === 'regtest', 'bitcoin: synthetic regtest fixture');
// The index reads are in the evidence set, as a sat-read input (P14.25; T14-102):
// the fixture holds only where each envelope's bytes are.
ok(chain.inscriptions.every((x) => Object.keys(x).sort().join() === 'envelope,id') && !('holder' in chain) && !('tip' in chain), 'bitcoin: chain.json holds no index reads, only envelope locations (T14-102)');
const bev = readJSON('bitcoin/evidence-set.json');
const bsrInput = bev.inputs.find((x) => x.kind === 'sat-read');
const bsrBytes = read(bsrInput.source);
const bsr = JSON.parse(td.decode(bsrBytes));
eq(satReadProblems(bsr, bev.network, bev.tip), [], 'bitcoin: sat-read input has the P14.25 form');
eq(bev.inputs.filter((x) => x.kind === 'inscription').map((x) => x.source), bsr.inscriptions.map((x) => `index:${x.id}`), 'bitcoin: one inscription input per inscription the sat-read lists, in chain order');
const envOf = Object.fromEntries(chain.inscriptions.map((x) => [x.id, read(`bitcoin/${x.envelope}`)]));
// The author's did:webvh log, resolved from its host (P9.33, P8.5): a
// signer-history input with its source and the time obtained (P7.17).
const resolved = readJSON('bitcoin/resolved.json');
const bHistories = bev.signerHistories.map((h) => {
  const bytes = read(`bitcoin/${resolved.responses.find((r) => r.source === h.source).file}`);
  ok(bev.inputs.some((x) => x.kind === 'signer-history' && x.source === h.source && x.digest === resourceDigest(bytes)), `bitcoin: ${h.source} is a signer-history input with its digest`);
  return { ...h, bytes };
});
ok(bHistories.length === 1 && /^https:\/\//.test(bHistories[0].source) && typeof bHistories[0].obtained === 'string', 'bitcoin: the author log is resolved, with its URL and the time obtained (P9.33, P7.17)');
// The verifier's evidence, from evidence-set inputs only. A different tip
// re-derives each inscription's confirmations, as P14.25 fixes them.
const btcEvidence = ({ tip = bev.tip, envelopes = envOf, signerHistories = bHistories } = {}) => {
  let bytes = bsrBytes;
  if (tip !== bev.tip) bytes = te.encode(JSON.stringify({ ...bsr, tip, inscriptions: bsr.inscriptions.map((x) => ({ ...x, confirmations: tip.height - x.height + 1 })) }));
  return {
    network: bev.network, tip, depth: bev.depth, satRead: { source: bsrInput.source, bytes },
    inscriptions: bsr.inscriptions.map((x) => ({ id: x.id, envelope: envelopes[x.id], metaprotocol: 'og', contentType: parseEnvelope(envelopes[x.id]).contentType })),
    signerHistories,
  };
};
{
  // T14-099: confirmations that disagree with the tip make the read unusable.
  const bad = { ...bsr, inscriptions: bsr.inscriptions.map((x, k) => (k ? x : { ...x, confirmations: x.confirmations + 1 })) };
  ok(satReadProblems(bad, bev.network, bev.tip).some((q) => q.includes('confirmations')), 'sat-read: wrong confirmations are caught (T14-099)');
  ok(satReadProblems({ ...bsr, extra: 1 }, bev.network, bev.tip).length > 0, 'sat-read: an extra member is caught (P14.25)');
  ok(satReadProblems(bsr, 'mainnet', bev.tip).length > 0, 'sat-read: another network is caught (P14.25)');
  // T14-100: a listed inscription with no inscription input is unread.
  eq(unreadInscriptions(bsr, new Set([bsr.inscriptions[0].id])), [bsr.inscriptions[1].id], 'sat-read: a listed inscription with no envelope input is unread (T14-100)');
}
const parts = chain.inscriptions.map((x) => parseEnvelope(read(`bitcoin/${x.envelope}`)));
parts.forEach((p, k) => {
  eq(p.metadata.part, [k + 1, parts.length], `bitcoin part ${k + 1}: part member`);
  ok(p.metadataBytes + (p.body?.length ?? 0) <= 350000, `bitcoin part ${k + 1}: metadata and body ≤ 350,000 bytes`);
  ok(bytesEq(read(`bitcoin/inscriptions/part-${k + 1}.metadata.cbor`), p.metadataRaw), `bitcoin part ${k + 1}: metadata file equals the envelope's tag-5 pushes`);
});
ok(parts[0].body === null && parts[0].contentType === null, 'bitcoin: only the final part has a body or content type (P9.32)');
const inscribed = parts.flatMap((p) => p.metadata.entries);
checkOgLog(inscribed, authorDoc, resources, 'bitcoin');
const last = inscribed[inscribed.length - 1];
ok(last.state.asset.body === 'full' && parts[1].contentType === last.state.asset.resource.mediaType, 'bitcoin: body mode full and content type (P9.17)');
ok(resourceDigest(parts[1].body) === last.state.asset.resource.digest, 'bitcoin: body is the exact resource version');
ok(inscribed.findIndex((e) => e.state.asset.aliases.some((a) => a.startsWith('did:btco:'))) === inscribed.length - 1, 'bitcoin: anchoring entry is the last of the anchoring publication');
ok(last.state.asset.aliases.includes(`did:btco:reg:${bsr.sat}`), 'bitcoin: anchoring alias names the sat');
ok(parts.every((p) => Object.keys(p.metadata).every((k) => k === 'entries' || k === 'part')), 'bitcoin: metadata is {entries, part}, with no signers member (P14.12, D22)');
const resolvedLog = parseLines(bHistories[0].bytes, 'resolved author log');
ok(bHistories[0].did === last.state.author.did, 'bitcoin: the resolved log is the author\'s (P9.33)');
await checkWebvh(resolvedLog, 'resolved author log');
ok(resolvedLog.some((e) => e.versionId === last.state.author.versionId), 'bitcoin: the resolved author log holds the named version (P5.3, P9.33)');
const total = parts.reduce((n, p) => n + p.metadataBytes, 0);
ok(total + parts[1].body.length > 350000, 'bitcoin: one inscription would exceed 350,000 bytes, so parts are justified');
const br = readJSON('bitcoin/expected-report.json');
ok(br.evidence.inputs[0].kind === 'sat-read' && br.evidence.inputs[0].digest === resourceDigest(bsrBytes), 'bitcoin report: sat-read input digest');
chain.inscriptions.forEach((x, k) => ok(br.evidence.inputs[k + 1].digest === resourceDigest(read(`bitcoin/${x.envelope}`)), `bitcoin report: input digest ${k + 1}`));
{
  // The whole report, derived from the evidence set's inputs only (P9.18,
  // P14.25; T14-102), with the same verifier the regtest gate runs against ord.
  const derived = await computeReport(btcEvidence());
  eq(derived.evidence, { inputs: bev.inputs, network: bev.network, tip: bev.tip, depth: bev.depth }, 'bitcoin report: evidence matches the evidence set');
  sameAs(derived, br, 'bitcoin report: whole report derived from the evidence set (P14.25)'); shape(br, 'bitcoin report'); noPrior(bev, 'bitcoin');
  ok(defaultCheck(br) && transferCheck(br), 'bitcoin report: default and transfer checks pass at 9 confirmations (P7.22)');
}

// Transfer depth (P7.22, P14.13; T7-071, T7-072): the same reads at a tip that
// gives the publication 5, then 6, confirmations. Derived only, not a vector.
{
  const finalBlock = bsr.inscriptions[bsr.inscriptions.length - 1].height;
  const at = async (confs) => computeReport(btcEvidence({ tip: { height: finalBlock + confs - 1, hash: bev.tip.hash } }));
  const shallow = await at(TRANSFER_DEPTH - 1);
  const deep = shallow.diagnostics.filter((d) => d.code === 'insufficient-depth');
  ok(deep.length === 1 && deep[0].item.kind === 'inscription' && deep[0].item.id === bsr.inscriptions[0].id && deep[0].rule === 'P7.22', 'depth: 5 confirmations give one insufficient-depth diagnostic naming the first inscription (T7-071)');
  ok(defaultCheck(shallow) && !transferCheck(shallow), 'depth: at 5 confirmations the default check passes and the transfer check fails (T7-071)');
  const enough = await at(TRANSFER_DEPTH);
  ok(!enough.diagnostics.some((d) => d.code === 'insufficient-depth') && transferCheck(enough), 'depth: at exactly 6 confirmations the transfer check passes (T7-072)');
  shape(shallow, 'depth report');
}

// CBOR member order (P14.12; T14-097, T14-098): the vector's envelopes are a
// fixed read fixture; equivalent metadata with map members in other orders is
// re-encoded here, independently of the generator, and must decode to the
// same entries and give the same report, apart from the inputs' digests.
{
  const head = (major, n) => n < 24 ? [(major << 5) | n] : n < 0x100 ? [(major << 5) | 24, n] : n < 0x10000 ? [(major << 5) | 25, n >> 8, n & 0xff] : [(major << 5) | 26, (n >>> 24) & 0xff, (n >> 16) & 0xff, (n >> 8) & 0xff, n & 0xff];
  const enc = (v, order) => {
    if (v === null) return [0xf6]; if (v === true) return [0xf5]; if (v === false) return [0xf4];
    if (typeof v === 'number') return v >= 0 ? head(0, v) : head(1, -1 - v);
    if (typeof v === 'string') { const b = [...te.encode(v)]; return [...head(3, b.length), ...b]; }
    if (Array.isArray(v)) return [...head(4, v.length), ...v.flatMap((x) => enc(x, order))];
    const keys = order(Object.keys(v));
    return [...head(5, keys.length), ...keys.flatMap((k) => [...enc(k, order), ...enc(v[k], order)])];
  };
  const push = (d) => d.length <= 75 ? [d.length, ...d] : d.length <= 0xff ? [0x4c, d.length, ...d] : [0x4d, d.length & 0xff, d.length >> 8, ...d];
  const envelopeOf = (p, metadata) => {
    const out = [0x00, 0x63, ...push([...te.encode('ord')])];
    if (p.contentType) out.push(...push([1]), ...push([...te.encode(p.contentType)]));
    out.push(...push([7]), ...push([...te.encode('og')]));
    for (let i = 0; i < metadata.length; i += 520) out.push(...push([5]), ...push(metadata.slice(i, i + 520)));
    if (p.body) { out.push(0x00); for (let i = 0; i < p.body.length; i += 520) out.push(...push([...p.body.subarray(i, i + 520)])); }
    out.push(0x68);
    return new Uint8Array(out);
  };
  const orders = {
    reversed: (ks) => [...ks].reverse(),
    sorted: (ks) => [...ks].sort(),
    'part-first': (ks) => [...ks].sort((a, b) => (b === 'part') - (a === 'part') || (a < b ? 1 : a > b ? -1 : 0)),
  };
  const fixture = chain.inscriptions.map((x) => parseEnvelope(read(`bitcoin/${x.envelope}`)));
  const strip = (r) => ({ ...r, evidence: { ...r.evidence, inputs: r.evidence.inputs.map(({ digest, ...i }) => i) } });
  for (const [name, order] of Object.entries(orders)) {
    const envelopes = fixture.map((p) => envelopeOf(p, enc(p.metadata, order)));
    ok(envelopes.some((e, k) => !bytesEq(e, read(`bitcoin/${chain.inscriptions[k].envelope}`))), `cbor order ${name}: the re-encoded envelopes differ from the fixture's bytes`);
    const decoded = envelopes.map(parseEnvelope);
    decoded.forEach((p, k) => ok(td.decode(J(p.metadata)) === td.decode(J(fixture[k].metadata)), `cbor order ${name}: part ${k + 1} decodes to the same JSON values (T14-097)`));
    const derived = await computeReport(btcEvidence({ envelopes: Object.fromEntries(chain.inscriptions.map((x, k) => [x.id, envelopes[k]])) }));
    sameAs(strip(derived), strip(br), `cbor order ${name}: the same report apart from the inputs' digests (T14-097, T14-098)`);
  }
  // A `signers` member, as inscriptions written before D22 carry, is ignored
  // only on mainnet at height 977,150 or lower (P14.12; T14-103); this regtest
  // vector is outside that bound, so there it makes the metadata invalid like
  // any other unknown member (T14-106, T14-003).
  const withMember = (member) => fixture.map((p, k) => envelopeOf(p, enc(k === 0 ? { ...p.metadata, ...member } : p.metadata, orders.sorted)));
  const envs = (list) => Object.fromEntries(chain.inscriptions.map((x, k) => [x.id, list[k]]));
  const quiet = console.error; console.error = () => {}; // the expected FAIL lines
  const legacy = await computeReport(btcEvidence({ envelopes: envs(withMember({ signers: [{ did: last.state.author.did, log: [{ versionId: '1-zQmForged', note: 'not evidence' }] }] })) }));
  const unknown = await computeReport(btcEvidence({ envelopes: envs(withMember({ extra: 1 })) }));
  console.error = quiet;
  ok(legacy.axes.outcome === 'invalid', 'signers member on regtest: the metadata invalid (P14.12, T14-106)');
  ok(unknown.axes.outcome === 'invalid', 'unknown metadata member: invalid (P14.12, T14-003)');
  // The mainnet exception's bound, which the regtest vector cannot reach (T14-103, T14-106).
  ok(legacySignersAllowed('mainnet', 977095) && legacySignersAllowed('mainnet', 977150), 'signers member: ignored on mainnet at height 977,150 or lower (P14.12, T14-103)');
  ok(!legacySignersAllowed('mainnet', 977151) && !legacySignersAllowed('regtest', 102) && !legacySignersAllowed('signet', 100) && !legacySignersAllowed('testnet', 100), 'signers member: not ignored above height 977,150 or on any other network (P14.12, T14-106)');
}

// The author's resolved log missing (P9.33; T9-140): missing evidence, never
// acceptance. Derived only, not a vector.
{
  const absent = await computeReport(btcEvidence({ signerHistories: [] }));
  ok(absent.axes.outcome === 'incomplete' && absent.axes.identity === 'incomplete' && absent.axes.bitcoin === 'undetermined', 'no resolved author log: outcome and identity incomplete, bitcoin undetermined (P9.33, P9.16, T9-140)');
  ok(absent.diagnostics.some((d) => d.code === 'signer-history-missing' && d.rule === 'P5.6' && d.item.id === last.state.author.did), 'no resolved author log: a signer-history-missing diagnostic (P5.6, T9-140)');
  ok(!absent.entries.some((e) => e.status === 'accepted'), 'no resolved author log: no entry accepted (P5.6, T9-140)');
  shape(absent, 'missing author log report');
}

// Several logs for the author (P9.33; T9-148, T9-149): a log that fails
// anywhere is not evidence, with no verified prefix used, and the order of
// the inputs never changes the report. The failing log here is the resolved
// one with a forged second version appended. Derived only, not a vector.
{
  const good = bHistories[0];
  const forgedLine = JSON.stringify({ ...resolvedLog[0], versionId: '2-QmForgedVersionNotSignedByTheUpdateKeys', versionTime: '2026-01-02T00:00:00Z' });
  const forged = { did: good.did, source: 'https://mirror.example/did.jsonl', obtained: '2026-01-07T00:00:00Z', bytes: te.encode(td.decode(good.bytes) + forgedLine + '\n') };
  const noEvidence = ({ evidence, ...r }) => r;
  const ab = await computeReport(btcEvidence({ signerHistories: [good, forged] }));
  const ba = await computeReport(btcEvidence({ signerHistories: [forged, good] }));
  sameAs(ab, ba, 'two author logs: the same report in either input order (P9.33, P7.17, T9-148)');
  sameAs(noEvidence(ab), noEvidence(br), 'two author logs: the failing one is not evidence; the report is the one-log report apart from its inputs (P9.33, T9-148)');
  const alone = await computeReport(btcEvidence({ signerHistories: [forged] }));
  ok(alone.axes.outcome === 'incomplete' && alone.axes.identity === 'incomplete' && alone.axes.bitcoin === 'undetermined', 'failing author log alone: not evidence, its verified prefix unused; outcome and identity incomplete, bitcoin undetermined (P9.33, T9-149)');
  ok(alone.diagnostics.some((d) => d.code === 'signer-history-missing' && d.item.id === good.did) && !alone.entries.some((e) => e.status === 'accepted' || e.status === 'rejected'), 'failing author log alone: signer-history-missing, nothing accepted or rejected (P9.33, T9-149)');
  shape(alone, 'failing author log report');
}

// genesis vector (P14.1, P14.27–P14.29)
{
  const gl = parseLines(read('genesis/did.jsonl'), 'genesis log');
  ok(gl.length === 1, 'genesis: one entry');
  const ge = gl[0];
  checkOgLog(gl, authorDoc, { [resourceDigest(v1)]: read('genesis/resources/v1.md') }, 'genesis');
  eq(ge, localLog[0], 'genesis: the same entry as local entry 1');
  const scid = ge.parameters.scid;
  // P14.28 verification steps, written out independently of checkChain.
  const { proof, ...noProof } = ge;
  const placeholder = JSON.parse(JSON.stringify({ ...noProof, versionId: '{SCID}' }).split(scid).join('{SCID}'));
  ok(bytesEq(read('genesis/scid-input.json'), J(placeholder)), 'genesis: scid-input.json is the JCS form of the placeholder entry (P14.28)');
  ok(multihash(read('genesis/scid-input.json')) === scid, 'genesis: SCID is the multihash of scid-input.json (P14.28)');
  ok(bytesEq(read('genesis/entry-hash-input.json'), J({ ...noProof, versionId: scid })), 'genesis: entry-hash-input.json is the entry with versionId = SCID (P14.29)');
  ok(ge.versionId === '1-' + multihash(read('genesis/entry-hash-input.json')), 'genesis: versionId is 1- and the entry hash (P14.29)');
  ok(ge.state.id === `did:og:${scid}`, 'genesis: state.id is did:og and the SCID');
  const d = readJSON('genesis/derivation.json');
  ok(d.scid === scid && d.versionId === ge.versionId, 'genesis: derivation.json values');
  const gr = readJSON('genesis/expected-report.json');
  const gev = readJSON('genesis/evidence-set.json');
  ok(gev.inputs.every((x) => x.digest === resourceDigest(read(x.source))), 'genesis: evidence-set digests');
  // The whole report, derived from the evidence set's inputs only (P7.17, P14.25).
  const input = (kind) => read(gev.inputs.find((x) => x.kind === kind).source);
  const gres = read(gev.inputs.find((x) => x.kind === 'resource').source);
  const derived = await offChainReport({
    evidenceSet: gev,
    log: parseLines(input('log'), 'genesis evidence log'),
    authorLog: parseLines(input('signer-history'), 'genesis evidence author log'),
    resources: { [resourceDigest(gres)]: gres },
  });
  sameAs(derived, gr, 'genesis report: whole report derived from the evidence set (P14.25)'); shape(gr, 'genesis report');
  ok(gr.axes.offline === 'self-contained', 'genesis report: a complete loose evidence set is self-contained (P7.21, T7-067)');
  // Writer comparison: canonical entry bytes, JCS plus LF (P14.2, P14.3).
  ok(canonicalLog(gl) === td.decode(read('genesis/did.jsonl')), 'genesis: did.jsonl is the canonical form of its entry, JCS plus LF');
}

// prior-format fixture: the mainnet acceptance Original of 1 November 2026 (T14-085)
{
  const PF = join(ROOT, '..', 'prior-format');
  const chain = JSON.parse(readFileSync(join(PF, 'chain.json'), 'utf8'));
  const dsha = (b) => sha(sha(b));
  const entries = [];
  for (const x of chain.inscriptions) {
    const tx = Buffer.from(readFileSync(join(PF, x.transaction), 'utf8').trim(), 'hex');
    // Parse a segwit transaction; the txid is over the serialization without marker, flag and witness.
    let i = 4;
    ok(tx[4] === 0 && tx[5] === 1, `prior ${x.revealTxid}: segwit marker`);
    i = 6;
    const varint = () => { const f = tx[i++]; if (f < 0xfd) return f; if (f === 0xfd) { const v = tx.readUInt16LE(i); i += 2; return v; } if (f === 0xfe) { const v = tx.readUInt32LE(i); i += 4; return v; } throw new Error('varint'); };
    const insStart = i;
    const nin = varint();
    for (let k = 0; k < nin; k++) { i += 36; const n = varint(); i += n + 4; }
    const nout = varint();
    for (let k = 0; k < nout; k++) { i += 8; const n = varint(); i += n; }
    const insEnd = i;
    const witness = [];
    for (let k = 0; k < nin; k++) { const n = varint(); const items = []; for (let m = 0; m < n; m++) { const l = varint(); items.push(tx.subarray(i, i + l)); i += l; } witness.push(items); }
    const lock = tx.subarray(i, i + 4); i += 4;
    ok(i === tx.length, `prior ${x.revealTxid}: whole transaction parsed`);
    const legacy = Buffer.concat([tx.subarray(0, 4), tx.subarray(insStart, insEnd), lock]);
    ok(Buffer.from(dsha(legacy)).reverse().toString('hex') === x.revealTxid, `prior ${x.revealTxid}: txid matches the transaction bytes`);
    const script = witness[0][1];
    const at = script.indexOf(Buffer.from([0x00, 0x63, 0x03, 0x6f, 0x72, 0x64]));
    ok(at >= 0, `prior ${x.revealTxid}: ord envelope in the reveal script`);
    // Read the envelope's fields: tag 1 (content type) only, then the body.
    let j = at + 6; const fields = {}; const body = [];
    const pushData = () => { const o = script[j++]; let n; if (o <= 75) n = o; else if (o === 0x4c) n = script[j++]; else if (o === 0x4d) { n = script[j] | (script[j + 1] << 8); j += 2; } else return null; const dd = script.subarray(j, j + n); j += n; return dd; };
    while (script[j] !== 0x68) {
      const tag = pushData();
      if (tag.length === 0) { while (script[j] !== 0x68) body.push(pushData()); break; }
      (fields[tag[0]] ??= []).push(pushData());
    }
    ok(Object.keys(fields).join() === '1' && td.decode(fields[1][0]) === chain.contentType, `prior ${x.revealTxid}: content type only, no metaprotocol (not an Originals inscription under P9.31)`);
    for (const e of parseLines(new Uint8Array(Buffer.concat(body)), `prior ${x.revealTxid} body`)) entries.push(e);
  }
  checkChain(entries, 'prior-format log');
  ok(entries[0].parameters.method === chain.method && chain.method !== 'og:1.0-draft.1', 'prior: method value is originals:1.0, not one this draft implements (P14.1)');
  ok(entries[0].state.id === chain.did && chain.did.startsWith('did:vh:'), 'prior: identifier is the earlier did:vh form');
  const pr = JSON.parse(readFileSync(join(PF, 'expected-report.json'), 'utf8'));
  // The whole report: a method value this draft does not implement is
  // `unsupported`, and nothing else is reported about the log (P14.1, P14.25).
  const derived = unsupportedReport({
    network: chain.network,
    inputs: chain.inscriptions.map((x) => ({ kind: 'transaction', source: `mempool.space:${x.revealTxid}`, digest: resourceDigest(new Uint8Array(Buffer.from(readFileSync(join(PF, x.transaction), 'utf8').trim(), 'hex'))) })),
  });
  ok(entries[0].parameters.method !== 'og:1.0-draft.1', 'prior: derived outcome is unsupported because the method value is not implemented');
  sameAs(derived, pr, 'prior report: whole report derived (T14-085, P14.25)'); shape(pr, 'prior report');
}

// missing-resource vector: loose inputs without version 1 (P7.21, T7-068)
{
  const mev = readJSON('missing-resource/evidence-set.json');
  ok(mev.inputs.every((x) => x.digest === resourceDigest(read(x.source))), 'missing-resource: evidence-set digests');
  const input = (kind) => read(mev.inputs.find((x) => x.kind === kind).source);
  const res = Object.fromEntries(mev.inputs.filter((x) => x.kind === 'resource').map((x) => { const b = read(x.source); return [resourceDigest(b), b]; }));
  ok(!res[resourceDigest(v1)], 'missing-resource: version 1 is not supplied');
  const derived = await offChainReport({
    evidenceSet: mev, log: parseLines(input('log'), 'missing-resource log'), authorLog: parseLines(input('signer-history'), 'missing-resource author log'), resources: res,
  });
  const mr = readJSON('missing-resource/expected-report.json');
  sameAs(derived, mr, 'missing-resource report: whole report derived from the evidence set (P14.25)'); shape(mr, 'missing-resource report');
  ok(mr.axes.offline === 'needs-external' && mr.axes.availability === 'partial', 'missing-resource: needs-external and partial (P7.21, P7.4)');
  ok(mr.diagnostics.length === 1 && mr.diagnostics[0].code === 'resource-missing' && mr.diagnostics[0].item.id === resourceDigest(v1), 'missing-resource: one resource-missing diagnostic for version 1');
}
// anchor-absent vector: the anchoring sat read in full with no anchoring publication (P9.5, T9-135)
{
  const aev = readJSON('anchor-absent/evidence-set.json');
  noPrior(aev, 'anchor-absent');
  ok(aev.inputs.every((x) => x.digest === resourceDigest(read(x.source))), 'anchor-absent: evidence-set digests');
  const input = (kind) => read(aev.inputs.find((x) => x.kind === kind).source);
  const satRead = JSON.parse(td.decode(input('sat-read')));
  ok(satRead.sat === bsr.sat && satRead.complete === true && satRead.inscriptions.length === 0, 'anchor-absent: the sat is read in full with no inscription');
  eq(satReadProblems(satRead, aev.network, aev.tip), [], 'anchor-absent: sat-read input has the P14.25 form');
  const res = Object.fromEntries(aev.inputs.filter((x) => x.kind === 'resource').map((x) => { const b = read(x.source); return [resourceDigest(b), b]; }));
  const log = parseLines(input('log'), 'anchor-absent log');
  eq(log.map((e) => e.versionId), inscribed.map((e) => e.versionId), 'anchor-absent: the copy is the anchored log');
  const derived = await anchorAbsentReport({
    evidenceSet: aev, log, authorLog: parseLines(input('signer-history'), 'anchor-absent author log'), resources: res, satRead,
  });
  const ar = readJSON('anchor-absent/expected-report.json');
  sameAs(derived, ar, 'anchor-absent report: whole report derived from the evidence set (P14.25)'); shape(ar, 'anchor-absent report');
  ok(!('bitcoin' in ar) && ar.axes.bitcoin === 'not-anchored' && ar.entries[ar.entries.length - 1].status === 'ignored', 'anchor-absent: not anchored, the anchoring entry ignored, no bitcoin member');
}
for (const v of ['genesis', 'local', 'missing-resource']) noPrior(readJSON(`${v}/evidence-set.json`), v);
// T14-101: each diagnostic code carries the one rule P14.25 fixes for it.
{
  const RULE = {
    'target-missing': ['P3.2'], 'resource-missing': ['P7.4'], 'resource-mismatch': ['P7.4'], 'signer-history-missing': ['P5.6'],
    'signer-version-missing': ['P7.8'], 'proof-unchecked': ['P7.19'], 'anchoring-sat-not-read': ['P7.14', 'P9.17', 'P9.10'],
    'signer-sat-not-read': ['P9.35'], 'inscription-unverifiable': ['P9.15'], 'publication-waiting': ['P9.36'],
    'input-unusable': ['P7.17'], 'insufficient-depth': ['P7.22'],
  };
  eq(Object.keys(RULE).sort(), CODES.filter((c) => c !== 'entry-rejected').sort(), 'diagnostics: every code but entry-rejected has a fixed rule (P14.25)');
  for (const v of ['genesis', 'local', 'missing-resource', 'bitcoin', 'anchor-absent']) {
    for (const d of readJSON(`${v}/expected-report.json`).diagnostics) if (d.code !== 'entry-rejected') ok(RULE[d.code].includes(d.rule), `${v}: ${d.code} carries rule ${d.rule}, the one P14.25 fixes (T14-101)`);
  }
}
{ const { checks, failures } = stats(); console.log(`${checks} checks, ${failures} failures`); process.exit(failures ? 1 : 0); }
