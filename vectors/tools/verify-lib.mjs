// Verification helpers shared by check.mjs and the regtest gate
// (vectors/regtest/). Written independently of the generator's lib.mjs: it
// re-derives SCIDs, entry hashes, proofs, digests, the ZIP layout, CBOR
// metadata and ord envelopes, and verifies did:webvh logs with didwebvh-ts.
import { ed25519 } from '@noble/curves/ed25519.js';
import { sha256 } from '@noble/hashes/sha2.js';
import { base58 } from '@scure/base';
import canonicalize from 'canonicalize';
import { resolveDIDFromLog } from 'didwebvh-ts';
export const te = new TextEncoder(), td = new TextDecoder('utf-8', { fatal: true });
export const counts = { failures: 0, checks: 0 };
export const stats = () => ({ ...counts });
export const ok = (cond, msg) => { counts.checks++; if (!cond) { counts.failures++; console.error('FAIL', msg); } };
// Equal as JSON values: compared in JCS form, so the order of object members
// never matters (P14.3, P14.12); array order does.
export const eq = (a, b, msg) => ok(td.decode(J(a)) === td.decode(J(b)), `${msg}: ${JSON.stringify(a)} != ${JSON.stringify(b)}`);
export const bytesEq = (a, b) => a.length === b.length && a.every((x, i) => x === b[i]);

export const sha = (b) => sha256(b);
export const multihash = (b) => { const h = sha(b); const m = new Uint8Array(34); m[0] = 0x12; m[1] = 0x20; m.set(h, 2); return base58.encode(m); };
export const resourceDigest = (b) => 'z' + multihash(b);
export const J = (v) => te.encode(canonicalize(v));

// ---------- JSON Lines (P14.2) ----------
export function parseLines(bytes, label) {
  const text = td.decode(bytes);
  ok(text.endsWith('\n') && !text.includes('\r'), `${label}: line format`);
  return text.slice(0, -1).split('\n').map((l) => {
    const v = JSON.parse(l);
    ok(JSON.stringify(v) === l, `${label}: compact JSON with no whitespace outside strings`);
    return v;
  });
}

