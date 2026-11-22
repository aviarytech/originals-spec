// Verifies vectors/og-1.0-draft.1/ without using the generator's code:
// SCIDs, entry hashes, proofs, digests, the ZIP layout, CBOR metadata and ord
// envelopes are all re-derived here, and the did:webvh logs are verified with
// didwebvh-ts, an independent did:webvh implementation.
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { ed25519 } from '@noble/curves/ed25519.js';
import { sha256 } from '@noble/hashes/sha2.js';
import { base58 } from '@scure/base';
import canonicalize from 'canonicalize';
import { resolveDIDFromLog } from 'didwebvh-ts';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', 'og-1.0-draft.1');
const read = (p) => new Uint8Array(readFileSync(join(ROOT, p)));
const readJSON = (p) => JSON.parse(readFileSync(join(ROOT, p), 'utf8'));
const te = new TextEncoder(), td = new TextDecoder('utf-8', { fatal: true });
let failures = 0, checks = 0;
const ok = (cond, msg) => { checks++; if (!cond) { failures++; console.error('FAIL', msg); } };
const eq = (a, b, msg) => ok(JSON.stringify(a) === JSON.stringify(b), `${msg}: ${JSON.stringify(a)} != ${JSON.stringify(b)}`);
const bytesEq = (a, b) => a.length === b.length && a.every((x, i) => x === b[i]);

const sha = (b) => sha256(b);
const multihash = (b) => { const h = sha(b); const m = new Uint8Array(34); m[0] = 0x12; m[1] = 0x20; m.set(h, 2); return base58.encode(m); };
const resourceDigest = (b) => 'z' + multihash(b);
const J = (v) => te.encode(canonicalize(v));

// ---------- JSON Lines (P14.2) ----------
function parseLines(bytes, label) {
  const text = td.decode(bytes);
  ok(text.endsWith('\n') && !text.includes('\r'), `${label}: line format`);
  return text.slice(0, -1).split('\n').map((l) => {
    const v = JSON.parse(l);
    ok(JSON.stringify(v) === l, `${label}: compact JSON with no whitespace outside strings`);
    return v;
  });
}

// ---------- Ed25519 / eddsa-jcs-2022 ----------
function decodeMultikey(mk) {
  ok(mk[0] === 'z', 'multikey is base58btc');
  const b = base58.decode(mk.slice(1));
  ok(b.length === 34 && b[0] === 0xed && b[1] === 0x01, 'Ed25519 Multikey: prefix 0xed01 and 32 bytes (P14.8)');
  return b.slice(2);
}
function verifyProof(doc, p, pub, label, { allowCreated }) {
  const members = Object.keys(p).sort();
  const expected = ['cryptosuite', 'proofPurpose', 'proofValue', 'type', 'verificationMethod', ...(allowCreated ? ['created'] : [])].sort();
  eq(members, expected, `${label}: proof members`);
  ok(p.type === 'DataIntegrityProof' && p.cryptosuite === 'eddsa-jcs-2022' && p.proofPurpose === 'assertionMethod', `${label}: proof type, cryptosuite and purpose`);
  const { proofValue, ...options } = p;
  ok(proofValue[0] === 'z', `${label}: proofValue multibase`);
  const sig = base58.decode(proofValue.slice(1));
  ok(sig.length === 64, `${label}: 64-byte signature`);
  const point = ed25519.Point.fromBytes(pub);
  ok(!point.isSmallOrder(), `${label}: key is not small-order`);
  ok(!ed25519.Point.fromBytes(sig.slice(0, 32)).isSmallOrder(), `${label}: R is not small-order`);
  const data = new Uint8Array(64);
  data.set(sha(J(options)), 0); data.set(sha(J(doc)), 32);
  ok(ed25519.verify(sig, data, pub, { zip215: false }), `${label}: signature verifies`);
}

