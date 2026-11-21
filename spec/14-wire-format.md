## Wire format (partly provisional)

This section pins the byte-level choices that independent implementations must share. D6 decides the 350,000-byte inscription limit and the did:btco network prefixes in P14.12, and D4 the limits in P14.13. D4 decides JCS canonicalization (P14.3), as the canonicalization the pinned VH Log version uses; SHA-256 multihashes for resource digests (P14.7, P4.2); the two cryptosuites (P14.8, P5.12); and the parts of P14.2, P14.3, P14.5, P14.8 and P14.10 that it records as decided. D3 decides that an asset log has no witness file (P14.2, P9.8). D6 decides the inscription body, metadata and media type in P14.12 (P9.17, P9.30), and the 8,192-byte preview limit in P14.13, except the JSON-to-CBOR mapping of the metadata, which stays provisional, and that a did:btco signer version is identified by its own metadata alone (P14.12, P5.13). The carried-log values (P14.14–P14.17) are proposed and provisional. D8 decides signer sets, parent Originals and scoped grants; the members that carry them (P14.4, P14.5, P14.8–P14.10, P14.23) are provisional, as the other entry state fields are, and so are the three limits P14.13 adds for them. They are an additive change under the same `method` value: an Original without `authors` or `parent`, and a grant without `scope`, are exactly as before. Everything else in this section, including the entry state fields and the evidence package format, is **provisional**: it is taken from the Originals SDK at revision 1b3cabdd [S29], which is the only implementation, and recorded so that it is reviewed as a decision rather than adopted silently (D1, D4). Where the SDK and this section differ, this section says so and the SDK is expected to change. A provisional value may still change before an interoperable release; until then a change keeps the `method` value `originals:1.0`, and Originals written under an earlier provisional value no longer verify. After an interoperable release, changing a value changes the `method` value.

### Log and parameters

P14.1 An Original’s asset log MUST use the `method` value `originals:1.0`, which implies `vh-log:1.0`. The genesis entry’s parameters MUST be exactly `method` and `scid`; a deactivation entry’s parameters MUST be exactly `{"deactivated": true}`; every other entry’s parameters MUST be `{}`. A null parameter value MUST be rejected (P5.9, P9.9).

P14.2 The asset log file is named `did.jsonl`. Each entry is one line of compact JSON ending in a single line feed. An asset log has no witness file (P9.8). `versionTime` MUST carry at most three fractional digits and end in `Z`, and MUST be later than the previous entry’s by at least one millisecond (D5) [S22]. A reader MUST reject an asset log, hosted or packaged, that breaks this line format, including one with a carriage return or no final line feed, or whose line contains whitespace outside JSON strings. Key order and string escapes are not constrained, because hashes and proofs are computed over the JCS form (P14.3). The logs of signer DIDs and did:webvh aliases follow their own DID methods.

P14.3 Canonicalization is JCS [[spec: RFC8785]]. Parsers MUST reject duplicate keys, lone surrogates, any number whose exact decimal value, as written, has magnitude greater than 9,007,199,254,740,991 (2<sup>53</sup> − 1) (for example `1e16` or `9007199254740993.0`), any number whose value is negative zero (for example `-0` or `-0.0`), and nesting deeper than 64 levels (P5.7).

### Entry state

P14.4 An entry’s state MUST have exactly the members `id`, `operation`, `author`, `asset` and `transitions`, and an editor entry also `editor`. Every object defined in this section MUST have exactly its listed members, and a verifier MUST reject any other member (P5.7).

