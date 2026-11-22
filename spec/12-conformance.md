## Conformance and negative tests

All requirements here are proposed. A conformance claim needs a named, pinned Originals profile plus the upstream VH and identity-method versions. “VH-based” alone is not an interoperable conformance target. Open profile choices are blockers to a release claim, not reasons to accept unverified evidence.

### Proposed minimum test matrix

The matrix has 390 rows, grouped by the section of the first rule each tests. Every row has:

- an **ID**, `T<section>-<number>`. IDs are stable: a row keeps its ID when rows are added or moved, a new row takes the next unused number in its section, and the number of a removed row is never reused. Fixtures and reports cite rows by ID;
- an **actor**: a *verifier* (including a resolver or reader), a *writer* (the part of the SDK that makes entries, packages, carriers and inscriptions), a *host* (P6.7, P9.7, P14.11) or the *SDK* as a whole, including its signing display and storage;
- a **given**: the input and preconditions. Unless the row says otherwise, the evidence set (P7.17) holds the complete log, the history of every signer DID that the log names, the bytes of every version, and, for an anchored Original or a did:btco signer, the genesis entry’s network, a tip, and the full inscription lists of the sats involved, read by indexes that agree on them (P9.31); it holds no prior result. A row states only how its input departs from that default;
- an **expected** result, in the vocabulary of P7.18 and P7.19 wherever it is a verification result. “Rejected” means the entry or publication is labelled `rejected` with the rule it fails; “accepted” means `accepted`. A result given as “A / B” pairs with a given of the form “X / Y”;
- the **rules** it tests. Every row cites at least one rule.

Rows that concern only the experimental additions are in their own document, with IDs of the form `A-<number>`.

#### Identifiers and aliases (§3)

| ID | Actor | Given | Expected | Rules |
|---|---|---|---|---|
| T3-001 | verifier | Wrong genesis or Original ID | `binding` `unbound`; `outcome` `invalid` | P3.1 |
| T3-002 | verifier | VH-valid log that fails Originals rules, read through a generic resolver | Not reported as Originals-verified | P3.5 |
| T3-003 | verifier | did:webvh whose document points to a `did:og` that does not list it | Not an alias; no Originals result through that did:webvh | P3.6 |
| T3-004 | verifier | Asset state lists a did:webvh whose document points elsewhere | Alias not confirmed; the `did:og` still verifiable directly | P3.6 |
| T3-005 | verifier | Served DID document for the `did:og` that differs from the one derived from the log | Ignored; the derived document is used | P3.8 |
| T3-006 | verifier | Derived DID document | Same for every resolver; `controller`, `alsoKnownAs` and `#files` match the author DID and asset state | P3.8, P14.9 |
| T3-007 | verifier | Generic VH-Log processor, or a resolver for did:vh, given a `did:og` log | Rejected by its unrecognised `method` value | P3.5, P14.1 |
| T3-008 | verifier | did:btco DID document inscribed on the anchoring sat by its holder | Ignored for the Original; a generic did:btco result is not reported as Originals verification | P3.5, P9.31 |
| T3-009 | verifier | The Original’s did:webvh alias moves to another host | Unanchored: handled as an alias change by an author entry (P3.6, P9.3). Anchored: a new did:webvh alias is rejected (P9.10). Author binding unaffected either way | P3.6, P9.3, P9.10 |
| T3-010 | verifier | Exact-checkpoint resolution of a checkpoint the resolver cannot supply | Reports why; the latest checkpoint is not substituted | P3.2 |
| T3-011 | verifier | Controller of the did:webvh alias log, not the author, changes its DID document to stop listing the `did:og` | The alias is no longer confirmed; the Original, its history and its `did:og` result are unchanged, and no other log becomes its history | P3.7, P3.6 |
| T3-012 | verifier | Resolver given an anchored Original’s did:webvh alias, or its did:btco alias | Reads the log from that layer’s source, verifies it under this profile and returns the `did:og` with its state and report, or reports why it cannot | P3.9, P3.3 |

#### The resource (§4)

| ID | Actor | Given | Expected | Rules |
|---|---|---|---|---|
| T4-001 | verifier | Byte changed at same URL | Digest failure; `availability` `partial`, listing that version with the mismatch as its reason; no verified resource result | P4.3, P4.2, P7.4, P2.3 |
| T4-002 | SDK | Caller changes version counter | Counter ignored or rejected; history-derived version retained | P4.4 |
| T4-003 | SDK | Stale parent or prior digest | Conflict; no silent rebase or commit | P4.5 |
| T4-004 | verifier | Entry whose state has no resource, or more than one | Rejected | P4.1, P14.5 |
| T4-005 | SDK | Metadata supplied, omitted or null | Replacement, unchanged or removed, respectively | P4.6 |
| T4-006 | verifier | Name set to null | Rejected | P4.6 |
| T4-007 | verifier | Update that leaves the resource’s digest and mediaType unchanged | Its version does not advance; `transitions` is empty | P4.4, P14.4 |
| T4-008 | verifier | Resource digest with an unlisted algorithm | Entry `rejected`; `history` `invalid`; an unlisted digest algorithm is invalid evidence, not an `unsupported` profile | P4.2, P14.7 |
| T4-009 | verifier | Update that changes only the resource’s `mediaType`, with the same `digest` and `size`, and a transition whose `from` and `to` are that digest | Accepted; a new version of the resource, and its version advances | P4.1, P4.4, P14.4, P14.6 |
| T4-010 | verifier | Update that changes only the resource’s `mediaType` with empty `transitions` | Rejected | P14.4, P14.6 |

#### Signing and authority (§5)

