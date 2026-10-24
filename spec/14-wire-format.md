## Wire format (partly provisional)

This section pins the byte-level choices that independent implementations must share. The inscription media type, the 350,000-byte inscription limit and the did:btco network prefixes in P14.12, and the limits in P14.13, are decided (owner decisions, 21 October 2026), as are the wire rules D4 records as decided on 23 October 2026 (P14.2, P14.3, P14.5, P14.8, P14.10). Every other value here is **provisional**: it is taken from the Originals SDK at revision 1b3cabdd [S29], which is the only implementation, and recorded so that it is reviewed as a decision rather than adopted silently (D1, D4). Where the SDK and this section differ, this section says so and the SDK is expected to change. A provisional value may still change before an interoperable release, and changing it changes the `method` value.

### Log and parameters

P14.1 An Original’s asset log MUST use the `method` value `originals:1.0`, which implies `vh-log:1.0`. The genesis entry’s parameters MUST be exactly `method` and `scid`; a deactivation entry’s parameters MUST be exactly `{"deactivated": true}`; every other entry’s parameters MUST be `{}`. A null parameter value MUST be rejected (P5.9, P9.9).

P14.2 The asset log file is named `did.jsonl`. Each entry is one line of compact JSON ending in a single line feed. An asset log has no witness file (P9.8). `versionTime` MUST carry at most three fractional digits and end in `Z`, and MUST be later than the previous entry’s by at least one millisecond (D5) [S22]. A reader MUST reject an asset log, hosted or packaged, and an inscription body (P14.12) that breaks this line format, including one with a carriage return or no final line feed, or whose line contains whitespace outside JSON strings. Key order and string escapes are not constrained, because hashes and proofs are computed over the JCS form (P14.3). The logs of signer DIDs and did:webvh aliases follow their own DID methods.

P14.3 Canonicalization is JCS [[spec: RFC8785]]. Parsers MUST reject duplicate keys, lone surrogates, any number whose exact decimal value, as written, has magnitude greater than 9,007,199,254,740,991 (2<sup>53</sup> − 1) (for example `1e16` or `9007199254740993.0`), any number whose value is negative zero (for example `-0` or `-0.0`), and nesting deeper than 64 levels (P5.7).

### Entry state

P14.4 An entry’s state MUST have exactly the members `id`, `operation`, `author`, `asset` and `transitions`, and an editor entry also `editor`. Every object defined in this section MUST have exactly its listed members, and a verifier MUST reject any other member (P5.7).

- `id` is the Original’s did:vh, `did:vh:<SCID>`.
- `operation` is `create` in the genesis entry and `update` or `deactivate` in every other entry. Anchoring is an `update` (P9.10).
- `author` and `editor` are each exactly `{did, verificationMethod, versionId}`, all strings (P5.1, P5.16). For a did:btco signer, `versionId` is the inscription id of the version (P5.13).
- `asset` has the required members `name`, `status`, `resources` and `aliases`, and the optional members `metadata` and `editors`.
- `transitions` is an array of `{resource, from, to}`, where `from` is the previous digest, or null for an added resource, and `to` is the new digest, or null for a removed resource. It MUST list exactly the resources added, removed or whose digest changed: first those in the resulting `resources`, in that order, then the removed ones, in their previous order; in the genesis entry it lists every resource with `from: null`; a deactivation lists none.

P14.5 The members of `asset`:

- `name`: a string of 1 to 1,024 UTF-16 code units (owner decision, 23 October 2026).
- `metadata`: a JSON object. When absent, there is no metadata (P4.6).
- `status`: `active` or `deactivated`, agreeing with the operation and the deactivated parameter (P6.5).
- `aliases`: an array of DIDs with at most one did:webvh and at most one did:btco. The genesis entry lists none.
- `resources`: an array of resource descriptors, with at least one, at most the limit in P14.13, and unique ids. Existing resources keep their order; an added resource is appended, and a removed one leaves the others in order (P4.1).
- `editors`: an array of 1 to 32 grants, each exactly `{did, name, metadata, resources}`, where `name` and `metadata` are booleans and `resources` is an array of resource ids. An empty array MUST NOT be used; absence means no editors (P5.15).

P14.6 A resource descriptor is exactly `{id, mediaType, size, digest}`. `id` matches `^[A-Za-z0-9._-]{1,64}$`. `mediaType` is a `type/subtype` media type without parameters. `size` is the byte length, a non-negative integer. `mediaType` and `size` MUST NOT change unless `digest` changes in the same entry.

P14.7 A resource digest is the letter `z` followed by the base58btc encoding of the SHA-256 multihash (code 0x12, length 0x20) of the bytes, so it begins `zQm`. A verifier MUST reject a digest whose encoding is not the one this produces (P4.2). VH-Log’s own hashes, the SCID and entry hashes, are the same multihash without the `z`.

### Proofs and keys

P14.8 Each entry has exactly one proof with `type` `DataIntegrityProof`, `proofPurpose` `assertionMethod`, a `cryptosuite` of `eddsa-jcs-2022` or `bip340-jcs-2025` (P5.12), a `verificationMethod` byte-identical to the signer reference’s, and a `proofValue` of `z` followed by the base58btc encoding of the 64-byte signature. Signer keys are Multikeys in base58btc: Ed25519 with prefix 0xed01 and 32 bytes, or secp256k1 with prefix 0xe701 and a 33-byte compressed key. Ed25519 verification MUST reject small-order points. A proof has exactly the members `type`, `cryptosuite`, `verificationMethod`, `proofPurpose` and `proofValue` (P14.4).

