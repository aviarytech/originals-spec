## Identifiers and resolution

Each Original has its own did:vh, used for resolution across private use, web publication and later layers, with identifier mechanics hidden by the SDK (D1). This draft assumes Bitcoin is the later layer, as in the existing SDK, and proposes one of a list of EVM chains, fixed at genesis, as a layer before it or instead of it (P9.19, P9.28, P14.22).

Author identity remains distinct from asset identity. An asset identifier does not authorize an author to edit it. The same Original, identifier and authenticated history should continue across layers.

### Decided: the Original is a did:vh

Each Original is a did:vh, `did:vh:<SCID>`, whose log is its [[ref: asset log]] under the Originals extension (section 1). The SCID is the asset log’s SCID; there is no separate DID log for the Original. Resource versions, authority and ownership are derived from the asset log and from Bitcoin, or from the EVM chain the Original is anchored on (P9.20), never from a DID document.

The Original gains aliases, listed in its asset state and in the derived `alsoKnownAs`:

- a did:webvh once it is published on the web. This is a small did:webvh log of its own that points to the did:vh, and its implicit `#files` service maps DID URLs such as `did:webvh:<SCID>:example.com/photo` to files at that host;
- a did:btco once it is anchored, naming the anchoring sat (P9.10). Once anchored, resolution should go through this alias. Originals inscriptions on that sat carry log entries, not a did:btco DID document, in their metadata (P9.17, P14.12), so the alias is resolved only by a verifier applying this profile (P3.5).
- proposed: for an Original whose genesis entry names an EVM anchor chain, a did:evm once it is anchored, instead of a did:btco. This token alias names the Original’s one token on that chain, as a did:btco names a sat, and is resolved by a verifier applying this profile (P3.9, P9.19, P14.18). A move replaces it with the destination’s alias (P9.28); the DID left behind still resolves, to a report that the Original has moved (P3.9).

Every alias is a DID, so at each layer an Original has an identifier that resolves to it (P3.9).

The derived DID document of the did:vh carries a `#files` service built from the resource descriptor, so the did:vh can locate the Original’s files itself.

The SDK today identifies an Original by `did:cel` and keeps a CEL 3 log [S14, S12]. No Originals were issued in that format, so it is replaced without conversion or migration.

### Proposed rules

P3.1 The asset identifier MUST bind to the correct genesis under the chosen profile. A verifier MUST reject identifier/genesis mismatch, including substitution of a different valid history at the same URL.

P3.2 Exact-checkpoint resolution MUST either return evidence for that checkpoint or report why it cannot. It MUST NOT silently substitute the latest checkpoint or resolve a different Original.

P3.3 A resolver MUST distinguish verified state, missing evidence, unsupported profile and invalid evidence. A successful HTTP request or a host’s claimed identifier MUST NOT count as successful verification.

P3.4 Publication URLs and redirects MUST NOT independently transfer author or log-control authority. Any continuity claim after relocation MUST be supported by the selected profile’s authenticated evidence.

P3.5 A successful generic VH Log, did:vh, did:webvh or did:btco resolution MUST NOT be reported as Originals verification. Originals state MUST be derived only by a verifier that applies this profile, because generic resolvers ignore the profile’s additional rules. A generic did:vh resolver rejects an asset log by its unrecognised `method` value [S19, S20], so it fails closed rather than showing a different current state. A generic did:btco resolver finds no DID document on an anchoring sat, because the metadata of Originals inscriptions is an array of log entries, not a DID document (P9.17, P14.12); if the sat’s holder inscribes one there, a generic did:btco resolver returns it, and it MUST NOT be used for the Original (P3.8).

P3.6 A did:webvh is an alias of an Original only if its DID document points to the Original’s did:vh and the Original’s asset state lists the did:webvh. A verifier MUST NOT accept either direction alone. A did:webvh DID document MUST NOT be used to derive the Original’s state, resource versions, authority or ownership.

P3.7 The did:webvh alias log SHOULD be controlled by the author. Whoever controls it can stop it pointing to the did:vh, but cannot change the Original or make another log its history (P3.6).

P3.8 The DID document of an Original’s did:vh MUST be derived from the asset log as section 2 describes, and a resolver MUST derive the same document from the same log. A stored or served DID document for the did:vh, including a did:btco DID document inscribed on the anchoring sat, MUST NOT be used.

P3.9 (proposed) At every layer an Original has a DID that resolves to it (owner direction, 11 November 2026): its did:vh, from a copy of its log, a `src` location or a carried file (P7.11); on the web, its did:webvh alias (P3.6); on an EVM anchor chain, its did:evm alias (P14.18); on Bitcoin, its did:btco alias (P9.10). Every alias in the asset state MUST be a DID. Given any of these DIDs, a resolver applying this profile MUST read the asset log from that layer’s source, verify it under this profile, and return the Original’s did:vh with its state and report, or report why it cannot (P3.3, P3.5). This profile defines the did:evm method, and no generic resolver for it exists. A did:evm DID is an alias of an Original only if it names the token P14.19 derives for that Original and the log accepted on that token lists it; a verifier MUST NOT accept either alone. Its DID document is derived from the accepted log as P14.18 defines, and a stored or served document, including what the token’s `tokenURI` returns, MUST NOT be used (P3.8). A did:evm DID naming a token with no accepted anchoring publication resolves to nothing (P9.23). A did:evm DID naming a token the Original has left (P9.29) still resolves: the resolver MUST report that the Original has moved, name the alias that replaced it, and MUST NOT return the state on that token as current.

### Identity history and time

A verification method reference needs a specific identity state and its method-bound history evidence, not an unqualified fetch of today’s DID document. Exact identity versionId references reduce ambiguity, but they do not prove when an entry was signed. An attacker retaining a revoked key can reference an older valid identity version and claim an earlier timestamp.

Asset logs do not use VH [[ref: witnesses]] (P9.8). Off Bitcoin, on the local and web layers, an Original has claimed ordering only (P7.6), and recovery from key compromise is limited (section 5). Ordering evidence comes from Bitcoin: the block containing each inscription on the anchoring sat orders it, and its entries are checked against the author’s DID as it stood at that block (P9.15). Anyone who needs ordering evidence and an owner anchors the Original; the anchor’s uniqueness is not established and its ownership is provisional (P9.16), and while the anchoring sat carries its complete log (P9.17), its resource bytes, and the DID histories of any did:vh or did:webvh signers, stay off Bitcoin (P9.18). For an Original anchored on an EVM chain, ordering evidence comes from its token’s publications instead, and is described by that chain’s trust class (P9.20, P9.27).

Author DIDs may use any DID method with verifiable version history that the profile lists; the baseline lists did:vh, did:webvh and did:btco (P5.8). A did:btco author DID keeps its history on Bitcoin, so the author binding of an anchored Original by such an author needs no author DID host; one by a did:vh or did:webvh author also needs that author’s log from wherever it is hosted (P5.13). Either way, the Original’s whole log, including the entries before its anchor, is on the anchoring sat (P9.17). An unanchored Original gets no ordering evidence beyond its own log (D3).

::: issue Unresolved
How exact identity versions are packaged (D3).
:::

Sources: VH Log and did:vh pre-drafts [S2, S3]; SDK identity and layers [S12, S14].
