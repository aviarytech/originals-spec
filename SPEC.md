# Originals Protocol — VH-based Editor’s Draft 0.1

8 October 2026 · First review draft · Protocol and SDK design

## 1 Purpose and status

Originals preserves the identifiable, signed history of named digital resources while allowing an author to create, edit, export, verify and publish an Original. This draft replaces the active CEL-based history with Verifiable History and identity-level signing. It preserves useful SDK behavior wherever the change does not require a different model.

The immediate implementation target is a local vertical slice: create an Original, edit and seal a resource version, export the evidence, and verify it in a fresh reader without a private key. Hosted publication and Bitcoin integration follow that slice. This document is a design for review, not an implementation or a migration authorization.

### Decision legend

- Confirmed direction: CEL is removed entirely from the active Originals design. Stephen Curran’s VH Log and did:vh work provide the standards direction. Author signing uses identity verification rather than an application-maintained device-key allowlist.
- Retained SDK behavior: an existing behavior to preserve, identified as such below. It is not a claim that the new implementation already exists.
- Proposed rule: a requirement offered by this draft. Capitalized MUST, MUST NOT and SHOULD appear only in these proposed rules; they do not imply agreement or a finalized upstream standard.
- Unresolved: a choice that requires review. The current working preference is a DID per Original for resolution, with its complexity hidden by the SDK. The precise did:vh profile and authority bridge are not yet settled.

### Scope and non goals

The working basis is one separate VH history per Original. The draft covers resource state, author and controller authority, local operations, portable evidence, and boundaries with storage and publication. It does not invent a new DID method, finalize a wire format or proof suite, promise encryption or key recovery, or treat Bitcoin possession as edit authority.

VH Log and did:vh are pre-drafts. Their algorithms, parameter behavior and resolution semantics remain dependencies to pin and test. The SDK compatibility observations refer to the inspected v3 paths, not a promise that every historical or application-specific path behaves identically.

### Review priorities

1. Confirm the asset-DID preference and specify its resolution profile.
2. Specify the bridge between author-identity authority and VH log-control authority.
3. Choose historical identity evidence and anti-backdating policy.
4. Pin the signed application statement and portable evidence format.

These decisions block an interoperable protocol release. They do not block review of the local lifecycle, compatibility requirements or failure behavior in this draft.

Sources: SDK v3 documentation [S1]; VH Log pre-draft [S2]; did:vh pre-draft [S3].

\page

## 2 Model and terminology

An Original is a logical asset with a stable identifier, a verifiable state history and a set of named resources. Its content can be a photograph, a document, or several related byte streams. A resourceID identifies one logical resource across revisions. A resource version is an exact byte sequence bound to a mediaType and cryptographic digest in verified asset history.

A manifest is the application view of an Original’s current name, metadata, resource descriptors and lifecycle status. A VH entry commits a state transition according to the selected VH profile. A checkpoint identifies an exact verified prefix of that history. A draft is a local, unsigned candidate change; it is never a verified resource version.

### Three authorities

Author identity is the identity making an application statement. Its verification method must be authorized through the applicable DID verification relationship and method rules. The statement also needs authority to change this particular Original.

Log-control authority is the authority to append or modify VH history under the previous accepted entry’s rules, including the applicable updateKeys. VH updateKeys are raw Multikey material. A log signature does not automatically establish author identity or application permission.

Storage and publication authority is permission to store bytes or publish a checkpoint. A host, storage adapter, wallet, inscription holder or sat owner does not gain asset-editing authority merely by performing that role. One actor may hold several roles, but verifiers evaluate each role separately.

### Proposed rules

P2.1 An accepted Original MUST have one unambiguous history identity and an exact verified current checkpoint. An implementation MUST NOT merge divergent valid histories by choosing the latest claimed timestamp.

P2.2 A committed asset change MUST satisfy both the selected VH log-validity rules and the Originals application authorization rules. Possession of a raw update key or an authenticated author key alone MUST NOT be treated as satisfying both checks.

P2.3 Every accepted state MUST preserve the association between the Original, its resourceIDs and the prior accepted checkpoint. Storage locations MUST be treated as retrieval hints, not substitutes for signed digest bindings.

### Conceptual state illustration

The following is an explanatory model, not a normative wire format or test vector:

