# Originals Protocol — VH-based Editor’s Draft 0.1

12 October 2026 · First review draft · Protocol and SDK design

## 1 Purpose and status

Originals preserves the identifiable, signed history of named digital resources while allowing an author to create, edit, export, verify and publish an Original. This draft replaces the active CEL-based history with Verifiable History and identity-level signing. It preserves useful SDK behavior wherever the change does not require a different model.

The immediate implementation target is a local vertical slice: create an Original, edit a resource version, export the evidence, and verify it in a fresh reader without a private key. Hosted publication and Bitcoin integration follow that slice. This document is a design for review, not an implementation or a migration authorization.

### Decision legend

- Confirmed direction: CEL is removed entirely from the active Originals design. Stephen Curran’s VH Log and did:vh work provide the standards direction. Author signing uses identity verification rather than an application-maintained device-key allowlist.
- Retained SDK behavior: an existing behavior to preserve, identified as such below. It is not a claim that the new implementation already exists.
- Proposed rule: a requirement offered by this draft, numbered Pn.n. The key words MUST, MUST NOT, SHOULD, SHOULD NOT and MAY in proposed rules are to be interpreted as described in BCP 14 [RFC2119] [RFC8174] when, and only when, they appear in all capitals. They do not imply agreement or a finalized upstream standard. Lowercase “must” and “should” in explanatory prose describe intent and are not conformance requirements.
- Unresolved: a choice that requires review. The current working preference is a DID per Original for resolution, with its complexity hidden by the SDK. The precise did:vh profile and author key binding are not yet settled.

### Scope and non-goals

The working basis is one separate VH history per Original, with one author whose key signs each change. The draft covers resource state, author and controller authority, local operations, portable evidence, and boundaries with storage and publication. It does not invent a new DID method, finalize a wire format or proof suite, promise encryption or key recovery, or treat Bitcoin possession as edit authority.

VH Log and did:vh are pre-drafts. Their algorithms, parameter behavior and resolution semantics remain dependencies to pin and test. The SDK compatibility observations refer to the inspected SDK 4 paths under `packages/sdk/src/v3`, not a promise that every historical or application-specific path behaves identically.

### Review priorities

1. Confirm the asset-DID preference and specify its resolution profile.
2. Confirm the key binding, rotation entries and DID-declared witness policy in sections 5 and 9.
3. Choose witness selection and the freshness bound for author DID state.
4. Pin the signed entry state and portable evidence format.

These decisions block an interoperable protocol release. They do not block review of the local lifecycle, compatibility requirements or failure behavior in this draft.

Sources: SDK 4 guide to the CEL 3 asset API [S1]; VH Log pre-draft [S2]; did:vh pre-draft [S3].

## 2 Model and terminology

An Original is a logical asset with a stable identifier, a verifiable state history and a set of named resources. Its content can be a photograph, a document, or several related byte streams. A resourceID identifies one logical resource across revisions. A resource version is an exact byte sequence bound to a mediaType and cryptographic digest in verified asset history.

A manifest is the application view of an Original’s current name, metadata, resource descriptors and lifecycle status. A VH entry commits a state transition according to the selected VH profile. A checkpoint identifies an exact verified prefix of that history. A draft is a local, unsigned candidate change; it is never a verified resource version.

### Three authorities

Author identity is the identity making a change. Its verification method is authorized through the applicable DID verification relationship and method rules.

Log-control authority is the authority to append or modify VH history under the previous accepted entry’s rules, including the applicable updateKeys. VH updateKeys are raw Multikey material. A log signature alone does not establish author identity.

In the baseline profile these two authorities are held by one key. The author signs each VH entry with a key that is both an active updateKey for the Original and a verification method of the author’s DID. One signature therefore shows both who made the change and that it may be appended.

Storage and publication authority is permission to store bytes or publish a checkpoint. A host, storage adapter, wallet, inscription holder or sat owner does not gain asset-editing authority merely by performing that role. One actor may hold several roles, but verifiers evaluate each role separately.

### Proposed rules

P2.1 An accepted Original MUST have one unambiguous history identity and an exact verified current checkpoint. An implementation MUST NOT merge divergent valid histories by choosing the latest claimed timestamp.

P2.2 A committed asset change MUST be a valid VH entry under the selected profile, signed by an active updateKey that the verifier confirms is an authorized verification method of the author identity named in that entry. A raw update key with no verified author binding MUST NOT be treated as an authorized change.

P2.3 Every accepted state MUST preserve the association between the Original, its resourceIDs and the prior accepted checkpoint. Storage locations MUST be treated as retrieval hints, not substitutes for signed digest bindings.

### Conceptual state illustration

The following is an explanatory model, not a normative wire format or test vector:

Original identity → VH checkpoint → full application state
Application state → name, metadata, lifecycle, named resource descriptors
Resource descriptor → resourceID, mediaType, exact-byte digest
VH entry → Original identity, parent entry, resulting application state, author identity reference, one proof by the author’s key
Evidence package → VH history, author identity evidence, resource bytes

For a generic VH profile, the application manifest can be the profiled VH state. For a did:vh specialization, the VH state is constrained by the DID method’s DID-document requirements. Manifest embedding or an integrity-bound manifest reference requires a compatible, documented extension. An arbitrary asset object cannot simply replace the DID document.

Sources: VH Log and did:vh state models [S2, S3]; current envelope and resource behavior [S4, S5].

## 3 Identifiers and resolution

The working preference is a DID per Original for file resolution across private use, web publication and later layers, with identifier mechanics hidden by the SDK. This draft assumes Bitcoin is the later layer, as in the existing SDK.

Author identity remains distinct from asset identity. An asset DID does not authorize an author to edit it. The same Original, identifier and authenticated history should continue across layers.

### Working preference: did:vh specialization

