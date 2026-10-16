## Identifiers and resolution

Each Original has its own identifier, used for resolution across private use, web publication and later layers, with identifier mechanics hidden by the SDK (D1). This draft assumes Bitcoin is the later layer, as in the existing SDK.

Author identity remains distinct from asset identity. An asset identifier does not authorize an author to edit it. The same Original, identifier and authenticated history should continue across layers.

### Decided: a VH Log specialisation

Originals is a specialisation of VH Log. Each Original has its own identifier, derived from the SCID of its genesis entry, and one log whose state is the asset [[ref: manifest]]. A resolver returns that log, and the evidence needed to obtain an exact checkpoint.

Because the identifier is not a did:vh, this draft has to define its own resolution contract: identifier syntax, how the log is located, relocation, exact-checkpoint requests, result metadata, offline behavior and errors. A self-certifying identifier does not supply these automatically. Whether the identifier is itself a DID, under a method name of its own, is open (D1).

The SDK today identifies an Original by a `did:cel` identifier derived from its genesis, which never changes, and records `did:webvh` and `did:btco` identifiers as aliases when the Original moves up a layer [S14, S12]. This draft keeps that shape with a VH Log identifier as the stable one: the did:btco alias names the anchoring sat (P9.10).

### Proposed rules

P3.1 The asset identifier MUST bind to the correct genesis under the chosen profile. A verifier MUST reject identifier/genesis mismatch, including substitution of a different valid history at the same URL.

P3.2 Exact-checkpoint resolution MUST either return evidence for that checkpoint or report why it cannot. It MUST NOT silently substitute the latest checkpoint or resolve a different Original.

P3.3 A resolver MUST distinguish verified state, missing evidence, unsupported profile and invalid evidence. A successful HTTP request or a host’s claimed identifier MUST NOT count as successful verification.

P3.4 Publication URLs and redirects MUST NOT independently transfer author or log-control authority. Any continuity claim after relocation MUST be supported by the selected profile’s authenticated evidence.

P3.5 A successful generic VH Log resolution MUST NOT be reported as Originals verification. Originals state MUST be derived only by a verifier that applies this profile, because generic resolvers ignore the profile’s additional rules.

### Identity history and time

A verification method reference needs a specific identity state and its method-bound history evidence, not an unqualified fetch of today’s DID document. Exact identity versionId references reduce ambiguity, but they do not prove when an entry was signed. An attacker retaining a revoked key can reference an older valid identity version and claim an earlier timestamp.

Ordering evidence comes from VH [[ref: witnesses]]. A witnessed Original’s entries are approved by witnesses that check the author’s latest DID state before approving (P9.8), so once a key’s removal reaches the witnesses, that key cannot add ordinary entries. The witness list itself is declared in the author’s DID (P9.9), so the asset key cannot change it. An unwitnessed Original, such as one kept only on a device, has claimed ordering only (P7.6), and recovery from key compromise is limited (section 5).

Author DIDs may use any DID method with verifiable version history that the profile lists; the baseline lists did:vh and did:webvh (P5.8). An unwitnessed Original gets no ordering evidence beyond its own log (D3).

::: issue Unresolved
How exact identity versions are packaged, witness selection and independence, and the freshness bound verifiers apply (D3).
:::

Sources: VH Log and did:vh pre-drafts [S2, S3]; SDK identity and layers [S12, S14].