| ID | Actor | Given | Expected | Rules |
|---|---|---|---|---|
| T5-001 | verifier | Broken chain or reordered entry | `history` `invalid`; `outcome` `invalid`; no derived state beyond the failure | P5.5, P2.2 |
| T5-002 | verifier | Valid key of an identity other than the Original’s author DID, with no grant in the parent’s state covering the change | Entry `rejected`; identity alone grants no edit right | P5.4, P5.16, P5.17 |
| T5-003 | verifier | Valid VH entry, key not a method of the named signer DID (the author DID, or the editor DID for an editor entry) | Entry `rejected`; `identity` `failed`; VH validity cannot rescue it | P5.3, P5.4 |
| T5-004 | verifier | Wrong DID method binding or relationship | Entry `rejected`; `identity` `failed` | P5.3 |
| T5-005 | verifier | Entry that sets updateKeys or nextKeyHashes | Rejected | P5.10, P5.9 |
| T5-006 | verifier | Entry signed by a key the author DID added, with no asset log entry for the change | Accepted | P5.10 |
| T5-007 | verifier | Author key not under assertionMethod in the author DID | Entry `rejected`; `identity` `failed` | P5.3 |
| T5-008 | verifier | Author key that is also an updateKey of the author DID’s own log | Entry `rejected`; `identity` `failed` | P5.3 |
| T5-009 | verifier | Author DID versionId absent from signed state | Rejected | P5.1 |
| T5-010 | verifier | Verification method from another DID, with a different controller, or under authentication only | Entry `rejected`; `identity` `failed` | P5.3 |
| T5-011 | verifier | Key expressed as JWK or a different multikey encoding | Entry `rejected`; `identity` `failed` | P5.3, P14.8 |
| T5-012 | verifier | Later entry names a different author DID, or an older author DID version than the most recent earlier author entry | Rejected | P5.8 |
| T5-013 | verifier | Author DID using a method the profile does not list | Rejected | P5.8 |
| T5-014 | verifier | Anchored Original with a did:btco author DID, verified with no author DID host | Author binding checked against inscribed DID versions in chain order | P5.13 |
| T5-015 | verifier | did:btco author DID version inscribed after an Originals inscription in the same block | Not in effect for that inscription | P5.13 |
| T5-016 | verifier | Inscription on a did:btco author DID’s sat after its deactivation | Not a version; author DID remains deactivated | P5.13 |
| T5-017 | verifier | Two proofs in the proof array | Rejected | P5.2, P14.8 |
| T5-018 | verifier | Proof using a cryptosuite other than `eddsa-jcs-2022`, including `bip340-jcs-2025` | Rejected | P5.12, P14.8 |
| T5-019 | verifier | Entry whose state is a delta rather than the full asset state | Rejected | P5.1, P14.4 |
| T5-020 | verifier | Entry with duplicate JSON keys or an unsigned state field | Parse failure; entry `rejected`; no verified state | P5.7, P14.3, P14.4 |
| T5-021 | verifier | Inscribed entry naming a did:btco author DID version inscribed in a later block | Rejected; the version was not in effect | P5.13 |
| T5-022 | verifier | Inscribed entry naming a did:btco author DID version inscribed later in the same block | Rejected | P5.13 |
| T5-023 | verifier | Inscribed entry naming a did:btco author DID version inscribed earlier in the same block, whose key it holds | Accepted | P5.13 |
| T5-024 | verifier | Entry before the anchor naming a did:btco author DID version inscribed at or after the inscription that carries it | Rejected | P5.13 |
| T5-025 | verifier | Inscribed entry naming a preceding did:btco version whose key a later preceding version removed | Rejected; the key must hold in the latest preceding version | P5.13 |
| T5-026 | verifier | did:btco author DID inscription the index reports on a sat other than the one the DID names | Not a version of that DID | P5.13 |
| T5-027 | verifier | Editor entry without a grant that allows the resource, changing `body` | Rejected | P5.16, P9.30 |
| T5-028 | verifier | Entry before the anchoring entry signed with key K1 at did:btco author version v1, the author having rotated to K2 in v2 before the anchoring publication; anchoring entry signed with K2 naming v2 | Accepted | P5.13, P9.15 |
| T5-029 | verifier | Anchoring entry signed with K1 naming did:btco author version v1, K1 removed in v2 before the anchoring publication | Rejected | P5.13 |
| T5-030 | verifier | did:vh signer DID whose log `method` value is not a did:vh value the verifier implements, such as the VH-Log-based pre-draft’s | Not a did:vh signer log for this profile; identity evidence not established | P5.8 |
| T5-031 | verifier | Editor entry whose grant allows the resource, adding a version and naming its preview / editor entry that changes or removes the preview without a grant that allows the resource, or without changing the resource | Accepted / rejected | P5.16, P9.30 |
| T5-032 | verifier | Two editors with grants each sign an entry within their grant, on successive heads, with no author signature | Both accepted; author unchanged; each entry identifies its editor | P5.16 |
| T5-033 | verifier | Editor entry changing content outside its grant: the name, the metadata or the resource | Rejected | P5.16 |
| T5-034 | verifier | Editor entry that changes grants, aliases, lifecycle or parameters, anchors, or deactivates | Rejected | P5.16 |
| T5-035 | verifier | Editor entry whose author reference differs from its parent’s | Rejected | P5.16 |
| T5-036 | verifier | Editor entry whose parent’s state has no grant for that editor, including after revocation | Rejected | P5.17 |
| T5-037 | verifier | Editor’s earlier entries after its grant is revoked | Remain valid | P5.17 |
| T5-038 | verifier | Grant naming the author DID, a DID of the author’s identity, a duplicate editor or an unlisted DID method | Rejected | P5.15 |
| T5-039 | verifier | did:webvh author moved under DID portability, then rotated; new entry signed with the new key naming a version after the move | Accepted; entries before the move still verify against versions before it | P5.14 |
| T5-040 | writer, verifier | Moved author: package, import into a fresh reader, verify, then continue editing with the new key | Same result in the fresh reader; editing continues with authority | P5.14 |
| T5-041 | verifier | Moved author whose latest asset entry is an editor entry, read by a fresh reader with no package | Author freshness `not-established` unless the moved author log is found; not reported as currently authorized | P5.14, P7.8 |
| T5-042 | verifier | Verification method at a version after a move whose controller is the old DID | Entry `rejected`; `identity` `failed` | P5.3, P5.14 |
| T5-043 | verifier | Log with a different SCID whose `alsoKnownAs` lists the author DID | Not the author’s identity; entries signed with its keys rejected | P5.14 |
| T5-044 | verifier | Old author DID location redirecting to a new host | Redirect not followed; no continuity established | P5.14, P8.5, P3.4 |
| T5-045 | verifier | Author DID that changes DID method | Not continuity; entries naming the new DID’s keys rejected | P5.14 |
| T5-046 | verifier | Editor entry whose proof’s verificationMethod is the author’s, or whose operation is not update | Rejected | P5.2, P5.16 |
| T5-047 | verifier | Editor entry naming an older editor DID version than that editor’s previous entry | Rejected | P5.8, P5.18 |
| T5-048 | verifier | More grants than the profile limit | Rejected; `history` `limit-exceeded` | P5.15, P7.7 |
| T5-049 | verifier | Grant, before or after anchoring, naming the anchoring sat’s did:btco DID or the Original’s own `did:og` | Rejected | P5.15 |
| T5-050 | verifier | Inscription after the anchor naming a did:btco signer version not in that DID’s fully read history | Rejected | P5.13, P9.15 |
| T5-051 | verifier | Moved signer with no verified entry yet, whose latest entry names a location other than its earliest | Earliest entry’s location asked first; a log from either must verify from the identity’s genesis | P5.14 |
| T5-052 | verifier | did:btco inscription with a delegated or content-encoded body whose own metadata is a DID document for that DID | A version of that DID | P5.13 |
| T5-053 | verifier | did:btco inscription on the DID’s sat whose metadata the verifier has not read | History ends before it; an entry depending on it has `identity` `incomplete`, or is `unverifiable` if inscribed after the anchoring publication | P5.13, P9.15 |
| T5-054 | verifier | Grant naming the Original’s did:webvh alias | Rejected | P5.15 |
| T5-055 | SDK | Signer asked to sign input that is not a well-formed Originals entry, or without showing the signer, the Original, the operation and the resource changes | Refused | P5.11 |
| T5-056 | verifier | `editors` naming two did:webvh DIDs with the same SCID at different locations | Rejected | P5.15 |
| T5-057 | SDK | Signer shown an author entry that adds an editor or widens a grant | Before-and-after permission view, with the addition marked, before signing | P5.11 |
| T5-058 | SDK | Signer shown an author entry with `supersedes` | Entries and signers of each superseded branch shown before signing | P5.11, P6.9 |
| T5-059 | verifier | Entry signed by a did:btco or did:webvh signer with a secp256k1 verification method and a `bip340-jcs-2025` proof | Entry `rejected`; `identity` `failed` | P5.12, P14.8 |

#### Operations (§6)

| ID | Actor | Given | Expected | Rules |
|---|---|---|---|---|
| T6-001 | SDK | Signer rejects or returns invalid proof | No partial state commit | P6.1 |
| T6-002 | SDK | Interrupted local commit | Recover prior or fully committed checkpoint; no false success | P6.2 |
| T6-003 | SDK | Identical accepted retry | Existing result or explicit duplicate; no unintended extra version | P6.4 |
| T6-004 | verifier | Update after deactivation | Rejected; historical evidence retained | P6.5 |
| T6-005 | verifier | Divergent valid branches, settled neither on Bitcoin nor by `supersedes` | `state` `conflict`; every branch reported; no timestamp winner | P6.6, P6.9, P9.16, P2.1 |
| T6-006 | verifier | Lifecycle status deactivated without VH deactivated: true, or the reverse | Rejected | P6.5 |
| T6-007 | verifier | Deactivation on an unanchored branch, the author anchoring a sibling branch from before it first | The anchored branch is the Original’s history; the deactivation is not part of it | P6.5, P9.16 |
| T6-008 | verifier | Update whose parent descends from a deactivation | Rejected | P6.5 |
| T6-009 | verifier | Deactivation inscribed after the anchor, its parent naming a preview | Accepted carrying that preview, with it as the body, or carrying none, with the full version or no body as its `body` signs | P6.5, P9.17, P9.30 |
| T6-010 | host | Two submissions with the same parent at a shared host | One accepted; the other refused with a stale-parent conflict returning the new head; refused candidate kept by the SDK, not published | P6.7, P6.8 |
| T6-011 | host | Reconciled candidate signed by an authorized signer against the new head | Accepted | P6.8 |
| T6-012 | verifier | Host changes or re-signs a submitted entry | Fails verification, or is not by an authorized signer | P6.7 |
| T6-013 | host | Submission retried after a lost acknowledgement, including after the head has moved on | Existing checkpoint and current head returned; no second append and no conflict | P6.7 |
| T6-014 | verifier | Refused candidate published elsewhere | Unanchored: a fork with `state` `conflict` until anchoring, or until an author entry supersedes the refused branch if it holds only editor entries. Anchored: not `current`; `ignored` | P6.6, P6.8, P9.12, P9.13, P6.9 |
| T6-015 | verifier | Longer branch of a fork, or the branch with more signers | No winner; `state` `conflict` | P6.6 |
| T6-016 | verifier | Entry on one branch bringing in content from another | Accepted on its branch as a single-parent entry; fork remains | P6.6 |
| T6-017 | verifier | Evidence set with a prior result that reported a state, and a competing branch | `state` `conflict`, stated against the prior result; not silent | P6.6, P7.17 |
| T6-018 | verifier | Unanchored fork: editor-only branch from entry 3, author entry on the other branch naming its first entry in `supersedes` | Editor branch `conflicting`; `state` `valid-as-of` the author branch | P6.9 |
| T6-019 | verifier | Editor entry later extending a superseded branch | `conflicting` | P6.9 |
| T6-020 | verifier | `supersedes` naming a branch that holds an author entry | No settlement; `state` `conflict` | P6.6, P6.9 |
| T6-021 | verifier | `supersedes` naming an ancestor of the superseding entry, or an entry whose parent is not its ancestor | Author entry rejected | P6.9 |
| T6-022 | verifier | `supersedes` naming an entry not in the evidence set | No effect; author entry decided without it | P6.9 |
| T6-023 | verifier | Editor entry with a `supersedes` member | Rejected | P6.9, P14.4 |
| T6-024 | verifier | Superseding author entry labelled `key-removed-since` and not endorsed | Settles nothing; `state` `conflict` | P6.9 |
| T6-025 | verifier | Revoked editor forks again from an entry before the superseded branch | New `conflict` until superseded or anchored | P6.9 |
| T6-026 | SDK | Unsigned draft | Marked unsigned; never packaged as accepted history, counted as a resource version or published as a signed Original | P6.3 |