Each Original has an asset did:vh identifier and one conforming DID-document history. The Originals profile specifies how an asset manifest is represented or referenced without violating the method’s state constraints. A resolver returns the asset DID document and the evidence needed to obtain the exact manifest checkpoint.

This alternative can reuse DID resolution concepts, method validation and version selection. It adds profile work for manifest binding, discovery, resolution metadata and the relationship between the asset controller and author identities. An asset DID is not assumed to be a human or organizational author DID.

### Alternative retained for review: generic VH identifier

Each Original has a generic VH history identifier, with an Originals discovery profile describing how to locate history and resource evidence. The application manifest is the profiled full VH state. Author statements still use standards-based identity verification.

This alternative requires its own resolution contract: identifier syntax, locator discovery, relocation, exact-checkpoint requests, result metadata, offline behavior and errors. A self-certifying identifier does not supply these automatically.

### Common proposed rules

P3.1 The asset identifier MUST bind to the correct genesis under the chosen profile. A verifier MUST reject identifier/genesis mismatch, including substitution of a different valid history at the same URL.

P3.2 Exact-checkpoint resolution MUST either return evidence for that checkpoint or report why it cannot. It MUST NOT silently substitute the latest checkpoint or resolve a different Original.

P3.3 A resolver MUST distinguish verified state, missing evidence, unsupported profile and invalid evidence. A successful HTTP request or a host’s claimed identifier MUST NOT count as successful verification.

P3.4 Publication URLs and redirects MUST NOT independently transfer author or log-control authority. Any continuity claim after relocation MUST be supported by the selected profile’s authenticated evidence.

P3.5 A successful generic VH or did:vh resolution MUST NOT be reported as Originals verification. Originals state MUST be derived only by a verifier that applies this profile, because generic resolvers ignore the profile’s additional rules.

### Identity history and time

A verification method reference needs a specific identity state and its method-bound history evidence, not an unqualified fetch of today’s DID document. Exact identity versionId references reduce ambiguity, but they do not prove when a statement was signed. An attacker retaining a revoked key can reference an older valid identity version and claim an earlier timestamp.

Ordering evidence comes from VH witnesses. A witnessed Original’s entries are approved by witnesses that check the author’s latest DID state before approving (P9.8), so once a key’s removal reaches the witnesses, that key cannot add ordinary entries. The witness list itself is declared in the author’s DID (P9.9), so the asset key cannot change it. An unwitnessed Original, such as one kept only on a device, has claimed ordering only (P7.6), and recovery from key compromise is limited (section 5).

Unresolved: which identity methods beyond did:vh are acceptable, how exact identity versions are packaged, and witness selection, independence and freshness bounds (D3).

Sources: did:vh and VH Log pre-drafts [S2, S3].

## 4 Resource state and version semantics

### Retained SDK behavior

Resources have stable logical resourceIDs, mediaType values and exact-byte digests. The current v3 model fixes the resourceID set at genesis; adding or removing a resource is a scope expansion. An update binds the prior digest, and resource versions are derived from verified history rather than accepted from a caller’s counter.

For the existing update behavior, a supplied name or metadata value replaces that field. An omitted field remains unchanged. The new profile should preserve this distinction without turning omission into deletion or introducing an implicit metadata merge. Explicit null and deletion encodings need a schema decision before use.

### Proposed rules

P4.1 Genesis MUST establish the complete initial resourceID set for the baseline profile. Updates MUST NOT add, remove or silently rename resourceIDs. A future resource-set extension MUST have a separately identified profile and explicit transition rules.

P4.2 Each accepted resource update MUST bind the resourceID, prior digest and new descriptor. The resulting descriptor MUST bind the exact bytes and mediaType. The digest algorithm and encoded representation MUST be identified by the chosen profile; this draft does not select them. The profile MUST pin a closed set of algorithms, the algorithm identifier MUST be part of the signed descriptor, and a verifier MUST reject any algorithm outside the pinned set.

P4.3 Verification MUST compute the digest over the stored byte sequence without image decoding, re-encoding, text normalization or MIME-dependent transformation. Two visually identical photographs with different bytes are different byte versions.

P4.4 A resource’s visible version number MUST be derived from its accepted resource-changing transitions. An unrelated metadata update or another resource’s update MUST NOT advance that resource’s version. Caller-supplied counters MUST NOT override the verified result. Whether an update that leaves a resource’s digest unchanged advances its version is a profile decision (D5).

P4.5 A mutation with a stale expected checkpoint or stale prior digest MUST fail as a conflict. The SDK MUST NOT silently rebase and re-sign it against a new parent. Retrying the same submitted candidate MUST NOT produce a different signed statement without an explicit new preparation step.

P4.6 Name and metadata replacement MUST be atomic with the accepted transition. Omitting either field MUST preserve the prior value. Unsupported schema values MUST be rejected before commit.

### Photo lifecycle

Alice creates “Harbor at dawn” with resourceID photo, mediaType image/jpeg and bytes B1. Genesis commits digest H1. She crops the photograph locally, producing B2. The candidate update names photo, the accepted parent checkpoint and H1, and proposes H2 for B2.

After signing and independent verification succeed, the new checkpoint becomes current. The reader derives photo version 2 from history. If Alice also renames the Original, that name replaces the prior one in the same transition. A later metadata-only correction changes the asset checkpoint but leaves photo at version 2.

A fresh reader can inspect B1 and B2 when both are exported. A host serving B2 at the B1 URL fails the digest check. A draft crop is not a committed version, even when its bytes already exist in a local store.

Sources: OriginalsAsset and resources [S5, S6].

## 5 Signing and verification boundaries

Originals uses an identity signer and an independent verifier instead of an application-maintained device-key list such as the one planned for Boop [S11]. In the baseline profile each change has exactly one signature: the author signs the VH entry with a key that is both an active updateKey and a verification method of the author’s DID. There is no separate application statement and no separate sealing step.

