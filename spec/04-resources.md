## Resource state and version semantics

### Retained SDK behavior

Resources have stable logical resourceIDs, mediaType values and exact-byte digests. The current v3 model fixes the resourceID set at genesis; adding or removing a resource is a scope expansion. An update binds the prior digest, and resource versions are derived from verified history rather than accepted from a caller’s counter.

For the existing update behavior, a supplied name or metadata value replaces that field. An omitted field remains unchanged. The new profile should preserve this distinction without turning omission into deletion or introducing an implicit metadata merge. Explicit null and deletion encodings need a schema decision before use.

### Proposed rules

P4.1 Genesis MUST establish the complete initial resourceID set for the baseline profile. Updates MUST NOT add, remove or silently rename resourceIDs. A future resource-set extension MUST have a separately identified profile and explicit transition rules.

P4.2 Each accepted resource update MUST bind the resourceID, prior digest and new descriptor. The resulting descriptor MUST bind the exact bytes and mediaType. The digest algorithm and encoded representation MUST be identified by the chosen profile; this draft does not select them. The profile MUST pin a closed set of algorithms, the algorithm identifier MUST be part of the signed descriptor, and a verifier MUST reject any algorithm outside the pinned set.

P4.3 Verification MUST compute the digest over the stored byte sequence without image decoding, re-encoding, text normalization or MIME-dependent transformation. Two visually identical photographs with different bytes are different byte versions.

P4.4 A resource’s visible version number MUST be derived from its accepted resource-changing transitions. An unrelated metadata update or another resource’s update MUST NOT advance that resource’s version. Caller-supplied counters MUST NOT override the verified result. Whether an update that leaves a resource’s digest unchanged advances its version is a profile decision (D5).

P4.5 A mutation with a stale expected checkpoint or stale prior digest MUST fail as a conflict. The SDK MUST NOT silently rebase and re-sign it against a new parent. Retrying the same submitted candidate MUST NOT produce a different signed entry without an explicit new preparation step.

P4.6 Name and metadata replacement MUST be atomic with the accepted transition. Omitting either field MUST preserve the prior value. Unsupported schema values MUST be rejected before commit.

### Photo lifecycle

::: example Harbor at dawn
Alice creates “Harbor at dawn” with resourceID photo, mediaType image/jpeg and bytes B1. Genesis commits digest H1. She crops the photograph locally, producing B2. The candidate update names photo, the accepted parent checkpoint and H1, and proposes H2 for B2.

After signing and independent verification succeed, the new checkpoint becomes current. The reader derives photo version 2 from history. If Alice also renames the Original, that name replaces the prior one in the same transition. A later metadata-only correction changes the asset checkpoint but leaves photo at version 2.

A fresh reader can inspect B1 and B2 when an evidence package includes both. A host serving B2 at the B1 URL fails the digest check. A draft crop is not a committed version, even when its bytes already exist in a local store.
:::

Sources: OriginalsAsset and resources [S5, S6].
