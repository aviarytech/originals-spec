## Wire format (partly provisional)

This section pins the byte-level choices that independent implementations must share. Owner decisions of 21 October 2026 decide the 350,000-byte inscription limit and the did:btco network prefixes in P14.12, and the limits in P14.13. D4 decides JCS canonicalization (P14.3), as the canonicalization the pinned VH Log version uses; SHA-256 multihashes for resource digests (P14.7, P4.2); the two cryptosuites (P14.8, P5.12); and the parts of P14.2, P14.3, P14.5, P14.8 and P14.10 that it records as decided on 23 October 2026. D3 decides that an asset log has no witness file (P14.2, P9.8). D6 decides the inscription body, metadata and media type in P14.12 (P9.17; owner decision, 1 November 2026), except the JSON-to-CBOR mapping of the metadata, which stays provisional, and that a did:btco signer version is identified by its own metadata alone (P14.12, P5.13). Everything else in this section, including the entry state fields and the evidence package format, is **provisional**: it is taken from the Originals SDK at revision 1b3cabdd [S29], which is the only implementation, and recorded so that it is reviewed as a decision rather than adopted silently (D1, D4). Where the SDK and this section differ, this section says so and the SDK is expected to change. A provisional value may still change before an interoperable release; until then a change keeps the `method` value `originals:1.0`, and Originals written under the earlier value no longer verify (owner decision, 1 November 2026). After an interoperable release, changing a value changes the `method` value.

### Log and parameters

P14.1 An Original’s asset log MUST use the `method` value `originals:1.0`, which implies `vh-log:1.0`. The genesis entry’s parameters MUST be exactly `method` and `scid`; a deactivation entry’s parameters MUST be exactly `{"deactivated": true}`; every other entry’s parameters MUST be `{}`. A null parameter value MUST be rejected (P5.9, P9.9).

P14.2 The asset log file is named `did.jsonl`. Each entry is one line of compact JSON ending in a single line feed. An asset log has no witness file (P9.8). `versionTime` MUST carry at most three fractional digits and end in `Z`, and MUST be later than the previous entry’s by at least one millisecond (D5) [S22]. A reader MUST reject an asset log, hosted or packaged, that breaks this line format, including one with a carriage return or no final line feed, or whose line contains whitespace outside JSON strings. Key order and string escapes are not constrained, because hashes and proofs are computed over the JCS form (P14.3). The logs of signer DIDs and did:webvh aliases follow their own DID methods.

P14.3 Canonicalization is JCS [[spec: RFC8785]]. Parsers MUST reject duplicate keys, lone surrogates, any number whose exact decimal value, as written, has magnitude greater than 9,007,199,254,740,991 (2<sup>53</sup> − 1) (for example `1e16` or `9007199254740993.0`), any number whose value is negative zero (for example `-0` or `-0.0`), and nesting deeper than 64 levels (P5.7).

### Entry state

P14.4 An entry’s state MUST have exactly the members `id`, `operation`, `author`, `asset` and `transitions`, and an editor entry also `editor`. Every object defined in this section MUST have exactly its listed members, and a verifier MUST reject any other member (P5.7).

- `id` is the Original’s did:vh, `did:vh:<SCID>`.
- `operation` is `create` in the genesis entry and `update` or `deactivate` in every other entry. Anchoring is an `update` (P9.10).
- `author` and `editor` are each exactly `{did, verificationMethod, versionId}`, all strings (P5.1, P5.16). For a did:btco signer, `versionId` is the inscription id of the version (P5.13).
- `asset` has the required members `name`, `status`, `resource` and `aliases`, and the optional members `metadata` and `editors`.
- `transitions` is an array of `{from, to}` with at most one item, where `from` is the previous digest, or null in the genesis entry, and `to` is the new digest. It MUST have one item exactly when the resource’s digest changes: in the genesis entry `{from: null, to}`, and in a later entry that changes the digest `{from, to}`. It is empty in any other entry, including a deactivation (P4.1, P4.2).

P14.5 The members of `asset`:

- `name`: a string of 1 to 1,024 UTF-16 code units (owner decision, 23 October 2026).
- `metadata`: a JSON object. When absent, there is no metadata (P4.6).
- `status`: `active` or `deactivated`, agreeing with the operation and the deactivated parameter (P6.5).
- `aliases`: an array of DIDs with at most one did:webvh and at most one did:btco. The genesis entry lists none.
- `resource`: the descriptor of the Original’s one resource, at its version in this entry (P4.1).
- `editors`: an array of 1 to 32 grants, each exactly `{did, name, metadata, resource}`, all but `did` booleans. An empty array MUST NOT be used; absence means no editors (P5.15).

P14.6 A resource descriptor is exactly `{mediaType, size, digest}`. `mediaType` is a `type/subtype` media type without parameters. `size` is the byte length, a non-negative integer. `mediaType` and `size` MUST NOT change unless `digest` changes in the same entry.

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
    "serviceEndpoint": { "mediaType": "…", "size": 0, "digest": "z…" }
  }]
}
```

The `#files` service is the resource’s descriptor at that version; where to fetch the bytes comes from a did:webvh alias, a `src` location, an evidence package or, for a version inscribed on the anchoring sat, that inscription’s body (P9.17).

