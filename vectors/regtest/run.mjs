// The regtest gate (release blocker, step a): inscribes the Bitcoin vector's
// anchoring publication on a real regtest chain with Bitcoin Core and reads it
// back through ord 0.29.x, then checks the computed report against the
// vector's expected report. Run with `npm run regtest`.
//
// Everything runs in a fresh temporary directory, on regtest only, on free
// local ports; nothing outside that directory is read or written, except
// vectors/regtest/last-run.json, the record of a passing run.
import { spawn, execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, writeFileSync, mkdirSync } from 'node:fs';
import { createServer } from 'node:net';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { randomBytes } from 'node:crypto';
import { setTimeout as sleep } from 'node:timers/promises';
import * as btc from '@scure/btc-signer';
import { schnorr } from '@noble/curves/secp256k1.js';
import { sha256 } from '@noble/hashes/sha2.js';
import { key, next, proof, cbor, envelope, utf8 } from '../tools/lib.mjs';
import { decodeCbor, resourceDigest } from '../tools/verify-lib.mjs';
import { computeReport } from './report.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const VEC = join(HERE, '..', 'og-1.0-draft.1');
const vread = (p) => new Uint8Array(readFileSync(join(VEC, p)));
const vjson = (p) => JSON.parse(readFileSync(join(VEC, p), 'utf8'));
const BITCOIND = process.env.BITCOIND ?? 'bitcoind';
const ORD = process.env.ORD ?? 'ord';
const REGTEST = { bech32: 'bcrt', pubKeyHash: 0x6f, scriptHash: 0xc4, wif: 0xef };
const FEE_RATE = 2n; // sat/vB
const POSTAGE = 10_000n;
const hexOf = (b) => Buffer.from(b).toString('hex');
const log = (...a) => console.log('[regtest]', ...a);

const freePort = () => new Promise((res, rej) => {
  const s = createServer(); s.unref(); s.on('error', rej);
  s.listen(0, '127.0.0.1', () => { const { port } = s.address(); s.close(() => res(port)); });
});

const tmp = mkdtempSync(join(tmpdir(), 'og-regtest-'));
const procs = [];
let cleaned = false;
function cleanup() {
  if (cleaned) return; cleaned = true;
  for (const p of procs) { try { p.kill('SIGTERM'); } catch {} }
  // Give the daemons a moment to exit before removing their directories.
  const t = Date.now(); while (procs.some((p) => p.exitCode === null && p.signalCode === null) && Date.now() - t < 5000) { try { execFileSync('sleep', ['0.1']); } catch {} }
  for (const p of procs) { try { p.kill('SIGKILL'); } catch {} }
  rmSync(tmp, { recursive: true, force: true });
}
process.on('exit', cleanup);
for (const sig of ['SIGINT', 'SIGTERM']) process.on(sig, () => { cleanup(); process.exit(130); });