### Derived DID document

P14.9 The DID document derived for each version of an Original’s did:vh (P3.8) is exactly:

```json
{
  "@context": ["https://www.w3.org/ns/did/v1"],
  "id": "did:vh:<SCID>",
  "controller": "<author DID>",
  "alsoKnownAs": ["<aliases, omitted when empty>"],
  "service": [{
    "id": "did:vh:<SCID>#files",
    "type": "OriginalsFiles",
    "serviceEndpoint": { "<resource id>": { "mediaType": "…", "size": 0, "digest": "z…" } }
  }]
}
```

The `#files` service names each resource by id with its descriptor; where to fetch the bytes comes from a did:webvh alias, a `src` location or an evidence package.

### Evidence package

P14.10 An evidence package is a ZIP archive whose entries are all stored without compression. Names are at most 255 bytes of UTF-8. A writer MUST produce entries sorted by name, with the date 1980-01-01 00:00, the UTF-8 name flag and Unix mode 0100644, so that the same contents give the same bytes; a reader MAY ignore the order, date and flags, but MUST decode every name as UTF-8, reject a name that is not valid UTF-8, and reject an entry whose mode is not a regular file (P7.5). It contains:

- `originals-evidence.json`, the manifest: exactly `{format, profile, original, checkpoint, head, completeness, missing}`, where `format` is `originals-evidence/0.1`, `profile` is `originals:1.0`, `completeness` is `complete` or `partial` (P7.1), and `missing` lists `{kind: "resource", resource, version, digest, versionId}` and `{kind: "identity", did, role}` items, `role` being `author` or `editor`;
- `asset/did.jsonl`, the asset log;
- `signers/<hex SHA-256 of the DID>/did.jsonl`, and `did-witness.json` where that DID method has witnesses, for each did:vh or did:webvh signer; did:btco signers are read from Bitcoin and are not packaged (P9.18);
- `resources/<digest>`, the bytes of each resource version included.

Import MUST apply P7.5, with at most 20,000 archive entries and 512 MiB in total.

The SDK names the signer directory `authors/` and writes an `asset/did-witness.json`; this section uses `signers/` and none, because editors are signers too and asset logs have no witnesses.

### Hosting

P14.11 A did:webvh alias is a did:webvh log of its own whose DID document lists the Original’s did:vh in `alsoKnownAs` (P3.6). Relative to that alias’s location, the host serves the evidence package unpacked under `originals/`, and serves each resource with its signed media type and the headers P9.7 requires.

### Bitcoin

P14.12 An Originals inscription has the media type `application/vnd.originals.vh+jsonl`, no metadata and no content encoding, and a body of at most 350,000 bytes (P9.17). The anchoring inscription’s body is the asset log’s lines from genesis through the anchoring entry, each ending in a line feed; every later body is exactly one such line. A did:btco DID matches `^did:btco:((sig|test|reg):)?(0|[1-9][0-9]{0,15})$` with a sat number no greater than 2,099,999,997,689,999 (P9.10). A did:btco signer version is an inscription whose own metadata is a CBOR DID document, in shortest-form encoding, whose `id` is that DID, whatever its body, delegation or content encoding (P5.13).

### Limits

P14.13 A verifier MUST enforce these limits (P7.7, P8.5):

| Limit | Value |
|---|---|
| Entries in an asset log | 10,000 |
| Bytes in one entry, as its UTF-8 line without the line feed | 65,536 |
| Resources at any one time | 256 |
| Editor grants | 32 |
| Versions of one signer DID | 1,000 |
| Bytes in a fetched log file | 16 MiB |
| Bytes in one fetched resource | 64 MiB |
| Time for one fetch | 15 seconds |

Every entry carries the full resource list, so the resource limit and the entry limit interact. With 256 resources an entry that describes each of them can exceed 65,536 bytes: with 64-character resourceIDs a genesis entry is about 86 KB, and even with short resourceIDs an entry that changes all 256 resources is about 65.7 KB. A 350,000-byte inscription (P9.17) also holds far fewer large entries: about 6 to 10 entries at 256 resources, against 26 to 40 at 64. The SDK MUST refuse to sign an entry over the entry limit, rather than produce one every verifier rejects. Authors of Originals with many resources SHOULD keep resourceIDs short and SHOULD anchor early, while the log through the anchoring entry still fits one inscription. The owner kept the limit at 256 knowing this (owner decision, 23 October 2026).

The SDK measures entry size in UTF-16 code units of the re-serialised entry and sets no resource-size limit; this section measures UTF-8 bytes of the line as stored and sets 64 MiB, so that implementations in other languages agree.

### Shared-host saves

A shared host (P6.7) needs no particular transport. As a guide, the SDK submits `{original, entry, resources, identities}`, where `entry` is the exact line, and the host answers `accepted` or `already-accepted` with the checkpoint and head, or `stale-parent` with the head.

Sources: Originals SDK revision 1b3cabdd [S29].