#### Evidence and verification (§7)

| ID | Actor | Given | Expected | Rules |
|---|---|---|---|---|
| T7-001 | writer, verifier | Fresh create, edit and package; then verify the complete package of a never-anchored Original with a did:vh or did:webvh author in a fresh reader process, with no private keys and without network dependencies | Same asset checkpoint and resource versions; `outcome` `verified`; `offline` `self-contained`; no private key in the reader | P7.1, P7.3, P7.21, P8.4, P8.5 |
| T7-002 | verifier | Missing historical resource bytes | `availability` `partial`, listing the missing versions; supplied bytes still checked | P7.4 |
| T7-003 | SDK | Import then edit without authority | Read succeeds where evidence valid; edit authorization fails | P7.5, P8.4 |
| T7-004 | verifier | Old valid prefix served as current | Reported with `state` `valid-as-of` its checkpoint, never `current` | P7.10, P2.1, P7.6 |
| T7-005 | verifier | Entry signed by a key removed from the author DID | Unanchored: labelled `key-removed-since`, ordering `claimed`, `authority` `historical` and the default acceptance check fails while no later author entry endorses it (P7.9, P7.20, P7.22). Anchored: an anchoring entry or later inscribed entry is rejected if the removal is inscribed on the anchoring sat, for did:vh or did:webvh, or on the DID’s sat, for did:btco, before the entry’s inscription; a removal not on Bitcoin does not affect it | P7.9, P7.20, P7.22, P9.15, P9.33, P5.13 |
| T7-006 | verifier | Anchored entry whose did:vh or did:webvh signer has, off Bitcoin, a newer version that removes its key, not inscribed on the sat before the entry | Accepted against the inscribed signer history; the verifier may warn of the newer version beside the result | P7.8, P9.15 |
| T7-007 | verifier | Any entry after the author DID is deactivated | Not anchored: deactivation reported; entries labelled `did-deactivated-since`, default acceptance check fails (P7.9, P7.20). Anchored: accepted state remains current; entries inscribed after Bitcoin evidences the deactivation rejected | P7.9, P7.20, P9.15 |
| T7-008 | verifier | Older author DID history served, with a newer version of that DID in the evidence set, such as one the verifier retained | The newer version is used; the report names its source | P7.8, P7.17 |
| T7-009 | SDK | Older prefix imported over a newer local history | Local current state not rolled back | P7.5 |
| T7-010 | verifier | History or identity history beyond profile limits | Last valid prefix reported with `history` `limit-exceeded`; never complete or `current` | P7.7 |
| T7-011 | SDK | Archive with a symbolic link, `..` path or duplicate entry | Rejected before extraction | P7.5 |
| T7-012 | verifier | Anchored Original whose resource versions not inscribed in full are unavailable | Log verified; `availability` `partial`, listing those versions; not a verification failure | P7.4, P9.18 |
| T7-013 | writer | Writer asked to make a carried file from a preview | Refused; a preview is not a resource version | P7.16, P9.30 |
| T7-014 | verifier | Editor entry signed with a key removed from the editor DID | Unanchored: labelled `key-removed-since`; fails the default acceptance check unless endorsed (P7.20). Anchored: rejected if the removal is inscribed on the anchoring sat, for a did:vh or did:webvh editor DID, or on the DID’s own sat, for a did:btco editor DID, before the entry’s inscription (P9.15, P9.33, P5.13); see P5.18 | P7.20, P9.15, P9.33, P5.13, P5.18, P7.19 |
| T7-015 | verifier | Editor entry after the author DID is deactivated | Unanchored: labelled `did-deactivated-since`; never passes the default acceptance check (P7.20). Anchored: rejected if Bitcoin evidences the author DID’s deactivation before its inscription, inscribed on the anchoring sat or, for a did:btco author DID, on its own sat | P7.20, P9.15, P5.18, P7.19 |
| T7-016 | verifier | Editor DID history missing for an editor entry | In the accepted state of an unanchored Original: the entry `unchecked`, `identity` `incomplete`, not reported as `current` (P7.1, P5.6). An inscription: rejected if the did:vh or did:webvh editor version it names is not inscribed on the sat; `unverifiable` only while a did:btco editor’s sat is unread | P7.1, P5.6, P9.15, P9.33, P7.19 |
| T7-017 | verifier | Unanchored Original with complete evidence and signer DID histories fetched moments ago | Reported `valid-as-of` its verified checkpoint, with each signer DID versionId and fetch time; never current or currently authorized | P7.10 |
| T7-018 | verifier | Signer DID log obtained from a location without support from that DID’s witnesses or watchers | Freshness `not-established`; the report states where and when it was obtained and that a newer version may exist | P7.8 |
| T7-019 | verifier | Signer DID log obtained at a location whose latest version’s `id` names another location | Not used as that identity’s latest | P7.8 |
| T7-020 | verifier | Signer DID log from the old host whose latest version moves the DID and removes a key | Removal applied; moved log sought; freshness `not-established` until found | P7.8, P5.14 |
| T7-021 | verifier | Carried file whose bytes, with the carrier removed, are the version its log’s last entry names, signer DIDs resolved | Log verified, version verified, `valid-as-of` that checkpoint; never current unless anchored | P7.12, P7.14 |
| T7-022 | verifier | Carried file whose remaining bytes differ by one byte, or by changed line endings | Bytes not verified; overall file verification fails with an explicit reason such as file digest mismatch, and verified proofs shown as detail do not make it a pass; MAY report the log it carries only with a statement that the file is not a version of that Original | P7.12 |
| T7-023 | verifier | Carried file opened or previewed without the caller’s opt-in to resolve | No DID resolved; proofs unchecked | P7.13, P8.5 |
| T7-024 | verifier | Carried file read offline, signer DID not resolvable | Entries `unchecked`; `identity` `incomplete`; log and version not reported as verified; never a pass | P7.13, P5.6 |
| T7-025 | verifier | Forged log naming a real author DID, appended to bytes matching its last descriptor | Proofs fail once the DID is resolved; offline, nothing reported as verified | P7.13 |
| T7-026 | verifier | Carried log whose last entry names a media type with a different carrier or comment syntax, or none | No valid carrier | P7.12, P14.14 |
| T7-027 | verifier | JSON member that is not the root object’s last, as after a tool reorders members | Found; its log verified and reported separately; the file not verified as a version, because removing a member that is not last is not yet defined | P7.12, P14.17 |
| T7-028 | verifier | JSON document whose root is an array, or has a root member named `originalLog` anywhere | Writer refuses | P7.15, P14.17 |
| T7-029 | verifier | Writer asked to carry a draft, a version other than the last entry’s, or, after anchoring, an entry not accepted on the anchor | Refused | P7.15 |
| T7-030 | verifier | Writer about to write a carrier | User told what the file discloses first; a JSON carrier says the data gains a member | P7.15 |
| T7-031 | SDK | Carried file presented by an SDK or UI | Never labelled an evidence package or complete | P7.11 |
| T7-032 | verifier | Carrier added or removed | No entry signed; the version is unchanged | P7.16 |
| T7-033 | SDK | Carried log older than the reader’s local history, or on another branch | Local history kept; a branch reported as a conflict | P7.14, P7.5 |
| T7-034 | verifier | Anchored Original whose carried log disagrees with its anchor | State from the anchor; the carried log is not preferred | P7.14, P9.13 |
| T7-035 | verifier | Anchored Original’s carried log read without access to the anchor | `bitcoin` `missing-evidence`; at most the entries before the anchoring entry, with `state` `historical-checkpoint`; the anchoring entry and later entries `unchecked` | P7.14, P3.3, P9.15, P7.19 |
| T7-036 | verifier | Carried log that holds no anchoring entry | `state` `valid-as-of` its last entry; no statement about later anchoring | P7.14, P7.18 |
| T7-037 | writer | Writer asked to inscribe a carried file as a body | The carrier is removed first; the body is the version’s bytes | P7.16, P9.17 |
| T7-038 | writer | Writer making a carried file from the body and entries of an accepted inscription whose body is the full version | Allowed, as for any accepted checkpoint | P7.16, P7.15 |
| T7-039 | verifier | Complete evidence package of an anchored Original, read without access to the anchor | `bitcoin` `missing-evidence`; at most the entries before the first anchoring entry, with `state` `historical-checkpoint`; the package not preferred to the anchor | P7.1, P7.14, P7.18 |
| T7-040 | verifier | Complete evidence package of an Original with a did:btco signer, read offline | That signer’s history is not in the package; `identity` `incomplete` and `offline` `needs-external` until it is read from Bitcoin | P7.1, P14.10, P5.6, P7.21 |
| T7-041 | verifier | Carried file imported, then read again with no separate opt-in to resolve | No resolver request; the import is not an opt-in | P7.13 |
| T7-042 | verifier | Carried file read with the caller’s opt-in to resolve, then read again without one | The first read resolves; the second makes no resolver request | P7.13 |
| T7-043 | verifier | Caller’s opt-in recorded as a standing or default setting for carried files | Not an opt-in; each read needs its own | P7.13 |
| T7-044 | verifier | Carried checkpoint from before the anchoring entry of an Original that is now anchored | Allowed; reported with `state` `valid-as-of` that checkpoint, with no statement about current anchoring | P7.14, P7.15, P7.18 |
| T7-045 | verifier | Same evidence set verified twice, by one verifier or by two | Identical reports | P7.17 |
| T7-046 | verifier | Same log verified with and without a retained newer signer DID version supplied in the evidence set | Two reports, each identifying its evidence set; only the one with the newer version uses it | P7.8, P7.17 |
| T7-047 | verifier | Verifier with network access verifying an evidence set that lacks a signer DID history | Report over that evidence set: `identity` `incomplete`; it does not fetch silently | P7.17 |
| T7-048 | verifier | Report omitting an applicable axis, or using a value outside its list | Not conforming | P7.18, P7.23 |
| T7-049 | verifier | Unanchored Original, author key K1 removed, later author entry signed with K2 | Entries signed with K1 `endorsed`; `authority` `current`; default acceptance check passes | P7.20, P7.22, P5.9 |
| T7-050 | verifier | Unanchored Original, author key K1 removed, no later author entry | Last K1 entries `key-removed-since`, not endorsed; `authority` `historical`; default check fails; history still `valid` | P7.20 |
| T7-051 | verifier | Unanchored Original whose editor’s key was removed from the editor DID, followed by an author entry with a current key | Editor entry `endorsed`; default check passes | P7.20 |
| T7-052 | verifier | Host given an editor entry extending an entry that is neither `current-key` nor endorsed | Refused | P7.20 |
| T7-053 | verifier | Host given a `current-key` author entry extending such an entry | Accepted; it endorses it | P7.20 |
| T7-054 | verifier | Complete package, all entries `accepted`, bytes of one version missing | Default check passes; `availability` `partial` | P7.22 |
| T7-055 | verifier | Transfer check with one inscription on the anchoring sat `unverifiable` | Fails; default check passes with the inscription listed | P7.22 |
| T7-056 | verifier | Transfer check with a conflicting anchor reported | Fails | P7.22 |
| T7-057 | SDK | Application showing a single “verified” for `outcome` `verified` with `authority` `historical` | Not conforming | P7.22 |
| T7-058 | verifier | Complete package of a never-anchored Original with a did:webvh author, signer history included, network disabled | `offline` `self-contained`; `outcome` `verified` | P7.21, P8.5 |
| T7-059 | verifier | Complete package of a never-anchored Original with a did:btco author | `offline` `needs-external`, listing the author’s sat; not verified offline | P7.21, P8.5 |
| T7-060 | verifier | Complete package of an anchored Original | `offline` `needs-external`, listing the anchoring sat | P7.21 |
| T7-061 | writer | Writer asked to package an entry it has re-serialised, normalised or given another envelope discriminator | Never presented as preserving the entry’s signature; the package holds the signed bytes, or the entry is reported as not the signed one | P7.2 |
| T7-062 | SDK | Archive with an entry whose name is an absolute path | Rejected before extraction | P7.5, P14.10 |
| T7-063 | SDK | Archive of 20,000 / 20,001 entries | Imported, if otherwise valid / rejected before extraction | P7.5, P14.10 |
| T7-064 | SDK | Archive whose entries total 512 MiB / more than 512 MiB | Imported, if otherwise valid / rejected before extraction | P7.5, P14.10 |

