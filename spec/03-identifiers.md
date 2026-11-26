## Identifiers and resolution

Each Original has its own `did:og`, used for resolution across private use, web publication and later layers, with identifier mechanics hidden by the SDK (D1). Bitcoin is the later layer, as in the existing SDK, and the only anchor (D6).

Author identity remains distinct from asset identity. An asset identifier does not authorize an author to edit it. The same Original, identifier and authenticated history should continue across layers.

### Decided: the Original is a did:og

Each Original is a `did:og`, `did:og:<SCID>`, whose log is its [[ref: asset log]] (section 1). `did:og` is the Originals DID method, with its own log format (P14.1–P14.3, P14.27–P14.29); it replaces the `did:vh:<SCID>` of earlier drafts, which was never issued (D10). The SCID is the asset log’s SCID; there is no separate DID log for the Original. Resource versions, authority and the holder are derived from the asset log and from Bitcoin, never from a DID document.

The Original gains aliases, listed in its asset state and in the derived `alsoKnownAs`:

- a did:webvh once it is published on the web. This is a small did:webvh log of its own that points to the `did:og`, and its implicit `#files` service maps DID URLs such as `did:webvh:<SCID>:example.com/photo` to files at that host;
- a did:btco once it is anchored, naming the anchoring sat (P9.10). Once anchored, resolution should go through this alias. Originals inscriptions on that sat carry log entries, not a did:btco DID document, in their metadata (P9.17, P14.12), so the alias is resolved only by a verifier applying this profile (P3.5).

Every alias is a DID, so at each layer an Original has an identifier that resolves to it (P3.9).

The derived DID document of the `did:og` carries a `#files` service built from the resource descriptor, so the `did:og` can locate the Original’s files itself.

The SDK today identifies an Original by `did:cel` and keeps a CEL 3 log [S14, S12]. No Originals were issued in that format, so it is replaced without conversion or migration.

### Proposed rules

P3.1 The asset identifier MUST bind to the correct genesis under the chosen profile. A verifier MUST reject identifier/genesis mismatch, including substitution of a different valid history at the same URL.

P3.2 Exact-checkpoint resolution MUST either return evidence for that checkpoint or report why it cannot; a report whose evidence set lacks the target checkpoint has `state` `none`, `outcome` `incomplete` and a `target-missing` diagnostic (P7.18, P14.25). It MUST NOT silently substitute the latest checkpoint or resolve a different Original.

P3.3 A resolver MUST distinguish verified state, missing evidence, unsupported profile and invalid evidence. A successful HTTP request or a host’s claimed identifier MUST NOT count as successful verification.

P3.4 Publication URLs and redirects MUST NOT independently transfer author or log-control authority. Any continuity claim after relocation MUST be supported by the selected profile’s authenticated evidence.

P3.5 A successful generic VH Log, did:vh, did:webvh or did:btco resolution MUST NOT be reported as Originals verification. Originals state MUST be derived only by a verifier that applies this profile, because generic resolvers ignore the profile’s additional rules. A processor for VH Log [S2], whose entry shape the asset log shares (P14.27), rejects an asset log by its unrecognised `method` value and its empty `updateKeys` (P14.1), and a did:vh resolver of either kind [S3] rejects a `did:og` as another method, so each fails closed rather than showing a different current state. A generic did:btco resolver finds no DID document on an anchoring sat, because the metadata of an Originals inscription is an object holding log entries, not a DID document (P9.17, P14.12); if the sat’s holder inscribes one there, a generic did:btco resolver returns it, and it MUST NOT be used for the Original (P3.8).

P3.6 A did:webvh is an alias of an Original only if its DID document points to the Original’s `did:og` and the Original’s asset state lists the did:webvh. A verifier MUST NOT accept either direction alone. A did:webvh DID document MUST NOT be used to derive the Original’s state, resource versions, authority or holder.

P3.7 The did:webvh alias log SHOULD be controlled by the author. Whoever controls it can stop it pointing to the `did:og`, but cannot change the Original or make another log its history (P3.6).

P3.8 The DID document of an Original’s `did:og` MUST be derived from the asset log as section 2 describes, and a resolver MUST derive the same document from the same log. A stored or served DID document for the `did:og`, including a did:btco DID document inscribed on the anchoring sat, MUST NOT be used.

P3.9 (proposed) At every layer an Original has a DID that resolves to it: its `did:og`, from a copy of its log, a `src` location or a carried file (P7.11); on the web, its did:webvh alias (P3.6); on Bitcoin, its did:btco alias (P9.10), which names a sat that holds at most one Original (P9.34). Every alias in the asset state MUST be a DID. Given any of these DIDs, a resolver applying this profile MUST read the asset log from that layer’s source, verify it under this profile, and return the Original’s `did:og` with its state and report, or report why it cannot (P3.3, P3.5).

::: note
The aliases overlap the `src` locations that the asset log already records, and the did:btco alias cannot be resolved by the did:btco method alone: a did:btco resolver reads the sat’s DID document, which an Original does not use (P3.8), not its asset log, so only a resolver applying this profile returns the Original (P3.5, P3.9). They are kept because each does work a location cannot: adding the did:btco alias is how an Original is anchored and how a sat is bound to one Original (P9.10, P9.34), and the did:webvh alias gives the Original a DID that ordinary web resolution reaches, bound in both directions (P3.6). Owner ruling, 21 November 2026: no rule change.
:::

### Identity history and time

A verification method reference needs a specific identity state and its method-bound history evidence, not an unqualified fetch of today’s DID document. Exact identity versionId references reduce ambiguity, but they do not prove when an entry was signed. An attacker retaining a revoked key can reference an older valid identity version and claim an earlier timestamp.

Asset logs do not use VH [[ref: witnesses]] (P9.8). Off Bitcoin, on the local and web layers, an Original has claimed ordering only (P7.6), and recovery from key compromise is limited (section 5). Ordering evidence comes from Bitcoin: chain order on the anchoring sat orders each publication, and its entries are checked against each did:btco signer’s DID as its own sat shows it before that publication, and against each did:vh or did:webvh signer’s resolved log at the version they name (P9.15, P9.33). Anyone who needs ordering evidence and a holder anchors the Original; the anchor’s uniqueness is not established, and its holder is provisional, unless an index of Originals inscriptions shows that no competing anchor exists through a given block (P9.16). The anchoring sat carries the complete log, and no signer DID history (P9.17, P9.33); resource versions not inscribed in full stay off Bitcoin (P9.18).

Author DIDs may use any DID method with verifiable version history that the profile lists; the baseline lists did:vh, did:webvh and did:btco (P5.8). A did:btco author DID keeps its history on its own sat (P5.13), so the author binding of an anchored Original needs no author DID host; a did:vh or did:webvh author’s log is obtained by resolving the DID, and each inscribed entry is checked at the version it names (P9.33). A did:btco author’s key removals bind inscribed entries on their own; a did:vh or did:webvh author’s never do, and a verifier may only warn of them (P9.15). Either way, the Original’s whole log, including the entries before its anchor, is on the anchoring sat (P9.17). An unanchored Original gets no ordering evidence beyond its own log (D3).

::: issue Unresolved
How exact identity versions are bundled (D3).
:::

Sources: VH Log pre-draft [S2]; SDK identity and layers [S12, S14].