// ---------- VH-Log chain: SCID and entry hashes ----------
function checkChain(entries, label) {
  const scid = entries[0].parameters.scid;
  {
    const { proof, ...e } = entries[0];
    const pre = JSON.parse(JSON.stringify({ ...e, versionId: '{SCID}' }).replaceAll(scid, '{SCID}'));
    ok(multihash(J(pre)) === scid, `${label}: SCID`);
  }
  let prev = scid;
  entries.forEach((entry, i) => {
    const { proof, ...e } = entry;
    const [n, h] = entry.versionId.split('-');
    ok(Number(n) === i + 1, `${label}: version number ${i + 1}`);
    ok(multihash(J({ ...e, versionId: prev })) === h, `${label}: entry hash of entry ${i + 1}`);
    if (i > 0) ok(entry.versionTime > entries[i - 1].versionTime, `${label}: versionTime increases`);
    prev = entry.versionId;
  });
  return scid;
}

// ---------- did:webvh logs, via didwebvh-ts ----------
async function checkWebvh(entries, label) {
  const r = await resolveDIDFromLog(entries);
  ok(r && !r.didResolutionMetadata?.error && r.didDocument?.id === entries[entries.length - 1].state.id, `${label}: didwebvh-ts resolves the log`);
  checkChain(entries, label);
  return r.didDocument;
}

// ---------- did:og asset log under the profile (the checks the vectors exercise) ----------
const STATE = ['asset', 'author', 'id', 'operation', 'transitions'];
const ASSET_REQ = ['aliases', 'name', 'network', 'resource', 'status'];
const ASSET_OPT = ['body', 'editors', 'metadata', 'preview'];
function checkOgLog(entries, authorDoc, resources, label) {
  const scid = checkChain(entries, label);
  const did = `did:og:${scid}`;
  eq(entries[0].parameters, { method: 'og:1.0-draft.1', scid }, `${label}: genesis parameters (P14.1)`);
  let anchored = false;
  entries.forEach((entry, i) => {
    const L = `${label} entry ${i + 1}`;
    if (i > 0) eq(entry.parameters, {}, `${L}: parameters`);
    const s = entry.state;
    eq(Object.keys(s).sort(), STATE, `${L}: state members (P14.4)`);
    ok(s.id === did, `${L}: id`);
    ok(s.operation === (i === 0 ? 'create' : 'update'), `${L}: operation`);
    eq(s.author, entries[0].state.author, `${L}: author fixed at genesis (P5.8)`);
    const keys = Object.keys(s.asset);
    ok(ASSET_REQ.every((k) => keys.includes(k)) && keys.every((k) => ASSET_REQ.includes(k) || ASSET_OPT.includes(k)), `${L}: asset members (P14.5)`);
    ok(s.asset.network === 'regtest' && s.asset.network === entries[0].state.asset.network, `${L}: network fixed (P9.34)`);
    const btco = s.asset.aliases.filter((a) => a.startsWith('did:btco:'));
    ok(('body' in s.asset) === (btco.length > 0), `${L}: body present exactly with a did:btco alias (P14.5)`);
    if (btco.length) { ok(/^did:btco:reg:(0|[1-9][0-9]{0,15})$/.test(btco[0]), `${L}: did:btco alias names the genesis network (P9.10)`); anchored = true; }
    const prevDigest = i ? entries[i - 1].state.asset.resource.digest : null;
    const d = s.asset.resource.digest;
    if (d !== prevDigest) eq(s.transitions, [{ from: prevDigest, to: d }], `${L}: transition`);
    else eq(s.transitions, [], `${L}: no transition`);
    if (resources[d]) {
      ok(resourceDigest(resources[d]) === d && resources[d].length === s.asset.resource.size, `${L}: resource bytes match descriptor`);
    }
    // Signer binding (P5.2, P5.3) against the author's did:webvh document.
    ok(entry.proof.length === 1, `${L}: one proof`);
    const p = entry.proof[0];
    ok(p.verificationMethod === s.author.verificationMethod, `${L}: proof verificationMethod is the signer reference's`);
    const vm = authorDoc.verificationMethod.find((v) => v.id === p.verificationMethod);
    ok(vm && vm.type === 'Multikey' && vm.controller === authorDoc.id && authorDoc.assertionMethod.includes(vm.id), `${L}: assertionMethod Multikey in the author's DID document`);
    const { proof, ...doc } = entry;
    verifyProof(doc, p, decodeMultikey(vm.publicKeyMultibase), L, { allowCreated: false });
  });
  return { did, anchored };
}

