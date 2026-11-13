## Wire format (partly provisional)

This section pins the byte-level choices that independent implementations must share. Owner decisions of 21 October 2026 decide the 350,000-byte inscription limit and the did:btco network prefixes in P14.12, and the limits in P14.13. D4 decides JCS canonicalization (P14.3), as the canonicalization the pinned VH Log version uses; SHA-256 multihashes for resource digests (P14.7, P4.2); the two cryptosuites (P14.8, P5.12); and the parts of P14.2, P14.3, P14.5, P14.8 and P14.10 that it records as decided on 23 October 2026. D3 decides that an asset log has no witness file (P14.2, P9.8). D6 decides the inscription body, metadata and media type in P14.12 (P9.17; owner decision, 1 November 2026), except the JSON-to-CBOR mapping of the metadata, which stays provisional, and that a did:btco signer version is identified by its own metadata alone (P14.12, P5.13). The carried-log values (P14.14–P14.17) and the EVM anchoring values (P14.18–P14.22) are proposed and provisional. Everything else in this section, including the entry state fields and the evidence package format, is **provisional**: it is taken from the Originals SDK at revision 1b3cabdd [S29], which is the only implementation, and recorded so that it is reviewed as a decision rather than adopted silently (D1, D4). Where the SDK and this section differ, this section says so and the SDK is expected to change. A provisional value may still change before an interoperable release; until then a change keeps the `method` value `originals:1.0`, and Originals written under the earlier value no longer verify (owner decision, 1 November 2026). After an interoperable release, changing a value changes the `method` value.

### Log and parameters

P14.1 An Original’s asset log MUST use the `method` value `originals:1.0`, which implies `vh-log:1.0`. The genesis entry’s parameters MUST be exactly `method` and `scid`; a deactivation entry’s parameters MUST be exactly `{"deactivated": true}`; every other entry’s parameters MUST be `{}`. A null parameter value MUST be rejected (P5.9, P9.9).

P14.2 The asset log file is named `did.jsonl`. Each entry is one line of compact JSON ending in a single line feed. An asset log has no witness file (P9.8). `versionTime` MUST carry at most three fractional digits and end in `Z`, and MUST be later than the previous entry’s by at least one millisecond (D5) [S22]. A reader MUST reject an asset log, hosted or packaged, that breaks this line format, including one with a carriage return or no final line feed, or whose line contains whitespace outside JSON strings. Key order and string escapes are not constrained, because hashes and proofs are computed over the JCS form (P14.3). The logs of signer DIDs and did:webvh aliases follow their own DID methods.

P14.3 Canonicalization is JCS [[spec: RFC8785]]. Parsers MUST reject duplicate keys, lone surrogates, any number whose exact decimal value, as written, has magnitude greater than 9,007,199,254,740,991 (2<sup>53</sup> − 1) (for example `1e16` or `9007199254740993.0`), any number whose value is negative zero (for example `-0` or `-0.0`), and nesting deeper than 64 levels (P5.7).

### Entry state

P14.4 An entry’s state MUST have exactly the members `id`, `operation`, `author`, `asset` and `transitions`, and an editor entry also `editor`. Every object defined in this section MUST have exactly its listed members, and a verifier MUST reject any other member (P5.7).

- `id` is the Original’s did:vh, `did:vh:<SCID>`.
- `operation` is `create` in the genesis entry and `update` or `deactivate` in every other entry. Anchoring is an `update` (P9.10).
- `author` and `editor` are each exactly `{did, verificationMethod, versionId}`, all strings (P5.1, P5.16). For a did:btco signer, `versionId` is the inscription id of the version (P5.13).
- `asset` has the required members `name`, `status`, `resource` and `aliases`, and the optional members `metadata`, `editors` and `anchor` (P14.18).
- `transitions` is an array of `{from, to}` with at most one item, where `from` is the previous digest, or null in the genesis entry, and `to` is the new digest. It MUST have one item exactly when the resource’s digest changes: in the genesis entry `{from: null, to}`, and in a later entry that changes the digest `{from, to}`. It is empty in any other entry, including a deactivation (P4.1, P4.2).

P14.5 The members of `asset`:

- `name`: a string of 1 to 1,024 UTF-16 code units (owner decision, 23 October 2026).
- `metadata`: a JSON object. When absent, there is no metadata (P4.6).
- `status`: `active` or `deactivated`, agreeing with the operation and the deactivated parameter (P6.5).
- `aliases`: an array of DIDs with at most one did:webvh and at most one did:btco, or, in an entry with an `anchor` member, at most one did:webvh and at most one token alias, a did:evm DID (P14.18, P9.19). It holds no DID of any other method and no DID twice, and a verifier MUST reject one that does (P3.9). The genesis entry lists none.
- `anchor`: the anchor chain and minter, set at genesis and changed only by a move entry (P9.19, P9.28, P14.18). When absent, the anchor chain is Bitcoin.
- `resource`: the descriptor of the Original’s one resource, at its version in this entry (P4.1).
- `editors`: an array of 1 to 32 grants, each exactly `{did, name, metadata, resource}`, all but `did` booleans. An empty array MUST NOT be used; absence means no editors (P5.15).

P14.6 A resource descriptor is exactly `{mediaType, size, digest}`. `mediaType` is a `type/subtype` media type without parameters, and a verifier MUST reject one that has a parameter. `size` is the byte length, a non-negative integer. `mediaType` and `size` MUST NOT change unless `digest` changes in the same entry.

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

The `#files` service is the resource’s descriptor at that version; where to fetch the bytes comes from a did:webvh alias, a `src` location, an evidence package, a carried file (P7.11) or, for a version inscribed on the anchoring sat or published on the Original’s token, that inscription’s or publication’s body (P9.17, P9.25).

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

The JSON-to-CBOR mapping is provisional; it is the one ord applies to `--json-metadata`: an object is a map with text-string keys in the object’s order, an array an array, a string a text string, an integer an integer in shortest form, any other number a float in the narrowest of half, single and double precision that holds it exactly, `true`, `false` and `null` their simple values. A reader MUST accept a float of any of the three widths, and MUST reject metadata that is not one well-formed CBOR item, or that contains a tag, a byte string, an indefinite-length item, a map key that is not a text string, a duplicate key, an integer outside P14.3’s bound, or a float that is not finite, is negative zero or has a magnitude outside P14.3’s bound. Because each entry is checked over its JCS form, the width of a float and the form of an integer do not change its hashes or proof. It decodes the metadata to JSON values, and each entry is then checked under P14.3–P14.8, its hashes and proof computed over its JCS form; P14.2’s line format does not apply to it. An entry over the entry limit (P14.13) is measured as its JCS form in UTF-8. The metadata and body together MUST NOT exceed 350,000 bytes. An inscription whose metadata does not decode to a JSON array is not an Originals inscription. A did:btco DID matches `^did:btco:((sig|test|reg):)?(0|[1-9][0-9]{0,15})$` with a sat number no greater than 2,099,999,997,689,999 (P9.10). A did:btco signer version is an inscription whose own metadata is a CBOR DID document, in shortest-form encoding, whose `id` is that DID, whatever its body, delegation or content encoding (P5.13).

### Limits

P14.13 A verifier MUST enforce these limits (P7.7, P8.5):

| Limit | Value |
|---|---|
| Entries in an asset log | 10,000 |
| Bytes in one entry, as its JCS form in UTF-8, in every format | 65,536 |
| Editor grants | 32 |
| Versions of one signer DID | 1,000 |
| Bytes in a fetched log file | 16 MiB |
| Bytes in one fetched resource | 64 MiB |
| Time for one fetch | 15 seconds |

The SDK MUST refuse to sign an entry over the entry limit, rather than produce one every verifier rejects. An inscription’s 350,000 bytes (P9.17) hold the resource version and the entries together, so a large resource leaves little room for the log: an Original whose current version is over about 340,000 bytes cannot be anchored, and authors SHOULD anchor early, while the log through the anchoring entry is still short.

The SDK measures entry size in UTF-16 code units of the re-serialised entry and sets no resource-size limit; this section measures the UTF-8 bytes of the entry’s JCS form and sets 64 MiB, so that implementations in other languages agree.

### Shared-host saves

A shared host (P6.7) needs no particular transport. As a guide, the SDK submits `{original, entry, resources, identities}`, where `entry` is the exact line, and the host answers `accepted` or `already-accepted` with the checkpoint and head, or `stale-parent` with the head.

### Carried log (proposed)

Everything in this subsection is provisional. The trailer media types were checked only on macOS (Preview, Quick Look, `sips`, `afinfo`) with a 12,000-byte trailer; adding a media type needs the same evidence across the readers it targets.