- `id` is the Original’s did:vh, `did:vh:<SCID>`.
- `operation` is `create` in the genesis entry and `update` or `deactivate` in every other entry. Anchoring is an `update` (P9.10).
- `editor`, and `author` when `asset` has no `authors`, are each a [[ref: signer]] reference, exactly `{did, verificationMethod, versionId}`, all strings (P5.1, P5.16). For a did:btco signer, `versionId` is the inscription id of the version (P5.13).
- When `asset` has `authors`, `author` is instead an array of 1 to 32 signer references, sorted by `did` in the order of UTF-16 code units, as JCS sorts member names, with no `did` twice (P5.19). A verifier MUST reject an `author` that is an array when `asset` has no `authors`, or an object when it has.
- `asset` has the required members `name`, `status`, `resource` and `aliases`, and the optional members `metadata`, `editors`, `readers`, `preview`, `authors` and `parent`.
- `transitions` is an array of `{from, to}` with at most one item, where `from` is the previous digest, or null in the genesis entry, and `to` is the new digest. It MUST have one item exactly when the resource’s digest changes: in the genesis entry `{from: null, to}`, and in a later entry that changes the digest `{from, to}`. It is empty in any other entry, including a deactivation (P4.1, P4.2).

P14.5 The members of `asset`:

- `name`: a string of 1 to 1,024 UTF-16 code units.
- `metadata`: a JSON object. When absent, there is no metadata (P4.6).
- `status`: `active` or `deactivated`, agreeing with the operation and the deactivated parameter (P6.5).
- `aliases`: an array of DIDs with at most one did:webvh and at most one did:btco. It holds no DID of any other method and no DID twice, and a verifier MUST reject one that does (P3.9). The genesis entry lists none.
- `resource`: the descriptor of the Original’s one resource, at its version in this entry (P4.1).
- `preview`: exactly `{mediaType, size, digest}`, the preview of the version that `resource` names, for an inscription (P9.30). Each member follows P14.6 and P14.7 as for a resource descriptor, and `size` MUST be at least 1 and at most 8,192. It is allowed only in an entry whose `aliases` list a did:btco DID.
- `editors`: an array of 1 to 32 grants, each with exactly the members `did`, `name`, `metadata` and `resource`, all but `did` booleans, and optionally `scope`. An empty array MUST NOT be used; absence means no editors (P5.15). `scope` is an object with a string member `type` and the members its scope type defines (P5.28, P14.23); it MUST NOT be present when `resource` is false.
- `readers`: an array of 0 to 128 read grants, each exactly `{did}`, a string (P8.6). Absence means the Original is public, unless it has a `parent` (P8.10); an empty array means it is private, readable only by its author, or the members of its signer set, and its editors. A `scope` member, as editor grants have (P5.28), is reserved for read scopes; until a profile defines them a verifier MUST reject a read grant that has one (P8.14).
- `authors`: exactly `{threshold, dids}`, where `dids` is an array of 1 to 32 DIDs, sorted in the order of UTF-16 code units, with no DID twice, and `threshold` is an integer from 1 to the length of `dids` (P5.19). Once present it is never removed.
- `parent`: exactly `{did, versionId}`, both strings: the parent Original’s did:vh, `did:vh:<SCID>`, and the pin, a versionId of the parent’s asset log (P5.24). It is set only in the genesis entry, and only `versionId` changes.

P14.6 A resource descriptor is exactly `{mediaType, size, digest}`. `mediaType` is a `type/subtype` media type without parameters, and a verifier MUST reject one that has a parameter. `size` is the byte length, a non-negative integer. `mediaType` and `size` MUST NOT change unless `digest` changes in the same entry.

P14.7 A resource digest is the letter `z` followed by the base58btc encoding of the SHA-256 multihash (code 0x12, length 0x20) of the bytes, so it begins `zQm`. A verifier MUST reject a digest whose encoding is not the one this produces (P4.2). VH-Log’s own hashes, the SCID and entry hashes, are the same multihash without the `z`.

### Proofs and keys

