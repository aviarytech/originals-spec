## Resource state and version semantics

### Retained SDK behavior

An Original is exactly one resource, which can have many versions (owner decision, 1 November 2026, replacing the resource sets of 21 October 2026). Each version is a mediaType and an exact-byte digest. The resource is never added, removed or replaced by another; a change to its bytes is its next version (P4.1). Descriptive values such as a title or style belong in the asset state’s `metadata`, not in a second resource. An update binds the prior digest, and resource versions are derived from verified history rather than accepted from a caller’s counter.

For the existing update behavior, a supplied name or metadata value replaces that field. An omitted field remains unchanged. The new profile preserves this distinction without turning omission into deletion or introducing an implicit metadata merge.

Two changes from the SDK: it rejects null, so metadata can only be cleared by replacing it with an empty object, while this profile lets an explicit null remove metadata (P4.6); and it advances a resource’s version even when the new digest equals the old one, which P4.4 does not.

### Proposed rules

P4.1 An Original MUST have exactly one resource, from genesis for its whole history (owner decision, 1 November 2026). Genesis MUST establish its first version. No entry may add a second resource or remove the resource; a verifier MUST reject an entry whose state has no resource or more than one. A change to the resource’s bytes or mediaType is a new version of the same resource, and earlier versions stay verifiable in history (P8.3).

P4.2 Each accepted resource update MUST bind the prior digest and new descriptor. The resulting descriptor MUST bind the exact bytes and mediaType. The digest MUST be a SHA-256 multihash, and the baseline profile’s closed set of digest algorithms contains only SHA-256. The algorithm identifier MUST be part of the signed descriptor, and a verifier MUST reject any algorithm outside the pinned set. The multibase encoding of the digest is pinned with the rest of the entry format (D4).

P4.3 Verification MUST compute the digest over the stored byte sequence without image decoding, re-encoding, text normalization or MIME-dependent transformation. Two visually identical photographs with different bytes are different byte versions.

P4.4 The resource’s visible version number MUST be derived from its accepted resource-changing transitions; genesis is version 1. A name or metadata update MUST NOT advance the version. Caller-supplied counters MUST NOT override the verified result. An update that leaves the digest unchanged MUST NOT advance the version.

P4.5 A mutation with a stale expected checkpoint or stale prior digest MUST fail as a conflict. The SDK MUST NOT silently rebase and re-sign it against a new parent. Retrying the same submitted candidate MUST NOT produce a different signed entry without an explicit new preparation step.

P4.6 Name and metadata replacement MUST be atomic with the accepted transition. Omitting either field MUST preserve the prior value. An explicit null for metadata MUST remove it from the resulting state; an explicit null for the name MUST be rejected. Removal does not erase the prior value from history (P8.3). Unsupported schema values MUST be rejected before commit.

### Photo lifecycle

::: example Harbor at dawn
Alice creates “Harbor at dawn” with mediaType image/jpeg and bytes B1. Genesis commits digest H1. She crops the photograph locally, producing B2. The candidate update names the accepted parent checkpoint and H1, and proposes H2 for B2.

After signing and independent verification succeed, the new checkpoint becomes current. The reader derives version 2 of the photograph from history. If Alice also renames the Original, that name replaces the prior one in the same transition. A later metadata-only correction changes the asset checkpoint but leaves the photograph at version 2.

A fresh reader can inspect B1 and B2 when an evidence package includes both. A host serving B2 at the B1 URL fails the digest check. A draft crop is not a committed version, even when its bytes already exist in a local store.
:::

Sources: OriginalsAsset and resources [S5, S6]; SDK transitions and value rules [S12, S13].
