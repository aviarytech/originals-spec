## Purpose and status

Originals preserves the identifiable, signed history of one digital resource and its versions while allowing an author to create, edit, verify and publish an Original. This draft builds that history on Verifiable History and identity-level signing. It preserves useful SDK behavior wherever the change does not require a different model.

This document is a design for review, not a finalized standard or an implementation. Section 13 records the decisions taken and lists the open choices that block an interoperable release.

### Decision legend

- **Confirmed direction:** Originals history uses Verifiable History. Stephen Curran’s VH Log work provides the standards direction. Author signing uses identity verification rather than an application-maintained device-key allowlist.
- **Retained SDK behavior:** an existing behavior to preserve, identified as such below. It is not a claim that the new implementation already exists.
- **Proposed rule:** a requirement offered by this draft, numbered Pn.n and shown with a shaded label. The key words MUST, MUST NOT, SHOULD, SHOULD NOT and MAY in proposed rules are to be interpreted as described in BCP 14 [[spec: RFC2119]] [[spec: RFC8174]] when, and only when, they appear in all capitals. They do not imply agreement or a finalized upstream standard. Lowercase “must” and “should” in explanatory prose describe intent and are not conformance requirements.
- **Decided:** a choice taken in review and recorded in section 13. Each Original is a `did:og`, its own DID method, whose log is its history, with its complexity hidden by the SDK.
- **Unresolved:** a choice that still requires review, such as confirming the provisional wire format in section 14.

### Scope and non-goals

The working basis is one separate VH history per Original, with one author for its whole life. Each change is signed by the author or by an editor granted permission to change named content (P5.15). Signer sets, parent Originals, scoped grants and read authorization are experimental additions outside `did:og` 1.0 (D13). The draft covers resource state, author and controller authority, local operations, portable evidence, and boundaries with storage and publication. It defines one DID method, `did:og`, including its log format (section 14); it does not finalize a wire format or proof suite, promise encryption or key recovery, or treat Bitcoin possession as edit authority.

`did:og` defines its own log format, so the drafts it descends from, VH Log [S2] and did:vh [S3], are lineage rather than dependencies; the DID methods its signers use (P5.8) remain dependencies to pin and test. The SDK compatibility observations refer to the SDK at main revision 00fc683: the local entry under `packages/sdk/src/v3`, the history engine under `packages/cel/src/v3`, and the full SDK in `packages/sdk/src/core/OriginalsSDK3.ts` that adds hosting and Bitcoin. The SDK is the working reference, not the authority: where this draft departs from it, section 10 says so.

### Relationship to VH Log and did:vh

Originals defines its own DID method, `did:og`. Each Original is one `did:og` log, its [[ref: asset log]], and its stable identifier is `did:og:<SCID>`. There is no separate DID log for the Original. The method defines its own `method` values, `og:1.0-draft.1` for this draft (P14.1). A processor for VH Log or did:vh, or a resolver for another method, rejects the log by its unrecognised `method` value.

Earlier drafts made each Original a `did:vh:<SCID>` under a proposed did:vh extension mechanism [S19]. That mechanism exists only as an open pull request against the VH-Log-based did:vh pre-draft, now at swcurran/didvh-old, while a different, standalone method derived from did:webvh is published under the name did:vh [S3], uses the same `did:vh:<SCID>` form and rejects an Originals log. So that two methods do not claim one namespace, Originals no longer uses the did:vh name for its own identifiers (D10). did:vh, meaning that standalone method, remains one of the DID methods an author or editor may use (P5.8).

