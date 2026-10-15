## Identifiers and resolution

Each Original has its own DID, used for resolution across private use, web publication and later layers, with identifier mechanics hidden by the SDK (D1). This draft assumes Bitcoin is the later layer, as in the existing SDK.

Author identity remains distinct from asset identity. An asset DID does not authorize an author to edit it. The same Original, identifier and authenticated history should continue across layers.

### Decided: did:vh specialization

Each Original has an asset did:vh identifier and one conforming DID-document history. The Originals profile specifies how an asset [[ref: manifest]] is represented or referenced without violating the method’s state constraints. A resolver returns the asset DID document and the evidence needed to obtain the exact manifest checkpoint.

This choice reuses DID resolution concepts, method validation and version selection. It needs profile work for manifest binding, discovery, resolution metadata and the relationship between the asset controller and author identities. An asset DID is not assumed to be a human or organizational author DID.

A generic VH history identifier with an Originals discovery profile was considered and not chosen. It would have needed its own resolution contract: identifier syntax, locator discovery, relocation, exact-checkpoint requests, result metadata, offline behavior and errors.

### Proposed rules

P3.1 The asset identifier MUST bind to the correct genesis under the chosen profile. A verifier MUST reject identifier/genesis mismatch, including substitution of a different valid history at the same URL.

P3.2 Exact-checkpoint resolution MUST either return evidence for that checkpoint or report why it cannot. It MUST NOT silently substitute the latest checkpoint or resolve a different Original.

P3.3 A resolver MUST distinguish verified state, missing evidence, unsupported profile and invalid evidence. A successful HTTP request or a host’s claimed identifier MUST NOT count as successful verification.

P3.4 Publication URLs and redirects MUST NOT independently transfer author or log-control authority. Any continuity claim after relocation MUST be supported by the selected profile’s authenticated evidence.

P3.5 A successful generic VH or did:vh resolution MUST NOT be reported as Originals verification. Originals state MUST be derived only by a verifier that applies this profile, because generic resolvers ignore the profile’s additional rules.

### Identity history and time

A verification method reference needs a specific identity state and its method-bound history evidence, not an unqualified fetch of today’s DID document. Exact identity versionId references reduce ambiguity, but they do not prove when an entry was signed. An attacker retaining a revoked key can reference an older valid identity version and claim an earlier timestamp.

Ordering evidence comes from VH [[ref: witnesses]]. A witnessed Original’s entries are approved by witnesses that check the author’s latest DID state before approving (P9.8), so once a key’s removal reaches the witnesses, that key cannot add ordinary entries. The witness list itself is declared in the author’s DID (P9.9), so the asset key cannot change it. An unwitnessed Original, such as one kept only on a device, has claimed ordering only (P7.6), and recovery from key compromise is limited (section 5).

Author DIDs may use any DID method with verifiable version history that the profile lists; the baseline lists did:vh and did:webvh (P5.8). An unwitnessed Original gets no ordering evidence beyond its own log (D3).

::: issue Unresolved
How exact identity versions are packaged, witness selection and independence, and the freshness bound verifiers apply (D3).
:::

Sources: did:vh and VH Log pre-drafts [S2, S3].