Original identity → VH checkpoint → full application state
Application state → name, metadata, lifecycle, named resource descriptors
Resource descriptor → resourceID, mediaType, exact-byte digest
Application statement → Original identity, parent checkpoint, resulting state commitment, author identity reference, authorization evidence
Evidence package → VH history, application proofs, identity evidence, resource bytes

For a generic VH profile, the application manifest can be the profiled VH state. For a did:vh specialization, the VH state is constrained by the DID method’s DID-document requirements. Manifest embedding or an integrity-bound manifest reference requires a compatible, documented extension. An arbitrary asset object cannot simply replace the DID document.

Sources: VH Log and did:vh state models [S2, S3]; current envelope and resource behavior [S4, S5].

\page

## 3 Identifiers and resolution

The working preference is a DID per Original for file resolution across private use, web publication and later layers, with identifier mechanics hidden by the SDK. Bitcoin is the later-layer assumption here, based on the existing SDK; the latest spoken description did not clearly name that layer.

Author identity remains distinct from asset identity. An asset DID does not authorize an author to edit it. The same Original, identifier and authenticated history should continue across layers.

### Working preference did vh specialization

Each Original has an asset did:vh identifier and one conforming DID-document history. The Originals profile specifies how an asset manifest is represented or referenced without violating the method’s state constraints. A resolver returns the asset DID document and the evidence needed to obtain the exact manifest checkpoint.

This alternative can reuse DID resolution concepts, method validation and version selection. It adds profile work for manifest binding, discovery, resolution metadata and the relationship between the asset controller and author identities. An asset DID is not assumed to be a human or organizational author DID.

### Alternative retained for review generic VH identifier

Each Original has a generic VH history identifier, with an Originals discovery profile describing how to locate history and resource evidence. The application manifest is the profiled full VH state. Author statements still use standards-based identity verification.

This alternative requires its own resolution contract: identifier syntax, locator discovery, relocation, exact-checkpoint requests, result metadata, offline behavior and errors. A self-certifying identifier does not supply these automatically.

### Common proposed rules

P3.1 The asset identifier MUST bind to the correct genesis under the chosen profile. A verifier MUST reject identifier/genesis mismatch, including substitution of a different valid history at the same URL.

P3.2 Exact-checkpoint resolution MUST either return evidence for that checkpoint or report why it cannot. It MUST NOT silently substitute the latest checkpoint or resolve a different Original.

P3.3 A resolver MUST distinguish verified state, missing evidence, unsupported profile and invalid evidence. A successful HTTP request or a host’s claimed identifier MUST NOT count as successful verification.

P3.4 Publication URLs and redirects MUST NOT independently transfer author or log-control authority. Any continuity claim after relocation MUST be supported by the selected profile’s authenticated evidence.

### Identity history and time

A verification method reference needs a specific identity state and its method-bound history evidence, not an unqualified fetch of today’s DID document. Exact identity versionId references reduce ambiguity, but they do not prove when a statement was signed. An attacker retaining a revoked key can reference an older valid identity version and claim an earlier timestamp.

Unresolved: which identity methods and historical resolution capabilities are required; how exact identity versions are packaged; and whether acceptance requires a witness, trusted timestamp, independent checkpoint, freshness bound or another ordered evidence policy. Until selected, verification reports claimed times separately from independently supported ordering or time.

Sources: did:vh and VH Log pre-drafts [S2, S3].

\page

## 4 Resource state and version semantics

### Retained SDK behavior

Resources have stable logical resourceIDs, mediaType values and exact-byte digests. The current v3 model fixes the resourceID set at genesis; adding or removing a resource is a scope expansion. An update binds the prior digest, and resource versions are derived from verified history rather than accepted from a caller’s counter.

For the existing update behavior, a supplied name or metadata value replaces that field. An omitted field remains unchanged. The new profile should preserve this distinction without turning omission into deletion or introducing an implicit metadata merge. Explicit null and deletion encodings need a schema decision before use.

### Proposed rules

P4.1 Genesis MUST establish the complete initial resourceID set for the baseline profile. Updates MUST NOT add, remove or silently rename resourceIDs. A future resource-set extension MUST have a separately identified profile and explicit transition rules.

P4.2 Each accepted resource update MUST bind the resourceID, prior digest and new descriptor. The resulting descriptor MUST bind the exact bytes and mediaType. The digest algorithm and encoded representation MUST be identified by the chosen profile; this draft does not select them.