### Proposed rules for a signed change

P5.1 Each VH entry MUST carry, in its signed state, the profile discriminator, Original identity, operation, resulting state commitment, resource transitions, the author DID, the absolute id of the author’s verification method and the exact author DID versionId. The VH entry chain binds the parent checkpoint. The VH proof MUST cover every security-relevant field, and only signed fields MAY affect verified state.

P5.2 An entry’s proof array MUST contain exactly one proof, and the author binding MUST be evaluated against that proof’s key. The proof’s verificationMethod MUST be a did:key URL for the updateKey, so that VH resolvers never resolve external identities; the author’s verification method is referenced only in the signed state.

P5.3 A verifier MUST check that the signing key is the active updateKey under the pinned VH rules and that the verification method named in the signed state is embedded in the author DID document at the named version, is listed under assertionMethod, has a controller equal to the author DID, has type Multikey and has a publicKeyMultibase value byte-identical to the updateKey. Verification methods held in another DID document, and a DID document’s controller property, MUST NOT confer authority.

P5.4 A verifier MUST reject an entry whose author binding fails, even when the VH proof is valid. A valid signature by a recognized identity MUST NOT grant permission to change an Original whose updateKeys do not include that identity’s key.

P5.5 VH validation MUST apply the pinned upstream algorithms for entry integrity, chaining, parameters, proofs and controller changes.

P5.6 A candidate MUST NOT become the current state until the VH and author-binding checks succeed. Missing identity history MUST remain an explicit failure or incomplete-verification result; it MUST NOT downgrade to trusting the key alone.

P5.7 Parsers MUST reject duplicate keys, values that the pinned canonicalization cannot represent exactly, and any member of parameters, proof or Originals-defined state that is not defined by the pinned VH Log version, the pinned did:vh version or this profile. Under the did:vh option, the profile MUST list the DID Core members it allows in the state.

P5.8 The author DID MUST be fixed at genesis; an entry naming a different author DID MUST be rejected in the baseline profile. Author DIDs MUST use a method with verifiable version history; the baseline profile accepts did:vh. The author DID versionId referenced by each entry MUST NOT be older than the one referenced by its predecessor.

P5.9 Every entry MUST set or inherit exactly one updateKey, and that key MUST be an assertionMethod key of the author DID at the version the entry references. The author SHOULD remove from their DID any key they no longer hold, because a thief can rotate an Original to any listed key. An empty updateKeys list MUST be rejected except in a deactivation entry, where VH recommends it; deactivation is the only way to end an Original.

P5.10 A rotation entry’s parameters MUST contain only updateKeys, holding exactly one key that differs from the signing key. Its state MUST be identical to its predecessor’s except for the operation, which is rotate, the author verification method id and the author DID versionId. That version MUST be one in which the new key meets P5.3, and P5.8 applies. The rotation entry is signed by the asset log’s active updateKey as VH requires; that signing key need not still be listed in the author DID. Every other entry is an ordinary entry, and its signing key MUST meet P5.3 at the version it references.

P5.11 A signer holding an Originals key MUST parse the entry, show the author the Original, operation and resource changes before signing, and refuse input that is not a well-formed Originals entry. The author’s Originals key SHOULD be a verification method used only for Originals entries, and MUST NOT also be an updateKey of the author DID’s own log.

### Key policy

The baseline profile has one author per Original. The author’s DID is the Original’s controller, and its prerotation protects the DID itself; asset logs do not activate VH prerotation. An asset log lists one current key of the author, and P5.9 keeps that key inside the author’s DID. There is no dedicated per-Original keypair by default; a compatible author key can control several logs. Naming the author DID in an entry grants no log authority by itself.

### Collaboration deferred

Only the author’s key may append in the baseline profile. Editors who can change an Original’s state without gaining log control need that boundary enforced by VH verification rules, which is proposed upstream in VH Log issue 5 [S2a]. If VH Log does not adopt it, a later Originals profile will define delegation separately. Collaborative editing is not part of the baseline.

### Rotation and key compromise

To rotate, the author first updates their DID: they add the new key and, if the old key is compromised, remove it in the same update. The SDK sends the DID update to the witnesses of every affected Original, then appends a rotation entry to each asset log the old key controls. The rotation entry is signed by the old key, references the new DID version and sets updateKeys to the new key (P5.10).

For a witnessed Original, witnesses refuse an ordinary entry whose signing key the author’s latest DID no longer lists, and refuse a rotation entry whose new key that DID does not list (P9.8). Once the author’s DID update reaches the witnesses, a thief holding the removed key cannot edit, deactivate or fork the Original, and can perform only the rotation the author wants. The thief also cannot change the witnesses, because the witness list is declared in the author’s DID, which the asset key does not control (P9.9).

These limits remain:

- Before the author removes the stolen key, the thief can edit or deactivate any Original the key controls; deactivation is permanent. The thief can also rotate an Original to another key the author DID still lists, which is why P5.9 asks the author to remove keys they no longer hold.
- The protection holds only while fewer than a threshold of witnesses misbehave or see stale author DID history (P9.8).
- For an unwitnessed Original, entries signed with a removed key cannot be distinguished from earlier ones. Verifiers report them as historically authorized with unproven ordering, never as current (P7.9).
- A lost key that was never rotated cannot be replaced; recovery is a separate decision (section 8).

A VH extension that lets a log name a DID as its controller would remove the rotation entries; it is a candidate upstream change alongside VH Log issue 5 [S2a]. Loading evidence does not restore signing authority, and claimed timestamps cannot establish signing before revocation.

Sources: VH update authorization and witnesses [S2]; editor authority proposal [S2a]; identity document rules [S3]; current signer/envelope boundaries [S4, S6, S7].