// ---------- ZIP (P14.10) ----------
function readZip(b) {
  const v = new DataView(b.buffer, b.byteOffset, b.byteLength);
  const e = b.length - 22;
  ok(v.getUint32(e, true) === 0x06054b50 && v.getUint16(e + 20, true) === 0, 'zip: end record with no comment');
  const count = v.getUint16(e + 10, true), cdSize = v.getUint32(e + 12, true), cdOff = v.getUint32(e + 16, true);
  ok(cdOff + cdSize === e, 'zip: central directory directly before the end record');
  const files = {}; const names = [];
  let c = cdOff, expectOff = 0;
  for (let i = 0; i < count; i++) {
    ok(v.getUint32(c, true) === 0x02014b50, 'zip: central header');
    const made = v.getUint16(c + 4, true), need = v.getUint16(c + 6, true), flags = v.getUint16(c + 8, true), method = v.getUint16(c + 10, true);
    const time = v.getUint16(c + 12, true), date = v.getUint16(c + 14, true), crc = v.getUint32(c + 16, true);
    const csize = v.getUint32(c + 20, true), size = v.getUint32(c + 24, true);
    const nlen = v.getUint16(c + 28, true), xlen = v.getUint16(c + 30, true), clen = v.getUint16(c + 32, true);
    const ext = v.getUint32(c + 38, true), off = v.getUint32(c + 42, true);
    const name = td.decode(b.subarray(c + 46, c + 46 + nlen));
    ok(made === 0x0314 && need === 10 && flags === 0x0800 && method === 0 && time === 0 && date === 0x0021, `zip ${name}: header values`);
    ok(xlen === 0 && clen === 0 && v.getUint16(c + 34, true) === 0 && v.getUint16(c + 36, true) === 0 && ext === 0x81a40000, `zip ${name}: no extra field or comment; mode 0100644`);
    ok(off === expectOff && csize === size, `zip ${name}: entries contiguous and stored`);
    ok(v.getUint32(off, true) === 0x04034b50 && v.getUint16(off + 26, true) === nlen && v.getUint16(off + 28, true) === 0, `zip ${name}: local header`);
    ok(v.getUint32(off + 14, true) === crc, `zip ${name}: local CRC matches central`);
    const data = b.subarray(off + 30 + nlen, off + 30 + nlen + size);
    let x = 0xffffffff;
    for (const byte of data) { x ^= byte; for (let k = 0; k < 8; k++) x = x & 1 ? 0xedb88320 ^ (x >>> 1) : x >>> 1; }
    ok(((x ^ 0xffffffff) >>> 0) === crc, `zip ${name}: CRC-32`);
    files[name] = new Uint8Array(data); names.push(name);
    expectOff = off + 30 + nlen + size; c += 46 + nlen;
  }
  ok(expectOff === cdOff, 'zip: no bytes between entries and central directory');
  const sorted = [...names].sort((a, b) => Buffer.compare(Buffer.from(a), Buffer.from(b)));
  eq(names, sorted, 'zip: entries sorted by name');
  return files;
}

function checkPackage(files, ogDid, label) {
  const mBytes = files['originals-evidence.json'];
  const m = JSON.parse(td.decode(mBytes));
  ok(bytesEq(mBytes, J(m)), `${label}: manifest is its JCS form`);
  eq(Object.keys(m).sort(), ['checkpoint', 'completeness', 'format', 'head', 'missing', 'original', 'profile'], `${label}: manifest members`);
  ok(m.format === 'originals-evidence/0.1' && m.profile === 'og:1.0-draft.1' && m.original === ogDid, `${label}: manifest values`);
  const log = parseLines(files['asset/did.jsonl'], `${label} asset log`);
  ok(m.head === log[log.length - 1].versionId, `${label}: head is the log's last entry`);
  ok(log.some((e) => e.versionId === m.checkpoint), `${label}: checkpoint is an entry in the log`);
  const authorDid = log[0].state.author.did;
  const dir = `signers/${Buffer.from(sha(te.encode(authorDid))).toString('hex')}/did.jsonl`;
  ok(dir in files, `${label}: signer directory is the lowercase hex SHA-256 of the DID`);
  for (const e of log) if (e.state.transitions[0]) ok(`resources/${e.state.transitions[0].to}` in files, `${label}: resource ${e.state.transitions[0].to} present`);
  ok(m.completeness === 'complete' && m.missing.length === 0, `${label}: complete`);
  return { manifest: m, log, authorLog: parseLines(files[dir], `${label} author log`) };
}

