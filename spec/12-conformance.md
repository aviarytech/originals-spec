## Conformance and negative tests

All requirements here are proposed. A conformance claim needs a named, pinned Originals profile plus the upstream VH and identity-method versions. “VH-based” alone is not an interoperable conformance target. Open profile choices are blockers to a release claim, not reasons to accept unverified evidence.

### Proposed minimum test matrix

| Test | Required result |
|---|---|
| Fresh create, edit, package and verify | Same asset checkpoint and resource versions; no private key in reader |
| Byte changed at same URL | Digest failure; no verified resource result |
| Wrong genesis or Original ID | Identifier binding failure |
| Broken chain or reordered entry | History invalid; no derived accepted state beyond failure |
| Valid key of an identity other than the Original’s author DID, with no grant in the parent’s state covering the change | Rejected; identity alone grants no edit right |
| Valid VH entry, key not a method of the named signer DID (the author DID, or the editor DID for an editor entry) | Signer binding failure; VH validity cannot rescue it |
| Wrong DID method binding or relationship | Identity authorization failure |
| Old identity version with claimed old time | Unanchored: ordering unproven; no timestamp-only acceptance. Anchored: checked against the author DID state at the inscription time (P9.15) |
| Missing identity history for an entry the accepted state depends on | Incomplete identity evidence; no blanket verified result. For an inscription after the anchor, see P9.15’s unverifiable case |
| Missing historical resource bytes | Explicit partial availability; supplied bytes still checked |
| Caller changes version counter | Counter ignored or rejected; history-derived version retained |
| Stale parent or prior digest | Conflict; no silent rebase or commit |
| Signer rejects or returns invalid proof | No partial state commit |
| Interrupted local commit | Recover prior or fully committed checkpoint; no false success |
| Identical accepted retry | Existing result or explicit duplicate; no unintended extra version |
| Entry whose state has no resource, or more than one | Rejected (P4.1, P14.5) |
| Metadata supplied, omitted or null | Replacement, unchanged or removed, respectively |
| Name set to null | Rejected |
| Update that leaves the resource’s digest unchanged | Its version does not advance; `transitions` is empty (P4.4, P14.4) |
| Import then edit without authority | Read succeeds where evidence valid; edit authorization fails |
| Update after deactivation | Rejected; historical evidence retained |
| Old valid prefix served as current | Reported valid as of its checkpoint, never current (P7.10) |
| Divergent valid branches not settled on Bitcoin | Unresolved conflict; every branch reported; none current; no timestamp winner |
| Hosted mixed snapshot | Rejected before public result is marked verified |
| Anchoring sat moved to a new holder | Owner reported as the new holder; author unchanged |
| After anchoring, author-signed entry not inscribed on the sat | Not current |
| Inscription on the anchoring sat signed by neither the author nor an editor whose grant covers the change, including one by the owner | Rejected; state unchanged |
| Author-signed entry inscribed by the owner | Accepted |
| Entry after anchoring that removes or changes the did:btco alias, or adds another | Rejected |
| Newer inscription on the sat that does not extend the head | Ignored; state follows the authenticated chain |
| Same evidence inscribed on a different sat | No ownership conferred |
| Anchoring an Original from the local or web layer | Accepted; ordering before the anchor claimed only; uniqueness not established; ownership provisional |
| Entry after anchoring that adds a did:webvh alias when the anchoring entry’s state listed none | Rejected |
| Two valid anchoring entries for one Original on different sats | The first in chain order is the anchor; the other and its descendants are a conflicting anchor, not current, conferring no ownership |
| Anchoring entry inscribed on a sat other than the one it names | Not an anchor |
| Publication at the same or a lower block height than the previous accepted one | Not accepted |
| Bitcoin failure, retry or reorganization | Durable boundary follows adapter policy, not pending intent |
| Entry signed by a key removed from the author DID | Unanchored: historically authorized, ordering unproven, not current while the latest verified author DID state does not list the key (P7.9). Anchored: an anchoring entry or later inscribed entry is rejected if its inscription time is at or after the removal’s versionTime, unless it names a later did:vh or did:webvh version that lists the key again (P9.15); for did:btco, rejected unless the latest version preceding the inscription lists the key (P5.13) |
| Accepted anchored entry whose key the author DID later removes | Remains current |
| Author DID deactivated after an Original is anchored | Accepted state remains current; entries inscribed later rejected |
| Anchored entry naming a did:vh or did:webvh author DID version whose versionTime is later than its inscription time | Checked against the named version (P9.15) |
| Block whose timestamp is earlier than an ancestor’s | Inscription time is the greatest ancestor timestamp |
| Anchored entry whose did:vh or did:webvh signer DID is known only up to a version older than the entry’s inscription time | Checked against the newest known version; the report states that version and when it was obtained (P7.8, P9.15) |
| Author DID version published with a versionTime before an already accepted inscription it would reject | Retroactive revocation conflict reported; result not silently changed |
| Any entry after the author DID is deactivated | Not anchored: deactivation reported; entries historically authorized only (P7.9). Anchored: accepted state remains current; entries inscribed later rejected (P9.15) |
| Entry that sets updateKeys or nextKeyHashes | Rejected |
| Asset log entry that sets the witness parameter to anything other than an empty object | Rejected |
| Entry signed by a key the author DID added, with no asset log entry for the change | Accepted |
| Author key not under assertionMethod in the author DID | Author binding failure |
| Author key that is also an updateKey of the author DID’s own log | Author binding failure |
| Author DID versionId absent from signed state | Rejected |
| Verification method from another DID, with a different controller, or under authentication only | Author binding failure |
| Key expressed as JWK or a different multikey encoding | Author binding failure |
| Later entry names a different author DID, or an older author DID version than the most recent earlier author entry | Rejected |
| Author DID using a method the profile does not list | Rejected |
| Anchored Original with a did:btco author DID, verified with no author DID host | Author binding checked against inscribed DID versions in chain order |
| did:btco author DID version inscribed after an Originals inscription in the same block | Not in effect for that inscription |
| Anchoring entry naming the author DID’s own did:btco sat | Rejected |
| Inscription on a did:btco author DID’s sat after its deactivation | Not a version; author DID remains deactivated |
| Anchored Original whose did:vh or did:webvh author DID log is unavailable for entries the accepted state depends on | Incomplete identity evidence; not reported as current. Later inscriptions it cannot check are unverifiable and leave the accepted state current; later publications from that head wait (P9.15) |
| Two proofs in the proof array | Rejected |
| Older author DID history served when the verifier has retained a newer version | The newer version is used (P7.8) |
| VH-valid log that fails Originals rules, read through a generic resolver | Not reported as Originals-verified |
| did:webvh whose document points to a did:vh that does not list it | Not an alias; no Originals result through that did:webvh |
| Asset state lists a did:webvh whose document points elsewhere | Alias not confirmed; the did:vh still verifiable directly |
| Served DID document for the did:vh that differs from the one derived from the log | Ignored; the derived document is used |
| Derived DID document | Same for every resolver; `controller`, `alsoKnownAs` and `#files` match the author DID and asset state |
| Plain did:vh resolver given an Originals log | Rejected by its unrecognised `method` value |
| Later entry that moves the log between plain did:vh and the Originals extension | Rejected |
| Proof using a cryptosuite other than `eddsa-jcs-2022` or `bip340-jcs-2025` | Rejected |
| Entry whose state is a delta rather than the full asset state | Rejected |
| Inscription carrying a compact delta | Rejected in the baseline profile, which defines no compact encoding (P9.17); under a profile that defines one, decoded to the full entry and checked over it (P9.14) |
| Inscription that does not decode deterministically | Rejected |
| Lifecycle status deactivated without VH deactivated: true, or the reverse | Rejected |
| Older prefix imported over a newer local history | Local current state not rolled back |
| Log file larger than the profile cap | Fetch refused; reported as unavailable |
| Entry with duplicate JSON keys or an unsigned state field | Parse failure; no verified state |
| Resource digest with an unlisted algorithm | Unsupported-profile failure |
| Locator resolving or redirecting to a private address | Fetch refused; reported as unavailable |
| History or identity history beyond profile limits | Last valid prefix reported, labelled limit-exceeded; never complete or current |
| Archive with a symbolic link, `..` path or duplicate entry | Rejected before extraction |
| SVG resource containing script, or a name containing markup | Not executed on the platform origin or in a client |
| Entry inscribed on a sat whose did:btco alias its asset state does not list | Not an anchoring entry; ignored and reported |
| Inscription on the anchoring sat whose metadata is a did:btco DID document, not an array of entries | Not an Originals inscription; ignored for the Original (P14.12) |
| did:btco DID document inscribed on the anchoring sat by its holder | Ignored for the Original; a generic did:btco result is not reported as Originals verification |
| Inscription other than the anchoring inscription carrying more than one entry | Rejected |
| Anchored Original verified from Bitcoin alone, with no copy of the log | Complete log verified from the anchoring sat (P9.17) |
| Copy of the log that differs from the entries inscribed on the anchoring sat | Ignored; the sat’s entries are the log (P9.17) |
| Anchoring sat whose inscriptions cannot be read in full | Resolution fails |
| Inscription with no confirmations | Reported as observed; not in the accepted log |
| Reorganization that removes an accepted inscription | Reported with `authoritative-source-changed`; not silent |
| Inscribed entry naming a did:btco author DID version inscribed in a later block | Rejected; the version was not in effect (P5.13) |
| Inscribed entry naming a did:btco author DID version inscribed later in the same block | Rejected (P5.13) |
| Inscribed entry naming a did:btco author DID version inscribed earlier in the same block, whose key it holds | Accepted (P5.13) |
| Entry before the anchor naming a did:btco author DID version inscribed after the anchoring inscription | Rejected (P5.13) |
| Inscribed entry naming a preceding did:btco version whose key a later preceding version removed | Rejected; the key must hold in the latest preceding version (P5.13) |
| Anchored Original whose uninscribed resource versions are unavailable | Log verified; those versions reported unavailable; not a verification failure (P7.4, P9.18) |
| Anchored Original read from Bitcoin alone | Current version’s bytes read from the newest accepted inscription’s body and checked against its descriptor (P9.17, P9.18) |
| Anchored entry naming a did:vh or did:webvh author DID version, later than its inscription time, that lists again a key removed before that time | Accepted against the named version (P9.15) |
| Verifier learns of a valid anchoring entry earlier in chain order than the one it reported | Earlier one reported as the anchor, previous one as conflicting, owner change reported; not silent (P9.16) |
| Anchoring when the log or signer identity evidence through the signed anchoring entry does not verify | SDK refuses to inscribe (P9.18) |
| Verified anchoring inscription after submission | Submitted, not observed, while the network is not seen to hold it; pending Bitcoin acceptance while in the mempool, or confirmed but not yet verified; once confirmed, reverified and reported anchored, not anchored, or anchored with incomplete identity evidence (P9.18) |
| Anchoring inscription that does not start at the genesis entry, or whose entries do not verify as one log | Not an anchor (P9.17) |
| Anchoring inscription whose last entry is not an anchoring entry naming that sat | Not an anchor (P9.17) |
| Inscription the Bitcoin index reports on a sat whose number differs from the did:btco alias’s sat number | Not on the anchoring sat; ignored and reported (P9.10) |
| Inscriptions read from a network other than the one the did:btco alias names | Not on the anchoring sat (P9.10) |
| did:btco author DID inscription the index reports on a sat other than the one the DID names | Not a version of that DID (P5.13) |
| Entry after anchoring that replaces the did:webvh alias with a different one | Rejected (P9.10) |
| Entry before the anchoring entry, in the anchoring inscription, signed by a key removed from its signer’s DID before the inscription | Accepted against the version it names; ordering claimed (P9.15) |
| did:btco alias with an unknown network prefix, a sign, leading zeros or a number beyond the supply of sats | Rejected (P9.10) |
| Two indexes the verifier uses disagree on which sat an inscription is on | Not accepted; missing evidence reported until they agree (P9.10) |
| Anchored Original whose did:webvh alias is removed, then added again | Re-adding rejected (P9.10) |
| Inscription whose metadata and body are exactly 350,000 bytes together | Accepted, if otherwise valid (P9.17) |
| Inscription whose metadata and body are over 350,000 bytes together, or an Original whose log through the anchoring entry and current version are over it | Rejected; the SDK refuses to anchor or publish (P9.17) |
| Inscription whose body’s digest or size differs from its last entry’s resource descriptor | Rejected (P9.17) |
| Inscription whose content type differs from its last entry’s resource `mediaType`, or that has a content encoding | Rejected (P9.17) |
| SDK about to inscribe an entry | Tells the author the inscribed version, name and metadata become public and permanent, and warns when the version is active content (P9.18) |
| Inscription after the anchor whose entry changes only the name or metadata | Body is the unchanged current version, inscribed again (P9.17) |
| Inscription metadata containing a CBOR tag, byte string, indefinite-length item, non-text map key or duplicate key | Rejected (P14.12) |
| Entry whose metadata holds a non-integer number, inscribed as a half-, single- or double-precision float | Accepted; hashes and proof checked over its JCS form (P14.3, P14.12) |
| Inscription metadata holding a NaN, infinite or negative-zero float, or one above P14.3’s bound | Rejected (P14.12) |
| Inscription metadata split over several data pushes | Concatenated, then decoded (P14.12) |
| Entry carried in inscription metadata | Hashes and proof checked over its JCS form; key order in the CBOR map does not matter (P14.3, P14.12) |
| Two editors with grants each sign an entry within their grant, on successive heads, with no author signature | Both accepted; author unchanged; each entry identifies its editor (P5.16) |
| Editor entry changing content outside its grant: the name, the metadata or the resource | Rejected (P5.16) |
| Editor entry that changes grants, aliases, lifecycle or parameters, anchors, or deactivates | Rejected (P5.16) |
| Editor entry whose author reference differs from its parent’s | Rejected (P5.16) |
| Editor entry whose parent’s state has no grant for that editor, including after revocation | Rejected (P5.17) |
| Editor entry signed before its revocation, on the revocation’s parent | Unanchored: fork, unresolved; settled by the anchor’s branch (P9.16). After anchoring: the first inscribed in chain order extending the head is accepted, the other ignored (P9.13); if the first is unverifiable, the other waits (P9.15) |
| Editor’s earlier entries after its grant is revoked | Remain valid |
| Grant naming the author DID, a DID of the author’s identity, a duplicate editor or an unlisted DID method | Rejected (P5.15) |
| Editor entry signed with a key removed from the editor DID | Unanchored: not current while the latest verified editor DID state does not list the key. Anchored: rejected if inscribed at or after the removal, unless it names a later did:vh or did:webvh editor DID version that lists the key again (P9.15), or, for a did:btco editor DID, the latest version preceding the inscription lists it (P5.13); see P5.18 |
| Editor entry after the author DID is deactivated | Unanchored: not current. Anchored: rejected if its inscription time is at or after the author DID deactivation’s versionTime, or for a did:btco author DID if the deactivation precedes it in chain order (P9.15, P5.18) |
| Editor entry inscribed on the anchoring sat by the owner | Accepted (P9.12) |
| Editor DID history missing for an editor entry | In the accepted state: incomplete identity evidence, not reported as current (P7.1, P5.6). An inscription after the anchor: unverifiable; accepted state stays current; later publications from that head wait (P9.15) |
| Two submissions with the same parent at a shared host | One accepted; the other refused with a stale-parent conflict returning the new head; refused candidate kept by the SDK, not published (P6.7, P6.8) |
| Reconciled candidate signed by an authorized signer against the new head | Accepted (P6.8) |
| Host changes or re-signs a submitted entry | Fails verification, or is not by an authorized signer (P6.7) |
| Submission retried after a lost acknowledgement, including after the head has moved on | Existing checkpoint and current head returned; no second append and no conflict (P6.7) |
| Refused candidate published elsewhere | Unanchored: fork; unresolved until anchoring. Anchored: not current; ignored (P6.6, P6.8, P9.12, P9.13) |
| Longer branch of a fork, or the branch with more signers | No winner; unresolved conflict (P6.6) |
| Entry on one branch bringing in content from another | Accepted on its branch as a single-parent entry; fork remains (P6.6) |
| did:webvh author moved under DID portability, then rotated; new entry signed with the new key naming a version after the move | Accepted; entries before the move still verify against versions before it (P5.14) |
| Moved author: package, import into a fresh reader, verify, then continue editing with the new key | Same result in the fresh reader; editing continues with authority (P5.14) |
| Moved author whose latest asset entry is an editor entry, read by a fresh reader with no package | Author freshness not established unless the moved author log is found; not reported as currently authorized (P5.14, P7.8) |
| Verification method at a version after a move whose controller is the old DID | Author binding failure (P5.3, P5.14) |
| Log with a different SCID whose `alsoKnownAs` lists the author DID | Not the author’s identity; entries signed with its keys rejected (P5.14) |
| Old author DID location redirecting to a new host | Redirect not followed; no continuity established (P5.14, P8.5) |
| Author DID that changes DID method | Not continuity; entries naming the new DID’s keys rejected (P5.14) |
| The Original’s did:webvh alias moves to another host | Unanchored: handled as an alias change by an author entry (P3.6, P9.3). Anchored: a new did:webvh alias is rejected (P9.10). Author binding unaffected either way |
| Editor entry whose proof’s verificationMethod is the author’s, or whose operation is not update | Rejected (P5.2, P5.16) |
| Editor entry naming an older editor DID version than that editor’s previous entry | Rejected (P5.8, P5.18) |
| More grants than the profile limit | Rejected; limit-exceeded (P5.15, P7.7) |
| Unanchored: verifier that reported a state learns of a competing branch | Conflict reported; not silent (P6.6) |
| Grant, before or after anchoring, naming the anchoring sat’s did:btco DID or the Original’s own did:vh | Rejected (P5.15) |
| Unanchored Original with complete evidence and signer DID histories fetched moments ago | Reported valid as of its verified checkpoint, with each signer DID versionId and fetch time; never current or currently authorized (P7.10) |
| Entry state with a member section 14 does not list, at any level | Rejected (P14.4) |
| Resource digest in a non-canonical encoding, or a multihash other than SHA-256 | Rejected (P14.7) |
| `asset.editors` present as an empty array | Rejected (P14.5) |
| Resource descriptor whose `size` or `mediaType` changes without its `digest` | Rejected (P14.6) |
| Entry whose UTF-8 line is 65,536 bytes / 65,537 bytes | Accepted / rejected (P14.13) |
| Derived DID document compared with section 14’s template | Identical for every resolver (P14.9) |
| Evidence package built twice from the same contents | Byte-identical archives (P14.10) |
| Evidence package with a compressed archive entry or a name over 255 bytes | Rejected (P14.10) |
| Transitions in the genesis entry / an entry changing the resource / any other entry | `[{from: null, to}]` / `[{from, to}]` / `[]` (P14.4) |
| Inscription after the anchor naming a signer DID version the verifier cannot verify | Reported unverifiable; the accepted state stays current and its identity evidence is not made incomplete; later publications from that head wait (P9.15) |
| Inscription after the anchor naming a did:vh or did:webvh signer version number the verifier holds under another versionId | Rejected (P9.15) |
| Inscription after the anchor naming a did:btco signer version not in that DID’s fully read history | Rejected (P5.13, P9.15) |
| Unverifiable inscription after the anchor that the verifier later verifies and accepts | Change of head reported, not silent (P9.15) |
| Moved signer with no verified entry yet, whose latest entry names a location other than its earliest | Earliest entry’s location asked first; a log from either must verify from the identity’s genesis (P5.14) |
| Signer DID log obtained from a location without support from that DID’s witnesses or watchers | Freshness not established; the report states where and when it was obtained and that a newer version may exist (P7.8) |
| Signer DID log obtained at a location whose latest version’s `id` names another location | Not used as that identity’s latest (P7.8) |
| Anchoring inscription submitted but rejected, evicted or not visible to the SDK’s Bitcoin provider | Labelled submitted, not observed; never pending Bitcoin acceptance (P9.18) |
| did:btco inscription with a delegated or content-encoded body whose own metadata is a DID document for that DID | A version of that DID (P5.13) |
| did:btco inscription on the DID’s sat whose metadata the verifier has not read | History ends before it; an entry depending on it has incomplete identity evidence, or is unverifiable if inscribed after the anchoring inscription (P5.13, P9.15) |
| Number such as `1e16` or `9007199254740993.0` in an entry | Rejected (P14.3) |
| Asset log with a carriage return, non-compact JSON or no final line feed | Rejected (P14.2) |
| Proof with a member other than those P14.8 lists | Rejected (P14.8) |
| Evidence package whose entries are unsorted or carry other dates or flags | A reader may accept it; a writer never produces it (P14.10) |
| Evidence package with a name that is not valid UTF-8, or an entry whose mode is not a regular file | Rejected (P14.10, P7.5) |
| Valid publication after an earlier unverifiable inscription extending the same head | Not accepted until the unverifiable one is resolved; reported as waiting on it (P9.15) |
| Earlier unverifiable inscription later verified as invalid, with a valid later publication from the same head | The later publication is accepted; the change of head is reported (P9.15) |
| did:btco signer gap found after an inscription was accepted | That inscription becomes unverifiable; the head is recomputed and the change reported (P9.15) |
| Entry in the anchoring inscription naming a signer version number the verifier holds under another versionId | Rejected (P9.15) |
| `name` of 1,024 / 1,025 UTF-16 code units, counting a non-BMP character as two | Accepted / rejected (P14.5) |
| Inscription after the anchor whose signer version is unverifiable but which fails a check not depending on that version | Rejected, not unverifiable (P9.15) |
| Publication extending an unverifiable inscription | Listed as waiting on it; followed under P9.13 once it is accepted, ignored if it is rejected (P9.15) |
| Single acceptance check while an unverifiable inscription is listed | Passes only with the list presented beside its result (P9.15) |
| Inscription after the anchor naming a did:vh or did:webvh version above the P14.13 limit, or after a deactivated version the verifier holds | Rejected (P9.15) |
| Signer DID log from the old host whose latest version moves the DID and removes a key | Removal applied; moved log sought; freshness not established until found (P7.8, P5.14) |
| did:btco signer whose named version is known but an earlier inscription on its sat is unread | Unverifiable; not accepted against the older state (P9.15) |
| Asset log line with whitespace outside JSON strings / with keys in non-JCS order | Rejected / accepted (P14.2) |
| Original without `anchor` whose later entry adds one; Original with `anchor` whose later entry changes or removes it | Rejected (P9.19) |
| Original with an EVM `anchor` listing a did:btco alias, or a token alias other than its derived token’s; Original without `anchor` listing a token alias | Rejected (P9.19, P14.19) |
| `anchor.chain` not `eip155:` with a canonical decimal chain ID / `minter` in mixed case | Rejected (P14.18) |
| `anchor.chain` well formed but not in the verifier’s revision of P14.22 | Unsupported, not invalid; a writer refuses to write it (P9.19, P14.22) |
| Genesis entry with an `anchor` member while P14.21 pins no contract | Unsupported, not invalid; a writer refuses to write it (P14.21) |
| Provider reporting the listed chain ID whose block 0 has another hash than P14.22 lists | Not that chain; its answers are not evidence (P9.21) |
| Code at the anchor contract address with another runtime code hash, or none, on a listed chain | Unsupported; never verified or reported as not anchored (P9.21) |
| The pinned contract deployed on a chain that is not listed | Unsupported (P9.21) |
| Publication read from a chain other than the one `anchor` names | Not a publication of the Original (P9.20) |
| Publication record present at the latest block but not in state at the finalized block | Observed, not accepted; pending (P9.22, P9.27) |
| Two providers disagree on a record, its bytes, `ownerOf` or the finalized block | Missing evidence until they agree; the lower finalized block is used (P9.20, P9.22) |
| A block accepted as finalized is replaced | `authoritative-source-changed` and a finality failure reported (P9.22) |
| Token minted, no anchoring publication | Not anchored; no owner (P9.23) |
| Two anchoring entries from different branches published on the token | The one with the lower record index is the anchor; the other a conflicting anchor; uniqueness MAY be reported as established under the chain’s finality and class (P9.24, P9.16) |
| Two publications extending the same head recorded in one block | The one with the lower record index is accepted; at most one per block (P9.13, P9.20) |
| Publication by an address that is neither the holder nor an approved operator | Reverted by the contract; no record (P14.20) |
| Upload opened and never committed | Ignored (P14.20) |
| Publication whose stored metadata and body exceed 350,000 bytes, or whose body digest, size or media type differs from the last entry’s descriptor | Rejected (P14.20, P9.17) |
| Publication that refers to an earlier record’s body, the last entry not changing the resource | Accepted; the body is checked against the descriptor as if stored (P9.25, P14.20) |
| Publication that refers to an earlier record’s body whose digest differs from the last entry’s descriptor | Rejected (P9.25, P14.20) |
| `publishSameBody` naming a later record, a record of another token, or a record that itself refers to another | Reverted by the contract; no record (P14.20) |
| Publication known only from a `Published` event, or a token whose records or bytes cannot be read from state at the finalized block | Never accepted from the event; resolution fails with missing evidence (P9.25) |
| Original with an EVM `anchor` naming a did:btco author or editor | Rejected (P9.26) |
| did:webvh signer key removed before the timestamp the publication’s record holds | Rejected, as P9.15 with the publication’s inscription time (P9.20, P9.26) |
| Token held by a contract account | That contract is the owner (P9.23) |
| Writer creating an Original with an EVM `anchor` | Author told the choice is permanent, the chain’s trust class and what it means, that publications last only while the chain’s state is kept, and the minter fixed (P9.27) |
| Report for an Original anchored on an EVM chain | Names the chain, its trust class, the token, the finalized block and the providers; never called a Bitcoin anchor (P9.27) |
| Report for an Original anchored on a `consortium` or `operator` chain | Ordering, ownership and uniqueness described as attested by the chain’s validators or operator, never as proven (P9.27) |

### Release evidence

Release evidence should include positive and negative fixtures, pinned profile decisions, deterministic results and a dependency inventory. Run fresh-process and partial-package tests. An independent verifier should reproduce the positive checkpoints before interoperability is claimed.