P14.14 The carrier for a resource version is chosen by the `mediaType` its descriptor names (P14.6), compared ASCII case-insensitively, and no other carrier is valid for it (P7.12). A `mediaType` has no parameters (P14.6), so one such as `text/plain; charset=utf-8` is rejected, not matched with its parameter ignored:

| Carrier | `mediaType` |
|---|---|
| Trailer (P14.15) | `image/png`, `image/jpeg`, `image/gif`, `image/tiff`, `image/heic`, `audio/mp4`, `audio/wav`, `audio/aiff` |
| Text block (P14.16), with the comment syntax in its table | the media types in P14.16’s table |
| JSON member (P14.17) | `application/json`, `application/geo+json` |

Any other media type has no carrier, including an alias of a listed type, such as `application/javascript` or `audio/x-wav`; ZIP-based formats such as EPUB and Office documents, whose readers look for their directory only in the last 65,557 bytes; PDF, whose readers may look for `%%EOF` only in the last 1,024 bytes; and other `+json` types, whose own signatures or closed schemas an added member can break.

A carrier is at most 16 MiB (16,777,216 bytes); a larger one is no carrier. In every carrier an entry’s size is measured as its JCS form in UTF-8 (P14.13); the limits on a file, a carrier and a publication are separate from it. In every carrier each entry is checked under P14.3–P14.8, nesting depth counted from the entry. A reader MAY refuse a carried file larger than the resource limit of P14.13 plus 16 MiB.

A reader does not know the media type before it has found the log. It tries each carrier’s detection, and no two carriers can match one file. A file name extension or a declared type MAY decide which it tries first, but is only a hint: when the hint is wrong or absent the reader tries the other carriers. It then verifies the log and checks that the carrier it found is the one this rule assigns to the last entry’s `mediaType` (P7.12).

P14.15 A trailer is the asset log `L`, exactly as P14.2 defines `did.jsonl`, followed by a 24-byte footer: the byte length of `L` as an unsigned 64-bit big-endian integer, then the 16 bytes `89 4F 52 49 47 49 4E 41 4C 4C 4F 47 0D 0A 1A 0A` (`\x89ORIGINALLOG\r\n\x1A\n`). A file has a trailer only if it is at least 24 bytes long, its last 16 bytes are that sequence, and `24 + length`, computed without overflow, is at most 16 MiB (P14.14) and at most the file’s size. A reader can decide this from the footer alone, before reading `L`. The carrier is the last `24 + length` bytes, and the resource version is every byte before it. Like PNG’s signature, the footer is damaged by end-of-line conversion and by stripping the high bit, so a file altered that way has no trailer rather than a wrong one. A trailer whose `L` breaks P14.2 is a trailer with an invalid log.

P14.16 A text block is a single line feed (0x0A), which a writer never precedes with a carriage return of its own, followed by these lines:

- the comment opener, for a block comment;
- `=====BEGIN ORIGINAL=====`;
- one line per entry, in order, each the compact JSON of the entry as in P14.2;
- `=====END ORIGINAL=====`;
- the comment closer, for a block comment.

For a line comment, each marker and entry line starts with the comment prefix and one space. Each line ends in a line feed, or in CR LF when the resource version’s own lines end that way; a reader MUST accept either. A writer ends the last line too, but a reader MUST also accept a last line with no line end. A writer MUST refuse a text block unless the resource version is valid UTF-8, a leading UTF-8 byte order mark allowed. It MUST also refuse unless the appended block, parsed under the version’s own syntax, is a separate comment and nothing else; `text/plain` has no comment and no such check. The test is the parse of the resulting file, not a search of the version for particular text. The checks known for each type are:

- `text/html`, parsed with an HTML parser: refuse a version that ends inside a comment, or inside an element whose content is not parsed as markup, `script`, `style`, `textarea`, `title`, `xmp`, `plaintext` or `noscript`. An unclosed `pre` is not a reason to refuse, because its content is parsed as markup and the block is still a comment.
- `text/markdown`: refuse a version that ends inside an unclosed code fence, or in one of the HTML contexts above.
- `application/xhtml+xml`, `image/svg+xml`, `application/xml` and `text/xml`, parsed with an XML parser: refuse a version that ends inside a comment or a CDATA section.
- `text/css`: refuse a version that ends inside an unterminated comment or string.
- `application/yaml`: refuse a document whose last node is a block scalar.
- the line-comment types: refuse a version that ends inside an unterminated string, heredoc or block comment of its language, or whose last line ends in a line continuation.

