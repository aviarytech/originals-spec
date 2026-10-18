## Decision register and source baseline

### Decisions

Choices marked **Decided** were taken in review on 15 October 2026; **Open** items still block an interoperable release.

D1 **Asset identifier and state shape.** Decided: each Original is a did:vh, `did:vh:<SCID>`, whose log is its asset log under the Originals did:vh extension [S19]; there is no separate DID log and no `did:cel`. Each entry’s state is the full asset state, and the DID document is derived, with a `#files` service built from the resource descriptors. The Original gains a did:webvh alias, its own small log bound in both directions, when published on the web, and a did:btco alias when anchored (section 3, P3.6–P3.8). Existing CEL 3 assets cannot be converted. Open: the asset state schema, the `originals` method values and the exact DID document derivation, exact-checkpoint resolution and deactivation history.

D2 **Author key binding and key policy.** The baseline is one author per Original, for its whole life, whose identity-bound key signs each VH entry directly, with no dedicated per-Original keypair. Pre-rotation is on the DID side, not the asset log. The author DID is the asset log’s controller [S25]: entries are signed by keys in the author DID’s Originals declaration, and rotation happens only in the author DID (section 5, P9.9). Decided: the author’s Originals key MUST be used only for Originals entries (P5.11). Open: key custody, and how the Originals declaration is encoded in the author DID. Collaborative editing depends on VH Log issue 5 and is deferred.

D3 **Historical identity and ordering.** Witnesses provide ordering for witnessed Originals (P9.8), declared in the author’s DID (P9.9). Decided: author DIDs may use any method with verifiable version history that the profile lists, and the baseline lists did:vh, did:webvh and did:btco, whose versions are inscriptions ordered by chain order (P5.8, P5.13); witnesses refuse entries unless they obtain author DID state no more than 60 seconds old (P9.8); unwitnessed Originals get no ordering evidence and remain claimed-ordering only (P7.6); witnesses, if any, end at the anchoring entry, and Bitcoin orders everything after it (P9.10, P9.13); an inscribed entry is checked against the author DID as it stood at its inscription time, so later rotation or author DID deactivation does not make an anchored Original non-current (P9.15). Open: how identity versions are packaged, how the witness declaration is encoded in the DID document, witness selection and independence governance, and the freshness policy verifiers apply (P7.8).

D4 **Entry state and package.** Decided: resource digests are SHA-256 multihashes, the only algorithm in the baseline set (P4.2); canonicalization is whatever the pinned VH Log version uses, and proofs use `eddsa-jcs-2022` or `bip340-jcs-2025`, permitted under VH-Log’s proposed rule for additional cryptosuites [S21] (P5.12). Open: entry state fields, asset log and witness file names, multibase encoding, envelope discriminator, completeness declaration and limits. Publish real test vectors only after those choices.

D5 **Operational edge cases.** Decided: an update that leaves a digest unchanged does not advance that resource’s version (P4.4); an explicit null removes metadata, and the name cannot be null (P4.6); the author resolves a fork by continuing one branch and declaring the others abandoned (P6.6). Open: atomic local commit and duplicate submission details, and whether to allow finer versionTime precision [S22].

D6 **Transport profiles.** Open: hosted discovery and relocation, Boop adapter changes, and the new Bitcoin representation, boundary, confirmations and reorganization policy. No final MIME type is selected here.

D7 **Later capabilities.** Decided: authorship never transfers. An Original anchors once, terminally, to one sat, from the local or the web layer, and one anchored from the local layer never gains a did:webvh alias; the sat’s holder is the owner, and transferring an Original means moving the sat. On Bitcoin a change needs the author’s signature and an inscription on the sat, so a sale freezes the Original unless author and owner cooperate (P9.10–P9.13). The first valid anchor in chain order wins, a witnessed branch takes precedence over an unwitnessed anchor, and an anchor without witness proofs from more than half its witnesses reports its uniqueness as not established (P9.16). Open: whether to add resource-set changes, encryption or recovery, and how VH evidence is carried across the local, web and Bitcoin layers. Migration from earlier formats remains out of scope and will be designed separately.

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
- [S9] SDK repository packages, including publication and Bitcoin paths. <https://github.com/onionoriginals/sdk/tree/00fc683d0aa7f746904a14fa1f88336f09711ff5/packages>
- [S10] Boop issue 232, what a stranger sees when verifying a published note. <https://github.com/aviarytech/boop/issues/232>
- [S11] Boop issue 286, author-present signing sessions and device keys. <https://github.com/aviarytech/boop/issues/286>
- [S12] SDK cel history.ts, state transitions, resource versions and layers. <https://github.com/onionoriginals/sdk/blob/00fc683d0aa7f746904a14fa1f88336f09711ff5/packages/cel/src/v3/history.ts>
- [S13] SDK cel profile.ts, value and schema rules. <https://github.com/onionoriginals/sdk/blob/00fc683d0aa7f746904a14fa1f88336f09711ff5/packages/cel/src/v3/profile.ts>
- [S14] SDK cel identity.ts, asset identifier derivation. <https://github.com/onionoriginals/sdk/blob/00fc683d0aa7f746904a14fa1f88336f09711ff5/packages/cel/src/v3/identity.ts>
- [S15] SDK cel publications.ts, Bitcoin resolution and ownership snapshots. <https://github.com/onionoriginals/sdk/blob/00fc683d0aa7f746904a14fa1f88336f09711ff5/packages/cel/src/v3/publications.ts>
- [S16] SDK OriginalsSDK3.ts, the full SDK with hosting and Bitcoin. <https://github.com/onionoriginals/sdk/blob/00fc683d0aa7f746904a14fa1f88336f09711ff5/packages/sdk/src/core/OriginalsSDK3.ts>
- [S17] SDK authority notes, originals-cel-v3-authority.md. Its identifier section predates the move to did:cel. <https://github.com/onionoriginals/sdk/blob/00fc683d0aa7f746904a14fa1f88336f09711ff5/specs/originals-cel-v3-authority.md>
- [S18] SDK inscription notes, btco-inscription-shape.md. Its identifier section predates the move to did:cel. <https://github.com/onionoriginals/sdk/blob/00fc683d0aa7f746904a14fa1f88336f09711ff5/specs/btco-inscription-shape.md>
- [S19] did:vh pull request 3, allow did:vh extensions. <https://github.com/swcurran/didvh/pull/3>
- [S20] VH-Log pull request 2, allow a specialisation to define an authoritative source. <https://github.com/swcurran/VH-Log/pull/2>
- [S21] VH-Log pull request 3, allow a specialisation to permit additional cryptosuites. <https://github.com/swcurran/VH-Log/pull/3>
- [S22] VH-Log pull request 8, let a specialisation define versionTime precision. <https://github.com/swcurran/VH-Log/pull/8>
- [S23] VH-Log pull request 9, allow a specialisation to define locations not reached over HTTPS. <https://github.com/swcurran/VH-Log/pull/9>
- [S24] VH-Log pull request 10, allow a specialisation to define another encoding for log entries. <https://github.com/swcurran/VH-Log/pull/10>
- [S25] VH-Log pull request 11, allow a specialisation to take authorized keys from a controller. <https://github.com/swcurran/VH-Log/pull/11>


::: note
Baseline note: 00fc683d0aa7f746904a14fa1f88336f09711ff5 is the SDK main revision, rechecked on 15 October 2026. Boop observations and issue references [S10, S11] are integration review inputs, pending an exact repository/revision pin. Upstream documents are pre-drafts, not finalized standards. This draft deliberately leaves the named decisions open.
:::

### Normative references

[[spec]]
