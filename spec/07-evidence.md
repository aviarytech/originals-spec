## Evidence packages and fresh verification

### Retained behavior and new evidence

An evidence package preserves signed history and historical resource bytes so a fresh reader can reconstruct versions. It additionally needs the author identity evidence that binds each signing key to the author’s DID. A public key being present in an archive is not sufficient evidence that an identity authorized it.

An evidence package describes what it includes and what is unavailable. Complete and partial packages must be distinguishable. Offline verification is an intended capability of a complete package, but it depends on specifying portable identity evidence and any freshness or external-ordering requirement.

### Proposed package rules

P7.1 An evidence package MUST declare whether it is complete or partial. A complete package MUST include the VH evidence through the selected checkpoint, the identity evidence required to check each entry’s signer binding, for the author and for every editor that signed an entry, and the historical resource bytes referenced by that prefix. It MUST identify the Original, profile and target checkpoint unambiguously.

P7.2 Packaging MUST preserve signed bytes or canonical signed representations as required by each proof format. Reformatting, normalization or changing an envelope discriminator MUST NOT be presented as preserving an existing signature.

P7.3 A reader MUST validate evidence before exposing derived state as verified. Verification MUST establish identifier/genesis binding, history continuity, log authority, author binding and state transitions, and MUST check the digest of every resource byte sequence it is given. Resource bytes are not needed for the log to verify; missing ones are reported as unavailable content (P7.4, P9.18). A private key MUST NOT be required for any read-only check.

P7.4 Missing bytes MUST produce an explicit partial-availability result identifying the affected resource and checkpoint. Available bytes MUST still be checked. Missing proof or identity evidence MUST be reported separately from missing content; no missing item permits bypassing a signature or digest check.

P7.5 Import MUST NOT confer signing authority, trust unknown keys, or replace an existing history with a conflicting branch without explicit handling. Untrusted archive paths, sizes and compression MUST be bounded before extraction. Import MUST reject absolute paths, `..` segments, symbolic links and duplicate entries. Import MUST NOT replace a newer local history with an older prefix of it.

P7.6 Evidence from a truncated prefix MUST NOT be represented as the latest state. A valid historical prefix and a current result are separate claims, and off Bitcoin only the first can be made (P7.10). For entries not inscribed on an anchoring sat, reports MUST label time and ordering as claimed only, except that an anchoring inscription shows the entries before it existed no later than its block (P9.16).

P7.7 A verifier MUST enforce profile-defined limits on history length, entry size, identity-history length, the number of editor grants and the number of resources and versions. When a history exceeds a limit, the verifier reports the last valid prefix as VH requires, and MUST label the result limit-exceeded and MUST NOT report it as complete or current.

P7.8 The verification report MUST state, for the author DID and each editor DID it relied on, the latest versionId used and whether its freshness was independently established. An Original that is not anchored is never reported as current or currently authorized (P7.10). For an anchored Original, a verifier checks each did:vh or did:webvh signer against the newest version of that DID it knows of: the newest it has obtained from any source or retained from earlier verification (owner decision, 21 October 2026). It is not required to show that no newer version exists, and the report MUST state that version and when it was obtained. A verifier that knows of a newer version than the one a package or host supplies MUST use the newer one. A did:vh or did:webvh signer’s freshness is independently established only if that DID’s own witnesses or watchers support its latest version (P9.8); for a log obtained without that support, the report MUST state freshness as not established, together with where the log was obtained, when, and its latest versionId (owner decision, 23 October 2026). A log obtained at a location whose latest version’s `id` names another location shows that the identity has moved: the verifier MUST still use every verified version in it, including any that removes a key, and MUST look for the moved log as P5.14 describes, reporting freshness as not established until it finds it. A report shown to a person MUST say plainly that the verifier obtained that DID’s history from that place at that time, and that the DID may have a newer version, such as one that removes a key, which the verifier has not seen. did:btco signers are read from Bitcoin (P5.13). Verifiers SHOULD retain the highest verified versionId seen for each author DID and each Original, and compare copies of both logs as VH describes.

P7.9 If the signing key of an entry that is not inscribed on an anchoring sat is not under assertionMethod in the latest verified state of its signer’s DID, or the author DID’s latest verified state is deactivated (P6.5, P5.18), a verifier MUST report that entry as historically authorized only, because it may have been signed after the key was removed or the DID deactivated (section 5), and any result that includes it MUST say so. An entry inscribed on an anchoring sat is checked instead against its signer’s DID state at its inscription time, and an editor entry also against the author DID’s deactivation at that time (P9.15, P5.18).

P7.10 A verifier MUST NOT report an Original that is not anchored as current, or its author or editors as currently authorized, however recently it obtained the asset log or the signers’ DID histories. Off Bitcoin nothing shows that a newer entry or another branch does not exist (P7.6, P6.6). A verifier MUST instead report a valid unanchored Original as valid as of its verified checkpoint, stating that checkpoint, the latest versionId it relied on for each signer’s DID and when it obtained that history. Only an anchored Original’s state derived from its anchoring sat (P9.13) can be reported as current, under the adapter’s confirmation policy (P9.5).

### Proposed verification report

Return separate results for history validity, author binding, identity evidence, resource availability and freshness/order policy; for an Original that is not anchored, the result is valid as of a checkpoint, never current (P7.10). Include the verified checkpoint, profile, unresolved dependencies, missing items and failures. Avoid a single green “verified” result that conceals incomplete identity evidence or unavailable historical bytes. If the SDK offers a single acceptance check, its default policy must require every part of the report to pass except content availability, which is reported separately: a verified log with unavailable bytes passes as a log, and an application that needs the content checks availability as well.

::: example Harbor at dawn, packaged
For the photo example, a package through photo version 2 contains the genesis and update entries, Alice’s identity evidence, plus B1 and B2. If B1 is omitted, the reader may still verify supplied history and B2 where all proof evidence is present, but reports that historical photo version 1 bytes are unavailable. It cannot claim to be a complete package.
:::

Sources: current save and load paths [S4, S6, S7]; proposed VH and identity evidence requirements derive from [S2, S3].
