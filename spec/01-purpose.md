## Purpose and status

Originals preserves the identifiable, signed history of named digital resources while allowing an author to create, edit, verify and publish an Original. This draft builds that history on Verifiable History and identity-level signing. It preserves useful SDK behavior wherever the change does not require a different model.

The immediate implementation target is a local vertical slice: create an Original, edit a resource version, package the evidence, and verify it in a fresh reader without a private key. Hosted publication and Bitcoin integration follow that slice. This document is a design for review, not an implementation or a migration authorization.

### Decision legend

- **Confirmed direction:** Originals history uses Verifiable History. Stephen Curran’s VH Log and did:vh work provide the standards direction. Author signing uses identity verification rather than an application-maintained device-key allowlist.
- **Retained SDK behavior:** an existing behavior to preserve, identified as such below. It is not a claim that the new implementation already exists.
- **Proposed rule:** a requirement offered by this draft, numbered Pn.n and shown with a shaded label. The key words MUST, MUST NOT, SHOULD, SHOULD NOT and MAY in proposed rules are to be interpreted as described in BCP 14 [[spec: RFC2119]] [[spec: RFC8174]] when, and only when, they appear in all capitals. They do not imply agreement or a finalized upstream standard. Lowercase “must” and “should” in explanatory prose describe intent and are not conformance requirements.
- **Unresolved:** a choice that requires review. The current working preference is a DID per Original for resolution, with its complexity hidden by the SDK. The precise did:vh profile and author key binding are not yet settled.

### Scope and non-goals

The working basis is one separate VH history per Original, with one author whose key signs each change. The draft covers resource state, author and controller authority, local operations, portable evidence, and boundaries with storage and publication. It does not invent a new DID method, finalize a wire format or proof suite, promise encryption or key recovery, or treat Bitcoin possession as edit authority.

VH Log and did:vh are pre-drafts. Their algorithms, parameter behavior and resolution semantics remain dependencies to pin and test. The SDK compatibility observations refer to the inspected SDK 4 paths under `packages/sdk/src/v3`, not a promise that every historical or application-specific path behaves identically.

### Review priorities

1. Confirm the asset-DID preference and specify its resolution profile.
2. Confirm the key binding, rotation entries and DID-declared witness policy in sections 5 and 9.
3. Choose witness selection and the freshness bound for author DID state.
4. Pin the signed entry state and portable evidence format.

These decisions block an interoperable protocol release. They do not block review of the local lifecycle, compatibility requirements or failure behavior in this draft.

Sources: SDK 4 guide [S1]; VH Log pre-draft [S2]; did:vh pre-draft [S3].