## 6 Local operations and transitions

The public SDK should retain the familiar create, edit, export and load workflow. Compatibility applies to useful semantics, not to preserving CEL types or hiding a required protocol change. A new envelope discriminator, history engine and verifier are expected.

### Proposed operation contract

Create prepares the initial manifest, resource descriptors and genesis entry. The author signs it, the SDK verifies it and commits one valid initial checkpoint. It returns either a verified Original or an explicit unsigned draft; these outcomes are different types or clearly distinguishable states.

Edit reads an exact verified parent, checks the fixed resourceID set, computes new descriptors, has the author sign the next VH entry and verifies it. The current pointer changes only after the signed entry and new bytes are durably stored. For the caller this is one step; there is no separate seal operation.

Export reads a selected verified checkpoint and its history. Load/import reconstructs and verifies evidence with no signing key requirement. A loaded Original is readable without becoming writable. Obtaining a signer is an explicit authority step, and eligibility to append is rechecked against the verified parent.

Deactivate is a VH entry signed by the author’s key that sets the VH deactivated parameter and produces a terminal state. Subsequent ordinary edits are rejected. Historical evidence is retained and readable where the selected upstream resolution and evidence policy permit it; this draft does not assume that every resolver already supports historical deactivated-state access.

### Proposed failure rules

P6.1 Preparation, signing and verification MUST complete before the current committed state changes. A signing rejection, timeout or invalid proof MUST leave the prior checkpoint unchanged. Staged bytes may remain for cleanup but MUST NOT appear as committed versions.

P6.2 Commit MUST be recoverable after interruption. Storage implementations MUST define how they persist the accepted history and bytes before advancing the current pointer, or provide an equivalent atomic boundary. An interrupted commit MUST NOT expose a checkpoint whose required local evidence was never committed.

P6.3 Drafts MUST be explicitly marked unsigned. The SDK MUST NOT export them as accepted history, count them as resource versions or publish them as signed Originals.

P6.4 A retried operation MUST preserve its intended parent and statement. If the parent changed, the SDK MUST report a conflict and require a new candidate. An already accepted identical candidate SHOULD return its existing checkpoint without duplicating the transition.

P6.5 Deactivation MUST be expressed as VH deactivated: true, and the manifest lifecycle status MUST match it; a verifier MUST reject a mismatch in either direction. Deactivation MUST be terminal for new edits in the baseline profile, and a verifier MUST reject an update after an accepted deactivation. If the latest verified author DID is deactivated, the verifier MUST report the Original as non-current, and witnesses MUST refuse every further entry, including rotation entries. Any future reactivation feature requires an explicit new profile and authorization policy.

### Observable results

The SDK should expose the selected checkpoint, derived resource versions, verification status and actionable error category. Suggested categories are invalid evidence, incomplete evidence, unsupported profile, unauthorized key, author binding failure, stale parent, deactivated asset and unavailable bytes. Concrete API names and error codes remain a compatibility review item.

VH entries carry whole-second versionTime values that strictly increase, so a log accepts at most one entry per second. The SDK’s mutation queue must respect that limit.

Sources: OriginalsAsset, OriginalsSDK and envelope [S4, S6, S7].

## 7 Portable export and fresh verification

### Retained behavior and new evidence

An export preserves signed history and historical resource bytes so a fresh reader can reconstruct versions. The VH-based export additionally needs the author identity evidence that binds each signing key to the author’s DID. A public key being present in an archive is not sufficient evidence that an identity authorized it.

An evidence package describes what it includes and what is unavailable. Complete and partial packages must be distinguishable. Offline verification is an intended capability of a complete package, but it depends on specifying portable identity evidence and any freshness or external-ordering requirement.

### Proposed package rules

P7.1 An export MUST declare whether it is complete or partial. A complete export MUST include the VH evidence through the selected checkpoint, the identity evidence required to check each entry’s author binding, and the historical resource bytes referenced by that prefix. It MUST identify the Original, profile and target checkpoint unambiguously.

P7.2 Export MUST preserve signed bytes or canonical signed representations as required by each proof format. Reformatting, normalization or changing an envelope discriminator MUST NOT be presented as preserving an existing signature.

P7.3 A reader MUST validate evidence before exposing derived state as verified. Verification MUST establish identifier/genesis binding, history continuity, log authority, author binding, state transitions and resource digests. A private key MUST NOT be required for any read-only check.

P7.4 Missing bytes MUST produce an explicit partial-availability result identifying the affected resource and checkpoint. Available bytes MUST still be checked. Missing proof or identity evidence MUST be reported separately from missing content; no missing item permits bypassing a signature or digest check.

P7.5 Import MUST NOT confer signing authority, trust unknown keys, or replace an existing history with a conflicting branch without explicit handling. Untrusted archive paths, sizes and compression MUST be bounded before extraction. Import MUST reject absolute paths, `..` segments, symbolic links and duplicate entries. Import MUST NOT replace a newer local history with an older prefix of it.

P7.6 Evidence from a truncated prefix MUST NOT be represented as the latest state without the selected freshness policy. A valid historical prefix and a fresh current result are separate claims. For an unwitnessed Original, and for entries before the entry that activated witnesses, reports MUST label time and ordering as claimed only.

P7.7 A verifier MUST enforce profile-defined limits on history length, entry size, identity-history length and the number of resources and versions. Exceeding a limit MUST produce a distinct verification failure, not a partial success. This is intentionally stricter than VH, which reports the last valid prefix.

P7.8 The verification report MUST state the latest author DID versionId used and whether its freshness was independently established. An Original MUST NOT be reported as currently authorized unless its identity evidence meets the selected freshness policy. Verifiers SHOULD retain the highest verified versionId seen for each author DID and each Original, and compare copies of both logs as VH describes.

