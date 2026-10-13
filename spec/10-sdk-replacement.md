## SDK replacement

### Proposed replacement map

| Area | Retain | Replace or specify |
|---|---|---|
| OriginalsAsset | Resource semantics and lifecycle | VH transitions and author binding checks |
| OriginalsSDK | Create, load and verify workflow | Profile selection and identity adapters |
| Envelope | Portable evidence boundary | New discriminator and VH payload |
| Resource helpers | Exact bytes and prior digest checks | Profile-specific descriptor encoding |
| StorageAdapter | Byte storage abstraction | Durable commit contract and diagnostics |
| Hosted adapters | Exact snapshot delivery | Second history and its file |
| Bitcoin adapters | Durable boundary and retry intent | Current payloads and metadata format |
| Boop publish path | Local editing and public reader | Per-asset local signing path |

This is a semantic mapping, not a final API diff. Existing callers may need explicit profile, identity-evidence or authorization arguments. Avoid new product concepts unless required by the VH/identity boundary. The current history implementation is removed, including its types, codecs, genesis/identifier derivation, replay verification, publication paths and tests.

Migration from earlier Originals formats is out of scope for this draft ([D7](#d7)).

### Delivery sequence

1. Pin upstream pre-drafts and choose enough of the application profile to implement a local experimental slice with its provisional choices clearly identified.
2. Implement create, edit, evidence packages and fresh verification. Test without private keys in the reader and without network dependencies for a complete offline package.
3. Add identity rotation, deactivation, incomplete evidence and conflict tests. Keep unresolved freshness claims visible.
4. Replace the actual hosted and Boop publication paths, add witnesses for hosted Originals, and run exact-snapshot reader regressions.
5. Specify and implement the Bitcoin representation and durable-boundary tests. Design migration separately.

Sources: SDK map [S1, S4–S9]. Current SDK files were inspected across main, not as an atomic repository snapshot; pin and recheck them before implementation.