`did:og` defines its whole log format itself, as did:vh does for its own logs [S3]: the entry members, versionId and versionTime, SCID derivation, entry hashes, parameters and proofs (P14.1–P14.3, P14.8, P14.27–P14.29), and the log file (P14.2). The entry shape and the SCID and entry-hash algorithms are the ones VH Log at [S2] and did:vh at [S3] use, byte for byte, so that libraries for those logs can parse an asset log; but the rules are stated here, not incorporated by reference, and a later change to VH Log or did:vh does not change `did:og` (D10). VH Log is not being standardized at present, and `did:og` does not wait on it. `did:og` has no witnesses and no pre-rotation in the asset log, and its watchers, resolution and publishing rules are those of sections 3, 7 and 9. It defines the `did:og` identifier, how its log is sourced and its DID URL handling, and what is specific to Originals. It also profiles did:webvh and did:btco, which name an Original as aliases, and did:vh, did:webvh and did:btco as author DID methods.

Within that log format, `did:og`:

- Defines each entry’s state as the full [[ref: asset state]]: name, metadata, lifecycle, the resource descriptor, aliases, editor grants and, for an inscription, a signed preview of the version (P9.30). State is a full snapshot, never a delta, and never a DID document (section 2).
- Derives the DID document for each version deterministically: its `id`, a `controller` equal to the author DID, `alsoKnownAs` from the aliases in the asset state, and a `#files` service built from the resource descriptor. No DID document is stored, and the asset is not placed in it (section 2).
- Requires signed state fields for the operation, resource transitions, author DID, author verification method and author DID version, and for an editor entry the editor reference (P5.1, P5.16).
- Takes the log’s controller keys from the author DID (P14.1), with editor keys limited to the changes their grants allow (P5.16): one proof per entry, using `eddsa-jcs-2022` with an Ed25519 key, by an assertionMethod key of the signer’s DID at the version the entry names, other than an [[ref: updateKey]] of that DID’s own log. The asset log’s `updateKeys` is always empty, and there is no pre-rotation and there are no rotation entries (P5.2, P5.3, P5.9, P5.10, P5.12).
- Fixes the author DID at genesis (P5.8), lets the author grant editors who sign their own entries for named content only (P5.15–P5.18), keeps a signer’s identity across did:webvh moves only through that DID’s own verified history (P5.14), and leaves forks unresolved until anchoring settles them, except that an author entry may supersede a branch of editor entries (P6.6, P6.9, P9.16).
- Defines a resource descriptor bound to a SHA-256 digest, exactly one resource per Original, and history-derived versions (P4.1–P4.4).
- Rejects members that this specification does not define (P5.7), and requires the deactivated parameter and the lifecycle status to agree (P6.5).
- Does not use VH witnesses in the asset log, hosted or not; ordering off Bitcoin is claimed only (P9.8, P9.9).
- Makes Bitcoin the authoritative source after anchoring: an Original can be anchored with or without having been published on the web, inscriptions on the anchoring sat decide which entries form the log, and a later method version may define a compact encoding that decodes deterministically to full entries (P9.10, P9.13, P9.14).
- Defines a Bitcoin `src` kind, the anchoring sat’s did:btco alias, read from the Originals inscriptions on that sat rather than over HTTPS (P9.13, P9.31).

Originals adds, outside the log:

- Author identity, verified against the author DID’s own history (section 5).
- Resource bytes and evidence packages that verify offline (sections 4 and 7).
- A holder, whoever holds the anchoring sat, with no authority to change the Original (P9.11, P9.12).
- A did:webvh alias, a small did:webvh log of its own that points to the `did:og` (P3.6).
- A verification report that keeps Originals verification distinct from generic resolution (P3.5, section 7).

Earlier drafts relied on hooks that VH Log adds, or proposes, for a specialisation: an authoritative source, versionTime precision, locations not reached over HTTPS, alternative encodings, and authorized keys and editors from a controller [S20, S22–S25]. `did:og` defines each of these for itself (P5.3, P9.13, P9.14, P14.1, P14.2), so it needs no open upstream change and no did:vh extension mechanism; section 13 records those pull requests as background (D10).

Sources: SDK 4 guide [S1]; SDK history engine and full SDK [S12, S16]; VH Log, as lineage [S2]; the standalone did:vh [S3]; the VH-Log pull requests and did:vh pre-draft pull request of earlier drafts, as background [S19–S25].