#### Private use and fetching (§8)

| ID | Actor | Given | Expected | Rules |
|---|---|---|---|---|
| T8-001 | verifier | Log file larger than the profile cap | Fetch refused, with the cap as its reason; nothing from that file enters the evidence set | P8.5, P14.13 |
| T8-002 | verifier | Locator resolving or redirecting to a private address | Fetch refused, with the reason; nothing from that address enters the evidence set | P8.5 |
| T8-003 | SDK | Plaintext metadata, base64 content or raw storage | Never labelled encrypted | P8.2 |
| T8-004 | SDK | SDK about to share or publish an evidence package for the first time | Identifies the evidence and content included, and warns about embedded metadata such as EXIF location and device identifiers, before it is shared | P8.3 |
| T8-005 | SDK | Storage adapter returning, with a success status, bytes that differ from the signed descriptor, or reporting success for a write that failed | Bytes not treated as verified; digest failure or failed write surfaced; the success response certifies nothing | P8.1 |
| T8-006 | SDK | Later metadata correction of an Original whose history has been shared | Never described as removing a secret from the history already distributed | P8.3 |
| T8-007 | verifier | Locator whose host is an IP literal | Fetch refused | P8.5 |
| T8-008 | verifier | Locator whose host resolves to a public address when checked and a private address when connecting | Fetch refused; the fetcher connects only to the address it validated | P8.5 |
| T8-009 | verifier | Locator with percent-encoded segments, such as `%2e%2e` | Decoded before the checks; refused if the decoded locator fails them | P8.5 |
| T8-010 | verifier | Fetch that takes 15 seconds / more than 15 seconds | Completed / abandoned, with the time limit as its reason | P8.5, P14.13 |
| T8-011 | verifier | Fetched resource of 64 MiB / 64 MiB plus one byte | Fetched / refused, with the cap as its reason | P8.5, P14.13 |
| T8-012 | verifier | Fetched log file of 16 MiB / 16 MiB plus one byte | Fetched / refused, with the cap as its reason | P8.5, P14.13 |

#### Hosting and Bitcoin (§9)