This list is not yet complete and testable for every type in the table. Completing it, or dropping a type for which no reliable check exists, is open (D4).

Every entry line MUST be ASCII: a writer escapes every other character inside JSON strings with `\u` escapes, and also escapes characters so that no line contains the comment’s closer or, for `<!--` comments, `--`. These escapes do not change the entry’s JCS form (P14.3), and P14.2’s line rules otherwise apply to each entry line once its comment prefix and line end are removed. A reader MUST treat as no carrier a block in which any line contains a character that is not ASCII, a carriage return other than before its line feed, the comment’s closer before the closer line or, for `<!--` comments, `--` outside the opener and closer lines, so that a value un-escaped after signing cannot end the comment early.

A reader finds the block from the end of the file. After removing any spaces, tabs, carriage returns and line feeds at the end, the last line MUST be the comment closer for a block comment, or the `=====END ORIGINAL=====` line otherwise; the block then runs back through entry lines to the nearest `=====BEGIN ORIGINAL=====` line and, for a block comment, the opener line immediately before it. Marker, opener and closer lines match only as whole lines, after their comment prefix and line end are removed. The block is located by these lines alone: a line between the markers that is not a valid entry line, or no entry line at all, makes it a text block with an invalid log, not content. A block whose first line is not preceded by a line feed is no carrier. An incomplete or malformed marker structure is no carrier either: a closer line not directly preceded by the `=====END ORIGINAL=====` line, or, in a block comment, a `=====BEGIN ORIGINAL=====` line not directly preceded by the opener line. Removing a carrier MUST restore the version’s exact bytes. Which line end a writer uses for a version with mixed line ends, and whether the carriage-return rule covers the whitespace after the last line, are open (D4). The carrier runs from the line feed immediately before the block’s first line to the end of the file, including the whitespace after its last line, and the resource version is every byte before it. Any earlier block is content.

| `mediaType` | Comment |
|---|---|
| `text/plain` | none: the lines stand alone |
| `text/markdown`, `text/html`, `application/xhtml+xml`, `image/svg+xml`, `application/xml`, `text/xml` | block, `<!--` and `-->` |
| `text/css` | block, `/*` and `*/` |
| `text/javascript`, `application/typescript`, `text/x-c`, `text/x-c++`, `text/x-java-source`, `text/x-go`, `text/x-rust`, `text/x-swift`, `text/x-kotlin` | line, `//` |
| `text/x-python`, `text/x-shellscript`, `application/yaml`, `application/toml` | line, `#` |
| `application/sql` | line, `--` |

Other `text/` types, such as `text/csv`, have no carrier, because a trailing line would be read as content; so has `text/x-ruby`, whose `__END__` makes every later line data.

P14.17 A JSON member is a member of the document’s root object named `originalLog`, whose value is an array of the entries, in order, each a JSON object. A writer MUST write it as the root object’s last member: immediately after the last existing member’s value, before the whitespace that followed that value, or immediately after the root object’s `{` when the object is empty, leaving every other byte unchanged. When the member is the root object’s last, the carrier runs from the first byte after the previous member’s value, or after the root object’s `{` when it is the only member, through the array’s closing `]`, and the resource version is the document with exactly those bytes removed. A document has a JSON member only if its root is an object with exactly one member of that name, member names being compared after their escapes are decoded. A reader MUST reject a root object with more than one, and does not choose among them; a member of that name nested below the root is not a JSON member. A reader MUST find the member wherever it is in the root object, because tools reorder members. A member that is not the root object’s last still carries its log, which is verified and reported as P7.12 states for a log found where no carrier is defined; how its bytes are removed is open (D4), so the file is not verified as a version. A root member of that name is a JSON member whatever its value; a value that is not an array of objects is an invalid log. A reader MUST skip one leading UTF-8 byte order mark, which stays part of the version. A document nested deeper than 1,024 levels outside the entries, counting the root object as level 1, has no JSON member. A reader needs a parser that reports byte offsets to find the carrier’s bytes exactly. Outside the entries the document need only be JSON [[spec: RFC8259]]; P14.3’s limits apply to the entries only. P14.2’s line format does not apply. Whitespace, key order and string escapes in the entries are therefore free, so a carried log survives reformatting, although the remaining bytes then no longer match the version (P7.12). A writer MUST refuse a document whose root is not an object or that has any root member of that name (P7.15).

