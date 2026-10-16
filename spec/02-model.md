## Model and terminology

[[def: Original, Originals]]:
~ A logical asset with a stable identifier, a verifiable state history and a set of named resources. Its content can be a photograph, a document, or several related byte streams.

[[def: resourceID, resourceIDs]]:
~ Identifies one logical resource across revisions.

[[def: resource version, resource versions]]:
~ An exact byte sequence bound to a mediaType and cryptographic digest in verified asset history.

[[def: manifest]]:
~ The application view of an Original’s current name, metadata, resource descriptors and lifecycle status.

[[def: VH entry, VH entries]]:
~ Commits a state transition according to the selected VH profile.

[[def: checkpoint, checkpoints]]:
~ Identifies an exact verified prefix of that history.

[[def: draft, drafts]]:
~ A local, unsigned candidate change; it is never a verified resource version.

[[def: updateKey, updateKeys]]:
~ A VH key, expressed as raw Multikey material, that may append the next entry to a log under the previous accepted entry’s rules.

[[def: witness, witnesses]]:
~ A VH witness that approves entries before they count as current. Originals witnesses also check the author’s latest DID state ([P9.8](#p9.8)).

### Three authorities

Author identity is the identity making a change. Its verification method is authorized through the applicable DID verification relationship and method rules.

Log-control authority is the authority to append or modify VH history under the previous accepted entry’s rules, including the applicable updateKeys. VH updateKeys are raw Multikey material. A log signature alone does not establish author identity.

In the baseline profile these two authorities are held by one key. The author signs each VH entry with a key that is both an active updateKey for the Original and a verification method of the author’s DID. One signature therefore shows both who made the change and that it may be appended.

Storage and publication authority is permission to store bytes or publish a checkpoint. A host, storage adapter, wallet, inscription holder or sat owner does not gain asset-editing authority merely by performing that role. One actor may hold several roles, but verifiers evaluate each role separately.

Ownership is not an authority. Once an Original is anchored on Bitcoin, its owner is whoever holds the anchoring sat (P9.11). Only the author signs changes, for the Original’s whole life, but on Bitcoin a change also has to be inscribed on the sat, so after a sale neither the author nor the owner can change the Original alone (P9.12).

### Proposed rules

P2.1 An accepted [[ref: Original]] MUST have one unambiguous history identity and an exact verified current [[ref: checkpoint]]. An implementation MUST NOT merge divergent valid histories by choosing the latest claimed timestamp.

P2.2 A committed asset change MUST be a valid [[ref: VH entry]] under the selected profile, signed by an active [[ref: updateKey]] that the verifier confirms is an authorized verification method of the author identity named in that entry. A raw update key with no verified author binding MUST NOT be treated as an authorized change.

P2.3 Every accepted state MUST preserve the association between the Original, its [[ref: resourceIDs]] and the prior accepted checkpoint. Storage locations MUST be treated as retrieval hints, not substitutes for signed digest bindings.

### Conceptual state illustration

::: note Explanatory model
This is not a normative wire format or test vector.
:::

- Original identity → VH checkpoint → full application state
- Application state → name, metadata, lifecycle, named resource descriptors
- Resource descriptor → resourceID, mediaType, exact-byte digest
- VH entry → Original identity, parent entry, resulting application state, author identity reference, one proof by the author’s key
- Evidence package → VH history, author identity evidence, resource bytes

Because Originals is a specialisation of VH Log (D1), the VH state is the asset manifest itself, not a DID document.

Sources: VH Log state model [S2]; current envelope and resource behavior [S4, S5].