P7.9 A verifier MUST NOT report an unwitnessed entry as current if its signing key is absent from the latest verified author DID state, unless it is a rotation entry whose new key that state lists.

### Proposed verification report

Return separate results for history validity, author binding, identity evidence, resource availability and freshness/order policy. Include the verified checkpoint, profile, unresolved dependencies, missing items and failures. Avoid a single green “verified” result that conceals incomplete identity evidence or unavailable historical bytes. If the SDK offers a single acceptance check, its default policy must require every part of the report to pass.

For the photo example, an export through photo version 2 contains the genesis and update entries, Alice’s identity evidence, plus B1 and B2. If B1 is omitted, the reader may still verify supplied history and B2 where all proof evidence is present, but reports that historical photo version 1 bytes are unavailable. It cannot claim a complete export.

Sources: current export and load paths [S4, S6, S7]; proposed VH and identity evidence requirements derive from [S2, S3].

## 8 Private use: storage and security

### What private means today

The active SDK paths provide local/offline operation, not an encrypted vault. Serialized metadata is plaintext, embedded bytes may be base64 encoded, and storage adapters perform raw put/get operations. Base64 is not encryption. Encryption and signing-key recovery are not implemented in the inspected active paths.

This baseline should be stated plainly in product and SDK documentation. Private use means that the user can keep the evidence off public hosts; confidentiality then depends on the security of the chosen device, files and storage service. Exporting, synchronizing or publishing can disclose the manifest and its history.

### Proposed storage and privacy rules

P8.1 Storage adapters MUST preserve exact bytes and surface missing or failed writes. Returned content MUST be checked against the signed descriptor before being treated as verified. A storage adapter’s success response MUST NOT certify authorship or integrity.

P8.2 The SDK MUST NOT label plaintext metadata, base64 content or raw storage as encrypted. An encryption feature MUST identify its separate format, key handling, integrity protection and recovery behavior before making confidentiality claims.

P8.3 Publishing or exporting MUST identify the evidence and content being included. A later metadata correction MUST NOT be described as removing a secret from previously distributed history. Historical names, locators and identity links may remain visible. Before the first export or publication, the SDK SHOULD warn about embedded metadata such as EXIF location and device identifiers.

P8.4 Read-only loading MUST NOT imply that a signing key has been restored. The SDK MUST distinguish access to evidence, access to content-decryption keys if any, and current authority to sign updates.

P8.5 Resolvers and resource fetchers MUST apply every rule in the pinned VH Log version’s rules for retrieving log resources, including HTTPS only, no automatic redirects, percent-decoding before checks, refusal of IP literals and of private, loopback and link-local addresses before and after DNS resolution, a response size cap and a time limit. They MUST connect only to the address that was validated. The profile MUST define separate size caps for log files and resources, sized so that a long-lived Original remains resolvable. A complete offline package MUST verify without network access, and any fetch beyond it requires the caller’s opt-in.

### Threats addressed by the baseline

Digest binding detects byte substitution. Signed parent references and state commitments prevent undetected rebinding of a valid change to another history. VH and author-binding verification detect unauthorized appends and keys not bound to the named author. Exact-checkpoint requests reduce accidental use of a different version. Conflict reporting exposes concurrent edits instead of silently resolving them.

A malicious host can withhold content, serve an old valid prefix or show different valid branches to different readers. The baseline alone does not solve availability, freshness, global consistency or trusted time. Resolver fetching also creates privacy and network risks, addressed by P8.5.

### Open additions

Encryption at rest or in exports, multi-device signing, delegation recovery and lost-key recovery are separate decisions. A recovery design must preserve continuity through authorized VH and identity mechanisms; importing bytes or creating a new genesis is not recovery of the old authority. Do not commit to an emergency override absent a defined trust model.

Sources: StorageAdapter and serialization behavior [S4, S7, S8].

## 9 Hosted publication and Bitcoin boundaries

### Hosted publication

The inspected SDK hosted path maintains did:webvh-related publication alongside CEL history and cel.json. The new active format retires that dual history. A host serves the selected VH profile and exact resource evidence; the public reader verifies the same checkpoint semantics as the local reader.

The Boop adapter needs its actual publishing path replaced: ordinary publication uses local per-asset Ed25519 signing through localCelKeyStore and addResourceVersion, rather than SDK publishToWeb. Replacing only publishToWeb leaves active CEL behavior behind. The exact-snapshot public-reader requirement from Boop issue 232 [S10] remains a regression requirement.

### Proposed hosted rules

P9.1 A published snapshot MUST bind its manifest, history checkpoint and resource descriptors. The public reader MUST verify that exact snapshot and MUST NOT combine history from one checkpoint with metadata or bytes presented as another.

P9.2 A publish retry MUST resume or repeat the same intended snapshot. Uploading bytes, publishing a locator or changing an index MUST NOT create a new asset transition unless an explicit authorized transition is part of the operation.

P9.3 Host relocation and locator updates MUST preserve authenticated continuity under the chosen profile. Public delivery MUST use the new profile discriminator and MUST NOT relabel CEL evidence as VH.

### Bitcoin adapter

Current representations include CEL JSON with application/cel and media bytes with CEL CBOR metadata. Those encodings are replaced, not retained as the new active format. The VH-based inscription representation, MIME type, metadata schema, size limits and locator rules are unresolved. This draft defines the boundary requirements without inventing a final encoding.

P9.4 A Bitcoin publication MUST identify the exact accepted checkpoint and content commitment it represents. Only a verified change beyond the prior durable published boundary may form the next delta. A pending or failed transaction MUST NOT advance that durable boundary.

P9.5 Forks, reorganizations and competing publications MUST be exposed explicitly. Confirmation policy and reorganization handling MUST be defined by the adapter; transaction observation alone MUST NOT be described as permanent finality.