### EVM anchoring (proposed)

Everything in this subsection is provisional (D6). The anchor contract has not yet been reviewed, audited or deployed, so P14.21 pins no address or code hash. Until it does:

- a writer MUST NOT write an `anchor` member;
- a verifier MUST report an Original whose genesis entry has one as unsupported (P3.3), not invalid, whatever source its log comes from, including a carried log with no anchoring entry, which is then not read as a historical checkpoint (P7.14).

P14.18 The `anchor` member of `asset` (P14.5) is exactly `{chain, minter}`, both strings:

- `chain` is a CAIP-2 chain ID in the `eip155` namespace [S31]: `eip155:` followed by the chain ID in decimal with no leading zeros, matching `^eip155:[1-9][0-9]{0,19}$`, with a value below 2<sup>64</sup>. A chain that P14.22 does not list is unsupported (P9.19).
- `minter` is an address: `0x` followed by 40 lowercase hexadecimal digits. Mixed-case EIP-55 checksums are not used, so that equal addresses are equal strings.

A token alias is a DID of the did:evm method, which this profile defines (P3.9): `did:evm:<chain ID>:<contract address>:<token ID>`. The chain ID is the decimal chain ID of `chain`, without the `eip155:` prefix; the contract address is the one P14.21 fixes for that chain, in lowercase; and the token ID is P14.19’s in decimal with no leading zeros. A verifier MUST reject any other form. The derived DID document lists it in `alsoKnownAs` like any other alias (P14.9). The token’s CAIP-19 asset ID [S32], `eip155:<chain ID>/erc721:<contract address>/<token ID>`, is derived from the DID for wallets and marketplaces, and is never written in `aliases`. The method name is provisional (D6).

The DID document of a token alias is derived, never stored (P3.9). It is the document P14.9 derives from the state accepted on the token, with the token alias as its `id` and in its service `id`, and with `alsoKnownAs` listing exactly the Original’s did:vh.

P14.19 An Original’s token ID is `uint256(keccak256(abi.encode(keccak256(d), m)))`, where:

- `d` is the UTF-8 bytes of the Original’s did:vh, `did:vh:<SCID>`;
- `m` is the `minter` address;
- `abi.encode` is the Solidity ABI encoding of a `bytes32` and an `address`.

The contract’s `mint(bytes32 original)` mints the token whose ID is computed from `original` and the caller’s address, to the caller. It reverts if that token exists. A token minted for the wrong `original`, or by an address other than the minter, has a different ID and is not the Original’s token.

P14.20 The anchor contract implements ERC-721 [S33] and these functions and events:

```solidity
function mint(bytes32 original) external returns (uint256 tokenId);

function publish(uint256 tokenId, string calldata mediaType, bytes calldata metadata, bytes calldata body) external returns (uint32 index);
function publishSameBody(uint256 tokenId, bytes calldata metadata, uint32 bodyOf) external returns (uint32 index);

function begin(uint256 tokenId) external returns (bytes32 upload);
function append(bytes32 upload, bytes calldata data) external;
function commit(bytes32 upload, string calldata mediaType, uint32 metadataLength) external returns (uint32 index);
function commitSameBody(bytes32 upload, uint32 bodyOf) external returns (uint32 index);

function publicationCount(uint256 tokenId) external view returns (uint32);
function publication(uint256 tokenId, uint32 index) external view
    returns (uint64 timestamp, uint32 metadataLength, uint32 bodyLength, uint32 bodyOf, string memory mediaType);
function metadata(uint256 tokenId, uint32 index, uint32 offset, uint32 length) external view returns (bytes memory);
function body(uint256 tokenId, uint32 index, uint32 offset, uint32 length) external view returns (bytes memory);

event Published(uint256 indexed tokenId, uint32 index);
event UploadBegun(uint256 indexed tokenId, bytes32 upload, address by);
```

**Records.** The contract keeps, for each token, a list of publication records with indexes from 0 in the order they were recorded. A record holds the timestamp of the block that recorded it, which is the chain’s own (`block.timestamp`), the lengths of its metadata and body, its media type, and `bodyOf`: its own index if the publication stored its body, or the index of the earlier record of the same token whose body it refers to. A record that refers to an earlier body holds that body’s actual length as its `bodyLength`, not zero. Those bytes are not stored again and do not count again toward the 350,000-byte limit: a publication counts the bytes it newly stores. `bodyOf` is an index into the selected token’s own records, so a body stored on another token cannot be referred to. A record is never changed or removed. A record holds no block number: a contract on an Arbitrum chain sees an approximate block number of its parent chain, not its own [S42], and the record index already orders publications (P9.20).