P4.3 Verification MUST compute the digest over the stored byte sequence without image decoding, re-encoding, text normalization or MIME-dependent transformation. Two visually identical photographs with different bytes are different byte versions.

P4.4 A resource’s visible version number MUST be derived from its accepted resource-changing transitions. An unrelated metadata update or another resource’s update MUST NOT advance that resource’s version. Caller-supplied counters MUST NOT override the verified result.

P4.5 A mutation with a stale expected checkpoint or stale prior digest MUST fail as a conflict. The SDK MUST NOT silently rebase and re-sign it against a new parent. Retrying the same submitted candidate MUST NOT produce a different signed statement without an explicit new preparation step.

P4.6 Name and metadata replacement MUST be atomic with the accepted transition. Omitting either field MUST preserve the prior value. Unsupported schema values MUST be rejected before commit.

### Photo lifecycle

Alice creates “Harbor at dawn” with resourceID photo, mediaType image/jpeg and bytes B1. Genesis commits digest H1. She crops the photograph locally, producing B2. The candidate update names photo, the accepted parent checkpoint and H1, and proposes H2 for B2.

After signing and independent verification succeed, the new checkpoint becomes current. The reader derives photo version 2 from history. If Alice also renames the Original, that name replaces the prior one in the same transition. A later metadata-only correction changes the asset checkpoint but leaves photo at version 2.

A fresh reader can inspect B1 and B2 when both are exported. A host serving B2 at the B1 URL fails the digest check. A draft crop is not a committed version, even when its bytes already exist in a local store.

Sources: OriginalsAsset and resources [S5, S6].

\page

## 5 Signing and verification boundaries

The SDK replaces its device-key allowlist with an identity signer and independent verifier. Asset authorization and VH update-key validation remain required. A selected profile pins interoperable proof semantics.

### Proposed rules for a signed change

P5.1 The signing input MUST bind the profile discriminator, Original identity, operation, parent checkpoint, resulting state commitment, resource transitions, author identity and authorization context. The selected canonicalization and proof construction MUST cover every security-relevant field; their encoding remains open.

P5.2 A signer MUST return independently verifiable proof material, a verification method reference and evidence or references for the exact identity state. A success flag, key label or claimed DID MUST NOT constitute verification.

P5.3 A verifier MUST check DID method binding and history, cryptographic validity, and authorization under the selected verification relationship. assertionMethod is a candidate for application statements, not a settled choice. Relationship and proof purpose MUST be explicit and consistent.

P5.4 A verifier MUST independently check the author’s authority over the Original at the parent checkpoint. A valid assertion by a recognized identity MUST NOT automatically grant permission to change every Original.

P5.5 VH validation MUST apply the pinned upstream algorithms for entry integrity, chaining, parameters, proofs and controller changes. The SDK MUST NOT substitute application-author verification for updateKeys authorization.

P5.6 No candidate MUST become the current state until all required application and VH checks succeed. Missing identity history or authorization evidence MUST remain an explicit failure or incomplete-verification result; it MUST NOT downgrade to trusting the key alone.

### The unresolved authority bridge

The desired default is no dedicated per-Original keypair. Compatible author-managed keys can control several logs when explicitly bound into each log’s applicable updateKeys. Naming the author DID grants no log authority. This is a working preference, not a completed profile.

The profile must define the bridge: an explicitly bound identity-controlled log key, or a verifiable delegation to commit scoped author-approved statements. Define issuer, audience, asset scope, operations, validity, revocation, rotation and replay handling.

The bridge belongs in the Originals profile. Two physical signatures are not mandated: one construction may satisfy multiple obligations only when the standards and profile specify independent verification of each.

### Rotation and historical proof

did:vh recommends prerotation. When used, VH requires fresh future-key generation and recommends avoiding reuse of revealed prerotation keys. Shared long-lived keys broaden compromise impact and do not provide one-use prerotation benefits. Select a compatible reuse, rotation and custody policy.

Rotation requires an authorized outgoing controller. Loading evidence does not restore signing authority. Historical verification depends on the identity, ordering and revocation policy in section 3; claimed timestamps cannot establish signing before revocation.

Sources: VH update authorization [S2]; identity document rules [S3]; current signer/envelope boundaries [S4, S6, S7].

\page

