## Purpose and status

Originals preserves the identifiable, signed history of named digital resources while allowing an author to create, edit, verify and publish an Original. This draft builds that history on Verifiable History and identity-level signing. It preserves useful SDK behavior wherever the change does not require a different model.

The immediate implementation target is a local vertical slice: create an Original, edit a resource version, package the evidence, and verify it in a fresh reader without a private key. Hosted publication and Bitcoin integration follow that slice. This document is a design for review, not an implementation or a migration authorization.

### Decision legend

- **Confirmed direction:** Originals history uses Verifiable History. Stephen Curran’s VH Log and did:vh work provide the standards direction. Author signing uses identity verification rather than an application-maintained device-key allowlist.
- **Retained SDK behavior:** an existing behavior to preserve, identified as such below. It is not a claim that the new implementation already exists.
- **Proposed rule:** a requirement offered by this draft, numbered Pn.n and shown with a shaded label. The key words MUST, MUST NOT, SHOULD, SHOULD NOT and MAY in proposed rules are to be interpreted as described in BCP 14 [[spec: RFC2119]] [[spec: RFC8174]] when, and only when, they appear in all capitals. They do not imply agreement or a finalized upstream standard. Lowercase “must” and “should” in explanatory prose describe intent and are not conformance requirements.
- **Decided:** a choice taken in review and recorded in section 13. Each Original is a did:vh whose log is its history, under the Originals did:vh extension, with its complexity hidden by the SDK.
- **Unresolved:** a choice that still requires review, such as the asset state schema.

### Scope and non-goals

The working basis is one separate VH history per Original, with one author whose key signs each change. The draft covers resource state, author and controller authority, local operations, portable evidence, and boundaries with storage and publication. It does not invent a new DID method, finalize a wire format or proof suite, promise encryption or key recovery, or treat Bitcoin possession as edit authority.

VH Log and did:vh are pre-drafts. Their algorithms, parameter behavior and resolution semantics remain dependencies to pin and test. The SDK compatibility observations refer to the SDK at main revision 00fc683: the local entry under `packages/sdk/src/v3`, the history engine under `packages/cel/src/v3`, and the full SDK in `packages/sdk/src/core/OriginalsSDK3.ts` that adds hosting and Bitcoin. The SDK is the working reference, not the authority: where this draft departs from it, section 10 says so.

### Relationship to VH Log and did:vh

Originals is a did:vh extension [S19], and therefore a specialisation of VH Log [S2, S3]. Each Original is one did:vh log, its [[ref: asset log]], and its stable identifier is `did:vh:<SCID>`. There is no separate DID log for the Original. The extension defines its own `method` values, provisionally `originals:1.0`, each stating the VH-Log version it implies. A log cannot move between plain did:vh and the extension, and a resolver that does not implement the extension rejects the log by its unrecognised `method` value.

VH Log defines the log mechanism: entry structure, hash chaining, SCID, parameters, updateKeys, witnesses, watchers, resolution, and the rules for publishing and retrieving log files. did:vh defines the identifier, sourcing the log and DID URL handling. This draft does not repeat them. It defines only what is specific to Originals. It also profiles did:webvh and did:btco, which name an Original as aliases, and did:vh, did:webvh and did:btco as author DID methods.

Using the rules a did:vh extension may define, Originals:

- Defines each entry’s state as the full [[ref: asset state]]: name, metadata, lifecycle, resource descriptors and aliases. State is a full snapshot, never a delta, and never a DID document (section 2).
- Derives the DID document for each version deterministically: its `id`, a `controller` equal to the author DID, `alsoKnownAs` from the aliases in the asset state, and a `#files` service built from the resource descriptors. No DID document is stored, and the asset is not placed in it (section 2).
- Requires signed state fields for the operation, resource transitions, author DID, author verification method and author DID version (P5.1).
- Takes the log’s authorized keys from the author DID [S25]: one proof per entry, using `eddsa-jcs-2022` or `bip340-jcs-2025` [S21], by an assertionMethod key in the author DID’s Originals declaration at the version the entry names. There are no updateKeys, no pre-rotation and no rotation entries (P5.2, P5.3, P5.9, P5.10, P5.12).
- Fixes the author DID at genesis (P5.8) and defines fork declarations (P6.6).
- Defines resource descriptors bound to SHA-256 digests, a fixed resource set and history-derived versions (P4.1–P4.4).
- Rejects members that VH Log, did:vh or this extension do not define (P5.7), and requires the deactivated parameter and the lifecycle status to agree (P6.5).
- Does not use VH witnesses in the asset log, hosted or not; ordering off Bitcoin is claimed only (P9.8, P9.9).
- Makes Bitcoin the authoritative source after anchoring [S20]: an Original can be anchored with or without having been published on the web, inscriptions on the anchoring sat decide which entries form the log, and they may carry a compact encoding that decodes deterministically to full entries [S23, S24] (P9.10, P9.13, P9.14).

Originals adds, outside the log:

- Author identity, verified against the author DID’s own history (section 5).
- Resource bytes and evidence packages that verify offline (sections 4 and 7).
- Ownership as the holder of the anchoring sat, with no authority to change the Original (P9.11, P9.12).
- A did:webvh alias, a small did:webvh log of its own that points to the did:vh (P3.6).
- A verification report that keeps Originals verification distinct from generic resolution (P3.5, section 7).

The VH-Log hooks this relies on are open pull requests: an authoritative source [S20], additional cryptosuites [S21], versionTime precision [S22], locations not reached over HTTPS [S23], alternative encodings whose decoding may depend on earlier entries [S24], and authorized keys from a controller [S25]. The did:vh extension mechanism is also an open pull request [S19]; it lets an extension define its own state, parameters, VH-Log specialisation rules and `src` kinds. The extension uses that to define a Bitcoin `src` kind, retrieved under VH-Log’s rule for locations not reached over HTTPS.

### Review priorities

1. Specify the asset state schema, the `originals` method values and the DID document derivation.
2. Confirm the key binding, the author DID’s Originals declaration and sat ownership in sections 5 and 9.
3. Choose the freshness policy verifiers apply to author DID state (P7.8).
4. Pin the signed entry state and portable evidence format.

These decisions block an interoperable protocol release. They do not block review of the local lifecycle, compatibility requirements or failure behavior in this draft.

Sources: SDK 4 guide [S1]; SDK history engine and full SDK [S12, S16]; VH Log pre-draft [S2]; did:vh pre-draft [S3].
