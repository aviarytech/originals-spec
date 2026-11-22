// Primitives used by the vector generator. The checker (check.mjs) does not
// import this file: it re-implements every check it makes.
import { ed25519 } from '@noble/curves/ed25519.js';
import { sha256 } from '@noble/hashes/sha2.js';
import { base58 } from '@scure/base';
import canonicalize from 'canonicalize';

export const enc = new TextEncoder();
export const utf8 = (s) => enc.encode(s);
export const hex = (b) => Buffer.from(b).toString('hex');
export const concat = (...parts) => {
  const out = new Uint8Array(parts.reduce((n, p) => n + p.length, 0));
  let o = 0;
  for (const p of parts) { out.set(p, o); o += p.length; }
  return out;
};

export const jcs = (v) => canonicalize(v);

// SHA-256 multihash (0x12, 0x20) in base58btc: VH-Log hashes have no `z`,
// resource digests (P14.7) have one.
export const mh = (bytes) => base58.encode(concat(Uint8Array.of(0x12, 0x20), sha256(bytes)));
export const digest = (bytes) => 'z' + mh(bytes);

export function key(label) {
  const secret = sha256(utf8('originals-spec test vector seed: ' + label));
  const pub = ed25519.getPublicKey(secret);
  return { label, secret, pub, multikey: 'z' + base58.encode(concat(Uint8Array.of(0xed, 0x01), pub)) };
}

// eddsa-jcs-2022: sign SHA-256(JCS(proof options)) || SHA-256(JCS(document)).
export function proof(k, doc, verificationMethod, extra = {}) {
  const options = { type: 'DataIntegrityProof', cryptosuite: 'eddsa-jcs-2022', verificationMethod, ...extra, proofPurpose: 'assertionMethod' };
  const data = concat(sha256(utf8(jcs(options))), sha256(utf8(jcs(doc))));
  const sig = ed25519.sign(data, k.secret);
  return { ...options, proofValue: 'z' + base58.encode(sig) };
}

// A VH-Log entry (also did:webvh, which follows the same SCID and entry-hash
// rules). `prelim` has versionId, versionTime, parameters, state; for genesis
// the SCID placeholder `{SCID}` is used.
export function genesis(prelim, sign) {
  const scid = mh(utf8(jcs({ ...prelim, versionId: '{SCID}' })));
  const entry = JSON.parse(JSON.stringify(prelim).replaceAll('{SCID}', scid));
  entry.versionId = scid;
  const h = mh(utf8(jcs(entry)));
  entry.versionId = '1-' + h;
  entry.proof = [sign(entry)];
  return { scid, entry };
}

export function next(prev, body, sign) {
  const n = Number(prev.versionId.split('-')[0]) + 1;
  const entry = { versionId: prev.versionId, ...body };
  const h = mh(utf8(jcs(entry)));
  entry.versionId = `${n}-${h}`;
  entry.proof = [sign(entry)];
  return entry;
}

// One line of a did.jsonl: we write each entry in its JCS form (P14.2 lets
// key order be anything; JCS makes the bytes reproducible).
export const line = (entry) => jcs(entry) + '\n';