P14.8 Each entry has exactly one proof per signer reference, in the order P5.22 gives: one for an Original without `authors` and for every editor entry, and one per item of `author`, in that array’s order, for an author entry of a set Original. VH-Log’s `proof` is then an array of those proofs; for an entry with one proof it is exactly as before. Each proof has `type` `DataIntegrityProof`, `proofPurpose` `assertionMethod`, a `cryptosuite` of `eddsa-jcs-2022` or `bip340-jcs-2025` (P5.12), a `verificationMethod` byte-identical to the signer reference’s, and a `proofValue` of `z` followed by the base58btc encoding of the 64-byte signature. Each proof is computed over the entry without any proof (P5.22). Signer keys are Multikeys in base58btc: Ed25519 with prefix 0xed01 and 32 bytes, or secp256k1 with prefix 0xe701 and a 33-byte compressed key. Ed25519 verification MUST reject small-order points. A proof has exactly the members `type`, `cryptosuite`, `verificationMethod`, `proofPurpose` and `proofValue` (P14.4).

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

For a set Original, `controller` is instead the array `authors.dids` at that version, in its order, even for a set of one; for any other Original it is the author DID string, as above. `parent`, the grants and their scopes are not in the derived document. The `#files` service is the resource’s descriptor at that version; where to fetch the bytes comes from a did:webvh alias, a `src` location, an evidence package, a carried file (P7.11) or, for a version inscribed in full on the anchoring sat, that inscription’s body (P9.17). The `preview` member (P14.5) is not in the derived document.

### Evidence package

P14.10 An evidence package is a ZIP archive whose entries are all stored without compression. Names are at most 255 bytes of UTF-8. A writer MUST produce entries sorted by name, with the date 1980-01-01 00:00, the UTF-8 name flag and Unix mode 0100644, so that the same contents give the same bytes; a reader MAY ignore the order, date and flags, but MUST decode every name as UTF-8, reject a name that is not valid UTF-8, and reject an entry whose mode is not a regular file (P7.5). It contains:

- `originals-evidence.json`, the manifest: exactly `{format, profile, original, checkpoint, head, completeness, missing}`, where `format` is `originals-evidence/0.1`, `profile` is `originals:1.0`, `completeness` is `complete` or `partial` (P7.1), and `missing` lists `{kind: "resource", version, digest, versionId}`, `{kind: "identity", did, role}`, `{kind: "parent", did, versionId}` and `{kind: "object", digest}` items, `role` being `author`, for the author or a member of a signer set, or `editor`, a `parent` item naming a parent Original whose log through that pin is missing (P5.25), and an `object` item naming bytes that a scope check needs and the package lacks (P5.28);
- `asset/did.jsonl`, the asset log;
- `signers/<hex SHA-256 of the DID>/did.jsonl`, and `did-witness.json` where that DID method has witnesses, for each did:vh or did:webvh signer; did:btco signers are read from Bitcoin and are not packaged (P9.18);
- `parents/<hex SHA-256 of the parent Original’s did:vh>/did.jsonl`, the asset log of each parent Original, and of its own parent in turn, through the highest pin that the packaged entries depend on (P5.25); their signers are under `signers/` with the child’s;
- `resources/<digest>`, the bytes of each version of the resource included, and of each object that a version references and that a scope check needs (P5.29).

A preview (P9.30) is not a version of the resource: a writer MUST NOT put one under `resources/` or list it in `missing`, and a package without previews can be complete. A preview’s bytes are read from the inscription that carries it, and verifying the log does not need them.

Import MUST apply P7.5, with at most 20,000 archive entries and 512 MiB in total.

The SDK names the signer directory `authors/` and writes an `asset/did-witness.json`; this section uses `signers/` and none, because editors are signers too and asset logs have no witnesses.

### Hosting

P14.11 A did:webvh alias is a did:webvh log of its own whose DID document lists the Original’s did:vh in `alsoKnownAs` (P3.6). Relative to that alias’s location, the host serves the evidence package unpacked under `originals/`, and serves each resource with its signed media type and the headers P9.7 requires.

### Bitcoin

P14.12 An Originals inscription has (P9.17):