| ID | Actor | Given | Expected | Rules |
|---|---|---|---|---|
| T9-001 | verifier | Old identity version with claimed old time | Unanchored: ordering unproven; no timestamp-only acceptance. Anchored: checked against the author DID state that Bitcoin evidences at the inscription, never by its claimed time | P9.15, P9.33 |
| T9-002 | verifier | Missing identity history for an entry the accepted state depends on | `identity` `incomplete`; no blanket verified result. For an inscription after the anchor: rejected if it names a did:vh or did:webvh version not inscribed on the sat; `unverifiable` only while a did:btco signer’s sat is unread | P9.15 |
| T9-003 | verifier | Hosted mixed snapshot | Rejected before public result is marked verified | P9.1 |
| T9-004 | verifier | Anchoring sat moved to a new holder | The new holder reported as the Original’s holder; author unchanged | P9.11 |
| T9-005 | verifier | After anchoring, author-signed entry not inscribed on the sat | `ignored`; not part of the `current` state | P9.12, P7.19 |
| T9-006 | verifier | Inscription on the anchoring sat signed by neither the author nor an editor whose grant covers the change, including one by the holder | Rejected; state unchanged | P9.12, P9.15 |
| T9-007 | verifier | Author-signed entry inscribed by the holder | Accepted | P9.12 |
| T9-008 | verifier | Entry after anchoring that removes or changes the did:btco alias, or adds another | Rejected | P9.10 |
| T9-009 | verifier | Newer inscription on the sat that does not extend the head | `ignored`; state follows the authenticated chain | P9.13, P7.19 |
| T9-010 | verifier | Same evidence inscribed on a different sat | Does not make anyone the Original’s holder | P9.11 |
| T9-011 | verifier | Anchoring an Original from the local or web layer | Accepted; entries before the anchoring entry `existed-by-block`, their order among themselves claimed only; holder `provisional` unless an index shows uniqueness | P9.10, P9.16, P7.19 |
| T9-012 | verifier | Entry after anchoring that adds a did:webvh alias when the anchoring entry’s state listed none | Rejected | P9.10 |
| T9-013 | verifier | Two valid anchoring entries for one Original on different sats | The first in chain order is the anchor; the other and its descendants are a conflicting anchor, not current, and make no one the holder | P9.16 |
| T9-014 | verifier | Anchoring entry inscribed on a sat other than the one it names | Not an anchor | P9.10 |
| T9-015 | verifier | Publication that is not later in chain order than the previous accepted publication, comparing their final inscriptions | Not accepted | P9.13 |
| T9-016 | SDK | Bitcoin failure, retry or reorganization | Durable boundary follows adapter policy, not pending intent | P9.5, P9.6, P9.4 |
| T9-017 | verifier | Accepted anchored entry whose key the author DID later removes | Remains current | P9.15 |
| T9-018 | verifier | Author DID deactivated after an Original is anchored | Accepted state remains current; entries inscribed after Bitcoin evidences the deactivation rejected | P9.15 |
| T9-019 | verifier | Anchored entry naming a did:vh or did:webvh author DID version not inscribed on the anchoring sat through its publication | Rejected, not `unverifiable` | P9.15, P9.33 |
| T9-020 | verifier | Block whose timestamp is earlier than an ancestor’s | No effect; block timestamps do not order or check inscribed entries, chain order does | P9.13, P9.15 |
| T9-021 | verifier | did:vh or did:webvh author DID version published off Bitcoin with a versionTime before an already accepted inscription it would reject | No effect on acceptance; versionTime does not order inscribed entries | P9.15 |
| T9-022 | verifier | Asset log entry that sets the witness parameter to anything other than an empty object | Rejected | P9.9, P9.8 |
| T9-023 | verifier | Anchoring entry naming the author DID’s own did:btco sat | Rejected | P9.10, P5.13 |
| T9-024 | verifier | Anchored Original whose did:vh or did:webvh author DID host is unavailable | Identity evidence complete from the signer history inscribed on the anchoring sat; no author DID host needed | P9.18, P9.33 |
| T9-025 | verifier | Inscription carrying a compact delta | Rejected in the baseline profile, which defines no compact encoding (P9.17); under a profile that defines one, decoded to the full entry and checked over it | P9.17, P9.14 |
| T9-026 | host | SVG resource containing script, or a name containing markup | Not executed on the platform origin or in a client | P9.7 |
| T9-027 | verifier | Entry inscribed on a sat whose did:btco alias its asset state does not list | Not an anchoring entry; ignored and reported | P9.10 |
| T9-028 | verifier | Inscription on the anchoring sat without the `og` metaprotocol, such as a did:btco DID document | Not an Originals inscription; ignored for the Original | P9.31, P14.12 |
| T9-029 | verifier | Publication other than the anchoring publication carrying more than one entry | Rejected | P9.17 |
| T9-030 | verifier | Anchored Original whose evidence set is exactly the one P9.18 names: a network, a tip, and the full inscription lists of the anchoring sat and of each did:btco signer’s sat, read by agreeing indexes; no copy of the log, no signer DID host and no resource bytes | `outcome` `verified`; `bitcoin` `anchored`; the complete log and every signer’s identity verified from those inscriptions; `availability` as the inscribed bodies allow | P9.18, P9.17, P9.33, P9.31 |
| T9-031 | verifier | Copy of the log that differs from the entries inscribed on the anchoring sat | Ignored; the sat’s entries are the log | P9.17 |
| T9-032 | verifier | Anchoring sat whose inscriptions cannot be read in full | Resolution fails; `bitcoin` `missing-evidence`; `outcome` `incomplete` | P9.17, P3.3 |
| T9-033 | verifier | Inscription with no confirmations | Reported as observed; not in the accepted log | P9.5 |
| T9-034 | verifier | Reorganization that removes an accepted inscription | Reported with `authoritative-source-changed`; not silent | P9.5 |
| T9-035 | verifier | Anchored Original read from Bitcoin alone, its newest accepted inscription carrying the full version | Current version’s bytes read from that inscription’s body and checked against its descriptor | P9.17, P9.18 |
| T9-036 | verifier | Anchored entry naming an inscribed did:vh or did:webvh author DID version that lists its key, when a later version inscribed on the sat before the entry removed it | Rejected; the key must hold in the latest inscribed version | P9.15 |
| T9-037 | verifier | Evidence set holding a valid anchoring publication earlier in chain order than the anchor of the supplied prior result | The earlier one reported as the anchor and the previous one as a conflicting anchor; the change of holder stated against the prior result, not silent | P9.16, P9.36, P7.17 |
| T9-038 | SDK | Anchoring when the log or signer identity evidence through the signed anchoring entry does not verify | SDK refuses to inscribe | P9.18 |
| T9-039 | verifier | Writer checking its committed log before publishing an entry, the entry not yet on Bitcoin | Verified whole as a local copy, from genesis through that entry; reported as unverified on Bitcoin and never current | P9.18 |
| T9-040 | SDK | Local-copy result placed in a report given to a reader, or presented as anchored or current | Never; a local copy is only the writer’s own pre-publication check | P9.18 |
| T9-041 | SDK | Verified anchoring publication after submission | Submitted, not observed, while the network is not seen to hold it; pending Bitcoin acceptance while in the mempool, or confirmed but not yet verified; once confirmed, reverified and reported anchored, not anchored, or anchored with `identity` `incomplete` | P9.18 |
| T9-042 | verifier | Anchoring publication that does not start at the genesis entry, or whose entries do not verify as one log | Not an anchor | P9.17 |
| T9-043 | verifier | Anchoring publication whose last entry is not an anchoring entry naming that sat | Not an anchor | P9.17 |
| T9-044 | verifier | Inscription the Bitcoin index reports on a sat whose number differs from the did:btco alias’s sat number | Not on the anchoring sat; ignored and reported | P9.10 |
| T9-045 | verifier | Inscriptions read from a network other than the one the did:btco alias names | Not on the anchoring sat | P9.10 |
| T9-046 | verifier | Entry after anchoring that replaces the did:webvh alias with a different one | Rejected | P9.10 |
| T9-047 | verifier | Entry before the anchoring entry, in the anchoring publication, signed by a key removed from its signer’s DID before the publication | Accepted against the version it names; ordering claimed | P9.15, P5.13 |
| T9-048 | verifier | did:btco alias with an unknown network prefix, a sign, leading zeros or a number beyond the supply of sats | Rejected | P9.10 |
| T9-049 | verifier | Two indexes the verifier uses disagree on which sat an inscription is on | Not accepted; `bitcoin` `missing-evidence` until they agree | P9.10 |
| T9-050 | verifier | Anchored Original whose did:webvh alias is removed, then added again | Re-adding rejected | P9.10 |
| T9-051 | verifier | Inscription whose metadata and body are exactly 350,000 bytes together | Accepted, if otherwise valid | P9.17 |
| T9-052 | verifier, SDK | Inscription whose metadata and body are over 350,000 bytes together | Rejected; the SDK publishes a log too large for one inscription in parts instead | P9.17, P9.32 |
| T9-053 | verifier | Genesis entry with no `network`, or a later entry that changes it | Rejected | P9.34, P14.5 |
| T9-054 | verifier | Anchoring entry whose did:btco alias names a sat on a network other than its genesis entry’s `network` | Rejected | P9.10, P9.34 |
| T9-055 | verifier | Inscriptions of the Original read on a network other than the one its genesis entry names | Not evidence about the Original; ignored | P9.31, P9.34 |
| T9-056 | verifier | Anchoring publication for a second `did:og` on a sat already taken by a valid anchoring publication, including one that is a conflicting anchor of its own Original | Rejected; the did:btco alias resolves to the Original that took the sat | P9.34 |
| T9-057 | verifier | Anchoring publication on a sat whose only earlier anchoring publication, for another `did:og`, is invalid | Accepted, if otherwise valid; an invalid publication takes no sat | P9.34 |
| T9-058 | verifier | Anchoring publication in three parts, consecutive Originals inscriptions on the sat with an unrelated inscription between two of them | One publication, taking effect when the final part confirms, at the final part’s position in chain order; the unrelated inscription does not interrupt it | P9.32 |
| T9-059 | verifier | Parts of a publication interrupted by another Originals inscription on the sat | The interrupted parts rejected; the interrupting inscription considered on its own | P9.32 |
| T9-060 | verifier | Publication whose final part is not yet inscribed or not yet confirmed | No change of state or holder | P9.32 |
| T9-061 | verifier | Part other than the final part with a body or a content type, or a publication whose last entry is not in its final part | Publication rejected | P9.32 |
| T9-062 | verifier, SDK | Publication of 16 / 17 inscriptions | Accepted, if otherwise valid / rejected; the SDK refuses to publish it | P9.17, P14.13 |
| T9-063 | verifier | Originals inscription with a pointer, a parent, a content encoding, a delegate or a field ord does not recognise | Rejected with its publication | P9.31, P14.12 |
| T9-064 | verifier | Two indexes at the same tip listing different inscriptions on the anchoring sat, or on a did:btco signer’s sat | Not accepted; `bitcoin` `missing-evidence` until they agree | P9.31 |
| T9-065 | verifier | Verifier combining a holder read at one tip with inscriptions read at another | Never; every report is bound to one tip | P9.31 |
| T9-066 | verifier | Entry whose `aliases` list a did:btco DID with no `body`; `body` `preview` with no `preview`; or `preview` with `body` `full` or `none` | Rejected | P9.30, P14.5 |
| T9-067 | writer, verifier | Entry before any did:btco alias carrying `body` | Rejected; a writer never writes it | P9.30, P14.5 |
| T9-068 | verifier | Inscription whose last entry signs `body` `none`, with a body / `body` `full`, with no body or with the preview as its body | Rejected | P9.17 |
| T9-069 | verifier | Inscribed entry naming a did:vh or did:webvh signer version inscribed earlier in the same publication | Accepted, if otherwise valid | P9.33 |
| T9-070 | verifier | Inscribed signer history that does not start at the DID’s genesis entry, skips or repeats an entry already inscribed, or does not verify under its method | Publication rejected | P9.33 |
| T9-071 | verifier | Signer history inscribed only in a publication that was rejected | Ignored; a later publication carries it again | P9.33 |
| T9-072 | verifier | A did:vh or did:webvh signer whose controller publishes off Bitcoin a different version at a number already inscribed | Inscribed history unchanged; acceptance unchanged | P9.15, P9.33 |
| T9-073 | verifier | Writer inscribing an entry whose key the newest version of its signer’s DID that it has verified no longer lists | Refused | P9.33 |
| T9-074 | verifier | Verifier relying on an index of Originals inscriptions that it trusts, which lists no competing anchoring publication for the `did:og` through block N | May report uniqueness as established through block N, naming the index; never beyond it | P9.16 |
| T9-075 | verifier | Verifier with no index of Originals inscriptions | Uniqueness not established; holder `provisional` | P9.16 |
| T9-076 | verifier | Earlier anchoring publication naming a signer version that Bitcoin does not evidence, and a later valid anchoring publication on another sat | The earlier one is not an anchor; the later one is | P9.16 |
| T9-077 | verifier | Earlier anchoring publication with a did:btco signer whose sat is not read in full in the evidence set, and a later valid one | `bitcoin` `undetermined` until an evidence set reads it in full (P9.35); the later one not reported as the anchor meanwhile | P9.35, P9.16 |
| T9-078 | verifier | Publication and the publication extending it confirmed in the same block, in that transaction order | Both accepted, in chain order | P9.13 |
| T9-079 | verifier | Publication and the publication extending it in the same block, in the reverse transaction order | The later one in chain order does not extend the head when it is reached; only the one extending the accepted head is accepted | P9.13 |
| T9-080 | verifier | Signed entry inscribed by the holder long after it was signed, still extending the accepted head and valid in the signer state at its inscription | Accepted; signed entries do not expire | P9.15 |
| T9-081 | verifier | Inscription whose last entry signs `body` `full`, with a body whose digest or size differs from that entry’s resource descriptor | Rejected | P9.17 |
| T9-082 | verifier | Inscription whose last entry signs `body` `full`, with a body whose content type differs from the resource `mediaType`; any inscription with a content type and no body, or with a content encoding | Rejected | P9.17 |
| T9-083 | SDK | SDK about to inscribe an entry | Tells the author whether the preview, the full version or no body is inscribed; that this body, the name and the metadata become public and permanent; what Bitcoin will not hold; and the cost at the fee rate it will use; warns when the body is active content | P9.18 |
| T9-084 | verifier | Inscription after the anchor whose entry changes only the name or metadata, its parent naming a preview | The entry carries the same preview, or none; the body is that preview again, or, with none, the full version or no body, as its `body` signs | P9.17, P9.30 |
| T9-085 | verifier | Inscription after the anchor whose entry changes only the name or metadata, its parent naming no preview | The body is the full version again, or no body, as its `body` signs | P9.17, P9.30 |
| T9-086 | verifier | Inscription whose last entry names a preview, with that preview as its body, by default | Accepted; the sat shows the preview; the log verifies without the version’s bytes, which are listed as missing under `availability` unless its bytes are supplied, and never reported verified because the preview matched | P9.17, P9.18, P9.30, P7.4 |
| T9-087 | verifier | Inscription whose last entry signs `body` `full`, with the full version as its body | Accepted; the body is checked against the resource descriptor | P9.17 |
| T9-088 | verifier | Inscription whose last entry signs `body` `none`, with no body and no content type | Accepted; the entries are in its metadata only; the version is listed as missing under `availability` unless its bytes are supplied | P9.17, P7.4 |
| T9-089 | verifier | Writer inscribing a version whose `mediaType` is not an `image/` type, with no preview supplied | Names no preview and signs `body` `none`, unless the author chooses the full version and it signs `full` | P9.30 |
| T9-090 | verifier | Writer inscribing a version whose `mediaType` is an `image/` type, including `image/svg+xml` and an animated image | Generates an `image/webp` preview of at most 8,192 bytes, rasterising an SVG, and names it in the entry, unless the author chooses the full version | P9.30 |
| T9-091 | verifier | Writer inscribing an `image/` version it cannot decode, or cannot fit in a WebP preview of 8,192 bytes | Tells the author and names no preview; the entry signs `body` `full` or `none` | P9.30 |
| T9-092 | verifier | Writer adding a version whose generated preview is byte-identical to its parent’s | Makes another preview or names none; never signs the parent’s `preview` unchanged | P9.30 |
| T9-093 | verifier | Entry naming a preview of a media type other than `image/webp` for a version whose `mediaType` is an `image/` type, including an `image/svg+xml` preview of an `image/svg+xml` version, or one whose type is `Image` in another case | Rejected | P9.30 |
| T9-094 | verifier | Author-supplied preview of any media type for a version that is not an image | Accepted, within 8,192 bytes | P9.30 |
| T9-095 | writer, verifier | Preview of 0 bytes | Rejected; a writer never names one | P9.30, P14.5 |
| T9-096 | writer, verifier | Preview of 8,192 / 8,193 bytes | Accepted / the writer refuses to sign an entry naming it, and a verifier rejects such an entry and any inscription carrying it | P9.30, P14.5, P14.13 |
| T9-097 | verifier | Inscription whose last entry names a preview, with a body whose digest, size or content type differs from it, including the full version or no body | Inscription rejected, as a body that does not match always was; its entries not accepted from it; not an anchor if it is the anchoring inscription; state unchanged | P9.17 |
| T9-098 | writer, verifier | `preview` in an entry whose `aliases` list no did:btco DID: an entry of an Original for which no anchoring entry has been signed, or an entry before the anchoring entry in an anchoring publication | Rejected, not ignored; a writer never writes it | P9.30, P14.5 |
| T9-099 | verifier | Entry after anchoring that names a preview, signed but never inscribed | Not current (P9.12); its preview is not shown on Bitcoin | P9.12, P9.30 |
| T9-100 | verifier | Anchoring entry naming a preview, its parent naming none | Accepted | P9.30 |
| T9-101 | verifier | Entry after the anchor that changes the resource and names a preview of the new version, inscribed with it as its body | Accepted; the sat shows the new preview | P9.17, P9.30 |
| T9-102 | verifier | Entry that changes the resource’s digest and carries its parent’s `preview` unchanged | Rejected; it names a preview of the new version, or none | P9.30 |
| T9-103 | verifier | Entry other than the anchoring entry that does not change the resource and names a preview other than its parent’s, or names one when its parent named none | Rejected | P9.30 |
| T9-104 | verifier | Inscription whose last entry names no preview and whose version’s `size` is 0, with an empty body and that `mediaType` as content type | Accepted; an empty body is a body, not an absent one | P9.17, P14.12 |
| T9-105 | verifier | Originals inscription that names a delegate, with or without a body | Rejected as a whole | P9.17, P14.12 |
| T9-106 | verifier | Editor entry signed before its revocation, on the revocation’s parent | Unanchored: a fork with `state` `conflict`, settled by the anchor’s branch (P9.16) or by an author entry that supersedes the editor branch (P6.9). After anchoring: the first inscribed in chain order extending the head is accepted, the other `ignored` (P9.13); if the first is `unverifiable`, the other is `waiting` | P9.16, P6.9, P9.13, P9.15 |
| T9-107 | verifier | Editor entry inscribed on the anchoring sat by the holder | Accepted | P9.12 |
| T9-108 | verifier | Inscription after the anchor naming a did:btco signer version on a sat the verifier has not read that far | Labelled `unverifiable`; the accepted state stays `current` and `identity` is not made `incomplete`; later publications from that head `waiting` | P9.15 |
| T9-109 | verifier | Inscription after the anchor naming a did:vh or did:webvh signer version number that the inscribed signer history holds under another versionId | Rejected | P9.15 |
| T9-110 | verifier | Inscription after the anchor that was `unverifiable` in the prior result, verified and accepted in a larger evidence set | Change of head stated against the prior result, not silent | P9.15, P9.36 |
| T9-111 | SDK | Anchoring publication submitted but rejected, evicted or not visible to the SDK’s Bitcoin provider | Labelled submitted, not observed; never pending Bitcoin acceptance | P9.18 |
| T9-112 | verifier | Valid publication after an earlier `unverifiable` inscription extending the same head | Not accepted until the `unverifiable` one is resolved; reported as waiting on it | P9.15 |
| T9-113 | verifier | Earlier `unverifiable` inscription later verified as invalid, with a valid later publication from the same head | The later publication is accepted; the change of head is reported | P9.15 |
| T9-114 | verifier | Evidence set in which a did:btco signer’s sat is not read in full, with a prior result that accepted an inscription depending on it | That inscription `unverifiable` in this report; the head recomputed and the change stated against the prior result | P9.15, P9.36, P7.17 |
| T9-115 | verifier | Entry in the anchoring publication naming a signer version number that the inscribed signer history holds under another versionId | Rejected | P9.15 |
| T9-116 | verifier | Inscription after the anchor whose signer version is `unverifiable` but which fails a check not depending on that version | Rejected, not `unverifiable` | P9.15 |
| T9-117 | verifier | Publication extending an `unverifiable` inscription | Listed as waiting on it; followed under P9.13 once it is accepted, ignored if it is rejected | P9.13, P9.15 |
| T9-118 | verifier | Single acceptance check while an `unverifiable` inscription is listed | Passes only with the list presented beside its result | P9.15, P7.22 |
| T9-119 | verifier | did:btco signer whose named version is known but an earlier inscription on its sat is unread | Unverifiable; not accepted against the older state | P9.15 |
| T9-120 | verifier | Report for an anchored Original | States the network and tip it is bound to, the confirmation depth relied on, and whether more than one independent index agreed on the sat’s location | P9.5, P9.11, P9.31 |
| T9-121 | verifier | Signed anchoring entry not inscribed on the sat it names | Not anchored | P9.10, P9.12 |
| T9-122 | verifier | Evidence set lacking the full inscription list of a did:btco signer’s sat, for an entry inscribed after the anchoring publication | Inscription `unverifiable`; later publications extending the same head `waiting` | P9.15, P9.35, P9.36 |
| T9-123 | verifier | Larger evidence set that reads that sat in full, with a prior result | Inscription decided; change of head stated against the prior result | P9.36 |
| T9-124 | verifier | Entry decided by more than one row of the P9.15 table | First matching row decides | P9.15 |
| T9-125 | SDK | Publish retry after a partial upload | The same intended snapshot resumed or repeated; no new asset transition | P9.2 |
| T9-126 | SDK | Uploading bytes, publishing a locator or changing an index, with no authorized transition in the operation | No entry signed or appended | P9.2 |
| T9-127 | SDK | Rebroadcast of an anchoring or later publication’s unconfirmed transaction | The same transaction rebroadcast; no entry re-signed or rebased | P9.6 |
| T9-128 | SDK | Fee bump of an unconfirmed publication by a replacement transaction | Prepared and reported as a replacement carrying the same signed entries; no entry re-signed or rebased | P9.6 |

