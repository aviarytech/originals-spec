## Decision register and source baseline

### Prioritized open decisions

D1 **Asset identifier and state shape.** Confirm the working preference for did:vh per Original with SDK-hidden complexity and continuous identity across layers. Retain generic VH plus discovery as an explicit alternative. Pin genesis binding, exact-checkpoint resolution, deactivation history and manifest representation.

D2 **Author key binding and key policy.** The baseline is one author per Original whose identity-bound key signs each VH entry directly, with no dedicated per-Original keypair. The controller is the author’s DID; prerotation is on the DID side, not the asset log. Key binding, rotation entries and the rotation procedure are proposed in section 5, and the DID-declared witness policy in P9.9. Remaining: key custody, whether to require a key used only for Originals, and a possible VH extension for DID-named log controllers. Collaborative editing depends on VH Log issue 5 and is deferred.

D3 **Historical identity and ordering.** Witnesses provide ordering for witnessed Originals (P9.8), declared in the author’s DID (P9.9). Select identity methods beyond did:vh, how identity versions are packaged, how the witness declaration is encoded in the DID document, witness selection and independence governance, the freshness bound witnesses and verifiers apply to author DID state, and whether unwitnessed Originals need any ordering evidence.

D4 **Entry state and package.** Pin canonicalization and proof suite consistently with the pinned VH Log version, entry state fields, the DID Core members allowed in state, manifest schema, digest representation, envelope discriminator, completeness declaration and limits. Publish real test vectors only after those choices.

D5 **Operational edge cases.** Specify atomic local commit, duplicate submission, conflict handling, how a user resolves a detected fork, explicit null/deletion and updates that leave a digest unchanged.

D6 **Transport profiles.** Specify hosted discovery and relocation, Boop adapter changes, and the new Bitcoin representation, boundary, confirmations and reorganization policy. No final MIME type is selected here.

D7 **Later capabilities.** Decide whether to add resource-set changes, encryption or recovery. Define what transferring an Original means, given that possession of the inscription confers no edit authority and the selling author keeps full control, and how an Original moves between layers under VH. Design legacy continuity and migration separately. None is implied by preserving the core edit workflow.

### Sources
- [S1] Originals SDK 4 guide, CEL 3 asset API (V3.md). <https://github.com/onionoriginals/sdk/blob/00fc683d0aa7f746904a14fa1f88336f09711ff5/packages/sdk/V3.md>
- [S2] Stephen Curran, VH Log pre-draft. <https://swcurran.github.io/VH-Log/next/> · source revision f2f9fda2d8dae26b717ab54163169350c7182233 at <https://github.com/swcurran/VH-Log/tree/f2f9fda2d8dae26b717ab54163169350c7182233>
- [S2a] VH Log issue 5, update authorization as a core feature. <https://github.com/swcurran/VH-Log/issues/5>
- [S3] Stephen Curran, did:vh pre-draft. <https://swcurran.github.io/didvh/next/> · source revision e0b7cbad27d7b2274057251f85687e133329b5a9 at <https://github.com/swcurran/didvh/tree/e0b7cbad27d7b2274057251f85687e133329b5a9>
- [S4] SDK envelope.ts, under packages/sdk/src/v3 at the SDK revision in [S1]. <https://github.com/onionoriginals/sdk/blob/00fc683d0aa7f746904a14fa1f88336f09711ff5/packages/sdk/src/v3/envelope.ts>
- [S5] SDK resources.ts, under packages/sdk/src/v3 at the SDK revision in [S1]. <https://github.com/onionoriginals/sdk/blob/00fc683d0aa7f746904a14fa1f88336f09711ff5/packages/sdk/src/v3/resources.ts>
- [S6] SDK OriginalsAsset.ts, under packages/sdk/src/v3 at the SDK revision in [S1]. <https://github.com/onionoriginals/sdk/blob/00fc683d0aa7f746904a14fa1f88336f09711ff5/packages/sdk/src/v3/OriginalsAsset.ts>
- [S7] SDK OriginalsSDK.ts, under packages/sdk/src/v3 at the SDK revision in [S1]. <https://github.com/onionoriginals/sdk/blob/00fc683d0aa7f746904a14fa1f88336f09711ff5/packages/sdk/src/v3/OriginalsSDK.ts>
- [S8] SDK storage/StorageAdapter.ts. <https://github.com/onionoriginals/sdk/blob/00fc683d0aa7f746904a14fa1f88336f09711ff5/packages/sdk/src/storage/StorageAdapter.ts>
- [S9] SDK repository publication and Bitcoin paths. <https://github.com/onionoriginals/sdk/tree/00fc683d0aa7f746904a14fa1f88336f09711ff5/packages/sdk/src>
- [S10] Boop issue 232, what a stranger sees when verifying a published note. <https://github.com/aviarytech/boop/issues/232>
- [S11] Boop issue 286, author-present signing sessions and device keys. <https://github.com/aviarytech/boop/issues/286>


::: note
Historical context only: an earlier VH/CEL draft at https://aviarytech.github.io/vhcel/. It is not the normative basis for retaining CEL in the new active design.

Baseline note: 00fc683d0aa7f746904a14fa1f88336f09711ff5 is the latest inspected SDK main revision; source reads were not atomic. Boop observations and issue references [S10, S11] are integration review inputs, pending an exact repository/revision pin. Upstream documents are pre-drafts, not finalized standards. This draft deliberately leaves the named decisions open.
:::

### Normative references

[[spec]]
