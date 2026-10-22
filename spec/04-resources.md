## Resource state and version semantics

### Retained SDK behavior

Resources have stable logical resourceIDs, mediaType values and exact-byte digests. The current v3 model fixes the resourceID set at genesis; this profile lets the author add and remove resources (P4.1), so that, for example, a note can gain an attachment. An update binds the prior digest, and resource versions are derived from verified history rather than accepted from a caller’s counter.

For the existing update behavior, a supplied name or metadata value replaces that field. An omitted field remains unchanged. The new profile preserves this distinction without turning omission into deletion or introducing an implicit metadata merge.

Two changes from the SDK: it rejects null, so metadata can only be cleared by replacing it with an empty object, while this profile lets an explicit null remove metadata (P4.6); and it advances a resource’s version even when the new digest equals the old one, which P4.4 does not.

### Proposed rules

P4.1 Genesis MUST establish the initial resourceID set, with at least one resource. An author entry MAY add resources, appended after the existing ones, and MAY remove resources, as long as at least one remains (owner decision, 21 October 2026). An editor entry MUST NOT add or remove resources (P5.16). A resourceID, once used, MUST NOT be used again in that Original, even after its resource is removed, so each resourceID names one resource for the Original’s whole history. There is no rename: renaming is removing one resource and adding another. Removing a resource does not remove it from history: its earlier versions stay verifiable (P8.3).

P4.2 Each accepted resource update MUST bind the resourceID, prior digest and new descriptor. The resulting descriptor MUST bind the exact bytes and mediaType. The digest MUST be a SHA-256 multihash, and the baseline profile’s closed set of digest algorithms contains only SHA-256. The algorithm identifier MUST be part of the signed descriptor, and a verifier MUST reject any algorithm outside the pinned set. The multibase encoding of the digest is pinned with the rest of the entry format (D4).

P4.3 Verification MUST compute the digest over the stored byte sequence without image decoding, re-encoding, text normalization or MIME-dependent transformation. Two visually identical photographs with different bytes are different byte versions.

P4.4 A resource’s visible version number MUST be derived from its accepted resource-changing transitions. An unrelated metadata update or another resource’s update MUST NOT advance that resource’s version. Caller-supplied counters MUST NOT override the verified result. An update that leaves a resource’s digest unchanged MUST NOT advance that resource’s version. A resource added after genesis starts at version 1.

P4.5 A mutation with a stale expected checkpoint or stale prior digest MUST fail as a conflict. The SDK MUST NOT silently rebase and re-sign it against a new parent. Retrying the same submitted candidate MUST NOT produce a different signed entry without an explicit new preparation step.

P4.6 Name and metadata replacement MUST be atomic with the accepted transition. Omitting either field MUST preserve the prior value. An explicit null for metadata MUST remove it from the resulting state; an explicit null for the name MUST be rejected. Removal does not erase the prior value from history (P8.3). Unsupported schema values MUST be rejected before commit.

### Photo lifecycle

::: example Harbor at dawn
Alice creates “Harbor at dawn” with resourceID photo, mediaType image/jpeg and bytes B1. Genesis commits digest H1. She crops the photograph locally, producing B2. The candidate update names photo, the accepted parent checkpoint and H1, and proposes H2 for B2.

After signing and independent verification succeed, the new checkpoint becomes current. The reader derives photo version 2 from history. If Alice also renames the Original, that name replaces the prior one in the same transition. A later metadata-only correction changes the asset checkpoint but leaves photo at version 2.

A fresh reader can inspect B1 and B2 when an evidence package includes both. A host serving B2 at the B1 URL fails the digest check. A draft crop is not a committed version, even when its bytes already exist in a local store.
:::

Sources: OriginalsAsset and resources [S5, S6]; SDK transitions and value rules [S12, S13].