**Bytes.** The contract stores a publication’s metadata and body in state, as the code of contracts it creates: each holds a zero byte followed by at most 24,575 bytes [S37], and the contract keeps their addresses in its own storage. `metadata` and `body` return the stored bytes from `offset`, at most `length` of them and fewer at the end, so a reader can read a record in ranges that suit its provider; `body` of a record that refers to an earlier one returns that one’s bytes. The contract emits no publication bytes in events. `Published` only helps a reader find records (P9.25). `begin` emits `UploadBegun` with the upload ID, which a transaction receipt does not otherwise return, so that the writer can learn it. Both events are discovery aids: the contract’s state remains the evidence.

A publication is recorded in one of three ways:

- **In one transaction:** `publish` stores the metadata and body and adds a record.
- **Referring to a stored body:** `publishSameBody` stores the metadata and adds a record whose body is that of record `bodyOf`. It reverts unless `bodyOf` is an earlier record of the same token that stored its own body. The new record takes that record’s media type.
- **In stages, for data larger than a chain accepts in one transaction.** Chains cap a transaction’s gas and size, and storing bytes in state is costly, so on many chains this is the usual path for all but small publications:
  - `begin` opens an upload;
  - `append` stores the next bytes of the upload, and only the caller of `begin` can call it;
  - `commit` closes the upload and adds a record: the first `metadataLength` bytes of the upload are the metadata and the rest the body. Only the caller of `begin` can call it, once, and it reverts if `metadataLength` exceeds the upload;
  - `commitSameBody` closes the upload instead and adds a record whose metadata is the whole upload and whose body is that of record `bodyOf`, on the conditions of `publishSameBody`. An entry can be larger than a chain accepts in one transaction, and without this it would have to store its body again.

**Limits.** The contract enforces the 350,000-byte limit (P9.25). `publish` reverts if its metadata and body together exceed it, `publishSameBody` if its metadata does, and `append` if it would take the upload past it. `publish`, `publishSameBody` and `commit` revert if `mediaType` is longer than 255 bytes. No record, and no upload, therefore holds more than 350,000 bytes.

`publish`, `publishSameBody`, `begin`, `commit` and `commitSameBody` revert unless the caller is, at that moment, the token’s holder, the address approved for that token through `approve`, or an operator the holder approved through `setApprovalForAll`. Only a record places a publication in chain order (P9.20), so an upload that is never committed is ignored. The contract judges no signature and no entry: it checks only who may publish (P9.12, P9.23).

- **Metadata:** the CBOR array of entries that P14.12 defines for inscription metadata, with the same mapping and reader rules.
- **Body:** the exact bytes of the resource version that the last entry names (P9.17), under the record’s media type, which MUST equal that version’s `mediaType`.

A reader MUST reject a record whose metadata and body lengths together exceed 350,000 bytes for a record that stored its body, or whose metadata length does for one that refers to a body, or whose media type is longer than 255 bytes, and MUST do so from the record’s fields without reading its bytes (P9.25). It MUST reject a publication whose body’s digest, size or media type differs from the last entry’s descriptor, whether the record stored the body or refers to it. A writer SHOULD use `publishSameBody` when the bytes are already stored on the token, and chooses how to split an upload to fit the chain’s transaction limits. Neither choice changes the publication.

P14.21 The anchor contract is compiled for the EVM version this section will pin, and deployed with CREATE2 through the deterministic deployment proxy at `0x4e59b44847b379578588920ca78fbf26c0b4956c` [S34], with a zero salt, so that it has the same address on every listed chain where that proxy exists and the pinned bytecode runs. Whether it can be deployed that way is checked for each chain before P14.22 lists the chain with a pin. Where it cannot, this section MAY pin another address for that chain, and a verifier still checks the code at that address against the pinned runtime code hash (P9.21). This section will pin, after review and an external audit:

- the contract’s source;
- the compiler and its settings;
- the EVM version;
- the resulting address, and the address for any chain where it differs;
- the runtime code hash.