## 6 Local operations and transitions

The public SDK should retain the familiar create, edit, export and load workflow. Compatibility applies to useful semantics, not to preserving CEL types or hiding a required protocol change. A new envelope discriminator, history engine and verifier are expected.

### Proposed operation contract

Create prepares the initial manifest, resource descriptors and genesis candidate. It obtains the required author and log proofs, verifies the complete candidate and commits one valid initial checkpoint. It returns either a verified Original or an explicit unsigned draft; these outcomes are different types or clearly distinguishable states.

Edit reads an exact verified parent, checks the fixed resourceID set, computes new descriptors and creates a candidate bound to the old state. Seal obtains proofs and validates the candidate independently. Commit changes the current pointer only after the sealed result and required local evidence are durably stored.

Export reads a selected verified checkpoint and its history. Load/import reconstructs and verifies evidence with no signing key requirement. A loaded Original is readable without becoming writable. Obtaining a signer is an explicit authority step, and eligibility to append is rechecked against the verified parent.

Deactivate produces an authorized terminal state. Subsequent ordinary edits are rejected. Historical evidence is retained and readable where the selected upstream resolution and evidence policy permit it; this draft does not assume that every resolver already supports historical deactivated-state access.

### Proposed failure rules

P6.1 Preparation, signing and verification MUST complete before the current committed state changes. A signing rejection, timeout or invalid proof MUST leave the prior checkpoint unchanged. Staged bytes may remain for cleanup but MUST NOT appear as committed versions.

P6.2 Commit MUST be recoverable after interruption. Storage implementations MUST define how they persist the accepted history and bytes before advancing the current pointer, or provide an equivalent atomic boundary. An interrupted commit MUST NOT expose a checkpoint whose required local evidence was never committed.

P6.3 Drafts MUST be explicitly marked unsigned. The SDK MUST NOT export them as accepted history, count them as resource versions or publish them as sealed Originals.

P6.4 A retried operation MUST preserve its intended parent and statement. If the parent changed, the SDK MUST report a conflict and require a new candidate. An already accepted identical candidate SHOULD return its existing checkpoint without duplicating the transition.

P6.5 Deactivation MUST be terminal for new edits in the baseline profile. A verifier MUST reject an update after an accepted deactivation. Any future reactivation feature requires an explicit new profile and authorization policy.

### Observable results

The SDK should expose the selected checkpoint, derived resource versions, verification status and actionable error category. Suggested categories are invalid evidence, incomplete evidence, unsupported profile, unauthorized author, unauthorized log controller, stale parent, deactivated asset and unavailable bytes. Concrete API names and error codes remain a compatibility review item.

Sources: OriginalsAsset, OriginalsSDK and envelope [S4, S6, S7].

\page

## 7 Portable export and fresh verification

### Retained behavior and new evidence

An export preserves signed history and historical resource bytes so a fresh reader can reconstruct versions. The VH-based export additionally needs the chosen application proofs, identity history and authorization evidence. A public key being present in an archive is not sufficient evidence that an identity authorized it.

An evidence package describes what it includes and what is unavailable. Complete and partial packages must be distinguishable. Offline verification is an intended capability of a complete package, but it depends on specifying portable identity evidence and any freshness or external-ordering requirement.

### Proposed package rules

P7.1 A complete export MUST include the VH evidence through the selected checkpoint, each required Originals statement and proof, required identity and authority evidence, and the historical resource bytes referenced by that prefix. It MUST identify the Original, profile and target checkpoint unambiguously.

P7.2 Export MUST preserve signed bytes or canonical signed representations as required by each proof format. Reformatting, normalization or changing an envelope discriminator MUST NOT be presented as preserving an existing signature.

P7.3 A reader MUST validate evidence before exposing derived state as verified. Verification MUST establish identifier/genesis binding, history continuity, log authority, application authority, state transitions and resource digests. A private key MUST NOT be required for any read-only check.

P7.4 Missing bytes MUST produce an explicit partial-availability result identifying the affected resource and checkpoint. Available bytes MUST still be checked. Missing proof or identity evidence MUST be reported separately from missing content; no missing item permits bypassing a signature or digest check.

P7.5 Import MUST NOT confer signing authority, trust unknown keys, or replace an existing history with a conflicting branch without explicit handling. Untrusted archive paths, sizes and compression MUST be bounded before extraction.