### Evidence package

P14.10 An evidence package is a ZIP archive whose entries are all stored without compression. Names are at most 255 bytes of UTF-8. A writer MUST produce entries sorted by name, with the date 1980-01-01 00:00, the UTF-8 name flag and Unix mode 0100644, so that the same contents give the same bytes; a reader MAY ignore the order, date and flags, but MUST decode every name as UTF-8, reject a name that is not valid UTF-8, and reject an entry whose mode is not a regular file (P7.5). It contains:

- `originals-evidence.json`, the manifest: exactly `{format, profile, original, checkpoint, head, completeness, missing}`, where `format` is `originals-evidence/0.1`, `profile` is `originals:1.0`, `completeness` is `complete` or `partial` (P7.1), and `missing` lists `{kind: "resource", version, digest, versionId}` and `{kind: "identity", did, role}` items, `role` being `author` or `editor`;
- `asset/did.jsonl`, the asset log;
- `signers/<hex SHA-256 of the DID>/did.jsonl`, and `did-witness.json` where that DID method has witnesses, for each did:vh or did:webvh signer; did:btco signers are read from Bitcoin and are not packaged (P9.18);
- `resources/<digest>`, the bytes of each version of the resource included.

Import MUST apply P7.5, with at most 20,000 archive entries and 512 MiB in total.

The SDK names the signer directory `authors/` and writes an `asset/did-witness.json`; this section uses `signers/` and none, because editors are signers too and asset logs have no witnesses.

### Hosting

P14.11 A did:webvh alias is a did:webvh log of its own whose DID document lists the Original’s did:vh in `alsoKnownAs` (P3.6). Relative to that alias’s location, the host serves the evidence package unpacked under `originals/`, and serves each resource with its signed media type and the headers P9.7 requires.

### Bitcoin

P14.12 An Originals inscription has (P9.17; owner decision, 1 November 2026):

- **Metadata** (ord tag 5): the CBOR encoding of a JSON array of entries, each the parsed JSON of one asset log line. The anchoring inscription’s array holds the entries from genesis through the anchoring entry, in order; every later array holds exactly one entry. The metadata is split into data pushes of at most 520 bytes, which a reader concatenates before decoding.
- **Content type** (ord tag 1): the `mediaType` of the resource in the array’s last entry.
- **Body**: the exact bytes of the resource version that the last entry’s `resource` descriptor names, with no content encoding.

The JSON-to-CBOR mapping is provisional; it is the one ord applies to `--json-metadata`: an object is a map with text-string keys in the object’s order, an array an array, a string a text string, an integer an integer in shortest form, `true`, `false` and `null` their simple values. A reader MUST reject metadata that is not one well-formed CBOR item, or that contains a tag, a byte string, a float, an indefinite-length item, a map key that is not a text string, a duplicate key, or an integer outside P14.3’s bound. It decodes the metadata to JSON values, and each entry is then checked under P14.3–P14.8, its hashes and proof computed over its JCS form; P14.2’s line format does not apply to it. An entry over the entry limit (P14.13) is measured as its JCS form in UTF-8. The metadata and body together MUST NOT exceed 350,000 bytes. An inscription whose metadata does not decode to a JSON array is not an Originals inscription. A did:btco DID matches `^did:btco:((sig|test|reg):)?(0|[1-9][0-9]{0,15})$` with a sat number no greater than 2,099,999,997,689,999 (P9.10). A did:btco signer version is an inscription whose own metadata is a CBOR DID document, in shortest-form encoding, whose `id` is that DID, whatever its body, delegation or content encoding (P5.13).

### Limits

P14.13 A verifier MUST enforce these limits (P7.7, P8.5):

| Limit | Value |
|---|---|
| Entries in an asset log | 10,000 |
| Bytes in one entry, as its UTF-8 line without the line feed | 65,536 |
| Editor grants | 32 |
| Versions of one signer DID | 1,000 |
| Bytes in a fetched log file | 16 MiB |
| Bytes in one fetched resource | 64 MiB |
| Time for one fetch | 15 seconds |

The SDK MUST refuse to sign an entry over the entry limit, rather than produce one every verifier rejects. An inscription’s 350,000 bytes (P9.17) hold the resource version and the entries together, so a large resource leaves little room for the log: an Original whose current version is over about 340,000 bytes cannot be anchored, and authors SHOULD anchor early, while the log through the anchoring entry is still short.

The SDK measures entry size in UTF-16 code units of the re-serialised entry and sets no resource-size limit; this section measures UTF-8 bytes of the line as stored and sets 64 MiB, so that implementations in other languages agree.

### Shared-host saves

A shared host (P6.7) needs no particular transport. As a guide, the SDK submits `{original, entry, resources, identities}`, where `entry` is the exact line, and the host answers `accepted` or `already-accepted` with the checkpoint and head, or `stale-parent` with the head.

Sources: Originals SDK revision 1b3cabdd [S29].
