## SDK replacement

This section is not normative. It maps the existing Originals SDK, at revision 00fc683, onto this profile.

### Replacement map

| Area | Retain | Replace or specify |
|---|---|---|
| OriginalsAsset and cel history | Resource semantics and lifecycle | VH transitions and author binding checks |
| OriginalsSDK and OriginalsSDK3 | Create, load and verify workflow | Profile selection and identity adapters |
| Envelope | Portable evidence boundary | New discriminator and VH payload |
| Resource helpers and cel history | Exact bytes and prior digest checks | Profile-specific descriptor encoding |
| StorageAdapter | Byte storage abstraction for hosting | Durable local commit contract and diagnostics |
| Hosted adapters | Exact snapshot delivery; did:webvh alias log beside the asset log | Separate Ed25519 signing of the did:webvh log; alias binding (P3.6) |
| Bitcoin adapters | Durable boundary, retry intent, one-way layer order, block-height gate, ownership snapshot | Current payloads and metadata format |

This is a semantic mapping, not a final API diff. Existing callers may need explicit profile, identity-evidence or authorization arguments. The SDK’s current history implementation is replaced whole, including its types, codecs, genesis/identifier derivation, replay verification, publication paths and tests.

### Deliberate departures from the SDK

This profile keeps the SDK’s behavior unless there is a reason not to. These are the places it does not:

| SDK at 00fc683 | This profile |
|---|---|
| An Original has a set of resources fixed at genesis | An Original has exactly one resource, with many versions (P4.1) |
| Resources are not inscribed | Each inscription carries a signed preview of the current resource version, or the version itself, as its body, and the log as its metadata (P9.17, P9.30) |
| Each Original is a CEL 3 log identified by `did:cel` | Each Original is a did:vh log under the Originals extension (section 3) |
| Each Original is controlled by its own `did:key` | The author signs with a key bound to their DID (P5.3) |
| Only the author signs | The author and editors it grants, each signing its own entries (P5.15–P5.18) |
| Concurrent edits are signed against the current head | An edit names its parent; a moved parent is a conflict (P4.5) |
| An unchanged digest still advances the version | It does not (P4.4) |
| Null is rejected; metadata is cleared with `{}` | An explicit null removes metadata (P4.6) |
| Create throws without a signer | Create can return an explicit unsigned draft (section 6) |
| Commits are in memory; persistence is the caller’s | Durable local commit (P6.2) |
| Anchoring requires web publication first | An Original can be anchored from local (P9.10, P9.16) |
| Ownership is reported as confirmed or not | Confirmation depth and index agreement are reported (P9.11) |

No Originals were issued under the CEL 3 format or earlier formats, so the SDK replaces them outright: there is no conversion, migration or legacy verification path ([D7](#d7)).

Sources: SDK map [S1, S4–S9, S12–S18]. SDK files are cited at revision 00fc683.