// ---------- Ed25519 / eddsa-jcs-2022 ----------
export function decodeMultikey(mk) {
  ok(mk[0] === 'z', 'multikey is base58btc');
  const b = base58.decode(mk.slice(1));
  ok(b.length === 34 && b[0] === 0xed && b[1] === 0x01, 'Ed25519 Multikey: prefix 0xed01 and 32 bytes (P14.8)');
  return b.slice(2);
}
export function verifyProof(doc, p, pub, label, { allowCreated }) {
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
export function checkChain(entries, label) {
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
export async function checkWebvh(entries, label) {
  const r = await resolveDIDFromLog(entries);
  ok(r && !r.didResolutionMetadata?.error && r.didDocument?.id === entries[entries.length - 1].state.id, `${label}: didwebvh-ts resolves the log`);
  checkChain(entries, label);
  return r.didDocument;
}

// Every version of a did:webvh log, by versionId: the document each prefix resolves to.
// An entry is checked against the version it names, never only the newest (P5.3).
export async function webvhVersions(entries, label) {
  const versions = new Map();
  for (let i = 0; i < entries.length; i++) versions.set(entries[i].versionId, await checkWebvh(entries.slice(0, i + 1), `${label} version ${i + 1}`));
  return versions;
}
const versionNumber = (versionId) => Number.parseInt(versionId, 10);

// ---------- did:og asset log under the profile (the checks the vectors exercise) ----------
export const STATE = ['asset', 'author', 'id', 'operation', 'transitions'];
export const ASSET_REQ = ['aliases', 'name', 'network', 'resource', 'status'];
export const ASSET_OPT = ['body', 'editors', 'metadata', 'preview'];
// `author` is the author DID's versions by versionId (webvhVersions), so each entry is
// checked at the version it names (P5.3), or one document when the caller has already
// resolved the one version every entry names (the regtest gate).
export function checkOgLog(entries, author, resources, label) {
  const scid = checkChain(entries, label);
  const did = `did:og:${scid}`;
  eq(entries[0].parameters, { method: 'og:1.0-draft.1', scid, updateKeys: [] }, `${label}: genesis parameters, updateKeys [] (P14.1)`);
  entries.forEach((entry, i) => {
    eq(Object.keys(entry).sort(), ['parameters', 'proof', 'state', 'versionId', 'versionTime'], `${label} entry ${i + 1}: entry members (P14.27)`);
    ok(/^[1-9][0-9]*-z?[1-9A-HJ-NP-Za-km-z]+$/.test(entry.versionId) && !entry.versionId.includes('-z'), `${label} entry ${i + 1}: versionId form (P14.27)`);
    ok(Array.isArray(entry.proof) && entry.proof.length === 1, `${label} entry ${i + 1}: proof is an array of one (P14.27)`);
  });
  let anchored = false;
  entries.forEach((entry, i) => {
    const L = `${label} entry ${i + 1}`;
    if (i > 0) {
      const pk = JSON.stringify(entry.parameters);
      ok(pk === '{}' || (!entry.state.editor && pk === '{"updateKeys":[]}'), `${L}: parameters {} or, for an author entry, {"updateKeys": []} (P14.1)`);
    }
    const s = entry.state;
    eq(Object.keys(s).sort(), STATE, `${L}: state members (P14.4)`);
    ok(s.id === did, `${L}: id`);
    ok(s.operation === (i === 0 ? 'create' : 'update'), `${L}: operation`);
    // The author DID is fixed; the version it names and the key may move on, never back (P5.8, T5-012, T5-039).
    ok(s.author.did === entries[0].state.author.did, `${L}: author DID fixed at genesis (P5.8)`);
    if (i > 0) ok(versionNumber(s.author.versionId) >= versionNumber(entries[i - 1].state.author.versionId), `${L}: author version not older than the previous entry's (P5.8, T5-012)`);
    const keys = Object.keys(s.asset);
    ok(ASSET_REQ.every((k) => keys.includes(k)) && keys.every((k) => ASSET_REQ.includes(k) || ASSET_OPT.includes(k)), `${L}: asset members (P14.5)`);
    ok(s.asset.network === 'regtest' && s.asset.network === entries[0].state.asset.network, `${L}: network fixed (P9.34)`);
    const btco = s.asset.aliases.filter((a) => a.startsWith('did:btco:'));
    ok(('body' in s.asset) === (btco.length > 0), `${L}: body present exactly with a did:btco alias (P14.5)`);
    if (btco.length) { ok(/^did:btco:reg:(0|[1-9][0-9]{0,15})$/.test(btco[0]), `${L}: did:btco alias names the genesis network (P9.10)`); anchored = true; }
    // One transition exactly when the digest or the mediaType changes; `to` equals `from` when only the mediaType does (P14.4, P14.6).
    const prev = i ? entries[i - 1].state.asset.resource : null;
    const d = s.asset.resource.digest;
    if (!prev || d !== prev.digest || s.asset.resource.mediaType !== prev.mediaType) eq(s.transitions, [{ from: prev ? prev.digest : null, to: d }], `${L}: transition (P14.6)`);
    else eq(s.transitions, [], `${L}: no transition`);
    if (prev && d === prev.digest) ok(s.asset.resource.size === prev.size, `${L}: size changes only with the digest (P14.6)`);
    if (resources[d]) {
      ok(resourceDigest(resources[d]) === d && resources[d].length === s.asset.resource.size, `${L}: resource bytes match descriptor`);
    }
    // Signer binding (P5.2, P5.3) against the author's did:webvh document.
    ok(entry.proof.length === 1, `${L}: one proof`);
    const p = entry.proof[0];
    ok(p.verificationMethod === s.author.verificationMethod, `${L}: proof verificationMethod is the signer reference's`);
    const authorDoc = author instanceof Map ? author.get(s.author.versionId) : author;
    ok(!!authorDoc, `${L}: names a version of the author DID that the author log contains (P5.3)`);
    if (!authorDoc) return;
    const vm = authorDoc.verificationMethod.find((v) => v.id === p.verificationMethod);
    ok(vm && vm.type === 'Multikey' && vm.controller === authorDoc.id && authorDoc.assertionMethod.includes(vm.id), `${L}: assertionMethod Multikey in the author's DID document`);
    const { proof, ...doc } = entry;
    verifyProof(doc, p, decodeMultikey(vm.publicKeyMultibase), L, { allowCreated: false });
  });
  return { did, anchored };
}

// ---------- ZIP (P14.10) ----------
export function readZip(b) {
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

export function checkPackage(files, ogDid, label) {
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
export function decodeCbor(b) {
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
export function parseEnvelope(s) {
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