The contract has no owner, administrator, proxy, upgrade, pause or self-destruct path. Its `tokenURI` MUST be computed from the contract’s own state and MUST NOT name a location off the chain; its form is open (D6).

P14.22 The supported chains. Each row is provisional, and each class is an assessment on the date given, against the definitions of P9.27:

| Chain | `chain` | Hash of block 0 | Class | Assessed | Basis |
|---|---|---|---|---|---|
| Ethereum | `eip155:1` | `0xd4e56740f876aef8c010b86a40d5f56745a118d0906a34e69aec8c0db1cb8fa3` | `consensus` | 11 November 2026 | Open validator set; changes take effect by its validators adopting them |
| Monad | `eip155:143` | `0x0c47353304f22b1c15706367d739b850cda80b5c87bbc335014fef3d88deaac9` | `consensus` | 11 November 2026 | Its staking contract registers a validator for any caller that supplies valid keys and 100,000 MON, with no approval step, and the 200 validators with the most stake, each with at least 10,000,000 MON, are active [S38]. Upgrades are hard forks its validators adopt; who decides them is not documented (D6) |
| Base | `eip155:8453` | `0xf712aa9241cc24369b143cf6dce85f0902a9731e70d66818a3a5845b296c73dd` | `exit-protected` | 11 November 2026 | Stage 1 [S36]: its data is on Ethereum, a transaction can be forced in within 12 hours, and anyone can propose state. There is no exit window: its contracts can be upgraded at once, but only by the Base Coordinator Multisig and the Base Security Council together |
| Arbitrum One | `eip155:42161` | `0x7ee576b35482195fc49205cec9af72ce14f003b9ae69f6ba0faef4514be8b442` | `exit-protected` | 11 November 2026 | Stage 1 [S36]: its data is on Ethereum, a transaction can be forced in within one day, and anyone can propose state. An ordinary upgrade leaves 10 days to exit; its Security Council can upgrade at once |
| Arc | `eip155:5042` | `0x09944e07412986bb417fd0006c89ffb71ee523d68ce2017ec2dabc944c42edad` | `consortium` | 11 November 2026 | A permissioned validator set of named institutions under proof of authority, which applies sanctions controls [S39]. Circle decides its membership and its upgrades, as summaries of Arc’s white paper report; no Arc page states it (D6) |
| Tempo | `eip155:4217` | `0x49d7ec7085e77bf5a403d0fcb4cfc42a4084a89dfff60477579c5e09c9e03c54` | `consortium` | 11 November 2026 | A permissioned validator set: only the owner of its validator contract, the Tempo team, adds a validator [S40]. Who decides upgrades is not documented (D6) |
| Robinhood Chain | `eip155:4663` | `0xaad15f3d702aaea00caf3e9bb56395efe9127bc3b31b24921abf1eee3409305c` | `operator` | 11 November 2026 | Stage 0 [S36]: an authorized filterer can make any transaction fail, including a forced one, without delay; its contracts can be upgraded at once; only two admitted parties can challenge its state |
| Elysium | `eip155:99901` | `0x14cd46a8e7cfd201c7a79d307c320213f984e7a2b3297cd4e2c4b514538db600` | `operator` | 11 November 2026 | One sequencer and permissioned validation; its transaction data is held by one server that the chain’s infrastructure operator runs, and only a certificate is posted to HyperEVM, the chain it settles to [S41]. Who can upgrade it is not documented (D6) |

A chain of class `operator` or `consortium` is an attested chain, and one of class `exit-protected` or `consensus` a proven chain (P9.28). A revision that changes a chain’s class MUST keep the earlier row, and give the date from which the new class applies, because a move is judged by the classes that applied at its departure (P9.28).

The hashes are those that two public endpoints of each chain reported for block 0 on 10 and 11 November 2026; Monad’s two are under one domain. The Stage 1 and Stage 0 assessments are L2BEAT’s as served on 10 November 2026. A chain is added, removed or reclassified only by a revision of this rule.

Sources: Originals SDK revision 1b3cabdd [S29]; the carried log, the owner request of 9 November 2026; CAIP-2, CAIP-19, ERC-721 and the deterministic deployment proxy [S31–S34]; Ethereum JSON-RPC block tags [S35]; the L2BEAT stages [S36]; the EIP-170 contract code size limit [S37]; the documentation of Monad, Arc, Tempo and Elysium [S38–S41]; Arbitrum’s block numbers and time [S42].