P7.6 Evidence from a truncated prefix MUST NOT be represented as the latest state without the selected freshness policy. A valid historical prefix and a fresh current result are separate claims.

### Proposed verification report

Return separate results for history validity, application authorization, identity evidence, resource availability and freshness/order policy. Include the verified checkpoint, profile, unresolved dependencies, missing items and failures. Avoid a single green “verified” result that conceals incomplete authorization or unavailable historical bytes.

For the photo example, an export through photo version 2 contains the accepted genesis and update evidence plus B1 and B2. If B1 is omitted, the reader may still verify supplied history and B2 where all proof evidence is present, but reports that historical photo version 1 bytes are unavailable. It cannot claim a complete export.

Sources: current export and load paths [S4, S6, S7]; proposed VH and identity evidence requirements derive from [S2, S3].

\page

## 8 Private use storage and security

### What private means today

The active SDK paths provide local/offline operation, not an encrypted vault. Serialized metadata is plaintext, embedded bytes may be base64 encoded, and storage adapters perform raw put/get operations. Base64 is not encryption. Encryption and signing-key recovery are not implemented in the inspected active paths.

This baseline should be stated plainly in product and SDK documentation. Private use means that the user can keep the evidence off public hosts; confidentiality then depends on the security of the chosen device, files and storage service. Exporting, synchronizing or publishing can disclose the manifest and its history.

### Proposed storage and privacy rules

P8.1 Storage adapters MUST preserve exact bytes and surface missing or failed writes. Returned content MUST be checked against the signed descriptor before being treated as verified. A storage adapter’s success response MUST NOT certify authorship or integrity.

P8.2 The SDK MUST NOT label plaintext metadata, base64 content or raw storage as encrypted. An encryption feature MUST identify its separate format, key handling, integrity protection and recovery behavior before making confidentiality claims.

P8.3 Publishing or exporting MUST identify the evidence and content being included. A later metadata correction MUST NOT be described as removing a secret from previously distributed history. Historical names, locators and identity links may remain visible.

P8.4 Read-only loading MUST NOT imply that a signing key has been restored. The SDK MUST distinguish access to evidence, access to content-decryption keys if any, and current authority to sign updates.

### Threats addressed by the baseline

Digest binding detects byte substitution. Signed parent references and state commitments prevent undetected rebinding of a valid change to another history. Independent application and log verification detect unauthorized authors and unauthorized appends. Exact-checkpoint requests reduce accidental use of a different version. Conflict reporting exposes concurrent edits instead of silently resolving them.

A malicious host can withhold content, serve an old valid prefix or show different valid branches to different readers. The baseline alone does not solve availability, freshness, global consistency or trusted time. Resolver fetching also creates privacy and network risks: external references need scheme restrictions, size limits, redirect limits and protection against requests to unintended private network targets.

### Open additions

Encryption at rest or in exports, multi-device signing, delegation recovery and lost-key recovery are separate decisions. A recovery design must preserve continuity through authorized VH and identity mechanisms; importing bytes or creating a new genesis is not recovery of the old authority. Do not commit to an emergency override absent a defined trust model.

Sources: StorageAdapter and serialization behavior [S4, S7, S8].

\page

## 9 Hosted publication and Bitcoin boundaries

### Hosted publication

The inspected SDK hosted path maintains did:webvh-related publication alongside CEL history and cel.json. The new active format retires that dual history. A host serves the selected VH profile and exact resource evidence; the public reader verifies the same checkpoint semantics as the local reader.

The Boop adapter needs its actual publishing path replaced: ordinary publication uses local per-asset Ed25519 signing through localCelKeyStore and addResourceVersion, rather than SDK publishToWeb. Replacing only publishToWeb leaves active CEL behavior behind. The exact-snapshot public-reader requirement associated with issue 232 remains a regression requirement.

### Proposed hosted rules

P9.1 A published snapshot MUST bind its manifest, history checkpoint and resource descriptors. The public reader MUST verify that exact snapshot and MUST NOT combine history from one checkpoint with metadata or bytes presented as another.

P9.2 A publish retry MUST resume or repeat the same intended snapshot. Uploading bytes, publishing a locator or changing an index MUST NOT create a new asset transition unless an explicit authorized transition is part of the operation.

