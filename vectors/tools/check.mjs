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
ok(lr.checkpoint === lp.manifest.checkpoint && lr.original === OG, 'local report: checkpoint and original');
eq(lr.entries.map((e) => e.versionId), localLog.map((e) => e.versionId), 'local report: entries');
eq(lr.axes, { outcome: 'verified', binding: 'bound', history: 'valid', identity: 'complete', authority: 'current', state: 'valid-as-of', availability: 'complete', offline: 'self-contained', bitcoin: 'not-read' }, 'local report: axes');

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
ok(last.state.asset.aliases.includes(`did:btco:reg:${chain.sat}`), 'bitcoin: anchoring alias names the sat');
const sh = parts[0].metadata.signers;
ok(sh.length === 1 && sh[0].did === last.state.author.did, 'bitcoin: inscribed signer history for the author (P9.33)');
await checkWebvh(sh[0].log, 'inscribed signer history');
ok(sh[0].log.some((e) => e.versionId === last.state.author.versionId), 'bitcoin: named author version is inscribed before the entry');
const total = parts.reduce((n, p) => n + p.metadataBytes, 0);
ok(total + parts[1].body.length > 350000, 'bitcoin: one inscription would exceed 350,000 bytes, so parts are justified');
const br = readJSON('bitcoin/expected-report.json');
chain.inscriptions.forEach((x, k) => ok(br.evidence.inputs[k].digest === resourceDigest(read(`bitcoin/${x.envelope}`)), `bitcoin report: input digest ${k + 1}`));
eq(br.entries.map((e) => e.versionId), inscribed.map((e) => e.versionId), 'bitcoin report: entries');
ok(br.axes.state === 'current' && br.axes.bitcoin === 'anchored' && br.axes.availability === 'partial', 'bitcoin report: axes');
ok(br.missing[0].digest === inscribed[0].state.asset.resource.digest, 'bitcoin report: version 1 bytes are missing');

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
  ok(gr.checkpoint === ge.versionId && gr.original === `did:og:${scid}`, 'genesis report: checkpoint and original');
  eq(gr.axes, { outcome: 'verified', binding: 'bound', history: 'valid', identity: 'complete', authority: 'current', state: 'valid-as-of', availability: 'complete', offline: 'self-contained', bitcoin: 'not-read' }, 'genesis report: axes');
  const gev = readJSON('genesis/evidence-set.json');
  ok(gev.inputs.every((x) => x.digest === resourceDigest(read(x.source.replace(/^genesis\//, 'genesis/')))), 'genesis: evidence-set digests');
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
  ok(pr.axes.outcome === 'unsupported' && Object.keys(pr.axes).length === 1 && pr.checkpoint === null, 'prior: expected outcome unsupported, with no state (T14-085)');
}

{ const { checks, failures } = stats(); console.log(`${checks} checks, ${failures} failures`); process.exit(failures ? 1 : 0); }