// ---- CRC-32 and the reproducible ZIP of P14.10 ----
const CRC = new Uint32Array(256).map((_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});
export function crc32(b) {
  let c = 0xffffffff;
  for (const x of b) c = CRC[(c ^ x) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

export function zip(files) {
  const names = Object.keys(files).sort((a, b) => Buffer.compare(Buffer.from(a), Buffer.from(b)));
  const locals = [], centrals = [];
  let offset = 0;
  for (const name of names) {
    const n = utf8(name), data = files[name], crc = crc32(data);
    const lh = Buffer.alloc(30);
    lh.writeUInt32LE(0x04034b50, 0); lh.writeUInt16LE(10, 4); lh.writeUInt16LE(0x0800, 6);
    lh.writeUInt16LE(0, 8); lh.writeUInt16LE(0x0000, 10); lh.writeUInt16LE(0x0021, 12);
    lh.writeUInt32LE(crc, 14); lh.writeUInt32LE(data.length, 18); lh.writeUInt32LE(data.length, 22);
    lh.writeUInt16LE(n.length, 26); lh.writeUInt16LE(0, 28);
    locals.push(lh, n, data);
    const ch = Buffer.alloc(46);
    ch.writeUInt32LE(0x02014b50, 0); ch.writeUInt16LE(0x0314, 4); ch.writeUInt16LE(10, 6);
    ch.writeUInt16LE(0x0800, 8); ch.writeUInt16LE(0, 10); ch.writeUInt16LE(0x0000, 12); ch.writeUInt16LE(0x0021, 14);
    ch.writeUInt32LE(crc, 16); ch.writeUInt32LE(data.length, 20); ch.writeUInt32LE(data.length, 24);
    ch.writeUInt16LE(n.length, 28); ch.writeUInt16LE(0, 30); ch.writeUInt16LE(0, 32);
    ch.writeUInt16LE(0, 34); ch.writeUInt16LE(0, 36); ch.writeUInt32LE(0x81a40000, 38); ch.writeUInt32LE(offset, 42);
    centrals.push(ch, n);
    offset += 30 + n.length + data.length;
  }
  const cd = Buffer.concat(centrals);
  const eocd = Buffer.alloc(22);
  eocd.writeUInt32LE(0x06054b50, 0); eocd.writeUInt16LE(0, 4); eocd.writeUInt16LE(0, 6);
  eocd.writeUInt16LE(names.length, 8); eocd.writeUInt16LE(names.length, 10);
  eocd.writeUInt32LE(cd.length, 12); eocd.writeUInt32LE(offset, 16); eocd.writeUInt16LE(0, 20);
  return new Uint8Array(Buffer.concat([...locals, cd, eocd]));
}

// ---- CBOR (the JSON-to-CBOR mapping of P14.12; integers, strings, arrays,
// maps, booleans and null only, which is all the vectors use) ----
function head(major, n) {
  if (n < 24) return Uint8Array.of((major << 5) | n);
  if (n < 0x100) return Uint8Array.of((major << 5) | 24, n);
  if (n < 0x10000) return Uint8Array.of((major << 5) | 25, n >> 8, n & 0xff);
  if (n < 0x100000000) { const b = Buffer.alloc(5); b[0] = (major << 5) | 26; b.writeUInt32BE(n, 1); return b; }
  const b = Buffer.alloc(9); b[0] = (major << 5) | 27; b.writeBigUInt64BE(BigInt(n), 1); return b;
}
export function cbor(v) {
  if (v === null) return Uint8Array.of(0xf6);
  if (v === true) return Uint8Array.of(0xf5);
  if (v === false) return Uint8Array.of(0xf4);
  if (typeof v === 'number') {
    if (!Number.isSafeInteger(v)) throw new Error('vectors use integers only');
    return v >= 0 ? head(0, v) : head(1, -1 - v);
  }
  if (typeof v === 'string') { const b = utf8(v); return concat(head(3, b.length), b); }
  if (Array.isArray(v)) return concat(head(4, v.length), ...v.map(cbor));
  const keys = Object.keys(v);
  return concat(head(5, keys.length), ...keys.flatMap((k) => [cbor(k), cbor(v[k])]));
}

// ---- ord envelope, as ord 0.29.1 writes it (Inscription::append_reveal_script) ----
function push(data) {
  const n = data.length;
  if (n <= 75) return concat(Uint8Array.of(n), data);
  if (n <= 0xff) return concat(Uint8Array.of(0x4c, n), data);
  if (n <= 520) return concat(Uint8Array.of(0x4d, n & 0xff, n >> 8), data);
  throw new Error('push over 520 bytes');
}
const chunks = (b) => { const out = []; for (let i = 0; i < b.length; i += 520) out.push(b.subarray(i, i + 520)); return out; };
export function envelope({ contentType, metaprotocol, metadata, body }) {
  const parts = [Uint8Array.of(0x00, 0x63), push(utf8('ord'))];
  if (contentType) parts.push(push(Uint8Array.of(1)), push(utf8(contentType)));
  if (metaprotocol) parts.push(push(Uint8Array.of(7)), push(utf8(metaprotocol)));
  if (metadata) for (const c of chunks(metadata)) parts.push(push(Uint8Array.of(5)), push(c));
  if (body) { parts.push(Uint8Array.of(0x00)); for (const c of chunks(body)) parts.push(push(c)); }
  parts.push(Uint8Array.of(0x68));
  return concat(...parts);
}
