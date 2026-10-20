## Model and terminology

[[def: Original, Originals]]:
~ A logical asset with a stable identifier, a verifiable state history and a set of named resources. Its content can be a photograph, a document, or several related byte streams.

[[def: resourceID, resourceIDs]]:
~ Identifies one logical resource across revisions.

[[def: resource version, resource versions]]:
~ An exact byte sequence bound to a mediaType and cryptographic digest in verified asset history.

[[def: asset log]]:
~ The Original’s did:vh log under the Originals extension. It is the Original’s only history.

[[def: asset state]]:
~ The state recorded in full in each asset log entry: the Original’s name, metadata, lifecycle status, resource descriptors and aliases. It is not a DID document.

[[def: VH entry, VH entries]]:
~ Commits a state transition according to the selected VH profile.

[[def: checkpoint, checkpoints]]:
~ Identifies an exact verified prefix of that history.

[[def: draft, drafts]]:
~ A local, unsigned candidate change; it is never a verified resource version.

[[def: editor, editors]]:
~ An identity, other than the author, that a grant in the asset state permits to change named content of the Original by signing its own entries ([P5.15](#p5.15)).

[[def: author entry, author entries]]:
~ An entry signed by the author. Only author entries can change grants, aliases, lifecycle or parameters ([P5.16](#p5.16)).

[[def: editor entry, editor entries]]:
~ An entry signed by an editor, changing only the content its grant allows ([P5.16](#p5.16)).

[[def: signer]]:
~ The identity that signs an entry: the author for an author entry, or the named editor for an editor entry.

[[def: updateKey, updateKeys]]:
~ A VH key, expressed as raw Multikey material, that may append the next entry to a log under the previous accepted entry’s rules. An asset log has none: its authorized keys come from the author DID ([P5.9](#p5.9)).

[[def: chain order]]:
~ The order of Bitcoin inscriptions by block height, then transaction index in the block, then inscription index in the transaction. On one sat it is the order in which the sat’s inscriptions were made.

[[def: witness, witnesses]]:
~ A VH witness that approves entries before they count as current. Originals asset logs do not use witnesses ([P9.8](#p9.8)); an author DID may still use its own DID method’s witnesses.

### Three authorities

Author identity is the identity making a change. Its verification method is authorized through the applicable DID verification relationship and method rules.

Log-control authority is the authority to append or modify VH history under the previous accepted entry’s rules. In plain VH it comes from updateKeys. A log signature alone does not establish author identity.

In the baseline profile these two authorities come from one place. The author DID is the asset log’s controller, and the author signs each author entry with a verification method of that DID. One signature therefore shows both who made the change and that it may be appended.

Editing authority is narrower. The author can grant an [[ref: editor]] permission to change named content, and the editor then signs its own entries, without the author countersigning them. A grant gives no authority over grants, aliases, lifecycle, parameters, anchoring, deactivation or the author DID (P5.15–P5.18). Each entry names its [[ref: signer]], so the Original keeps its author while every change identifies who made it.

Storage and publication authority is permission to store bytes or publish a checkpoint. A host, storage adapter, wallet, inscription holder or sat owner does not gain asset-editing authority merely by performing that role. One actor may hold several roles, but verifiers evaluate each role separately.

Ownership is not an authority. Once an Original is anchored on Bitcoin, its owner is whoever holds the anchoring sat (P9.11). Only the author signs changes, for the Original’s whole life, but on Bitcoin a change also has to be inscribed on the sat, so after a sale neither the author nor the owner can change the Original alone (P9.12).

### Proposed rules

P2.1 An accepted [[ref: Original]] MUST have one unambiguous history identity and an exact verified current [[ref: checkpoint]]. An implementation MUST NOT merge divergent valid histories by choosing the latest claimed timestamp.

P2.2 A committed asset change MUST be a valid [[ref: VH entry]] under the selected profile, signed by a key that the verifier confirms is an authorized verification method, at the version named in that entry, of the author or of an editor whose grant covers the change (P5.16). A key with no verified author binding MUST NOT be treated as an authorized change.

P2.3 Every accepted state MUST preserve the association between the Original, its [[ref: resourceIDs]] and the prior accepted checkpoint. Storage locations MUST be treated as retrieval hints, not substitutes for signed digest bindings.

### Conceptual state illustration

::: note Explanatory model
This is not a normative wire format or test vector.
:::

- Original identity → asset log checkpoint → asset state
- Application state → name, metadata, lifecycle, named resource descriptors
- Resource descriptor → resourceID, mediaType, exact-byte digest
- VH entry → Original identity, parent entry, resulting application state, author identity reference, an editor reference for an editor entry, one proof by the signer’s key
- Evidence package → VH history, author identity evidence, resource bytes

The asset log’s state is the full asset state in every entry, not a delta and not a DID document (D1). The DID document for each version is derived, never stored: its `id` is the did:vh, its `controller` is the author DID, its `alsoKnownAs` lists the aliases in the asset state, and its `#files` service is built from the resource descriptors. The asset itself is not placed in the DID document. Resource bytes are not in any state: they are files bound by the digests in their descriptors.

Sources: VH Log and did:vh state models [S2, S3]; current envelope and resource behavior [S4, S5].
