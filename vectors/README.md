# did:og test vectors (provisional)

These vectors are for the method value `og:1.0-draft.1` (P14.1). They are **provisional**, like the parts of section 14 they exercise, and are regenerated under a new draft number whenever a choice they depend on changes. Where a vector and the specification disagree, the specification governs (P14.26).

```sh
npm install
npm run vectors        # rebuild og-1.0-draft.1/ from fixed seeds (deterministic)
npm run vectors:check  # verify it independently
npm run regtest        # the regtest gate: inscribe the bitcoin vector on a real regtest chain (needs bitcoind and ord 0.29.x)
```

`tools/generate.mjs` builds everything from fixed seeds: each key's secret is `SHA-256("originals-spec test vector seed: <label>")`, and `og-1.0-draft.1/index.json` lists the labels and public keys. These are test keys. Never use them for anything else.

`tools/check.mjs` doesn't import the generator; its helpers are in `tools/verify-lib.mjs`. It recomputes SCIDs, entry hashes, `eddsa-jcs-2022` proofs (strict Ed25519, small-order points rejected), digests, the ZIP layout and CRCs, the CBOR metadata and the ord envelopes. It then derives each vector's whole report from its evidence set alone, with `tools/report-lib.mjs` off Bitcoin and `regtest/report.mjs` for the Bitcoin vector (the verifier the regtest gate runs against ord), and compares every member with `expected-report.json`, as P14.25 defines equality, which ignores each diagnostic's `reason`. It also checks the report shape: `diagnostics` and `changes`, codes from the closed list, and no `missing` or `dependencies` members. Writers are compared by canonical entry bytes: each line of a `did.jsonl` is the entry's JCS form followed by a line feed, and a writer's log matches when its entries are equal in that form, since P14.2 leaves key order and string escapes free (the vector files are themselves in canonical form, which the checker also verifies). The did:webvh logs are verified with [didwebvh-ts](https://www.npmjs.com/package/didwebvh-ts) 3.2.0, a separate did:webvh implementation.

## One Original, three layers

The genesis entry's parameters are `method`, `scid` and `updateKeys` `[]` (P14.1); `updateKeys` authorizes nothing, and the author entry is checked against the author DID.

### `genesis/`

The genesis entry on its own (P14.27–P14.29): `did.jsonl`, `scid-input.json` (the exact JCS bytes of the entry with `{SCID}` placeholders, hashed to the SCID), `entry-hash-input.json` (the exact JCS bytes hashed to the entry hash), `derivation.json`, the author's log and resource version 1, `evidence-set.json` and `expected-report.json`. The two implementations that must agree on it are the Originals SDK and `tools/check.mjs` (T14-091).

The Original is "Field notes", a `text/markdown` resource whose genesis names the `regtest` network. Its author is a did:webvh 1.0 DID at `author.example` with one entry. The asset log is signed by `#key-1`, an assertionMethod key that is not an updateKey (P5.3).

| Entry | Signer | Change |
|---|---|---|
| 1 | author | genesis, resource version 1 (28 bytes) |
| 2 | author | resource version 2 (346,000 bytes) |
| 3 | author | adds the did:webvh alias `…:host.example:field-notes` (P3.6) |
| 3′ | author | a competing entry 3 with the same parent, refused by the host |
| 4 | author | anchoring entry: adds `did:btco:reg:1234567890`, `body` `full` (P9.10, P9.17) |

### `local/`

Covers entries 1–2.

- `author/did.jsonl`: the author's DID log.
- `asset/did.jsonl`: the asset log.
- `resources/`: the two resource versions.
- `package/evidence.zip`: the evidence package, built as P14.10 fixes it, with `package/originals-evidence.json` as its manifest.
- `evidence-set.json`: the declared evidence set, which is the package alone with no network (P7.17).
- `expected-report.json`: the report (P14.25). The state is `valid-as-of` entry 2, `offline` is `self-contained` and `bitcoin` is `not-read`.

### `hosted/`

- `served/`: the files a host serves under the alias (P14.11). These are the alias's own `did.jsonl` and, under `originals/`, the unpacked package through entry 3.
- `layout.json`: the URLs and the response headers for the resources (P9.7).
- `exchanges.json`: three shared-host saves (P6.7), starting from head entry 2:
  1. Entry 3 is `accepted`.
  2. Entry 3′ is refused as `stale-parent`, with the new head.
  3. Entry 3, sent again byte for byte, is `already-accepted`.

### `bitcoin/`

This vector is **synthetic**. No regtest chain produced these transactions or blocks; the txids, tip hash and holder address are SHA-256 hashes of labels.