#### Wire format (§14)

| ID | Actor | Given | Expected | Rules |
|---|---|---|---|---|
| T14-001 | verifier | Later entry whose parameters set `method` to any value, including another method’s | Rejected | P14.1 |
| T14-002 | verifier | Inscription that does not decode deterministically | Rejected | P14.12 |
| T14-003 | verifier | Originals inscription whose metadata is a CBOR array of entries, as in earlier drafts, or an object with a member other than `entries`, `signers` and `part` | Rejected | P14.12 |
| T14-004 | verifier | `preview` whose `mediaType` has a parameter, whose digest is not in P14.7’s encoding, or with a member other than `mediaType`, `size` and `digest` | Rejected | P14.7, P14.5, P14.6 |
| T14-005 | verifier | Derived DID document of an entry that names a preview | Same as without it; the preview is not in the document, and does not advance the version | P14.9, P4.4, P9.30 |
| T14-006 | writer | Evidence package of an anchored Original whose entries name previews | Complete without the previews; a writer puts no preview under `resources/` and lists none in `missing` | P14.10, P9.30 |
| T14-007 | verifier | Inscription metadata containing a CBOR tag, byte string, indefinite-length item, non-text map key or duplicate key | Rejected | P14.12 |
| T14-008 | verifier | Entry whose metadata holds a non-integer number, inscribed as a half-, single- or double-precision float | Accepted; hashes and proof checked over its JCS form | P14.3, P14.12 |
| T14-009 | verifier | Inscription metadata holding a NaN, infinite or negative-zero float, or one above P14.3’s bound | Rejected | P14.3, P14.12 |
| T14-010 | verifier | Inscription metadata split over several data pushes | Concatenated, then decoded | P14.12 |
| T14-011 | verifier | Entry carried in inscription metadata | Hashes and proof checked over its JCS form; key order in the CBOR map does not matter | P14.3, P14.12 |
| T14-012 | verifier | Entry state with a member section 14 does not list, at any level | Rejected | P14.4 |
| T14-013 | verifier | Resource digest in a non-canonical encoding, or a multihash other than SHA-256 | Rejected | P14.7 |
| T14-014 | verifier | `asset.editors` present as an empty array | Rejected | P14.5 |
| T14-015 | verifier | Resource descriptor whose `size` changes without its `digest` | Rejected | P14.6 |
| T14-016 | verifier | Entry whose JCS form is 65,536 / 65,537 UTF-8 bytes, in `did.jsonl`, an inscription or any carrier | Accepted / rejected | P14.13 |
| T14-017 | verifier | Derived DID document compared with section 14’s template | Identical for every resolver | P14.9 |
| T14-018 | writer | Evidence package built twice from the same contents | Byte-identical archives | P14.10 |
| T14-019 | verifier | Evidence package with a compressed archive entry or a name over 255 bytes | Rejected | P14.10 |
| T14-020 | verifier | Transitions in the genesis entry / an entry changing the resource / any other entry | `[{from: null, to}]` / `[{from, to}]` / `[]` | P14.4 |
| T14-021 | verifier | Number such as `1e16` or `9007199254740993.0` in an entry | Rejected | P14.3 |
| T14-022 | verifier | Asset log with a carriage return, non-compact JSON or no final line feed | Rejected | P14.2 |
| T14-023 | verifier | Proof with a member other than those P14.8 lists | Rejected | P14.8 |
| T14-024 | writer, verifier | Evidence package whose entries are unsorted or carry other dates or flags | A reader may accept it; a writer never produces it | P14.10 |
| T14-025 | verifier | Evidence package with a name that is not valid UTF-8, or an entry whose mode is not a regular file | Rejected | P14.10, P7.5 |
| T14-026 | verifier | `name` of 1,024 / 1,025 UTF-16 code units, counting a non-BMP character as two | Accepted / rejected | P14.5 |
| T14-027 | verifier | Inscribed signer history above the P14.13 version limit, or continuing after a deactivated version | Publication rejected | P14.13, P9.33 |
| T14-028 | verifier | Asset log line with whitespace outside JSON strings / with keys in non-JCS order | Rejected / accepted | P14.2 |
| T14-029 | verifier | `mediaType` `image/PNG` / `application/javascript` / `application/pdf` / `application/vc+json` | Trailer / no carrier / no carrier / no carrier | P14.14 |
| T14-030 | verifier | Trailer whose length exceeds the file size less 24, or whose footer is altered by end-of-line conversion | No trailer | P14.15 |
| T14-031 | verifier | Trailer `length` 16,777,192 / 16,777,193 | Trailer / no trailer | P14.14, P14.15 |
| T14-032 | verifier | File of 16–23 bytes ending in the footer magic | No trailer | P14.15 |
| T14-033 | verifier | Trailer entry line of 70,000 bytes whose JCS form is 60,000 bytes | Within the entry limit, which is measured over the JCS form in every format | P14.14, P14.13 |
| T14-034 | verifier | Trailer whose log breaks P14.2 | Trailer found; log invalid | P14.2, P14.15 |
| T14-035 | verifier | Text block whose last line has no line end | Accepted | P14.16 |
| T14-036 | verifier | Text block with a blank, unprefixed or non-JSON line between the markers, or no entry line | Text block with an invalid log, not content | P14.16 |
| T14-037 | verifier | Text block at the very start of the file, with no line feed before it | No carrier | P14.16 |
| T14-038 | verifier | Writer asked for a text block on YAML ending in a block scalar, or Markdown ending in an unclosed fence | Refused | P14.16 |
| T14-039 | verifier | Text file with an earlier text block followed by content | The earlier block is content, not a carrier | P14.16 |
| T14-040 | verifier | Text block with CR LF line ends, followed by blank lines and spaces | Accepted; the trailing whitespace is part of the carrier | P14.16 |
| T14-041 | verifier | Text block in a CR LF file whose separator is CR LF, not a single LF | The added CR is left in the remaining bytes: digest mismatch, and file verification fails | P14.16, P7.12 |
| T14-042 | verifier | Text block entry line with `\u` escapes / with a raw non-ASCII character, closer, or `--` inside a `<!--` comment | Accepted, checked over its JCS form / no carrier | P14.16 |
| T14-043 | verifier | Writer asked for a text block on a version that is not valid UTF-8 | Refused | P14.16, P7.15 |
| T14-044 | verifier | JSON member that is the root object’s last, with entries reformatted and keys reordered | Accepted; entries checked over their JCS form | P14.17 |
| T14-045 | verifier | Two root members named `originalLog`, including one spelled with escapes | Rejected; neither is chosen | P14.17 |
| T14-046 | verifier | Member named `originalLog` nested below the root | Not a JSON member | P14.17 |
| T14-047 | verifier | JSON document with a 64-bit integer or a nested duplicate key outside the member | The member is still found; only the entries are subject to P14.3 | P14.3, P14.17 |
| T14-048 | verifier | JSON last root member `originalLog` whose value is `5` or `[1]` | JSON member with an invalid log | P14.17 |
| T14-049 | verifier | JSON document `{"originalLog":[…]}` with a leading byte order mark / with no other member | Member found; the version is the byte order mark and `{}` / `{}` | P14.17 |
| T14-050 | verifier | JSON document nested 1,025 levels outside the entries, counting the root object as level 1 | No JSON member | P14.17 |
| T14-051 | verifier | `aliases` holding a DID of any other method, or the same DID twice | Rejected | P14.5 |
| T14-052 | verifier | Genesis parameters other than exactly `method` and `scid`; a later entry with a non-empty parameters object that is not a deactivation; a null parameter value | Rejected | P14.1 |
| T14-053 | verifier | Carried file with a wrong or missing file name extension | The extension is only a hint; the other carriers are tried, and the carrier found is checked against the verified descriptor’s `mediaType` | P14.14 |
| T14-054 | verifier | Descriptor `mediaType` with a parameter, such as `text/plain; charset=utf-8` | Rejected; the parameter is not ignored | P14.6, P14.14 |
| T14-055 | verifier | Text block whose closer line is not directly preceded by the END marker, or whose BEGIN marker in a block comment is not directly preceded by the opener | No carrier | P14.16 |
| T14-056 | verifier | HTML version ending inside an open `script`, `style` or `textarea` element / inside an open `pre` element | Writer refuses / writer accepts; the block parses as a separate comment | P14.16 |
| T14-057 | verifier | Shell or C-family version whose last line ends in a line continuation | Writer refuses | P14.16 |
| T14-058 | verifier | HTML version ending inside an open tag, a processing instruction, or an open `iframe`, `noembed` or `noframes` element | Writer refuses; the appended block would not parse as a separate comment | P14.16 |
| T14-059 | verifier | Version of a listed type whose ending its format’s parser leaves outside any comment, string, tag or raw-text context | Writer adds the block; it parses as a separate comment | P14.16 |
| T14-060 | verifier | Writer with no parser for the version’s syntax asked for a text block | Refused | P14.16 |
| T14-061 | verifier | Two entries whose `versionTime` values differ by less than one millisecond, or a `versionTime` with more than three fractional digits | Rejected | P14.2 |
| T14-062 | verifier | `supersedes` with 9 versionIds, or a repeated one | Rejected | P14.4, P14.13 |
| T14-063 | host | Host of a did:webvh alias serving the evidence package unpacked under `originals/` and each resource with its signed media type and P9.7’s headers | Found from the alias and verified as the package | P14.11, P9.7 |
| T14-064 | verifier | Resource served under a did:webvh alias’s `originals/` with a media type other than its signed `mediaType` | The signed `mediaType` is used; the served type is never trusted | P14.11, P9.7 |
| T14-065 | verifier | Ed25519 proof whose public key or signature point `R` is a small-order point | Entry `rejected`; `identity` `failed` | P14.8 |
| T14-066 | verifier | `proofValue` that is not `z` followed by base58btc, or that decodes to a signature of other than 64 bytes | Entry `rejected` | P14.8 |
| T14-067 | verifier | Signer key Multikey with a prefix other than Ed25519’s 0xed01, such as secp256k1’s 0xe701, or an Ed25519 key of other than 32 bytes | Entry `rejected`; `identity` `failed` | P14.8, P5.3 |
| T14-068 | verifier | Entry containing `-0` or `-0.0` | Rejected | P14.3 |
| T14-069 | verifier | Entry containing a lone surrogate escape such as `\ud800` | Rejected | P14.3 |
| T14-070 | verifier | Entry nested 64 / 65 levels deep | Accepted, if otherwise valid / rejected | P14.3, P5.7 |
| T14-071 | verifier | Asset log of 10,000 / 10,001 entries | Accepted, if otherwise valid / last valid prefix reported with `history` `limit-exceeded` | P14.13, P7.7 |
| T14-072 | verifier | Signer DID history of 1,000 / 1,001 versions | Accepted, if otherwise valid / reported with `history` `limit-exceeded`; never complete | P14.13, P7.7 |
| T14-073 | verifier | `editors` with 32 / 33 grants | Accepted, if otherwise valid / rejected | P14.13, P5.15 |
| T14-074 | verifier | `supersedes` with 8 distinct versionIds of entries it may supersede | Accepted, if otherwise valid | P14.13, P6.9 |
| T14-075 | verifier | Each evidence set in `vectors/og-1.0-draft.1/` (`local/`, `bitcoin/`), with no network | A report equal to that vector’s `expected-report.json` | P14.25, P14.26, P7.17 |
| T14-076 | writer | The vector Original’s entries, resources and signer log, packaged and inscribed as in `vectors/og-1.0-draft.1/` | Byte-identical `evidence.zip`, metadata and envelopes | P14.26, P14.10, P14.12 |
| T14-077 | verifier | Evidence package whose manifest `checkpoint` is not an entry of `asset/did.jsonl`, or whose `head` is not its last entry | Rejected | P14.10 |
| T14-078 | writer | Inscription metadata and envelope fields | Members in the order `entries`, `signers`, `part`, and fields in ord 0.29.1’s order; a reader accepts any order ord accepts | P14.12 |
| T14-079 | host | The shared-host saves in `vectors/og-1.0-draft.1/hosted/exchanges.json`, applied in order | `accepted`, then `stale-parent` with the new head, then `already-accepted` | P6.7, P14.26 |

