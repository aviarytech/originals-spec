## Evidence packages and fresh verification

### Retained behavior and new evidence

An evidence package preserves signed history and historical resource bytes so a fresh reader can reconstruct versions. It additionally needs the author identity evidence that binds each signing key to the author’s DID. A public key being present in an archive is not sufficient evidence that an identity authorized it.

An evidence package describes what it includes and what is unavailable. Complete and partial packages must be distinguishable. Offline verification is an intended capability of a complete package, but it depends on specifying portable identity evidence and any freshness or external-ordering requirement.

### Proposed package rules

P7.1 An evidence package MUST declare whether it is complete or partial. A complete package MUST include the VH evidence through the selected checkpoint, the identity evidence required to check each entry’s author binding, and the historical resource bytes referenced by that prefix. It MUST identify the Original, profile and target checkpoint unambiguously.

P7.2 Packaging MUST preserve signed bytes or canonical signed representations as required by each proof format. Reformatting, normalization or changing an envelope discriminator MUST NOT be presented as preserving an existing signature.

P7.3 A reader MUST validate evidence before exposing derived state as verified. Verification MUST establish identifier/genesis binding, history continuity, log authority, author binding, state transitions and resource digests. A private key MUST NOT be required for any read-only check.

P7.4 Missing bytes MUST produce an explicit partial-availability result identifying the affected resource and checkpoint. Available bytes MUST still be checked. Missing proof or identity evidence MUST be reported separately from missing content; no missing item permits bypassing a signature or digest check.

P7.5 Import MUST NOT confer signing authority, trust unknown keys, or replace an existing history with a conflicting branch without explicit handling. Untrusted archive paths, sizes and compression MUST be bounded before extraction. Import MUST reject absolute paths, `..` segments, symbolic links and duplicate entries. Import MUST NOT replace a newer local history with an older prefix of it.

P7.6 Evidence from a truncated prefix MUST NOT be represented as the latest state without the selected freshness policy. A valid historical prefix and a fresh current result are separate claims. For an unwitnessed Original, and for entries before the entry that activated witnesses, reports MUST label time and ordering as claimed only.

P7.7 A verifier MUST enforce profile-defined limits on history length, entry size, identity-history length and the number of resources and versions. Exceeding a limit MUST produce a distinct verification failure, not a partial success. This is intentionally stricter than VH, which reports the last valid prefix.

P7.8 The verification report MUST state the latest author DID versionId used and whether its freshness was independently established. An Original MUST NOT be reported as currently authorized unless its identity evidence meets the selected freshness policy. Verifiers SHOULD retain the highest verified versionId seen for each author DID and each Original, and compare copies of both logs as VH describes.

P7.9 A verifier MUST NOT report an unwitnessed or anchored entry as current if its signing key is absent from the latest verified author DID state, unless it is a rotation entry whose new key that state lists.

### Proposed verification report

Return separate results for history validity, author binding, identity evidence, resource availability and freshness/order policy. Include the verified checkpoint, profile, unresolved dependencies, missing items and failures. Avoid a single green “verified” result that conceals incomplete identity evidence or unavailable historical bytes. If the SDK offers a single acceptance check, its default policy must require every part of the report to pass.

::: example Harbor at dawn, packaged
For the photo example, a package through photo version 2 contains the genesis and update entries, Alice’s identity evidence, plus B1 and B2. If B1 is omitted, the reader may still verify supplied history and B2 where all proof evidence is present, but reports that historical photo version 1 bytes are unavailable. It cannot claim to be a complete package.
:::

Sources: current save and load paths [S4, S6, S7]; proposed VH and identity evidence requirements derive from [S2, S3].
