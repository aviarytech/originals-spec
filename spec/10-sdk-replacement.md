## SDK replacement

### Proposed replacement map

| Area | Retain | Replace or specify |
|---|---|---|
| OriginalsAsset and cel history | Resource semantics and lifecycle | VH transitions and author binding checks |
| OriginalsSDK and OriginalsSDK3 | Create, load and verify workflow | Profile selection and identity adapters |
| Envelope | Portable evidence boundary | New discriminator and VH payload |
| Resource helpers and cel history | Exact bytes and prior digest checks | Profile-specific descriptor encoding |
| StorageAdapter | Byte storage abstraction for hosting | Durable local commit contract and diagnostics |
| Hosted adapters | Exact snapshot delivery; did:webvh alias log beside the asset log | Separate Ed25519 signing of the did:webvh log; alias binding (P3.6) |
| Bitcoin adapters | Durable boundary, retry intent, web-then-Bitcoin order, block-height gate, ownership snapshot | Current payloads and metadata format |
| Boop publish path | Local editing and public reader | Per-asset local signing path |

This is a semantic mapping, not a final API diff. Existing callers may need explicit profile, identity-evidence or authorization arguments. Avoid new product concepts unless required by the VH/identity boundary. The current history implementation is removed, including its types, codecs, genesis/identifier derivation, replay verification, publication paths and tests.

### Deliberate departures from the SDK

The SDK is what exists, so this draft keeps its behavior unless there is a reason not to. These are the places it does not:

| SDK today | This draft |
|---|---|
| Each Original is a CEL 3 log identified by `did:cel` | Each Original is a did:vh log under the Originals extension (section 3) |
| Each Original is controlled by its own `did:key` | The author signs with a key bound to their DID, and witnesses check it (P5.3, P9.8) |
| Concurrent edits are signed against the current head | An edit names its parent; a moved parent is a conflict (P4.5) |
| An unchanged digest still advances the version | It does not (P4.4) |
| Null is rejected; metadata is cleared with `{}` | An explicit null removes metadata (P4.6) |
| Create throws without a signer | Create can return an explicit unsigned draft (section 6) |
| Commits are in memory; persistence is the caller’s | Durable local commit (P6.2) |
| Ownership is reported as confirmed or not | Confirmation depth and index agreement are reported (P9.11) |

Existing CEL 3 assets cannot be converted, because their SCIDs and signatures differ; the VH-Log format applies to new Originals only. Migration from earlier Originals formats is out of scope for this draft ([D7](#d7)).

### Delivery sequence

1. Pin upstream pre-drafts and choose enough of the application profile to implement a local experimental slice with its provisional choices clearly identified.
2. Implement create, edit, evidence packages and fresh verification. Test without private keys in the reader and without network dependencies for a complete offline package.
3. Add author DID key rotation, deactivation, incomplete evidence and conflict tests. Keep unresolved freshness claims visible.
4. Replace the actual hosted and Boop publication paths, add witnesses for hosted Originals, and run exact-snapshot reader regressions.
5. Specify and implement the Bitcoin representation and durable-boundary tests. Design migration separately.

Sources: SDK map [S1, S4–S9, S12–S18]. SDK files were checked at main revision 00fc683 on 15 October 2026.
