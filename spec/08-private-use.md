## Private use: storage and security

### What private means today

The active SDK paths provide local/offline operation, not an encrypted vault. Serialized metadata is plaintext, embedded bytes may be base64 encoded, and the storage adapter, used only for hosted publication, performs raw put, get and exists operations. Local persistence is the caller’s serialized envelope. Base64 is not encryption. Encryption and signing-key recovery are not implemented in the inspected active paths.

This baseline should be stated plainly in product and SDK documentation. Private use means that the user can keep the evidence off public hosts; confidentiality then depends on the security of the chosen device, files and storage service. Sharing, synchronizing or publishing evidence can disclose the asset state and its history.

### Proposed storage and privacy rules

P8.1 Storage adapters MUST preserve exact bytes and surface missing or failed writes. Returned content MUST be checked against the signed descriptor before being treated as verified. A storage adapter’s success response MUST NOT certify authorship or integrity.

P8.2 The SDK MUST NOT label plaintext metadata, base64 content or raw storage as encrypted. An encryption feature MUST identify its separate format, key handling, integrity protection and recovery behavior before making confidentiality claims.

P8.3 Publishing or sharing an evidence package MUST identify the evidence and content being included. A later metadata correction MUST NOT be described as removing a secret from previously distributed history. Historical names, locators and identity links may remain visible. Before evidence is first shared or published, the SDK SHOULD warn about embedded metadata such as EXIF location and device identifiers.

P8.4 Read-only loading MUST NOT imply that a signing key has been restored. The SDK MUST distinguish access to evidence, access to content-decryption keys if any, and current authority to sign updates.

P8.5 Resolvers and resource fetchers retrieving an asset log, a did:webvh alias’s log or a resource MUST apply these rules, which this specification defines for itself rather than by reference to VH Log [S2]: HTTPS only, no automatic redirects, percent-decoding before checks, refusal of IP literals and of private, loopback and link-local addresses before and after DNS resolution, a response size cap and a time limit (P14.13). A signer DID’s log is retrieved under its own DID method (P5.8, P5.14), and these rules apply to it as well. They MUST connect only to the address that was validated. The profile MUST define separate size caps for log files and resources, sized so that a long-lived Original remains resolvable. A package whose `offline` result is `self-contained` (P7.21) MUST verify without network access, and any fetch beyond it requires the caller’s opt-in. A complete package that is not self-contained, such as one for an Original that is not anchored but has a did:btco signer, is reported as `needs-external` with the dependencies it lacks, and cannot verify offline. An anchor and a did:btco signer’s history are read from Bitcoin, never from a package (P7.1, P7.14): from a package alone, a reader without access to the anchor can validate the entries before the first anchoring entry, not the anchored history. This is the scope of this profile’s package, not a claim that Bitcoin evidence a reader retained cannot be checked offline; retained evidence shows what was valid at its checkpoint and cannot establish Bitcoin’s current state (P7.10).

### Unused rule numbers

Rule numbers P8.6–P8.14 are not used in `did:og` 1.0. They hold the rules for read authorization, host-enforced read grants in the asset state, which moved to the experimental additions document (D13), and are not reused. In the core, any host MAY serve any Original it holds to anyone; keeping an Original private means keeping its evidence off public hosts.

### Threats addressed by the baseline

Digest binding detects byte substitution. Signed parent references and state commitments prevent undetected rebinding of a valid change to another history. VH and author-binding verification detect unauthorized appends and keys not bound to the named author. Exact-checkpoint requests reduce accidental use of a different version. Conflict reporting exposes concurrent edits instead of silently resolving them.

A malicious host can withhold content, serve an old valid prefix or show different valid branches to different readers. The baseline alone does not solve availability, freshness, global consistency or trusted time. Resolver fetching also creates privacy and network risks, addressed by P8.5.

### Open additions

Encryption at rest or in evidence packages, multi-device signing, delegation recovery and lost-key recovery are separate decisions. A recovery design must preserve continuity through authorized VH and identity mechanisms; importing bytes or creating a new genesis is not recovery of the old authority. Do not commit to an emergency override absent a defined trust model.

Sources: StorageAdapter and serialization behavior [S4, S7, S8].