- **Metadata** (ord tag 5): the CBOR encoding of a JSON array of entries, each the parsed JSON of one asset log line. The anchoring inscription’s array holds the entries from genesis through the anchoring entry, in order; every later array holds exactly one entry. The metadata is split into data pushes of at most 520 bytes, which a reader concatenates before decoding.
- **Content type** (ord tag 1): the `mediaType` of the `preview` in the array’s last entry; when that entry has no `preview`, the `mediaType` of its `resource` if the body is the version, and no content type if there is no body.
- **Body**: the exact bytes of the preview that the last entry’s `preview` names; when it names none, the exact bytes of the resource version that its `resource` descriptor names, or no body (P9.17, P9.30). A body never has a content encoding. An inscription has a body when its envelope has the empty data push that begins ord’s body, even if no bytes follow it, and has no body when it has no such push. An inscription with no body and only fields is valid in ord and is still an inscription.
- **No delegate** (ord tag 11): an Originals inscription never names a delegate, and a verifier MUST reject one that does (P9.17). This rule is provisional.

The JSON-to-CBOR mapping is provisional; it is the one ord applies to `--json-metadata`: an object is a map with text-string keys in the object’s order, an array an array, a string a text string, an integer an integer in shortest form, any other number a float in the narrowest of half, single and double precision that holds it exactly, `true`, `false` and `null` their simple values. A reader MUST accept a float of any of the three widths, and MUST reject metadata that is not one well-formed CBOR item, or that contains a tag, a byte string, an indefinite-length item, a map key that is not a text string, a duplicate key, an integer outside P14.3’s bound, or a float that is not finite, is negative zero or has a magnitude outside P14.3’s bound. Because each entry is checked over its JCS form, the width of a float and the form of an integer do not change its hashes or proof. It decodes the metadata to JSON values, and each entry is then checked under P14.3–P14.8, its hashes and proof computed over its JCS form; P14.2’s line format does not apply to it. An entry over the entry limit (P14.13) is measured as its JCS form in UTF-8. The metadata and body together MUST NOT exceed 350,000 bytes. An inscription whose metadata does not decode to a JSON array is not an Originals inscription. A did:btco DID matches `^did:btco:((sig|test|reg):)?(0|[1-9][0-9]{0,15})$` with a sat number no greater than 2,099,999,997,689,999 (P9.10). A did:btco signer version is an inscription whose own metadata is a CBOR DID document, in shortest-form encoding, whose `id` is that DID, whatever its body, delegation or content encoding (P5.13).

### Limits

P14.13 A verifier MUST enforce these limits (P7.7, P8.5):

| Limit | Value |
|---|---|
| Entries in an asset log | 10,000 |
| Bytes in one entry, as its JCS form in UTF-8, in every format | 65,536 |
| Editor grants | 32 |
| Members of a signer set, and items of an `author` array (provisional) | 32 |
| Patterns in a `paths` scope (provisional) | 64 |
| Nested parent Originals, from a child to its furthest ancestor (provisional) | 8 |
| Bytes in a preview (P9.30) | 8,192 |
| Read grants (provisional) | 128 |
| Versions of one signer DID | 1,000 |
| Bytes in a fetched log file | 16 MiB |
| Bytes in one fetched resource | 64 MiB |
| Time for one fetch | 15 seconds |

The SDK MUST refuse to sign an entry over the entry limit, rather than produce one every verifier rejects. An inscription’s 350,000 bytes (P9.17) hold its body and the entries together. With a preview of at most 8,192 bytes, the log through the anchoring entry has room for over 340,000 bytes, whatever the size of the resource. A full version leaves little room for the log: a version over about 340,000 bytes cannot be inscribed in full. Either way, authors SHOULD anchor early, while the log through the anchoring entry is still short.

The SDK measures entry size in UTF-16 code units of the re-serialised entry and sets no resource-size limit; this section measures the UTF-8 bytes of the entry’s JCS form and sets 64 MiB, so that implementations in other languages agree.

### Shared-host saves

A shared host (P6.7) needs no particular transport. As a guide, the SDK submits `{original, entry, resources, identities}`, where `entry` is the exact line, and the host answers `accepted` or `already-accepted` with the checkpoint and head, or `stale-parent` with the head.