P9.6 Transaction retries MUST distinguish rebroadcasting the same intended transaction from preparing a replacement. Asset edits MUST NOT be silently re-signed or rebased because a transaction is retried. A wallet or sat holder MUST NOT acquire author or VH update authority by possession alone.

P9.7 A host MUST serve resource bytes with their signed mediaType and MUST NOT let a valid signature override content-safety policy. Active content such as HTML or SVG MUST be served from an origin without user credentials, with content-type sniffing disabled and a restrictive content security policy, or rendered only in a sandbox. Any SDK consumer that renders resources or manifest strings, including desktop and mobile clients, MUST apply the same isolation and MUST escape names and metadata.

P9.8 A hosted Original MUST activate VH witnesses: at least three, with a threshold of at least two and less than the number of witnesses, so that one lost or censoring witness cannot block or approve entries alone. Before approving an entry, an Originals witness MUST, in addition to the VH witness obligations:

- verify the entry under this profile;
- obtain the author DID’s latest state within the profile’s freshness bound, from sources independent of whoever submitted the entry, never from DID history supplied with it;
- refuse an ordinary entry whose signing key that state does not list;
- refuse a rotation entry whose new key that state does not list;
- refuse every entry if that state is deactivated.

Once an Original’s log has activated witnesses, a verifier MUST NOT report any later entry as current without witness proofs meeting the threshold. Whether an Original is hosted is not verifiable, so this rule follows the log, not the deployment. Activating witnesses does not give earlier entries proven ordering (P7.6), and the SDK MUST confirm the log’s head with the author before activating them. Witness independence from the host is a governance requirement that resolvers cannot check (D3). The author DID of a witnessed Original SHOULD itself use did:vh witnesses or watchers.

P9.9 The witness list and threshold for an author’s Originals MUST be declared in the author’s DID document. An asset log’s witness parameter MUST equal the declaration in the author DID version that the entry references, and witnesses MUST refuse an entry that changes the witness parameter unless it equals the declaration in the author DID’s latest state. Once witnesses are active, an entry that sets the witness parameter to an empty object MUST be rejected. Changing an Original’s witnesses therefore requires the author DID’s own update keys, not the asset key.

No Bitcoin spending, activation, inscription or migration is authorized by this document. Hosted and Bitcoin implementation follow the local interoperability slice, with dedicated adapter tests.

Sources: current SDK publication and Bitcoin paths [S7, S9]; Boop integration observations require repository-pinned confirmation before implementation.

## 10 SDK replacement and legacy evidence

### Proposed replacement map

| Area | Retain | Replace or specify |
|---|---|---|
| OriginalsAsset | Resource semantics and lifecycle | VH transitions and author binding checks |
| OriginalsSDK | Create, load and export workflow | Profile selection and identity adapters |
| Envelope | Portable evidence boundary | New discriminator and VH payload |
| Resource helpers | Exact bytes and prior digest checks | Profile-specific descriptor encoding |
| StorageAdapter | Byte storage abstraction | Durable commit contract and diagnostics |
| Hosted adapters | Exact snapshot delivery | Dual CEL path and cel.json |
| Bitcoin adapters | Durable boundary and retry intent | CEL payloads and metadata format |
| Boop publish path | Local editing and public reader | localCelKeyStore and addResourceVersion |

This is a semantic mapping, not a final API diff. Existing callers may need explicit profile, identity-evidence or authorization arguments. Avoid new product concepts unless required by the VH/identity boundary. Removal includes active CEL imports, types, codecs, genesis/identifier derivation, replay verification, publication paths and tests that require CEL as the new protocol.

### Proposed legacy rules

P10.1 The new active SDK MUST NOT produce, append to, or depend on CEL histories. New envelopes MUST use an unambiguous new format discriminator and MUST NOT reinterpret old signatures as new-protocol signatures.

P10.2 Existing CEL archives MUST be preserved byte-for-byte. A separate, read-only legacy verifier outside the new active SDK may interpret them according to their original rules. Its result MUST identify the legacy protocol and evidence limits.

P10.3 A legacy-to-VH continuity claim MUST NOT be inferred merely because the same content, name or signing key appears in both. Any migration or cross-reference needs a separately reviewed transition design and explicit authorization.

P10.4 The new SDK MUST NOT automatically re-genesis old assets or erase redirects and continuity records. The re-genesis-without-redirect idea associated with Boop issue 286 [S11] is a proposal for review, not approved migration policy.

### Delivery sequence

1. Pin upstream pre-drafts and choose enough of the application profile to implement a local experimental slice with its provisional choices clearly identified.
2. Implement create, edit, export and fresh verification. Test without private keys in the reader and without network dependencies for a complete offline package.
3. Add identity rotation, deactivation, incomplete evidence and conflict tests. Keep unresolved freshness claims visible.
4. Replace the actual hosted and Boop publication paths, add witnesses for hosted Originals, and run exact-snapshot reader regressions.
5. Specify and implement the Bitcoin representation and durable-boundary tests. Design migration separately.

Sources: SDK map [S1, S4–S9]. Current SDK files were inspected across main, not as an atomic repository snapshot; pin and recheck them before implementation.

## 11 Security considerations

This section collects the threats discussed throughout the draft.

