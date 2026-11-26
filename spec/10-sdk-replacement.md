## SDK replacement

This section is not normative. It orders the work of replacing the existing Originals SDK, at revision 00fc683, with an implementation of this profile, and lists where the profile departs from that SDK.

### Build plan

The SDK’s history implementation is replaced whole, including its types, codecs, genesis and identifier derivation, replay verification, publication paths and tests. The plan below orders that work by rule, so that each component rests only on components above it, and names the SDK area at 00fc683 it replaces or keeps. It is a build order, not a conformance target: the release claims every rule at once (D21), and each step is done when its rules’ rows in section 12 pass and the published vectors reproduce (P14.26).

| Step | Component | Rules it implements | SDK area at 00fc683 |
|---|---|---|---|
| 1 | Byte-level codecs: JSON Lines, JCS, numbers, multihash digests, Multikeys, `eddsa-jcs-2022` proofs | P14.2, P14.3, P14.7, P14.8, P4.2, P5.12 | Replaces the cel codecs; keeps exact-byte resource helpers |
| 2 | Asset state and entry schema, limits and the method value | P14.1, P14.4–P14.6, P14.9, P14.13, P4.1–P4.6 | Replaces OriginalsAsset types and cel profile rules |
| 3 | Log entries, SCID and entry hashes, genesis parameters with `updateKeys` `[]`, the derived DID document | P3.1–P3.5, P3.8, P14.1, P14.27–P14.29 | Replaces cel identity and genesis derivation |
| 4 | Signer DID resolution adapters for did:webvh, did:vh and did:btco, and identity by SCID | P5.8, P5.13, P5.14 [S3, S26, S27] | New identity adapters |
| 5 | Author and editor authorization, grants, key removal and endorsement | P5.1–P5.11, P5.15–P5.18, P7.9, P7.20 | Replaces author-only signing |
| 6 | The evidence set and the verification report | P7.1–P7.10, P7.17–P7.23, P14.25 | Replaces replay verification and status reporting |
| 7 | Local operations: create, update, deactivate, forks and superseding, durable commit | P6.1–P6.9, P2.1 | Replaces OriginalsSDK create, load and in-memory commit |
| 8 | Bundles, manifests and carried logs | P7.11–P7.16, P8.1–P8.5, P14.10, P14.14–P14.17 | Replaces the envelope; keeps the portable evidence boundary |
| 9 | Hosting: the did:webvh alias, shared-host append, serving layout | P3.6, P3.7, P6.7, P6.8, P9.1–P9.9, P14.11 | Replaces hosted adapters; keeps StorageAdapter and exact-snapshot delivery |
| 10 | Bitcoin reading: ord 0.29.x rules, chain order, the network and the one-Original-per-sat binding | P9.10, P9.13, P9.31, P9.34, P3.9 | Replaces publications.ts resolution and holder snapshots |
| 11 | Bitcoin verification: publications in parts, resolved signer logs, head selection and the anchor | P9.11, P9.12, P9.15–P9.18, P9.32, P9.33, P9.35, P9.36 | Replaces Bitcoin verification |
| 12 | Bitcoin writing: inscription encoding, previews and the signed body mode, broadcasting and replacement | P9.14, P9.17, P9.30, P14.12, P9.6 | Replaces current payloads and metadata; keeps the durable boundary, retry intent and one-way layer order |
| 13 | Signing display and SDK diagnostics | P5.11, section 6 error categories | Extends the signer interface |

Existing callers may need explicit profile, identity-evidence or authorization arguments; this is a semantic plan, not a final API diff.

### Deliberate departures from the SDK

This profile keeps the SDK’s behavior unless there is a reason not to. These are the places it does not:

| SDK at 00fc683 | This profile |
|---|---|
| An Original has a set of resources fixed at genesis | An Original has exactly one resource, with many versions (P4.1) |
| Resources are not inscribed | Each inscription carries a signed preview of the current resource version, or the version itself, as its body, and the log as its metadata (P9.17, P9.30) |
| Each Original is a CEL 3 log identified by `did:cel` | Each Original is a `did:og` log, in the log format section 14 defines (section 3, P14.27–P14.29) |
| Each Original is controlled by its own `did:key` | The author signs with a key bound to their DID (P5.3) |
| Only the author signs | The author and editors it grants, each signing its own entries (P5.15–P5.18) |
| Concurrent edits are signed against the current head | An edit names its parent; a moved parent is a conflict (P4.5) |
| An unchanged digest still advances the version | It does not (P4.4) |
| Null is rejected; metadata is cleared with `{}` | An explicit null removes metadata (P4.6) |
| Create throws without a signer | Create can return an explicit unsigned draft (section 6) |
| Commits are in memory; persistence is the caller’s | Durable local commit (P6.2) |
| Anchoring requires web publication first | An Original can be anchored from local (P9.10, P9.16) |
| Ownership is reported as confirmed or not | The holder is reported with the confirmation depth, network, tip and index agreement it rests on, and as provisional unless an index of Originals inscriptions shows no competing anchor (P9.11, P9.16, P9.31) |

No Originals were issued under the CEL 3 format or earlier formats, so the SDK replaces them outright: there is no conversion, migration or legacy verification path ([D7](#d7)).

Sources: SDK map [S1, S4–S9, S12–S18]. SDK files are cited at revision 00fc683.
