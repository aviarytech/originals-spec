## Hosted publication and Bitcoin boundaries

### Hosted publication

The inspected SDK hosted path publishes a second, separate history alongside did:webvh. The new format has a single history. A host serves the selected VH profile and exact resource evidence; the public reader verifies the same checkpoint semantics as the local reader.

The Boop adapter needs its actual publishing path replaced: ordinary publication uses local per-asset Ed25519 signing rather than SDK publishToWeb. Replacing only publishToWeb leaves that signing path in place. The exact-snapshot public-reader requirement from Boop issue 232 [S10] remains a regression requirement.

### Proposed hosted rules

P9.1 A published snapshot MUST bind its manifest, history checkpoint and resource descriptors. The public reader MUST verify that exact snapshot and MUST NOT combine history from one checkpoint with metadata or bytes presented as another.

P9.2 A publish retry MUST resume or repeat the same intended snapshot. Uploading bytes, publishing a locator or changing an index MUST NOT create a new asset transition unless an explicit authorized transition is part of the operation.

P9.3 Host relocation and locator updates MUST preserve authenticated continuity under the chosen profile. Public delivery MUST use the new profile discriminator and MUST NOT relabel evidence in another format as VH.

### Bitcoin adapter

The current inscription encodings are replaced, not retained. The VH-based inscription representation, MIME type, metadata schema, size limits and locator rules are unresolved. This draft defines the boundary requirements without inventing a final encoding.

P9.4 A Bitcoin publication MUST identify the exact accepted checkpoint and content commitment it represents. Only a verified change beyond the prior durable published boundary may form the next delta. A pending or failed transaction MUST NOT advance that durable boundary.

P9.5 Forks, reorganizations and competing publications MUST be exposed explicitly. Confirmation policy and reorganization handling MUST be defined by the adapter; transaction observation alone MUST NOT be described as permanent finality.

P9.6 Transaction retries MUST distinguish rebroadcasting the same intended transaction from preparing a replacement. Asset edits MUST NOT be silently re-signed or rebased because a transaction is retried. A wallet or sat holder MUST NOT acquire author or VH update authority by possession alone. Transferring an inscription MUST NOT be presented as transferring the Original unless an accepted transfer entry names the new holder’s DID as recipient (P5.12).

P9.7 A host MUST serve resource bytes with their signed mediaType and MUST NOT let a valid signature override content-safety policy. Active content such as HTML or SVG MUST be served from an origin without user credentials, with content-type sniffing disabled and a restrictive content security policy, or rendered only in a sandbox. Any SDK consumer that renders resources or manifest strings, including desktop and mobile clients, MUST apply the same isolation and MUST escape names and metadata.

P9.8 A hosted Original MUST activate VH witnesses: at least three, with a threshold of at least two and less than the number of witnesses, so that one lost or censoring witness cannot block or approve entries alone. Before approving an entry, an Originals witness MUST, in addition to the VH witness obligations:

- verify the entry under this profile;
- obtain the author DID’s latest state at approval time, from sources independent of whoever submitted the entry, never from DID history supplied with it, and refuse the entry if it cannot obtain state no more than 60 seconds old;
- refuse an ordinary entry whose signing key that state does not list;
- refuse a rotation entry whose new key that state does not list;
- refuse every entry if that state is deactivated;
- for a transfer entry, also obtain the recipient DID’s latest state the same way, and refuse the entry if that state does not list the recipient key or is deactivated.

Once an Original’s log has activated witnesses, a verifier MUST NOT report any later entry as current without witness proofs meeting the threshold. Whether an Original is hosted is not verifiable, so this rule follows the log, not the deployment. Activating witnesses does not give earlier entries proven ordering (P7.6), and the SDK MUST confirm the log’s head with the author before activating them. Witness independence from the host is a governance requirement that resolvers cannot check (D3). The author DID of a witnessed Original SHOULD itself use its method’s witnesses or watchers.

P9.9 The witness list and threshold for an author’s Originals MUST be declared in the author’s DID document. An asset log’s witness parameter MUST equal the declaration in the author DID version that the entry references, or for a transfer entry the recipient DID version it references, and witnesses MUST refuse an entry that changes the witness parameter unless it equals the declaration in the author DID’s latest state. Once witnesses are active, an entry that sets the witness parameter to an empty object MUST be rejected. Changing an Original’s witnesses therefore requires the author DID’s own update keys, not the asset key.

::: warning Not authorized
No Bitcoin spending, activation, inscription or migration is authorized by this document. Hosted and Bitcoin implementation follow the local interoperability slice, with dedicated adapter tests.
:::

Sources: current SDK publication and Bitcoin paths [S7, S9]; Boop integration observations require repository-pinned confirmation before implementation.