| Adversary | Can | Cannot, under the baseline |
|---|---|---|
| Malicious host or mirror | Withhold bytes or evidence, serve an old valid prefix of the asset log or the author’s DID log, show different branches to different readers | Alter bytes or entries without failing digest or proof checks (P2.3, P4.3); hide a fork from a reader that checks witness proofs, unless a threshold of witnesses misbehaves (P9.8) |
| Network attacker | Observe fetches; block or delay them | Forge entries or bytes; steer resolvers at private addresses (P8.5) |
| Holder of a stolen author key, before the author removes it | Edit or deactivate any Original the key controls; deactivation is permanent. Rotate an Original to another key the author DID still lists | Move control to a key outside the author’s DID (P5.9, P5.10); change an Original’s witnesses (P9.9) |
| Holder of a stolen author key, after the removal reaches the witnesses | Sign entries on unwitnessed Originals, reported as ordering unproven and never current (P7.9) | Add witnessed entries to a witnessed Original, or rotate it to any key the author’s latest DID does not list, unless a threshold of witnesses misbehaves (P9.8) |
| Malicious archive or package | Exhaust verifier resources; attempt path traversal; roll back to an older prefix | Pass verification over its limits, or replace newer local history (P7.5, P7.7) |
| Malicious host application, or other software holding the key | Ask the signer to sign an unintended change | Obtain a signature from a conforming signer for a change it did not show the author, when the key is used only for Originals (P5.11) |
| Malicious content author | Publish signed active content | Run script on the platform origin or in a client (P9.7) |
| Wallet or sat holder | Hold or transfer the inscription | Gain edit or update authority (P9.6) |
| Author who sold the inscription | Keep editing or deactivate the Original; change its witnesses through their DID; show different branches to different readers of an unwitnessed Original | Hide a fork from a reader that checks witness proofs, unless a threshold of witnesses misbehaves (P9.8) |
| Faulty, censoring or colluding witness | Delay or refuse approvals; below the threshold, nothing else | Block or approve entries alone (P9.8). A threshold of colluding witnesses can approve a fork or a stolen key’s entries |
| Bitcoin reorganization | Undo an observed publication | Advance the durable published boundary (P9.4, P9.5) |

Witnessed Originals get their ordering from witnesses (P9.8), and the author’s DID controls who the witnesses are (P9.9). An unwitnessed Original has claimed ordering only: a valid prefix is not proof of current state, and recovery from key compromise is limited (section 5). Witness selection, independence and freshness bounds remain open (D3).

Permanent history cannot be redacted (P8.3). A key or DID used across Originals links them publicly.

## 12 Conformance and negative tests

All requirements here are proposed. A conformance claim needs a named, pinned Originals profile plus the upstream VH and identity-method versions. “VH-based” alone is not an interoperable conformance target. Open profile choices are blockers to a release claim, not reasons to accept unverified evidence.

### Proposed minimum test matrix

| Test | Required result |
|---|---|
| Fresh create, edit, export and verify | Same asset checkpoint and resource versions; no private key in reader |
| Byte changed at same URL | Digest failure; no verified resource result |
| Wrong genesis or Original ID | Identifier binding failure |
| Broken chain or reordered entry | History invalid; no derived accepted state beyond failure |
| Recognized author key not in this Original’s updateKeys | Rejected; identity alone grants no edit right |
| Valid VH entry, key not a method of the named author DID | Author binding failure; VH validity cannot rescue it |
| Wrong DID method binding or relationship | Identity authorization failure |
| Old identity version with claimed old time | Witnessed: witness ordering applies. Unwitnessed: ordering unproven; no timestamp-only acceptance |
| Missing identity history | Incomplete identity evidence; no blanket verified result |
| Missing historical resource bytes | Explicit partial availability; supplied bytes still checked |
| Caller changes version counter | Counter ignored or rejected; history-derived version retained |
| Stale parent or prior digest | Conflict; no silent rebase or commit |
| Signer rejects or returns invalid proof | No partial state commit |
| Interrupted local commit | Recover prior or fully committed checkpoint; no false success |
| Identical accepted retry | Existing result or explicit duplicate; no unintended extra version |
| Resource added, removed or renamed | Rejected in baseline fixed-resource profile |
| Metadata supplied versus omitted | Replacement versus unchanged, respectively |
| Import then edit without authority | Read succeeds where evidence valid; edit authorization fails |
| Update after deactivation | Rejected; historical evidence retained |
| Old valid prefix served as current | Freshness unresolved or failed under policy, never assumed |
| Divergent valid branches | Explicit fork/conflict, no timestamp winner |
| Hosted mixed snapshot | Rejected before public result is marked verified |
| Bitcoin failure, retry or reorganization | Durable boundary follows adapter policy, not pending intent |
| Legacy bytes with new discriminator | Rejected; legacy verification remains separate |
| Ordinary entry signed by a key removed from the author DID | Witnessed: refused by witnesses and not current. Unwitnessed: historically authorized, ordering unproven, never current |
| Rotation entry by a removed key to a key in the latest author DID | Accepted |
| Rotation entry to a key not in the referenced author DID version | Rejected |
| Rotation entry that also changes state or another parameter, or rotates to its own signing key | Rejected as a rotation; checked as an ordinary entry |
| Witnessed rotation entry referencing an older DID version, to a key the latest author DID no longer lists | Refused by witnesses |
| Entry changes the witness parameter to a list the author DID does not declare | Rejected |
| Entry sets the witness parameter to an empty object after witnesses are active | Rejected |
| Entry after witness activation without enough witness proofs, whatever the deployment | Not current |
| Entries before witness activation, signed by a key later removed | Ordering unproven; not made current by activation |
| Any entry after the author DID is deactivated | Refused by witnesses; Original reported as non-current |
| Entry sets updateKeys to an empty list or to more than one key | Rejected |
| Author DID versionId absent from signed state | Rejected |
| Verification method from another DID, with a different controller, or under authentication only | Author binding failure |
| Key expressed as JWK or a different multikey encoding | Author binding failure |
| Later entry names a different author DID, or an older author DID version than its predecessor | Rejected |
| Two proofs in the proof array | Rejected |
| Stale author DID history served with a current asset log | Identity freshness not established; not reported as currently authorized |
| VH-valid log that fails Originals rules, read through a generic resolver | Not reported as Originals-verified |
| Lifecycle status deactivated without VH deactivated: true, or the reverse | Rejected |
| Older prefix imported over a newer local history | Local current state not rolled back |
| Log file larger than the profile cap | Distinct limit-exceeded failure |
| Entry with duplicate JSON keys or an unsigned state field | Parse failure; no verified state |
| Resource digest with an unlisted algorithm | Unsupported-profile failure |
| Locator resolving or redirecting to a private address | Fetch refused; reported as unavailable |
| History or identity history beyond profile limits | Distinct limit-exceeded failure |
| Archive with a symbolic link, `..` path or duplicate entry | Rejected before extraction |
| SVG resource containing script, or a name containing markup | Not executed on the platform origin or in a client |

