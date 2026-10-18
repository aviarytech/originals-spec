## Local operations and transitions

The public SDK should retain the familiar create, edit and load workflow. Compatibility applies to useful semantics, not to preserving existing types or hiding a required protocol change. A new envelope discriminator, history engine and verifier are expected.

The SDK today queues concurrent edits and signs each against whatever head is current, so two edits made at once both apply. This draft deliberately does not: an edit names its parent and fails as a conflict if the parent has moved (P4.5, P6.4). The SDK also commits in memory and leaves persistence to the caller, which P6.2 replaces with a durable commit contract.

### Proposed operation contract

Create prepares the initial asset state, resource descriptors and genesis entry. The author signs it, the SDK verifies it and commits one valid initial checkpoint. It returns either a verified Original or an explicit unsigned [[ref: draft]]; these outcomes are different types or clearly distinguishable states.

Edit reads an exact verified parent, checks the fixed resourceID set, computes new descriptors, has the author sign the next VH entry and verifies it. The current pointer changes only after the signed entry and new bytes are durably stored. For the caller this is one step.

Packaging collects a selected verified checkpoint and its history into an evidence package. Load/import reconstructs and verifies evidence with no signing key requirement. A loaded Original is readable without becoming writable. Obtaining a signer is an explicit authority step, and eligibility to append is rechecked against the verified parent.

Deactivate is a VH entry signed by the author’s key that sets the VH deactivated parameter and produces a terminal state. Subsequent ordinary edits are rejected. Historical evidence is retained and readable where the selected upstream resolution and evidence policy permit it; this draft does not assume that every resolver already supports historical deactivated-state access.

### Proposed failure rules

P6.1 Preparation, signing and verification MUST complete before the current committed state changes. A signing rejection, timeout or invalid proof MUST leave the prior checkpoint unchanged. Staged bytes may remain for cleanup but MUST NOT appear as committed versions.

P6.2 Commit MUST be recoverable after interruption. Storage implementations MUST define how they persist the accepted history and bytes before advancing the current pointer, or provide an equivalent atomic boundary. An interrupted commit MUST NOT expose a checkpoint whose required local evidence was never committed.

P6.3 Drafts MUST be explicitly marked unsigned. The SDK MUST NOT package them as accepted history, count them as [[ref: resource versions]] or publish them as signed Originals.

P6.4 A retried operation MUST preserve its intended parent and signed entry. If the parent changed, the SDK MUST report a conflict and require a new candidate. An already accepted identical candidate SHOULD return its existing checkpoint without duplicating the transition.

P6.5 Deactivation MUST be expressed as VH deactivated: true, and the lifecycle status in the asset state MUST match it; a verifier MUST reject a mismatch in either direction. Deactivation MUST be terminal for new edits in the baseline profile, and a verifier MUST reject an update after an accepted deactivation. If the latest verified author DID is deactivated, the verifier MUST report an Original that is not anchored as non-current, and witnesses MUST refuse every further entry. For an anchored Original, author DID deactivation refuses entries inscribed after it and leaves the accepted state current (P9.15). Any future reactivation feature requires an explicit new profile and authorization policy.

P6.6 When the SDK detects two or more valid branches from the same accepted entry, it MUST show every branch to the author and MUST NOT choose one by timestamp. The author resolves the fork by appending an ordinary entry to the chosen branch whose signed state lists the first entry of each abandoned branch. A verifier MUST report those branches and their descendants as abandoned forks, never as current. If branches declare each other abandoned, the verifier MUST report an unresolved conflict. Declarations do not decide between anchoring entries (P9.16). For a witnessed Original, only a branch whose later entries carry witness proofs meeting the threshold can be current (P9.8), whatever the declarations say.

### Observable results

The SDK should expose the selected checkpoint, derived resource versions, verification status and actionable error category. Suggested categories are invalid evidence, incomplete evidence, unsupported profile, unauthorized key, author binding failure, stale parent, fork, deactivated asset and unavailable bytes. Concrete API names and error codes remain a compatibility review item.

VH entries carry whole-second versionTime values that strictly increase, so a log accepts at most one entry per second. The current SDK uses millisecond timestamps. VH-Log’s proposed rule for versionTime precision [S22] would let the extension allow finer values; whether to use it is open (D5).

Sources: OriginalsAsset, OriginalsSDK and envelope [S4, S6, S7]; SDK transitions [S12].