// ---------- CBOR decoder with P14.12's restrictions ----------
function decodeCbor(b) {
  let i = 0;
  const arg = (ai) => {
    if (ai < 24) return ai;
    const n = { 24: 1, 25: 2, 26: 4, 27: 8 }[ai];
    ok(n !== undefined, 'cbor: no indefinite length or reserved value');
    let v = 0n; for (let k = 0; k < n; k++) v = (v << 8n) | BigInt(b[i++]);
    ok(v <= 9007199254740991n, 'cbor: integer within P14.3 bound');
    return Number(v);
  };
  const item = () => {
    const ib = b[i++], major = ib >> 5, ai = ib & 31;
    if (major === 0) return arg(ai);
    if (major === 1) return -1 - arg(ai);
    if (major === 2) { ok(false, 'cbor: no byte strings'); return null; }
    if (major === 3) { const n = arg(ai); const s = td.decode(b.subarray(i, i + n)); i += n; return s; }
    if (major === 4) { const n = arg(ai); return Array.from({ length: n }, item); }
    if (major === 5) {
      const n = arg(ai); const o = {};
      for (let k = 0; k < n; k++) { const key = item(); ok(typeof key === 'string' && !(key in o), 'cbor: text keys, no duplicates'); o[key] = item(); }
      return o;
    }
    if (major === 6) { ok(false, 'cbor: no tags'); return null; }
    if (ib === 0xf4) return false; if (ib === 0xf5) return true; if (ib === 0xf6) return null;
    ok(false, `cbor: unsupported simple/float 0x${ib.toString(16)} in these vectors`); return null;
  };
  const v = item();
  ok(i === b.length, 'cbor: exactly one item');
  return v;
}

// ---------- ord envelope parse (the subset these vectors use) ----------
function parseEnvelope(s) {
  let i = 0;
  const op = () => s[i++];
  const pushData = () => {
    const o = op();
    let n;
    if (o <= 75) n = o; else if (o === 0x4c) n = s[i++]; else if (o === 0x4d) { n = s[i] | (s[i + 1] << 8); i += 2; } else return null;
    const d = s.subarray(i, i + n); i += n; return d;
  };
  ok(op() === 0x00 && op() === 0x63, 'envelope: OP_FALSE OP_IF');
  ok(td.decode(pushData()) === 'ord', 'envelope: ord protocol id');
  const fields = {}; let body = null;
  while (s[i] !== 0x68) {
    const tag = pushData();
    if (tag.length === 0) { // body
      const chunks = []; while (s[i] !== 0x68) { const c = pushData(); ok(c.length <= 520, 'envelope: body chunk ≤ 520'); chunks.push(c); }
      body = Buffer.concat(chunks); break;
    }
    ok(tag.length === 1, 'envelope: one-byte tag');
    const val = pushData(); ok(val.length <= 520, 'envelope: field push ≤ 520');
    (fields[tag[0]] ??= []).push(val);
  }
  ok(op() === 0x68 && i === s.length, 'envelope: OP_ENDIF ends it');
  for (const t of Object.keys(fields)) ok(['1', '5', '7'].includes(t), `envelope: only tags 1, 5, 7 (P14.12); found ${t}`);
  ok(fields[7]?.length === 1 && td.decode(fields[7][0]) === 'og', 'envelope: metaprotocol og (P9.31)');
  return {
    contentType: fields[1] ? td.decode(fields[1][0]) : null,
    metadata: decodeCbor(new Uint8Array(Buffer.concat(fields[5] ?? []))),
    metadataRaw: new Uint8Array(Buffer.concat(fields[5] ?? [])),
    metadataBytes: Buffer.concat(fields[5] ?? []).length,
    body: body && new Uint8Array(body),
  };
}

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

console.log(`${checks} checks, ${failures} failures`);
process.exit(failures ? 1 : 0);