P9.3 Host relocation and locator updates MUST preserve authenticated continuity under the chosen profile. Public delivery MUST use the new profile discriminator and MUST NOT relabel CEL evidence as VH.

### Bitcoin adapter

Current representations include CEL JSON with application/cel and media bytes with CEL CBOR metadata. Those encodings are replaced, not retained as the new active format. The VH-based inscription representation, MIME type, metadata schema, size limits and locator rules are unresolved. This draft defines the boundary requirements without inventing a final encoding.

P9.4 A Bitcoin publication MUST identify the exact accepted checkpoint and content commitment it represents. Only a verified change beyond the prior durable published boundary may form the next delta. A pending or failed transaction MUST NOT advance that durable boundary.

P9.5 Forks, reorganizations and competing publications MUST be exposed explicitly. Confirmation policy and reorganization handling MUST be defined by the adapter; transaction observation alone MUST NOT be described as permanent finality.

P9.6 Transaction retries MUST distinguish rebroadcasting the same intended transaction from preparing a replacement. Asset edits MUST NOT be silently re-signed or rebased because a transaction is retried. A wallet or sat holder MUST NOT acquire author or VH update authority by possession alone.

No Bitcoin spending, activation, inscription or migration is authorized by this document. Hosted and Bitcoin implementation follow the local interoperability slice, with dedicated adapter tests.

Sources: current SDK publication and Bitcoin paths [S7, S9]; Boop integration observations require repository-pinned confirmation before implementation.

\page

## 10 SDK replacement and legacy evidence

### Proposed replacement map

| Area | Retain | Replace or specify |
|---|---|---|
| OriginalsAsset | Resource semantics and lifecycle | VH transitions and authority checks |
| OriginalsSDK | Create load export workflow | Profile selection and identity adapters |
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

P10.4 The new SDK MUST NOT automatically re-genesis old assets or erase redirects and continuity records. The re-genesis-without-redirect idea associated with issue 286 is a proposal for review, not approved migration policy.

### Delivery sequence

1. Pin upstream pre-drafts and choose enough of the application profile to implement a local experimental slice with its provisional choices clearly identified.
2. Implement create, edit/seal, export and fresh verification. Test without private keys in the reader and without network dependencies for a complete offline package.
3. Add identity rotation, deactivation, incomplete evidence and conflict tests. Keep unresolved freshness claims visible.
4. Replace the actual hosted and Boop publication paths; run exact-snapshot reader regressions.
5. Specify and implement the Bitcoin representation and durable-boundary tests. Design migration separately.

Sources: SDK map [S1, S4–S9]. Current SDK files were inspected across main, not as an atomic repository snapshot; pin and recheck them before implementation.

\page

## 11 Conformance and negative tests

All requirements here are proposed. A conformance claim needs a named, pinned Originals profile plus the upstream VH and identity-method versions. “VH-based” alone is not an interoperable conformance target. Open profile choices are blockers to a release claim, not reasons to accept unverified evidence.

### Proposed minimum test matrix

| Test | Required result |
|---|---|
| Fresh create edit export verify | Same asset checkpoint and resource versions; no private key in reader |
| Byte changed at same URL | Digest failure; no verified resource result |
| Wrong genesis or Original ID | Identifier binding failure |
| Broken chain or reordered entry | History invalid; no derived accepted state beyond failure |
| Valid author proof wrong asset scope | Application authorization failure |
| Valid VH key unauthorized author | Log validity cannot rescue application failure |
| Valid author unauthorized updateKey | Author validity cannot rescue log failure |
| Wrong DID method binding or relationship | Identity authorization failure |
| Old identity version with claimed old time | Apply selected anti-backdating policy; no timestamp-only acceptance |
| Missing identity history or delegation | Incomplete authorization evidence; no blanket verified result |
| Missing historical resource bytes | Explicit partial availability; supplied bytes still checked |
| Caller changes version counter | Counter ignored or rejected; history-derived version retained |
| Stale parent or prior digest | Conflict; no silent rebase or commit |
| Signer rejects or returns invalid proof | No partial state commit |
| Interrupted local commit | Recover prior or fully committed checkpoint; no false success |
| Identical accepted retry | Existing result or explicit duplicate; no unintended extra version |
| Resource added removed or renamed | Rejected in baseline fixed-resource profile |
| Metadata supplied versus omitted | Replacement versus unchanged, respectively |
| Import then edit without authority | Read succeeds where evidence valid; edit authorization fails |
| Update after deactivation | Rejected; historical evidence retained |
| Old valid prefix served as current | Freshness unresolved or failed under policy, never assumed |
| Divergent valid branches | Explicit fork/conflict, no timestamp winner |
| Hosted mixed snapshot | Rejected before public result is marked verified |
| Bitcoin failure retry or reorganization | Durable boundary follows adapter policy, not pending intent |
| Legacy bytes with new discriminator | Rejected; legacy verification remains separate |

