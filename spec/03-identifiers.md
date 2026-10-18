## Identifiers and resolution

Each Original has its own did:vh, used for resolution across private use, web publication and later layers, with identifier mechanics hidden by the SDK (D1). This draft assumes Bitcoin is the later layer, as in the existing SDK.

Author identity remains distinct from asset identity. An asset identifier does not authorize an author to edit it. The same Original, identifier and authenticated history should continue across layers.

### Decided: the Original is a did:vh

Each Original is a did:vh, `did:vh:<SCID>`, whose log is its [[ref: asset log]] under the Originals extension (section 1). The SCID is the asset log’s SCID; there is no separate DID log for the Original. Resource versions, authority and ownership are derived from the asset log and from Bitcoin, never from a DID document.

The Original gains aliases, listed in its asset state and in the derived `alsoKnownAs`:

- a did:webvh once it is published on the web. This is a small did:webvh log of its own that points to the did:vh, and its implicit `#files` service maps DID URLs such as `did:webvh:<SCID>:example.com/photo` to files at that host;
- a did:btco once it is anchored, naming the anchoring sat (P9.10). Once anchored, resolution should go through this alias.

The derived DID document of the did:vh carries a `#files` service built from the resource descriptors, so the did:vh can locate the Original’s files itself.

The SDK today identifies an Original by `did:cel` and keeps a CEL 3 log [S14, S12]. Those logs cannot be converted: their SCIDs and signatures differ. The VH-Log format applies to new Originals only.

### Proposed rules

P3.1 The asset identifier MUST bind to the correct genesis under the chosen profile. A verifier MUST reject identifier/genesis mismatch, including substitution of a different valid history at the same URL.

P3.2 Exact-checkpoint resolution MUST either return evidence for that checkpoint or report why it cannot. It MUST NOT silently substitute the latest checkpoint or resolve a different Original.

P3.3 A resolver MUST distinguish verified state, missing evidence, unsupported profile and invalid evidence. A successful HTTP request or a host’s claimed identifier MUST NOT count as successful verification.

P3.4 Publication URLs and redirects MUST NOT independently transfer author or log-control authority. Any continuity claim after relocation MUST be supported by the selected profile’s authenticated evidence.

P3.5 A successful generic VH Log, did:vh or did:webvh resolution MUST NOT be reported as Originals verification. Originals state MUST be derived only by a verifier that applies this profile, because generic resolvers ignore the profile’s additional rules. A generic did:vh resolver rejects an asset log by its unrecognised `method` value [S19, S20], so it fails closed rather than showing a different current state.

P3.6 A did:webvh is an alias of an Original only if its DID document points to the Original’s did:vh and the Original’s asset state lists the did:webvh. A verifier MUST NOT accept either direction alone. A did:webvh DID document MUST NOT be used to derive the Original’s state, resource versions, authority or ownership.

P3.7 The did:webvh alias log SHOULD be controlled by the author. Whoever controls it can stop it pointing to the did:vh, but cannot change the Original or make another log its history (P3.6).

P3.8 The DID document of an Original’s did:vh MUST be derived from the asset log as section 2 describes, and a resolver MUST derive the same document from the same log. A stored or served DID document for the did:vh MUST NOT be used.

### Identity history and time

A verification method reference needs a specific identity state and its method-bound history evidence, not an unqualified fetch of today’s DID document. Exact identity versionId references reduce ambiguity, but they do not prove when an entry was signed. An attacker retaining a revoked key can reference an older valid identity version and claim an earlier timestamp.

Ordering evidence comes from VH [[ref: witnesses]]. A witnessed Original’s entries are approved by witnesses that check the author’s latest DID state before approving (P9.8), so once a key’s removal reaches the witnesses, that key cannot add ordinary entries. The witness list itself is declared in the author’s DID (P9.9), so the asset key cannot change it. For an anchored Original, the block containing each inscription supplies that ordering, and its entries are checked against the author’s DID as it stood at that block (P9.15). An unwitnessed Original, such as one kept only on a device, has claimed ordering only (P7.6), and recovery from key compromise is limited (section 5).

Author DIDs may use any DID method with verifiable version history that the profile lists; the baseline lists did:vh and did:webvh (P5.8). An unwitnessed Original gets no ordering evidence beyond its own log (D3).

::: issue Unresolved
How exact identity versions are packaged, witness selection and independence, and the freshness bound verifiers apply (D3).
:::

Sources: VH Log and did:vh pre-drafts [S2, S3]; SDK identity and layers [S12, S14].