async function main() {
  const [rpcPort, p2pPort, ordPort] = [await freePort(), await freePort(), await freePort()];
  const rpcUser = 'og', rpcPass = randomBytes(16).toString('hex');
  const btcDir = join(tmp, 'bitcoin'), ordDir = join(tmp, 'ord');
  mkdirSync(btcDir); mkdirSync(ordDir);

  const bitcoindVersion = execFileSync(BITCOIND, ['--version']).toString().split('\n')[0].trim();
  const ordVersion = execFileSync(ORD, ['--version']).toString().trim();
  if (!/^ord 0\.29\.\d+$/.test(ordVersion)) throw new Error(`ord 0.29.x required (P9.31), found ${ordVersion}`);
  log(bitcoindVersion, '/', ordVersion, '/', tmp);

  const bitcoind = spawn(BITCOIND, [
    '-regtest', `-datadir=${btcDir}`, `-rpcport=${rpcPort}`, `-port=${p2pPort}`, '-rpcbind=127.0.0.1',
    '-rpcallowip=127.0.0.1', `-rpcuser=${rpcUser}`, `-rpcpassword=${rpcPass}`, '-listen=0', '-dnsseed=0', '-fixedseeds=0',
    '-txindex=1', '-server=1', '-fallbackfee=0.0002', '-printtoconsole=0',
  ], { stdio: 'ignore' });
  procs.push(bitcoind);

  let rpcId = 0;
  const rpc = async (method, params = [], wallet) => {
    const r = await fetch(`http://127.0.0.1:${rpcPort}/${wallet ? `wallet/${wallet}` : ''}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: 'Basic ' + Buffer.from(`${rpcUser}:${rpcPass}`).toString('base64') },
      body: JSON.stringify({ jsonrpc: '1.0', id: ++rpcId, method, params }),
    });
    const j = await r.json().catch(() => ({ error: { message: `HTTP ${r.status}` } }));
    if (j.error) throw new Error(`${method}: ${j.error.message}`);
    return j.result;
  };
  for (let i = 0; ; i++) {
    try { await rpc('getblockchaininfo'); break; } catch (e) { if (i > 300) throw e; await sleep(100); }
  }
  if ((await rpc('getblockchaininfo')).chain !== 'regtest') throw new Error('not regtest');

  await rpc('createwallet', ['og']);
  const w = (m, p) => rpc(m, p, 'og');
  const miner = await w('getnewaddress', ['', 'bech32m']);
  const mine = (n) => rpc('generatetoaddress', [n, miner]);
  // Past coinbase maturity and past ord's regtest jubilee (height 110), after
  // which a second inscription on a sat is not cursed.
  await mine(120);

  const ord = spawn(ORD, [
    '--regtest', `--bitcoin-rpc-url=http://127.0.0.1:${rpcPort}`, `--bitcoin-rpc-username=${rpcUser}`, `--bitcoin-rpc-password=${rpcPass}`,
    `--data-dir=${ordDir}`, '--index-sats', '--index-transactions',
    'server', '--address=127.0.0.1', `--http-port=${ordPort}`, '--polling-interval=100ms',
  ], { stdio: ['ignore', 'ignore', 'pipe'] });
  let ordErr = ''; ord.stderr.on('data', (d) => { ordErr += d; });
  procs.push(ord);
  const ordGet = async (path, { json = true } = {}) => {
    const r = await fetch(`http://127.0.0.1:${ordPort}${path}`, { headers: json ? { accept: 'application/json' } : {} });
    if (!r.ok) throw new Error(`ord ${path}: HTTP ${r.status} ${await r.text()}`);
    return json ? r.json() : new Uint8Array(await r.arrayBuffer());
  };
  const ordSync = async () => {
    const h = await rpc('getblockcount');
    for (let i = 0; ; i++) {
      try { if (Number(await ordGet('/blockheight')) >= h) return h; } catch (e) { if (i > 600) throw new Error(`${e.message}\n${ordErr}`); }
      await sleep(100);
    }
  };
  await ordSync();

  // ---------- The publication's parts ----------
  // Part 1 is the vector's, byte for byte: entries 1–3 and the author's
  // inscribed did:webvh history. Part 2 carries the anchoring entry, which
  // names the sat; the vector's sat is synthetic, so entry 4 is re-signed with
  // the vector's deterministic author key for the real sat.
  const env1 = vread('bitcoin/inscriptions/part-1.envelope.bin');
  const m1 = decodeCbor(vread('bitcoin/inscriptions/part-1.metadata.cbor'));
  const m2v = decodeCbor(vread('bitcoin/inscriptions/part-2.metadata.cbor'));
  const v2 = vread('local/resources/v2.md');
  const e3 = m1.entries[m1.entries.length - 1];
  const e4v = m2v.entries[0];
  const authorSigning = key('author assertionMethod key-1');
  const sign = (doc) => proof(authorSigning, doc, e3.state.author.verificationMethod);

  const tapKey = sha256(utf8('originals-spec regtest gate: reveal key'));
  const tapPub = schnorr.getPublicKey(tapKey);
  // ord's reveal script: <x-only key> OP_CHECKSIG, then the envelope.
  const leafOf = (env) => new Uint8Array([0x20, ...tapPub, 0xac, ...env]);
  const p2trOf = (env) => btc.p2tr(tapPub, { script: leafOf(env) }, REGTEST, true);

  const commitAddr = p2trOf(env1);
  // Size the fees from the transactions themselves (vsize at FEE_RATE), with
  // a margin for the anchoring entry's sat number, which isn't known yet.
  const reveal = (prev, env, to, amount) => {
    const pay = p2trOf(env);
    const tx = new btc.Transaction({ allowUnknownOutputs: true, allowUnknownInputs: true, allowLegacyWitnessUtxo: true });
    tx.addInput({
      txid: prev.txid, index: prev.vout, witnessUtxo: { script: pay.script, amount: prev.amount },
      tapLeafScript: pay.tapLeafScript, tapInternalKey: tapPub,
    });
    tx.addOutput({ script: to, amount });
    const [cb, scriptVer] = pay.tapLeafScript[0];
    const leaf = scriptVer.subarray(0, -1);
    const msg = tx.preimageWitnessV1(0, [pay.script], btc.SigHash.DEFAULT, [prev.amount], undefined, leaf, 0xc0);
    const sig = schnorr.sign(msg, tapKey);
    tx.updateInput(0, { finalScriptWitness: [sig, leaf, btc.TaprootControlBlock.encode(cb)] }, true);
    return tx;
  };
  const vsizeOf = (env) => BigInt(reveal({ txid: '00'.repeat(32), vout: 0, amount: 1_000_000n }, env, p2trOf(env).script, 1n).vsize);
  const env2Estimate = vread('bitcoin/inscriptions/part-2.envelope.bin');
  const fee2 = (vsizeOf(env2Estimate) + 100n) * FEE_RATE;
  const fee1 = (vsizeOf(env1) + 100n) * FEE_RATE;
  const value2 = POSTAGE + fee2; // the output holding the sat between the parts
  const value1 = value2 + fee1;

  // ---------- Commit ----------
  const commitTxid = await w('sendtoaddress', [commitAddr.address, Number(value1) / 1e8]);
  await mine(1);
  const commitTx = await w('gettransaction', [commitTxid, false, true]);
  const commitVout = commitTx.decoded.vout.find((o) => o.scriptPubKey.address === commitAddr.address).n;
  await ordSync();
  const commitOut = await ordGet(`/output/${commitTxid}:${commitVout}`);
  const SAT = commitOut.sat_ranges[0][0];
  const BTCO = `did:btco:reg:${SAT}`;
  log('sat', SAT, 'commit', commitTxid);

  // ---------- Anchoring entry for the real sat ----------
  const e4 = next(e3, {
    versionTime: e4v.versionTime, parameters: e4v.parameters,
    state: { ...e4v.state, asset: { ...e4v.state.asset, aliases: e4v.state.asset.aliases.map((a) => a.startsWith('did:btco:') ? BTCO : a) } },
  }, sign);
  const m2 = cbor({ entries: [e4], part: m2v.part });
  const env2 = envelope({ contentType: e4.state.asset.resource.mediaType, metaprotocol: 'og', metadata: m2, body: v2 });

  // ---------- Reveal part 1, onto an output that commits to part 2 ----------
  // ord puts an inscription on the first sat of the input that carries its
  // envelope (no pointer field, which P14.12 forbids). Part 1's reveal sends
  // the sat, at offset 0, to the taproot output committing to part 2's
  // script, so part 2's reveal spends the sat and inscribes the same sat.
  const r1 = reveal({ txid: commitTxid, vout: commitVout, amount: value1 }, env1, p2trOf(env2).script, value2);
  const r1id = await rpc('sendrawtransaction', [r1.hex]);
  const [h1hash] = await mine(1);
  const holderAddr = await w('getnewaddress', ['', 'bech32m']);
  const holderScript = btc.OutScript.encode(btc.Address(REGTEST).decode(holderAddr));
  const r2 = reveal({ txid: r1id, vout: 0, amount: value2 }, env2, holderScript, POSTAGE);
  const r2id = await rpc('sendrawtransaction', [r2.hex]);
  await mine(1);
  // 8 more blocks: the publication has 9 confirmations, as in the vector,
  // above the transfer depth of 6 (P7.22, P14.13).
  await mine(8);
  const tipHeight = await ordSync();
  log('reveals', r1id, r2id, 'tip', tipHeight);

  // ---------- Read back through ord only ----------
  const tipHash = (await ordGet(`/blockhash/${tipHeight}`, { json: false }));
  const tip = { height: tipHeight, hash: new TextDecoder().decode(tipHash).trim() };
  const satInfo = await ordGet(`/sat/${SAT}`);
  const reads = [];
  for (const id of satInfo.inscriptions) {
    const info = await ordGet(`/inscription/${id}`);
    const [txid, idx] = id.split('i');
    const txInfo = await ordGet(`/tx/${txid}`);
    const block = await ordGet(`/block/${info.height}`);
    const txIndex = block.transactions.findIndex((t) => computeTxid(t) === txid);
    const witness = txInfo.transaction.input[0].witness;
    const script = Buffer.from(witness[witness.length - 2], 'hex');
    const at = script.indexOf(Buffer.from([0x00, 0x63, 0x03, 0x6f, 0x72, 0x64]));
    const output = await ordGet(`/output/${info.satpoint.split(':').slice(0, 2).join(':')}`);
    reads.push({
      id, envelope: new Uint8Array(script.subarray(at)), height: info.height, txIndex, inscriptionIndex: Number(idx),
      sat: info.sat, metaprotocol: info.metaprotocol ?? null, contentType: info.content_type ?? null,
      holder: output.address ?? null, number: info.number, charms: info.charms,
    });
  }
  const evidence = { network: 'regtest', tip, depth: 1, sat: SAT, inscriptions: reads };
  const report = await computeReport(evidence);

  // ---------- Compare with the vector's expected report ----------
  // Only chain-dependent values are substituted: the sat and its did:btco
  // alias, the anchoring entry (it names the sat), inscription ids, part 2's
  // envelope digest, block heights, the tip and the holder's address.
  const expected = vjson('bitcoin/expected-report.json');
  const chain = vjson('bitcoin/chain.json');
  const vBtco = `did:btco:reg:${chain.sat}`;
  let text = JSON.stringify(expected)
    .replaceAll(vBtco, BTCO)
    .replaceAll(e4v.versionId, e4.versionId)
    .replaceAll(chain.inscriptions[0].id, `${r1id}i0`)
    .replaceAll(chain.inscriptions[1].id, `${r2id}i0`)
    .replaceAll(resourceDigest(env2Estimate), resourceDigest(env2))
    .replaceAll(chain.holder.address, holderAddr);
  const want = JSON.parse(text);
  want.evidence.tip = tip;
  const finalHeight = reads.find((x) => x.id === `${r2id}i0`)?.height;
  for (const e of want.entries) e.block = finalHeight;

  const diffs = [];
  const walk = (a, b, path) => {
    if (typeof a !== 'object' || a === null || typeof b !== 'object' || b === null) {
      if (a !== b) diffs.push(`${path}: expected ${JSON.stringify(a)}, got ${JSON.stringify(b)}`);
      return;
    }
    // A diagnostic's `reason` is text for people and is not compared (P14.25).
    for (const k of new Set([...Object.keys(a), ...Object.keys(b)])) if (k !== 'reason') walk(a[k], b[k], `${path}.${k}`);
  };
  walk(want, report, 'report');
  const env1Same = Buffer.compare(Buffer.from(reads[0]?.envelope ?? []), Buffer.from(env1)) === 0;
  if (!env1Same) diffs.push('part 1 envelope read from ord differs from the vector\'s part-1.envelope.bin');
  if (reads.length !== 2) diffs.push(`expected 2 inscriptions on the sat, ord lists ${reads.length}`);
  if (reads.some((x) => x.number < 0)) diffs.push('ord reports a cursed inscription');

  const result = {
    gate: 'regtest (release blocker step a)', date: new Date().toLocaleDateString('en-CA'), // the local calendar date of the run
    passed: diffs.length === 0,
    bitcoind: bitcoindVersion, ord: ordVersion, network: 'regtest',
    sat: SAT, anchoringAlias: BTCO, holder: holderAddr,
    transactions: { commit: commitTxid, revealPart1: r1id, revealPart2: r2id },
    inscriptions: reads.map(({ envelope: env, ...x }) => ({ ...x, envelopeBytes: env.length, envelopeDigest: resourceDigest(env) })),
    part1EnvelopeMatchesVector: env1Same,
    anchoringEntry: e4.versionId, tip,
    report,
    differences: diffs,
  };
  if (diffs.length) {
    for (const d of diffs) console.error('MISMATCH', d);
    console.error(JSON.stringify(result, null, 2));
    throw new Error(`${diffs.length} differences from the expected report`);
  }
  writeFileSync(join(HERE, 'last-run.json'), JSON.stringify(result, null, 2) + '\n');
  log('PASS: computed report matches the vector\'s expected report; wrote vectors/regtest/last-run.json');
}

