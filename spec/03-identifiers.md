## Identifiers and resolution

Each Original has its own did:vh, used for resolution across private use, web publication and later layers, with identifier mechanics hidden by the SDK (D1). This draft assumes Bitcoin is the later layer, as in the existing SDK.

Author identity remains distinct from asset identity. An asset identifier does not authorize an author to edit it. The same Original, identifier and authenticated history should continue across layers.

### Decided: an asset log named by DIDs

Each Original has one [[ref: asset log]], a VH log specialised by this profile, whose state is the [[ref: asset state]]. The asset log is the Original’s only history: resource versions, authority and ownership are derived from it and from Bitcoin, never from a DID document.

The Original is named by DIDs, each with its own DID log:

- a did:vh from creation, which never changes;
- a did:webvh alias once it is published on the web, whose implicit `#files` service maps DID URLs such as `did:webvh:<SCID>:example.com/photo` to files at that host;
- a did:btco alias once it is anchored, naming the anchoring sat (P9.10).

Each DID document points to the asset log and resource files through `#files`, and lists the Original’s other DIDs in `alsoKnownAs`. The asset log’s signed state lists the same DIDs as aliases. Once anchored, resolution should go through the did:btco alias.

The SDK today has the same shape: an asset log identified by `did:cel`, with `did:webvh` and `did:btco` aliases recorded in its state, and a separate did:webvh log for hosting [S14, S12]. This draft names the Original with a did:vh instead of `did:cel`.

### Proposed rules

P3.1 The asset identifier MUST bind to the correct genesis under the chosen profile. A verifier MUST reject identifier/genesis mismatch, including substitution of a different valid history at the same URL.

P3.2 Exact-checkpoint resolution MUST either return evidence for that checkpoint or report why it cannot. It MUST NOT silently substitute the latest checkpoint or resolve a different Original.

P3.3 A resolver MUST distinguish verified state, missing evidence, unsupported profile and invalid evidence. A successful HTTP request or a host’s claimed identifier MUST NOT count as successful verification.

P3.4 Publication URLs and redirects MUST NOT independently transfer author or log-control authority. Any continuity claim after relocation MUST be supported by the selected profile’s authenticated evidence.

P3.5 A successful generic VH Log, did:vh or did:webvh resolution MUST NOT be reported as Originals verification. Originals state MUST be derived only by a verifier that applies this profile, because generic resolvers ignore the profile’s additional rules. For example, a generic VH Log resolver given a web copy of an anchored Original’s asset log can show an entry the author signed after a sale as current, although it was never inscribed (P9.12).

P3.6 A DID is an alias of an Original only if its DID document points to that Original’s asset log and the asset log’s signed state lists the DID. A verifier MUST NOT accept either direction alone. A DID document MUST NOT be used to derive the Original’s state, resource versions, authority or ownership.

P3.7 The DID logs of an Original’s did:vh and did:webvh SHOULD be controlled by the author. Whoever controls them can stop them pointing to the asset log, but cannot change the Original or make another log its history (P3.6).

### Identity history and time

A verification method reference needs a specific identity state and its method-bound history evidence, not an unqualified fetch of today’s DID document. Exact identity versionId references reduce ambiguity, but they do not prove when an entry was signed. An attacker retaining a revoked key can reference an older valid identity version and claim an earlier timestamp.

Ordering evidence comes from VH [[ref: witnesses]]. A witnessed Original’s entries are approved by witnesses that check the author’s latest DID state before approving (P9.8), so once a key’s removal reaches the witnesses, that key cannot add ordinary entries. The witness list itself is declared in the author’s DID (P9.9), so the asset key cannot change it. An unwitnessed Original, such as one kept only on a device, has claimed ordering only (P7.6), and recovery from key compromise is limited (section 5).

Author DIDs may use any DID method with verifiable version history that the profile lists; the baseline lists did:vh and did:webvh (P5.8). An unwitnessed Original gets no ordering evidence beyond its own log (D3).

::: issue Unresolved
How exact identity versions are packaged, witness selection and independence, and the freshness bound verifiers apply (D3).
:::

Sources: VH Log and did:vh pre-drafts [S2, S3]; SDK identity and layers [S12, S14].
