## Model and terminology

[[def: Original, Originals]]:
~ A logical asset with a stable identifier, a verifiable state history and exactly one resource, which can have many versions. Its content can be a photograph or a document (P4.1).

[[def: resource version, resource versions]]:
~ An exact byte sequence bound to a mediaType and cryptographic digest in verified asset history.

[[def: asset log]]:
~ The Original’s did:vh log under the Originals extension. It is the Original’s only history.

[[def: asset state]]:
~ The state recorded in full in each asset log entry: the Original’s name, metadata, lifecycle status, resource descriptor, aliases and editor grants, and, from its anchoring entry on, any preview of the version that an inscription carries (P9.30). It is not a DID document.

[[def: VH entry, VH entries]]:
~ Commits a state transition according to the selected VH profile.

[[def: checkpoint, checkpoints]]:
~ Identifies an exact verified prefix of that history.

[[def: draft, drafts]]:
~ A local, unsigned candidate change; it is never a verified resource version.

[[def: editor, editors]]:
~ An identity, other than the author or a member of the signer set, that a grant in the asset state, or a grant inherited from a parent Original, permits to change named content of the Original by signing its own entries ([P5.15](#p5.15), [P5.24](#p5.24)).

[[def: author entry, author entries]]:
~ An entry signed by the author, or, for a set Original, by at least the threshold of its authorizing set ([P5.20](#p5.20)). Only author entries can change grants, the signer set, aliases, lifecycle or parameters ([P5.16](#p5.16)).

[[def: editor entry, editor entries]]:
~ An entry signed by an editor, changing only the content its grant allows ([P5.16](#p5.16)).

[[def: anchoring entry, anchoring entries]]:
~ The signed entry that first adds a did:btco alias to the asset state, naming the anchoring sat ([P9.10](#p9.10)). The Original is anchored only once that entry is validly inscribed on that sat and confirmed there. A signed entry that is not inscribed does not anchor it ([P9.12](#p9.12)).

[[def: signer]]:
~ An identity that signs an entry: the author for an author entry, each member that signs an author entry of a set Original, or the named editor for an editor entry.

[[def: signer set]]:
~ The DIDs and threshold in a set Original's `authors` member, which take the place of a single author ([P5.19](#p5.19)).

[[def: set Original, set Originals]]:
~ An Original whose asset state has an `authors` member. Its `author` is an array naming each member who signed, and its author entries carry one proof per signer ([P5.19](#p5.19), [P5.22](#p5.22)).

[[def: authorizing set]]:
~ The signer set, with its threshold, that must sign an author entry of a set Original: the set in its parent entry's state, or the author alone if that state has none ([P5.20](#p5.20)).

[[def: parent Original, parent Originals]]:
~ An Original that another Original, its child, names in its `parent` member at genesis. The parent contributes editor grants only ([P5.24](#p5.24)).

[[def: pin, pins]]:
~ The versionId of the parent Original's log that a child entry names in `parent.versionId`; inherited grants are judged at it, and it never goes backwards ([P5.24](#p5.24)).

[[def: inherited grant, inherited grants]]:
~ A grant in a parent Original's `editors` at the version a child entry pins, which authorizes that child editor entry as a direct grant would ([P5.24](#p5.24)).

[[def: scope type, scope types]]:
~ The kind of restriction a grant's `scope` makes, which defines its members and how a verifier checks it, such as `paths` or `items` ([P5.28](#p5.28), [P5.29](#p5.29)).

[[def: path view]]:
~ A map from path to digest that a resource media type defines for its versions, against which a `paths` scope is checked ([P5.29](#p5.29)).

[[def: item view]]:
~ A map from item id to digest that a resource media type defines for its versions, against which an `items` scope is checked ([P5.29](#p5.29)).

[[def: updateKey, updateKeys]]:
~ A VH key, expressed as raw Multikey material, that may append the next entry to a log under the previous accepted entry’s rules. An asset log has none: its authorized keys come from the author DID ([P5.9](#p5.9)).

[[def: chain order]]:
~ The order of Bitcoin inscriptions by block height, then transaction index in the block, then inscription index in the transaction. On one sat it is the order in which the sat’s inscriptions were made.

[[def: witness, witnesses]]:
~ A VH witness that approves entries before they count as current. Originals asset logs do not use witnesses ([P9.8](#p9.8)); an author DID may still use its own DID method’s witnesses.

### Three authorities

Author identity is the identity making a change. Its verification method is authorized through the applicable DID verification relationship and method rules.

Log-control authority is the authority to append or modify VH history under the previous accepted entry’s rules. In plain VH it comes from updateKeys. A log signature alone does not establish author identity.

In the baseline profile these two authorities come from one place. The author DID is the asset log’s controller, and the author signs each author entry with a verification method of that DID. One signature therefore shows both who made the change and that it may be appended. A set Original divides them among several people: its signer set is the controller, and an author entry carries one signature from each member who signs, of which at least the threshold must come from the previous entry’s set (P5.19, P5.20).

Editing authority is narrower. The author can grant an [[ref: editor]] permission to change named content, and the editor then signs its own entries, without the author countersigning them. A grant gives no authority over grants, aliases, lifecycle, parameters, anchoring, deactivation or the author DID (P5.15–P5.18). A child Original also inherits the grants of its parent Original, judged at the version each entry pins, and a grant’s scope can narrow the resource changes it allows (P5.24, P5.28). Each entry names its [[ref: signer]], so the Original keeps its author while every change identifies who made it.

Storage and publication authority is permission to store bytes or publish a checkpoint. A host, storage adapter, wallet, inscription holder or sat owner does not gain asset-editing authority merely by performing that role. One actor may hold several roles, but verifiers evaluate each role separately.

Ownership is not an authority. Once an Original is anchored, its owner is whoever holds the anchoring sat (P9.11). Only the author, or an editor the author has granted, signs changes, for the Original’s whole life, but on Bitcoin a change also has to be inscribed on the sat, so after a sale neither a signer nor the owner can change the Original alone (P9.12).

### Proposed rules

P2.1 An accepted [[ref: Original]] MUST have one unambiguous history identity and an exact verified current [[ref: checkpoint]]. An implementation MUST NOT merge divergent valid histories by choosing the latest claimed timestamp.

P2.2 A committed asset change MUST be a valid [[ref: VH entry]] under the selected profile, signed by a key that the verifier confirms is an authorized verification method, at the version named in that entry, of the author or of an editor whose grant covers the change (P5.16). A key with no verified signer binding, or an editor key whose grant in the parent’s state does not cover the change, MUST NOT be treated as an authorized change.

P2.3 Every accepted state MUST preserve the association between the Original, its resource and the prior accepted checkpoint. Storage locations MUST be treated as retrieval hints, not substitutes for signed digest bindings.

### Conceptual state illustration

::: note Explanatory model
This is not a normative wire format or test vector.
:::

- Original identity → asset log checkpoint → asset state
- Application state → name, metadata, lifecycle, the resource descriptor, aliases, editor grants, and optionally a signer set and a parent Original with its pin
- Resource descriptor → mediaType, size, exact-byte digest
- VH entry → Original identity, parent entry, resulting application state, author identity reference, an editor reference for an editor entry, one proof by each signer’s key
- Evidence package → VH history, author identity evidence, resource bytes

The asset log’s state is the full asset state in every entry, not a delta and not a DID document (D1). The DID document for each version is derived, never stored: its `id` is the did:vh, its `controller` is the author DID, or the members of a signer set, its `alsoKnownAs` lists the aliases in the asset state, and its `#files` service is built from the resource descriptor. The asset itself is not placed in the DID document. Resource bytes are not in any state: they are files bound by the digests in their descriptors.

Sources: VH Log and did:vh state models [S2, S3]; current envelope and resource behavior [S4, S5].
