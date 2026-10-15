## Decision register and source baseline

### Decisions

Choices marked **Decided** were taken in review on 15 October 2026; **Open** items still block an interoperable release.

D1 **Asset identifier and state shape.** Decided: each Original has its own did:vh, with SDK-hidden complexity and continuous identity across layers (section 3). A generic VH identifier with a discovery profile was not chosen. Open: genesis binding, exact-checkpoint resolution, deactivation history and manifest representation.

D2 **Author key binding and key policy.** The baseline is one author per Original at a time whose identity-bound key signs each VH entry directly, with no dedicated per-Original keypair. The controller is the author’s DID; prerotation is on the DID side, not the asset log. Key binding, rotation entries and the rotation procedure are proposed in section 5, and the DID-declared witness policy in P9.9. Decided: the author’s Originals key MUST be used only for Originals entries (P5.11). Open: key custody, and a possible VH extension for DID-named log controllers. Collaborative editing depends on VH Log issue 5 and is deferred.

D3 **Historical identity and ordering.** Witnesses provide ordering for witnessed Originals (P9.8), declared in the author’s DID (P9.9). Decided: author DIDs may use any method with verifiable version history that the profile lists, and the baseline lists did:vh and did:webvh (P5.8); witnesses refuse entries unless they obtain author DID state no more than 60 seconds old (P9.8); unwitnessed Originals get no ordering evidence and remain claimed-ordering only (P7.6). Open: how identity versions are packaged, how the witness declaration is encoded in the DID document, witness selection and independence governance, and the freshness policy verifiers apply (P7.8).

D4 **Entry state and package.** Decided: resource digests are SHA-256 multihashes, the only algorithm in the baseline set (P4.2); canonicalization and proof suite are whatever the pinned VH Log version uses, with no Originals-specific choice. A BIP340 Schnorr suite is wanted for alignment with the Bitcoin layer, but depends on VH Log supporting it and is a candidate upstream request. Open: entry state fields, the DID Core members allowed in state, manifest schema, multibase encoding, envelope discriminator, completeness declaration and limits. Publish real test vectors only after those choices.

D5 **Operational edge cases.** Decided: an update that leaves a digest unchanged does not advance that resource’s version (P4.4); an explicit null removes metadata, and the name cannot be null (P4.6); the author resolves a fork by continuing one branch and declaring the others abandoned (P6.6). Open: atomic local commit and duplicate submission details.

D6 **Transport profiles.** Open: hosted discovery and relocation, Boop adapter changes, and the new Bitcoin representation, boundary, confirmations and reorganization policy. No final MIME type is selected here.

D7 **Later capabilities.** Decided: transfer is a single author-signed entry naming the recipient’s DID and key (P5.12–P5.15); moving an inscription without one transfers nothing (P9.6). Open: how a transfer is made atomic with payment or an inscription move, whether to add resource-set changes, encryption or recovery, and how an Original moves between layers under VH. Migration from earlier formats remains out of scope and will be designed separately.

### Sources
- [S1] Originals SDK 4 guide (V3.md). <https://github.com/onionoriginals/sdk/blob/00fc683d0aa7f746904a14fa1f88336f09711ff5/packages/sdk/V3.md>
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
Baseline note: 00fc683d0aa7f746904a14fa1f88336f09711ff5 is the latest inspected SDK main revision; source reads were not atomic. Boop observations and issue references [S10, S11] are integration review inputs, pending an exact repository/revision pin. Upstream documents are pre-drafts, not finalized standards. This draft deliberately leaves the named decisions open.
:::

### Normative references

[[spec]]