- `chain.json`: the chain fixture. It gives the network, tip, sat and holder, and the index reads for each inscription: block, transaction index, inscription index and confirmations.
- `inscriptions/part-{1,2}.envelope.bin`: the two Originals inscriptions of the anchoring publication. Each is the ord envelope, from `OP_FALSE OP_IF` to `OP_ENDIF`, with its fields in ord 0.29.1's order (P14.12). Only one inscription would exceed 350,000 bytes, so the publication is in two parts (P9.32):
  - Part 1 carries entries 1–3 and the author's inscribed did:webvh history (P9.33). It has no body.
  - Part 2 carries entry 4, with resource version 2 as its body and `text/markdown` as its content type.
- `inscriptions/part-{1,2}.metadata.cbor`: each part's metadata. This is the concatenation of its tag-5 pushes.
- `evidence-set.json`: exactly the P9.18 evidence set, which is the sat's inscriptions at the stated network and tip.
- `expected-report.json`: the report. `state` is `current` and `bitcoin` is `anchored`, with the holder `provisional`. `availability` is `partial`, because version 1's bytes are not on Bitcoin, and `offline` is `needs-external`, derived from the one `resource-missing` diagnostic for version 1; the sat itself is read in full, so it is not a dependency (P7.21).

### `missing-resource/`

The negative case for P7.21: the loose inputs of `local/` (the asset log through entry 2 and the author's history) with only resource version 2 supplied. The report has `availability` `partial`, `offline` `needs-external` and one `resource-missing` diagnostic naming version 1's digest and entry 1; `outcome` is still `verified`.

### `reorg/`

Also **synthetic**. The same Original after a reorganization from block 101 removed its anchoring publication (P9.5, P9.36):

- `prior-report.json`: the prior result, the `bitcoin/` vector's report.
- `sat-read.json`: the anchoring sat read in full at the new tip, height 111, with no inscription on it.
- `did.jsonl`, `author/did.jsonl` and `resources/`: a copy of the log through entry 4, the author's history and both resource versions.
- `evidence-set.json` and `expected-report.json`: the report is `bitcoin` `not-anchored`, with no `bitcoin` member; entry 4, the anchoring entry, is `ignored`; the state is `valid-as-of` entry 3 with `claimed` ordering; `offline` is `self-contained`. Its change records are `head` from entry 4 to entry 3 and `holder` from the prior `{sat, address}` to null, both with cause `reorganization` (P14.25).

## `regtest/`: the regtest gate

`npm run regtest` runs step one of the mainnet gate (§13, release blockers). `run.mjs` starts Bitcoin Core and `ord --regtest` 0.29.x in a new temporary directory on free local ports, regtest only, and removes everything when it finishes. It then:

- inscribes the `bitcoin/` vector's anchoring publication. Part 1 is the vector's envelope byte for byte. The vector's sat is synthetic, so entry 4, the anchoring entry, is re-signed with the vector's author key for the real sat's `did:btco:reg:` alias. Commit and reveal transactions are built with [@scure/btc-signer](https://www.npmjs.com/package/@scure/btc-signer), because ord's wallet can't inscribe an envelope with no body.
- places both parts on one sat with no pointer (P14.12). ord puts an inscription on the first sat of the input carrying it, so part 1's reveal sends the sat, at offset 0, to the taproot output that commits to part 2's script, and part 2's reveal spends it.
- reads everything back through ord's JSON API only: the sat's inscriptions, each inscription's metaprotocol, content type, height, satpoint and envelope (from its reveal transaction), each block's transaction order, the holder and the tip. It builds the P9.18 evidence set from those reads.
- computes the report with `report.mjs`, which uses the checker's helpers and not the generator's, and compares it field by field with `bitcoin/expected-report.json`. Only chain-dependent values are substituted: the sat and its alias, the anchoring entry, inscription ids, part 2's envelope digest, block heights, the tip and the holder.

A passing run writes `regtest/last-run.json`, which the register cites. ord 0.29.x marks part 1 as vindicated, because its metadata spans several pushes, which ord counts as a duplicate field, and marks part 2 as a vindicated reinscription. P14.12 says this changes nothing.

## `prior-format/`

Not generated. The mainnet acceptance Original of 1 November 2026, written before `did:og` under `originals:1.0`, with the identifier `did:vh:QmVyqQ…sa5` and the log as the inscription body (content type `application/vnd.originals.vh+jsonl`, no metaprotocol). `transactions/` holds its two reveal transactions exactly as `https://mempool.space/api/tx/<txid>/hex` returned them on 21 November 2026; `chain.json` gives their blocks and the sat named in the owner's acceptance receipt. The checker recomputes each txid from the bytes, extracts the ord envelope from the reveal witness, checks the hash chain of the three entries it carries, and derives the whole expected report: outcome `unsupported`, with no state, entries or signers (P14.1, P14.25, T14-085). `chain.json` keeps the explanation under `expectedReport`, outside the report itself.