### Read requests (proposed)

P14.24 A read request (P8.9) is exactly `{type, did, proof}`, where `type` is `OriginalsReadRequest`, `did` is the requester’s DID and `proof` is a Data Integrity proof over the request without `proof`, canonicalized as P14.3 requires. The proof is exactly `{type, cryptosuite, proofPurpose, verificationMethod, created, expires, domain, challenge, proofValue}`:

- `type` is `DataIntegrityProof`, `cryptosuite` is `eddsa-jcs-2022` or `bip340-jcs-2025`, and `proofValue` is encoded as in P14.8;
- `proofPurpose` is `authentication`, and `verificationMethod` is the absolute id of a key that the `authentication` relationship of `did` lists;
- `created` and `expires` are UTC times in the form P14.2 requires of `versionTime`; `expires` MUST be later than `created` by at most five minutes, and a host MAY allow 60 seconds of clock difference when it compares them with its own clock;
- `domain` is the host’s origin, serialized as an ASCII origin such as `https://host.example`, with no path;
- `challenge` is the value the host issued, a string of at least 22 base64url characters encoding at least 128 random bits.

A host needs no particular transport. As a guide, a requester sends the base64url encoding of the request’s JCS form in an `Authorization` header with the scheme `OriginalsRead`, and a host issues challenges and session credentials at a location it publishes.

### Carried log (proposed)

Everything in this subsection is provisional. The trailer media types were checked only on macOS (Preview, Quick Look, `sips`, `afinfo`) with a 12,000-byte trailer; adding a media type needs the same evidence across the readers it targets.

P14.14 The carrier for a resource version is chosen by the `mediaType` its descriptor names (P14.6), compared ASCII case-insensitively, and no other carrier is valid for it (P7.12). A `mediaType` has no parameters (P14.6), so one such as `text/plain; charset=utf-8` is rejected, not matched with its parameter ignored:

| Carrier | `mediaType` |
|---|---|
| Trailer (P14.15) | `image/png`, `image/jpeg`, `image/gif`, `image/tiff`, `image/heic`, `audio/mp4`, `audio/wav`, `audio/aiff` |
| Text block (P14.16), with the comment syntax in its table | the media types in P14.16’s table |
| JSON member (P14.17) | `application/json`, `application/geo+json` |

Any other media type has no carrier, including an alias of a listed type, such as `application/javascript` or `audio/x-wav`; ZIP-based formats such as EPUB and Office documents, whose readers look for their directory only in the last 65,557 bytes; PDF, whose readers may look for `%%EOF` only in the last 1,024 bytes; and other `+json` types, whose own signatures or closed schemas an added member can break.

A carrier is at most 16 MiB (16,777,216 bytes); a larger one is no carrier. In every carrier an entry’s size is measured as its JCS form in UTF-8 (P14.13); the limits on a file, a carrier and an inscription are separate from it. In every carrier each entry is checked under P14.3–P14.8, nesting depth counted from the entry. A reader MAY refuse a carried file larger than the resource limit of P14.13 plus 16 MiB.

A reader does not know the media type before it has found the log. It tries each carrier’s detection, and no two carriers can match one file. A file name extension or a declared type MAY decide which it tries first, but is only a hint: when the hint is wrong or absent the reader tries the other carriers. It then verifies the log and checks that the carrier it found is the one this rule assigns to the last entry’s `mediaType` (P7.12).

