## Purpose and status

Originals preserves the identifiable, signed history of named digital resources while allowing an author to create, edit, verify and publish an Original. This draft builds that history on Verifiable History and identity-level signing. It preserves useful SDK behavior wherever the change does not require a different model.

The immediate implementation target is a local vertical slice: create an Original, edit a resource version, package the evidence, and verify it in a fresh reader without a private key. Hosted publication and Bitcoin integration follow that slice. This document is a design for review, not an implementation or a migration authorization.

### Decision legend

- **Confirmed direction:** Originals history uses Verifiable History. Stephen Curran’s VH Log and did:vh work provide the standards direction. Author signing uses identity verification rather than an application-maintained device-key allowlist.
- **Retained SDK behavior:** an existing behavior to preserve, identified as such below. It is not a claim that the new implementation already exists.
- **Proposed rule:** a requirement offered by this draft, numbered Pn.n and shown with a shaded label. The key words MUST, MUST NOT, SHOULD, SHOULD NOT and MAY in proposed rules are to be interpreted as described in BCP 14 [[spec: RFC2119]] [[spec: RFC8174]] when, and only when, they appear in all capitals. They do not imply agreement or a finalized upstream standard. Lowercase “must” and “should” in explanatory prose describe intent and are not conformance requirements.
- **Decided:** a choice taken in review and recorded in section 13. Each Original has its own did:vh, with its complexity hidden by the SDK.
- **Unresolved:** a choice that still requires review, such as the precise did:vh profile for asset manifests.

### Scope and non-goals

The working basis is one separate VH history per Original, with one author whose key signs each change. The draft covers resource state, author and controller authority, local operations, portable evidence, and boundaries with storage and publication. It does not invent a new DID method, finalize a wire format or proof suite, promise encryption or key recovery, or treat Bitcoin possession as edit authority.

VH Log and did:vh are pre-drafts. Their algorithms, parameter behavior and resolution semantics remain dependencies to pin and test. The SDK compatibility observations refer to the SDK at main revision 00fc683: the local entry under `packages/sdk/src/v3`, the history engine under `packages/cel/src/v3`, and the full SDK in `packages/sdk/src/core/OriginalsSDK3.ts` that adds hosting and Bitcoin. The SDK is the working reference, not the authority: where this draft departs from it, section 10 says so.

### Relationship to VH Log and did:vh

Originals is a profile of did:vh, which is itself a specialisation of VH Log [S2, S3]. VH Log defines the log mechanism: entry structure, hash chaining, SCID, parameters, updateKeys, witnesses, watchers, resolution, and the rules for publishing and retrieving log files. did:vh defines the state as a DID document and the `did:vh` identifier. This draft does not repeat either; implementers need both for the log mechanism. It defines only what is specific to Originals.

Originals constrains did:vh and VH Log by:

- Specifying the state as an asset manifest (name, metadata, lifecycle and resource descriptors) represented in or referenced from the did:vh DID document (section 2, D1).
- Identifying each Original by a did:vh, with did:btco recorded as an alias once it is anchored (section 3, P9.10).
- Requiring signed state fields for the profile, operation, resource transitions, author DID, author verification method and author DID version (P5.1).
- Allowing exactly one proof per entry, by a `did:key` updateKey that is also an assertionMethod key of the author’s DID, and exactly one updateKey at a time, without prerotation on the asset log (P5.2, P5.3, P5.9).
- Fixing the author DID at genesis (P5.8) and defining rotation entries (P5.10) and fork declarations (P6.6).
- Defining resource descriptors bound to SHA-256 digests, a fixed resource set and history-derived versions (P4.1–P4.4).
- Rejecting members that VH Log, did:vh or this profile do not define (P5.7), and requiring the deactivated parameter and the manifest lifecycle to agree (P6.5).
- Requiring witnesses for hosted Originals: at least three, declared in the author’s DID, which also check the author’s latest DID state (P9.8, P9.9).
- Ending witnesses at the anchoring entry, which sets the witness parameter to `{}`, after which inscription order on the anchoring sat orders entries (P9.10, P9.13).

Originals adds, outside the log:

- Author identity, verified against the author DID’s own history (section 5).
- Resource bytes and evidence packages that verify offline (sections 4 and 7).
- Ownership as the holder of the anchoring sat, with no authority to change the Original (P9.11, P9.12).
- A verification report that keeps Originals verification distinct from generic did:vh resolution (P3.5, section 7).

::: issue Layered specialisation
VH Log defines a specialisation of VH Log, but not a profile of another specialisation. Whether Originals is a profile of did:vh, or a specialisation of VH Log that reuses did:vh’s state rules, needs to be agreed upstream (D1).
:::

::: issue Ordering after witnesses
After anchoring, an entry that is valid under VH Log is not current unless it is inscribed on the anchoring sat (P9.12, P9.13). VH Log has no notion of ordering from an external ledger. This should be confirmed as an additional constraint a specialisation may add, rather than a change to VH Log processing.
:::

::: issue Log authority from a DID
The author binding needs one asset log signature to be both an updateKey and a verification method of the author’s DID, plus rotation entries to follow the DID. A VH Log extension that lets a log name a DID as its controller would remove the rotation entries; it is proposed alongside VH Log issue 5 [S2a].
:::

### Review priorities

1. Specify the asset did:vh resolution profile and manifest representation.
2. Confirm the key binding, rotation entries, DID-declared witness policy and sat ownership in sections 5 and 9.
3. Choose witness selection and the freshness bound verifiers apply to author DID state.
4. Pin the signed entry state and portable evidence format.

These decisions block an interoperable protocol release. They do not block review of the local lifecycle, compatibility requirements or failure behavior in this draft.

Sources: SDK 4 guide [S1]; SDK history engine and full SDK [S12, S16]; VH Log pre-draft [S2]; did:vh pre-draft [S3].