// ord's block JSON lists transactions without txids: compute each one from
// its fields (the serialization without witness data, double SHA-256).
function computeTxid(t) {
  const u32 = (n) => { const b = Buffer.alloc(4); b.writeUInt32LE(n >>> 0); return b; };
  const u64 = (n) => { const b = Buffer.alloc(8); b.writeBigUInt64LE(BigInt(n)); return b; };
  const varint = (n) => n < 0xfd ? Buffer.from([n]) : n <= 0xffff ? Buffer.concat([Buffer.from([0xfd]), Buffer.from([n & 0xff, n >> 8])]) : Buffer.concat([Buffer.from([0xfe]), u32(n)]);
  const bytes = (h) => { const b = Buffer.from(h, 'hex'); return Buffer.concat([varint(b.length), b]); };
  const parts = [u32(t.version), varint(t.input.length)];
  for (const i of t.input) {
    const [txid, vout] = i.previous_output.split(':');
    parts.push(Buffer.from(txid, 'hex').reverse(), u32(Number(vout)), bytes(i.script_sig), u32(i.sequence));
  }
  parts.push(varint(t.output.length));
  for (const o of t.output) parts.push(u64(o.value), bytes(o.script_pubkey));
  parts.push(u32(t.lock_time));
  return Buffer.from(sha256(sha256(Buffer.concat(parts)))).reverse().toString('hex');
}

try { await main(); process.exitCode = 0; } catch (e) { console.error('[regtest] FAIL', e.stack ?? e.message, e.cause ?? ''); process.exitCode = 1; } finally { cleanup(); }