### Release evidence

Release evidence should include positive and negative fixtures, pinned profile decisions, deterministic results and an active-dependency inventory without CEL. Run fresh-process and partial-package tests. An independent verifier should reproduce the positive checkpoints before interoperability is claimed.

## 13 Decision register and source baseline

### Prioritized open decisions

D1 Asset identifier and state shape. Confirm the working preference for did:vh per Original with SDK-hidden complexity and continuous identity across layers. Retain generic VH plus discovery as an explicit alternative. Pin genesis binding, exact-checkpoint resolution, deactivation history and manifest representation.

D2 Author key binding and key policy. The baseline is one author per Original whose identity-bound key signs each VH entry directly, with no dedicated per-Original keypair and no separate application statement. The controller is the author’s DID; prerotation is on the DID side, not the asset log. Key binding, rotation entries and the rotation procedure are proposed in section 5, and the DID-declared witness policy in P9.9. Remaining: key custody, whether to require a key used only for Originals, and a possible VH extension for DID-named log controllers. Collaborative editing depends on VH Log issue 5 and is deferred.

D3 Historical identity and ordering. Witnesses provide ordering for witnessed Originals (P9.8), declared in the author’s DID (P9.9). Select identity methods beyond did:vh, how identity versions are packaged, how the witness declaration is encoded in the DID document, witness selection and independence governance, the freshness bound witnesses and verifiers apply to author DID state, and whether unwitnessed Originals need any ordering evidence.

D4 Entry state and package. Pin canonicalization and proof suite consistently with the pinned VH Log version, entry state fields, the DID Core members allowed in state, manifest schema, digest representation, envelope discriminator, completeness declaration and limits. Publish real test vectors only after those choices.

D5 Operational edge cases. Specify atomic local commit, duplicate submission, conflict handling, how a user resolves a detected fork, explicit null/deletion and updates that leave a digest unchanged.

D6 Transport profiles. Specify hosted discovery and relocation, Boop adapter changes, and the new Bitcoin representation, boundary, confirmations and reorganization policy. No final MIME type is selected here.

D7 Later capabilities. Decide whether to add resource-set changes, encryption or recovery. Define what transferring an Original means, given that possession of the inscription confers no edit authority and the selling author keeps full control, and how an Original moves between layers under VH. Design legacy continuity and migration separately. None is implied by preserving the core edit workflow.

### Sources

[S1] Originals SDK 4 guide, CEL 3 asset API (V3.md). https://github.com/onionoriginals/sdk/blob/00fc683d0aa7f746904a14fa1f88336f09711ff5/packages/sdk/V3.md

[S2] Stephen Curran, VH Log pre-draft. https://swcurran.github.io/VH-Log/next/ · source revision f2f9fda2d8dae26b717ab54163169350c7182233 at https://github.com/swcurran/VH-Log/tree/f2f9fda2d8dae26b717ab54163169350c7182233

[S2a] VH Log issue 5, update authorization as a core feature. https://github.com/swcurran/VH-Log/issues/5

[S3] Stephen Curran, did:vh pre-draft. https://swcurran.github.io/didvh/next/ · source revision e0b7cbad27d7b2274057251f85687e133329b5a9 at https://github.com/swcurran/didvh/tree/e0b7cbad27d7b2274057251f85687e133329b5a9

[S4] SDK envelope.ts. [S5] SDK resources.ts. [S6] SDK OriginalsAsset.ts. [S7] SDK OriginalsSDK.ts. These files are under packages/sdk/src/v3 at the SDK revision in S1. https://github.com/onionoriginals/sdk/tree/00fc683d0aa7f746904a14fa1f88336f09711ff5/packages/sdk/src/v3

[S8] SDK storage/StorageAdapter.ts. https://github.com/onionoriginals/sdk/blob/00fc683d0aa7f746904a14fa1f88336f09711ff5/packages/sdk/src/storage/StorageAdapter.ts

[S9] SDK repository publication and Bitcoin paths. https://github.com/onionoriginals/sdk/tree/00fc683d0aa7f746904a14fa1f88336f09711ff5/packages/sdk/src

[S10] Boop issue 232, what a stranger sees when verifying a published note. https://github.com/aviarytech/boop/issues/232

[S11] Boop issue 286, author-present signing sessions and device keys. https://github.com/aviarytech/boop/issues/286

[RFC2119] Key words for use in RFCs to Indicate Requirement Levels. https://www.rfc-editor.org/rfc/rfc2119

[RFC8174] Ambiguity of Uppercase vs Lowercase in RFC 2119 Key Words. https://www.rfc-editor.org/rfc/rfc8174

Historical context only: an earlier VH/CEL draft at https://aviarytech.github.io/vhcel/. It is not the normative basis for retaining CEL in the new active design.

Baseline note: 00fc683d0aa7f746904a14fa1f88336f09711ff5 is the latest inspected SDK main revision; source reads were not atomic. Boop observations and issue references [S10, S11] are integration review inputs, pending an exact repository/revision pin. Upstream documents are pre-drafts, not finalized standards. This draft deliberately leaves the named decisions open.