### Coverage

Each core rule and the number of rows that test it. Every core rule has at least one row. A rule number counts as covered when one row tests one of its requirements; P9.15, P9.17 and P14.13 each bundle many requirements, and their rows test each table row, body mode and limit separately.

- Section 2: P2.1 (2), P2.2 (1), P2.3 (1).
- Section 3: P3.1 (1), P3.2 (1), P3.3 (3), P3.4 (1), P3.5 (3), P3.6 (4), P3.7 (1), P3.8 (2), P3.9 (1).
- Section 4: P4.1 (2), P4.2 (2), P4.3 (1), P4.4 (4), P4.5 (1), P4.6 (2).
- Section 5: P5.1 (2), P5.2 (2), P5.3 (8), P5.4 (2), P5.5 (1), P5.6 (3), P5.7 (2), P5.8 (4), P5.9 (2), P5.10 (2), P5.11 (3), P5.12 (2), P5.13 (18), P5.14 (9), P5.15 (6), P5.16 (8), P5.17 (3), P5.18 (3).
- Section 6: P6.1 (1), P6.2 (1), P6.3 (1), P6.4 (1), P6.5 (5), P6.6 (6), P6.7 (4), P6.8 (3), P6.9 (13).
- Section 7: P7.1 (4), P7.2 (1), P7.3 (1), P7.4 (5), P7.5 (8), P7.6 (1), P7.7 (4), P7.8 (7), P7.9 (2), P7.10 (2), P7.11 (1), P7.12 (5), P7.13 (6), P7.14 (7), P7.15 (6), P7.16 (4), P7.17 (8), P7.18 (4), P7.19 (7), P7.20 (9), P7.21 (5), P7.22 (7), P7.23 (1).
- Section 8: P8.1 (1), P8.2 (1), P8.3 (2), P8.4 (2), P8.5 (13).
- Section 9: P9.1 (1), P9.2 (2), P9.3 (1), P9.4 (1), P9.5 (4), P9.6 (3), P9.7 (3), P9.8 (1), P9.9 (1), P9.10 (15), P9.11 (3), P9.12 (7), P9.13 (9), P9.14 (1), P9.15 (36), P9.16 (10), P9.17 (25), P9.18 (11), P9.30 (25), P9.31 (8), P9.32 (5), P9.33 (13), P9.34 (5), P9.35 (2), P9.36 (5).
- Section 14: P14.1 (3), P14.2 (4), P14.3 (9), P14.4 (9), P14.5 (11), P14.6 (5), P14.7 (3), P14.8 (8), P14.9 (3), P14.10 (11), P14.11 (2), P14.12 (13), P14.13 (14), P14.14 (6), P14.15 (4), P14.16 (15), P14.17 (9), P14.25 (1), P14.26 (3).

Not covered, because the requirement is out of the core: the read-authorization rules, signer sets, parent Originals and scopes, whose rows moved with them to the additions; the limit on nested parents; the read request’s member set and challenge entropy, which the additions define.

### Release evidence

Release evidence should include positive and negative fixtures, pinned profile decisions, deterministic results and a dependency inventory. Before interoperability is claimed:

- an independent verifier reproduces every positive checkpoint and produces the same report for each fixture’s evidence set (P7.17), row by row, citing row IDs;
- fresh-process tests run with no private key in the reader and without network dependencies, from complete packages whose `offline` result is `self-contained` (T7-001), beside partial-package tests;
- the application’s own hosted publication paths, not only the SDK’s adapters, publish through this profile and pass exact-snapshot reader regressions: a fresh reader of each published snapshot reaches the writer’s checkpoint (P9.1, P9.2);
- the Bitcoin rows run against a test network before any mainnet anchoring (P9.18).