P14.15 A trailer is the asset log `L`, exactly as P14.2 defines `did.jsonl`, followed by a 24-byte footer: the byte length of `L` as an unsigned 64-bit big-endian integer, then the 16 bytes `89 4F 52 49 47 49 4E 41 4C 4C 4F 47 0D 0A 1A 0A` (`\x89ORIGINALLOG\r\n\x1A\n`). A file has a trailer only if it is at least 24 bytes long, its last 16 bytes are that sequence, and `24 + length`, computed without overflow, is at most 16 MiB (P14.14) and at most the file’s size. A reader can decide this from the footer alone, before reading `L`. The carrier is the last `24 + length` bytes, and the resource version is every byte before it. Like PNG’s signature, the footer is damaged by end-of-line conversion and by stripping the high bit, so a file altered that way has no trailer rather than a wrong one. A trailer whose `L` breaks P14.2 is a trailer with an invalid log.

P14.16 A text block is a single line feed (0x0A), which a writer never precedes with a carriage return of its own, followed by these lines:

- the comment opener, for a block comment;
- `=====BEGIN ORIGINAL=====`;
- one line per entry, in order, each the compact JSON of the entry as in P14.2;
- `=====END ORIGINAL=====`;
- the comment closer, for a block comment.

For a line comment, each marker and entry line starts with the comment prefix and one space. Each line ends in a line feed, or in CR LF when the resource version’s own lines end that way; a reader MUST accept either. A writer ends the last line too, but a reader MUST also accept a last line with no line end. A writer MUST refuse a text block unless the resource version is valid UTF-8, a leading UTF-8 byte order mark allowed. A writer MUST place the block only where the host format’s parser reads it as a comment: parsed under the version’s own syntax, the appended block MUST be a separate comment and nothing else, and a writer MUST refuse otherwise, or when it has no parser for that syntax. `text/plain` has no comment and no such check. The test is the parse of the resulting file, not a search of the version for particular text, and no list of refusals stands in for it.

For example, and not normatively, a writer refuses: an HTML version that ends inside a comment, an open tag, a processing instruction, or an element whose content is not parsed as markup, such as `script`, `style`, `iframe`, `noembed`, `noframes`, `textarea`, `title`, `xmp`, `plaintext` or `noscript`; a Markdown version that ends inside an unclosed code fence, or in one of those HTML contexts; an XML version, including XHTML and SVG, that ends inside a comment, a CDATA section, a processing instruction or an open tag; a CSS version that ends inside an unterminated comment or string; a YAML document whose last node is a block scalar; and a version of a line-comment type that ends inside an unterminated string, heredoc or block comment, or whose last line ends in a line continuation. An unclosed HTML `pre` is no reason to refuse: its content is parsed as markup, so the block is still a comment.

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

### Unused rule numbers

Rule numbers P14.18–P14.22 are not used. They held encodings for anchoring on an EVM chain, withdrawn when Bitcoin became the only anchor (D6), and are not reused.

### Scope types

P14.23 The members of the two scope types that P5.29 defines (provisional, D4):

- `paths`: exactly `{type, paths}`, where `type` is `paths` and `paths` is an array of 1 to 64 patterns, sorted in the order of UTF-16 code units, with no pattern twice. A pattern is one or more segments separated by `/`, with no leading or trailing `/` and no empty segment. A segment is `**`, or a string of one or more characters other than `/` that is not `.` or `..`, in which `*` matches any run of characters, possibly empty, other than `/`. A segment other than `**` MUST NOT contain `**`, so a segment such as `a**` or `***` MUST be rejected. A `**` segment matches zero or more whole segments, except that a final `/**` matches one or more, so `docs/**` matches `docs/a` and `docs/a/b` but not `docs`. Nothing else is special: `?`, `[` and `\` match themselves. Paths in a path view are `/`-separated and relative, with no empty, `.` or `..` segment, and a pattern matches a path only if it matches all of it, comparing code units exactly.
- `items`: exactly `{type, ops}`, where `type` is `items` and `ops` is an array of 1 to 3 of the strings `add`, `edit` and `remove`, sorted in the order of UTF-16 code units, with no string twice.

A verifier MUST reject a scope of either type that breaks these rules (P5.28). A scope whose `type` is neither is checked as P5.28 says for an unknown type; its other members are not checked here, but P14.3 still applies to them.

Sources: Originals SDK revision 1b3cabdd [S29].