### Release evidence

Release evidence should include positive and negative fixtures, pinned profile decisions, deterministic results and an active-dependency inventory without CEL. Run fresh-process and partial-package tests. An independent verifier should reproduce the positive checkpoints before interoperability is claimed.

\page

## 12 Decision register and source baseline

### Prioritized open decisions

D1 Asset identifier and state shape. Confirm the working preference for did:vh per Original with SDK-hidden complexity and continuous identity across layers. Retain generic VH plus discovery as an explicit alternative. Pin genesis binding, exact-checkpoint resolution, deactivation history and manifest representation.

D2 Authority bridge and key policy. Define how author identity and asset permission bind to raw VH updateKeys without requiring a dedicated per-Original keypair by default. Specify delegation, scope, revocation and replay protection, and resolve shared-key reuse versus prerotation. This is required even when an asset DID exists.

D3 Historical identity and ordering. Select supported identity methods, verification relationship, identity-version evidence and a policy for revoked-key backdating, stale prefixes and independently supported time or ordering.

D4 Signed statement and package. Pin canonicalization, proof suite, statement fields, manifest schema, digest representation, envelope discriminator, completeness declaration and limits. Publish real test vectors only after those choices.

D5 Operational edge cases. Specify atomic local commit, duplicate submission, conflict handling, explicit null/deletion, controller rotation and terminal deactivation behavior.

D6 Transport profiles. Specify hosted discovery and relocation, Boop adapter changes, and the new Bitcoin representation, boundary, confirmations and reorganization policy. No final MIME type is selected here.

D7 Later capabilities. Decide whether to add resource-set changes, encryption or recovery. Design legacy continuity and migration separately. None is implied by preserving the core edit workflow.

### Sources

[S1] Originals SDK v3 guide. https://github.com/onionoriginals/sdk/blob/00fc683d0aa7f746904a14fa1f88336f09711ff5/packages/sdk/V3.md

[S2] Stephen Curran, VH Log pre-draft. https://swcurran.github.io/VH-Log/next/ · source revision f2f9fda2d8dae26b717ab54163169350c7182233 at https://github.com/swcurran/VH-Log/tree/f2f9fda2d8dae26b717ab54163169350c7182233

[S3] Stephen Curran, did:vh pre-draft. https://swcurran.github.io/didvh/next/ · source revision e0b7cbad27d7b2274057251f85687e133329b5a9 at https://github.com/swcurran/didvh/tree/e0b7cbad27d7b2274057251f85687e133329b5a9

[S4] SDK envelope.ts. [S5] SDK resources.ts. [S6] SDK OriginalsAsset.ts. [S7] SDK OriginalsSDK.ts. These files are under packages/sdk/src/v3 at the SDK revision in S1. https://github.com/onionoriginals/sdk/tree/00fc683d0aa7f746904a14fa1f88336f09711ff5/packages/sdk/src/v3

[S8] SDK storage/StorageAdapter.ts. https://github.com/onionoriginals/sdk/blob/00fc683d0aa7f746904a14fa1f88336f09711ff5/packages/sdk/src/storage/StorageAdapter.ts

[S9] SDK repository publication and Bitcoin paths. https://github.com/onionoriginals/sdk/tree/00fc683d0aa7f746904a14fa1f88336f09711ff5/packages/sdk/src

Historical context only: Brian’s earlier VH/CEL draft at https://aviarytech.github.io/vhcel/. It is not the normative basis for retaining CEL in the new active design.

Baseline note: 00fc683d0aa7f746904a14fa1f88336f09711ff5 is the latest inspected SDK main revision; source reads were not atomic. Boop observations and issue references are integration review inputs, pending an exact repository/revision pin. Upstream documents are pre-drafts, not finalized standards. This first draft deliberately leaves the named decisions open.
