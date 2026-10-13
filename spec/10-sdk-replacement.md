## SDK replacement and legacy evidence

### Proposed replacement map

| Area | Retain | Replace or specify |
|---|---|---|
| OriginalsAsset | Resource semantics and lifecycle | VH transitions and author binding checks |
| OriginalsSDK | Create, load and export workflow | Profile selection and identity adapters |
| Envelope | Portable evidence boundary | New discriminator and VH payload |
| Resource helpers | Exact bytes and prior digest checks | Profile-specific descriptor encoding |
| StorageAdapter | Byte storage abstraction | Durable commit contract and diagnostics |
| Hosted adapters | Exact snapshot delivery | Dual CEL path and cel.json |
| Bitcoin adapters | Durable boundary and retry intent | CEL payloads and metadata format |
| Boop publish path | Local editing and public reader | localCelKeyStore and addResourceVersion |

This is a semantic mapping, not a final API diff. Existing callers may need explicit profile, identity-evidence or authorization arguments. Avoid new product concepts unless required by the VH/identity boundary. Removal includes active CEL imports, types, codecs, genesis/identifier derivation, replay verification, publication paths and tests that require CEL as the new protocol.

### Proposed legacy rules

P10.1 The new active SDK MUST NOT produce, append to, or depend on CEL histories. New envelopes MUST use an unambiguous new format discriminator and MUST NOT reinterpret old signatures as new-protocol signatures.

P10.2 Existing CEL archives MUST be preserved byte-for-byte. A separate, read-only legacy verifier outside the new active SDK may interpret them according to their original rules. Its result MUST identify the legacy protocol and evidence limits.

P10.3 A legacy-to-VH continuity claim MUST NOT be inferred merely because the same content, name or signing key appears in both. Any migration or cross-reference needs a separately reviewed transition design and explicit authorization.

P10.4 The new SDK MUST NOT automatically re-genesis old assets or erase redirects and continuity records. The re-genesis-without-redirect idea associated with Boop issue 286 [S11] is a proposal for review, not approved migration policy.

### Delivery sequence

1. Pin upstream pre-drafts and choose enough of the application profile to implement a local experimental slice with its provisional choices clearly identified.
2. Implement create, edit, export and fresh verification. Test without private keys in the reader and without network dependencies for a complete offline package.
3. Add identity rotation, deactivation, incomplete evidence and conflict tests. Keep unresolved freshness claims visible.
4. Replace the actual hosted and Boop publication paths, add witnesses for hosted Originals, and run exact-snapshot reader regressions.
5. Specify and implement the Bitcoin representation and durable-boundary tests. Design migration separately.

Sources: SDK map [S1, S4–S9]. Current SDK files were inspected across main, not as an atomic repository snapshot; pin and recheck them before implementation.
