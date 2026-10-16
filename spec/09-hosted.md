## Hosted publication and Bitcoin boundaries

### Hosted publication

The SDK hosted path publishes two histories: a did:webvh method log (`did.jsonl`) signed separately with Ed25519, and the asset’s own log (`cel.json`). The new format has a single history. A host serves the selected VH profile and exact resource evidence; the public reader verifies the same checkpoint semantics as the local reader.

The Boop adapter needs its actual publishing path replaced: ordinary publication uses local per-asset Ed25519 signing rather than SDK publishToWeb. Replacing only publishToWeb leaves that signing path in place. The exact-snapshot public-reader requirement from Boop issue 232 [S10] remains a regression requirement.

### Proposed hosted rules

P9.1 A published snapshot MUST bind its manifest, history checkpoint and resource descriptors. The public reader MUST verify that exact snapshot and MUST NOT combine history from one checkpoint with metadata or bytes presented as another.

P9.2 A publish retry MUST resume or repeat the same intended snapshot. Uploading bytes, publishing a locator or changing an index MUST NOT create a new asset transition unless an explicit authorized transition is part of the operation.

P9.3 Host relocation and locator updates MUST preserve authenticated continuity under the chosen profile. Public delivery MUST use the new profile discriminator and MUST NOT relabel evidence in another format as VH.

### Bitcoin adapter

The current inscription encodings are replaced, not retained. The VH-based inscription representation, MIME type, metadata schema, size limits and locator rules are unresolved. This draft defines the boundary requirements without inventing a final encoding.

P9.4 A Bitcoin publication MUST identify the exact accepted checkpoint and content commitment it represents. Only a verified change beyond the prior durable published boundary may form the next delta. A pending or failed transaction MUST NOT advance that durable boundary.

P9.5 Forks, reorganizations and competing publications MUST be exposed explicitly. Confirmation policy and reorganization handling MUST be defined by the adapter; transaction observation alone MUST NOT be described as permanent finality.

P9.6 Transaction retries MUST distinguish rebroadcasting the same intended transaction from preparing a replacement. Asset edits MUST NOT be silently re-signed or rebased because a transaction is retried. A wallet or sat holder MUST NOT acquire author or VH update authority by possession alone.

P9.7 A host MUST serve resource bytes with their signed mediaType and MUST NOT let a valid signature override content-safety policy. Active content such as HTML or SVG MUST be served from an origin without user credentials, with content-type sniffing disabled and a restrictive content security policy, or rendered only in a sandbox. Any SDK consumer that renders resources or manifest strings, including desktop and mobile clients, MUST apply the same isolation and MUST escape names and metadata.

P9.8 A hosted Original MUST activate VH witnesses: at least three, with a threshold of at least two and less than the number of witnesses, so that one lost or censoring witness cannot block or approve entries alone. Before approving an entry, an Originals witness MUST, in addition to the VH witness obligations:

- verify the entry under this profile;
- obtain the author DID’s latest state at approval time, from sources independent of whoever submitted the entry, never from DID history supplied with it, and refuse the entry if it cannot obtain state no more than 60 seconds old;
- refuse an ordinary entry whose signing key that state does not list;
- refuse a rotation entry whose new key that state does not list;
- refuse every entry if that state is deactivated.

Once an Original’s log has activated witnesses, a verifier MUST NOT report any later entry up to and including the anchoring entry (P9.10) as current without witness proofs meeting the threshold. Whether an Original is hosted is not verifiable, so this rule follows the log, not the deployment. Activating witnesses does not give earlier entries proven ordering (P7.6), and the SDK MUST confirm the log’s head with the author before activating them. Witness independence from the host is a governance requirement that resolvers cannot check (D3). The author DID of a witnessed Original SHOULD itself use its method’s witnesses or watchers.

P9.9 The witness list and threshold for an author’s Originals MUST be declared in the author’s DID document. An asset log’s witness parameter MUST equal the declaration in the author DID version that the entry references and witnesses MUST refuse an entry that changes the witness parameter unless it equals the declaration in the author DID’s latest state. Once witnesses are active, an entry that sets the witness parameter to an empty object MUST be rejected, except the anchoring entry, which MUST set it to an empty object (P9.10). Changing an Original’s witnesses therefore requires the author DID’s own update keys, not the asset key.

### Anchoring and ownership

Retained SDK behavior: an Original moves up through layers, from local to web to Bitcoin, one way only. Bitcoin is the last layer. Once an Original is anchored to a sat, its did:btco alias names that sat, and every later change is a reinscription on it.

An Original has one author for its whole life, and only the author signs changes. Ownership is separate: the owner is whoever holds the anchoring sat. On Bitcoin a change needs both: the author’s signature, and an inscription on the sat, which only its holder can make. After a sale the Original is frozen unless the author and the new owner cooperate. Selling or giving an Original means moving the sat, and needs nothing from the author.

P9.10 An Original MUST be published on the web layer before it is anchored, so that witnesses order its history up to the anchor. The author anchors it with a migrate entry, an ordinary entry under P5.10 whose signed state names one sat, inscribed on that sat. The migrate entry MUST set the witness parameter to an empty object: the current witnesses approve it as the last entry they witness, as VH requires, and Bitcoin has no witnesses after it. Anchoring MUST happen at most once and is terminal: a later entry that names a different sat, removes the sat or migrates to another layer MUST be rejected.

P9.11 The owner of an anchored Original is the current holder of its anchoring sat, as determined by the Bitcoin adapter under its confirmation policy (P9.5). An Original that is not anchored has no owner. Inscriptions of the same evidence on any other sat MUST NOT confer ownership. A verifier MUST report ownership separately from authorship, and MUST state the confirmation depth it relied on and whether more than one independent Bitcoin index agreed on the sat’s location.

P9.12 After anchoring, an entry MUST NOT be reported as current unless it is signed by the author under P5.3 and inscribed on the anchoring sat, extending the accepted head. This applies to every operation, including rotation and deactivation. An entry the author signs but that is not inscribed on the sat, and an inscription on the sat that the author did not sign, MUST NOT change the Original’s state. Holding the sat MUST NOT confer author or VH update authority, and transferring an Original MUST mean transferring the sat.

P9.13 A resolver MUST derive an anchored Original’s state by following, in inscription order on the anchoring sat, the publications that extend the accepted head, not by taking the newest inscription. Each accepted publication MUST be at a strictly greater block height than the one before it; among publications that extend the same head, the earliest in inscription order wins. Inscriptions that do not extend the head MUST be ignored and SHOULD be reported. For an anchored Original, inscription order on the sat takes the place of witness approval (P9.8); the author key checks of P7.9 still apply.

::: warning Not authorized
No Bitcoin spending, activation, inscription or migration is authorized by this document. Hosted and Bitcoin implementation follow the local interoperability slice, with dedicated adapter tests.
:::

Sources: current SDK publication and Bitcoin paths [S7, S9, S15, S16]; SDK authority and inscription notes [S17, S18]; Boop integration observations require repository-pinned confirmation before implementation.
