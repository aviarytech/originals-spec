## Private use: storage and security

### What private means today

The active SDK paths provide local/offline operation, not an encrypted vault. Serialized metadata is plaintext, embedded bytes may be base64 encoded, and storage adapters perform raw put/get operations. Base64 is not encryption. Encryption and signing-key recovery are not implemented in the inspected active paths.

This baseline should be stated plainly in product and SDK documentation. Private use means that the user can keep the evidence off public hosts; confidentiality then depends on the security of the chosen device, files and storage service. Sharing, synchronizing or publishing evidence can disclose the manifest and its history.

### Proposed storage and privacy rules

P8.1 Storage adapters MUST preserve exact bytes and surface missing or failed writes. Returned content MUST be checked against the signed descriptor before being treated as verified. A storage adapter’s success response MUST NOT certify authorship or integrity.

P8.2 The SDK MUST NOT label plaintext metadata, base64 content or raw storage as encrypted. An encryption feature MUST identify its separate format, key handling, integrity protection and recovery behavior before making confidentiality claims.

P8.3 Publishing or sharing an evidence package MUST identify the evidence and content being included. A later metadata correction MUST NOT be described as removing a secret from previously distributed history. Historical names, locators and identity links may remain visible. Before evidence is first shared or published, the SDK SHOULD warn about embedded metadata such as EXIF location and device identifiers.

P8.4 Read-only loading MUST NOT imply that a signing key has been restored. The SDK MUST distinguish access to evidence, access to content-decryption keys if any, and current authority to sign updates.

P8.5 Resolvers and resource fetchers MUST apply every rule in the pinned VH Log version’s rules for retrieving log resources, including HTTPS only, no automatic redirects, percent-decoding before checks, refusal of IP literals and of private, loopback and link-local addresses before and after DNS resolution, a response size cap and a time limit. They MUST connect only to the address that was validated. The profile MUST define separate size caps for log files and resources, sized so that a long-lived Original remains resolvable. A complete offline package MUST verify without network access, and any fetch beyond it requires the caller’s opt-in.

### Threats addressed by the baseline

Digest binding detects byte substitution. Signed parent references and state commitments prevent undetected rebinding of a valid change to another history. VH and author-binding verification detect unauthorized appends and keys not bound to the named author. Exact-checkpoint requests reduce accidental use of a different version. Conflict reporting exposes concurrent edits instead of silently resolving them.

A malicious host can withhold content, serve an old valid prefix or show different valid branches to different readers. The baseline alone does not solve availability, freshness, global consistency or trusted time. Resolver fetching also creates privacy and network risks, addressed by P8.5.

### Open additions

Encryption at rest or in evidence packages, multi-device signing, delegation recovery and lost-key recovery are separate decisions. A recovery design must preserve continuity through authorized VH and identity mechanisms; importing bytes or creating a new genesis is not recovery of the old authority. Do not commit to an emergency override absent a defined trust model.

Sources: StorageAdapter and serialization behavior [S4, S7, S8].
