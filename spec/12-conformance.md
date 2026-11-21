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
| Anchored Original whose resource versions not inscribed in full are unavailable | Log verified; those versions reported unavailable; not a verification failure (P7.4, P9.18) |
| Anchored Original read from Bitcoin alone, its newest accepted inscription carrying the full version | Current version’s bytes read from that inscription’s body and checked against its descriptor (P9.17, P9.18) |
| Anchored entry naming a did:vh or did:webvh author DID version, later than its inscription time, that lists again a key removed before that time | Accepted against the named version (P9.15) |
| Verifier learns of a valid anchoring entry earlier in chain order than the one it reported | Earlier one reported as the anchor, previous one as conflicting, owner change reported; not silent (P9.16) |
| Anchoring when the log or signer identity evidence through the signed anchoring entry does not verify | SDK refuses to inscribe (P9.18) |
| Writer checking its committed log before publishing an entry, the entry not yet on Bitcoin | Verified whole as a local copy, from genesis through that entry; reported as unverified on Bitcoin and never current (P9.18) |
| Local-copy result placed in a report given to a reader, or presented as anchored or current | Never; a local copy is only the writer’s own pre-publication check (P9.18) |
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
| Inscription whose metadata and body are over 350,000 bytes together, or an Original whose log through the anchoring entry and the body to be inscribed are over it | Rejected; the SDK refuses to anchor or inscribe (P9.17) |
| Inscription whose last entry names no preview, with a body whose digest or size differs from that entry’s resource descriptor | Rejected (P9.17) |
| Inscription whose last entry names no preview, with a body whose content type differs from the resource `mediaType`, or with a content type and no body; any inscription with a content encoding | Rejected (P9.17) |
| SDK about to inscribe an entry | Tells the author whether the preview, the full version or no body is inscribed; that this body, the name and the metadata become public and permanent; what Bitcoin will not hold; and the cost at the fee rate it will use; warns when the body is active content (P9.18) |
| Inscription after the anchor whose entry changes only the name or metadata, its parent naming a preview | The entry carries the same preview, or none; the body is that preview again, or, with none, the full version or no body (P9.17, P9.30) |
| Inscription after the anchor whose entry changes only the name or metadata, its parent naming no preview | The body is the full version again, or no body (P9.17, P9.30) |
| Inscription whose last entry names a preview, with that preview as its body, by default | Accepted; the sat shows the preview; the log verifies without the version’s bytes, which are reported unavailable unless obtained elsewhere, and never reported verified because the preview matched (P9.17, P9.18, P9.30, P7.4) |
| Inscription whose last entry names no preview, with the full version as its body | Accepted; the body is checked against the resource descriptor (P9.17) |
| Inscription whose last entry names no preview, with no body and no content type | Accepted; the entries are in its metadata only; the version is reported unavailable unless obtained elsewhere (P9.17, P7.4) |
| Writer inscribing a version whose `mediaType` is not an `image/` type, with no preview supplied | Names no preview and inscribes no body, unless the author chooses the full version (P9.30) |
| Writer inscribing a version whose `mediaType` is an `image/` type, including `image/svg+xml` and an animated image | Generates an `image/webp` preview of at most 8,192 bytes, rasterising an SVG, and names it in the entry, unless the author chooses the full version (P9.30) |
| Writer inscribing an `image/` version it cannot decode, or cannot fit in a WebP preview of 8,192 bytes | Tells the author and names no preview; the body is the full version or none (P9.30) |
| Writer adding a version whose generated preview is byte-identical to its parent’s | Makes another preview or names none; never signs the parent’s `preview` unchanged (P9.30) |
| Entry naming a preview of a media type other than `image/webp` for a version whose `mediaType` is an `image/` type, including an `image/svg+xml` preview of an `image/svg+xml` version, or one whose type is `Image` in another case | Rejected (P9.30) |
| Author-supplied preview of any media type for a version that is not an image | Accepted, within 8,192 bytes (P9.30) |
| Preview of 0 bytes | Rejected; a writer never names one (P9.30, P14.5) |
| Preview of 8,192 / 8,193 bytes | Accepted / the writer refuses to sign an entry naming it, and a verifier rejects such an entry and any inscription carrying it (P9.30, P14.5, P14.13) |
| Inscription whose last entry names a preview, with a body whose digest, size or content type differs from it, including the full version or no body | Inscription rejected, as a body that does not match always was; its entries not accepted from it; not an anchor if it is the anchoring inscription; state unchanged (P9.17) |
| `preview` in an entry whose `aliases` list no did:btco DID: an entry of an Original for which no anchoring entry has been signed, or an entry before the anchoring entry in an anchoring inscription | Rejected, not ignored; a writer never writes it (P9.30, P14.5) |
| Entry after anchoring that names a preview, signed but never inscribed | Not current (P9.12); its preview is not shown on Bitcoin (P9.30) |
| Anchoring entry naming a preview, its parent naming none | Accepted (P9.30) |
| Entry after the anchor that changes the resource and names a preview of the new version, inscribed with it as its body | Accepted; the sat shows the new preview (P9.17, P9.30) |
| Entry that changes the resource’s digest and carries its parent’s `preview` unchanged | Rejected; it names a preview of the new version, or none (P9.30) |
| Entry other than the anchoring entry that does not change the resource and names a preview other than its parent’s, or names one when its parent named none | Rejected (P9.30) |
| Editor entry whose grant allows the resource, adding a version and naming its preview / editor entry that changes or removes the preview without a grant that allows the resource, or without changing the resource | Accepted / rejected (P5.16, P9.30) |
| `preview` whose `mediaType` has a parameter, whose digest is not in P14.7’s encoding, or with a member other than `mediaType`, `size` and `digest` | Rejected (P14.5, P14.6, P14.7) |
| Derived DID document of an entry that names a preview | Same as without it; the preview is not in the document, and does not advance the version (P14.9, P4.4, P9.30) |
| Writer asked to make a carried file from a preview | Refused; a preview is not a resource version (P7.16, P9.30) |
| Deactivation inscribed after the anchor, its parent naming a preview | Accepted carrying that preview, with it as the body, or carrying none, with the full version or no body (P6.5, P9.17, P9.30) |
| Inscription whose last entry names no preview and whose version’s `size` is 0, with an empty body and that `mediaType` as content type | Accepted; an empty body is a body, not an absent one (P9.17, P14.12) |
| Originals inscription that names a delegate, with or without a body | Rejected as a whole (P9.17, P14.12) |
| Evidence package of an anchored Original whose entries name previews | Complete without the previews; a writer puts no preview under `resources/` and lists none in `missing` (P14.10, P9.30) |
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
| Submission whose entry is historically authorized only under the signer DID evidence the host holds | Refused with the reason; nothing appended; the SDK keeps the refused candidate with the reason and does not resubmit, package or publish it (P6.7, P6.8, P7.9) |
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
| Entry whose JCS form is 65,536 / 65,537 UTF-8 bytes, in `did.jsonl`, an inscription or any carrier | Accepted / rejected (P14.13) |
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
| Single acceptance check while an unverifiable inscription is listed | Passes only with the list presented beside its result (section 7, P9.15) |
| Inscription after the anchor naming a did:vh or did:webvh version above the P14.13 limit, or after a deactivated version the verifier holds | Rejected (P9.15) |
| Signer DID log from the old host whose latest version moves the DID and removes a key | Removal applied; moved log sought; freshness not established until found (P7.8, P5.14) |
| did:btco signer whose named version is known but an earlier inscription on its sat is unread | Unverifiable; not accepted against the older state (P9.15) |
| Asset log line with whitespace outside JSON strings / with keys in non-JCS order | Rejected / accepted (P14.2) |
| Carried file whose bytes, with the carrier removed, are the version its log’s last entry names, signer DIDs resolved | Log verified, version verified, valid as of that checkpoint; never current unless anchored (P7.12, P7.14) |
| Carried file whose remaining bytes differ by one byte, or by changed line endings | Bytes not verified; overall file verification fails with an explicit reason such as file digest mismatch, and verified proofs shown as detail do not make it a pass; MAY report the log it carries only with a statement that the file is not a version of that Original (P7.12) |
| Carried file opened or previewed without the caller’s opt-in to resolve | No DID resolved; proofs unchecked (P7.13, P8.5) |
| Carried file read offline, signer DID not resolvable | Proofs unchecked; log and version not reported as verified; identity evidence and author binding incomplete, never a pass (P7.13, P5.6) |
| Forged log naming a real author DID, appended to bytes matching its last descriptor | Proofs fail once the DID is resolved; offline, nothing reported as verified (P7.13) |
| Carried log whose last entry names a media type with a different carrier or comment syntax, or none | No valid carrier (P7.12, P14.14) |
| `mediaType` `image/PNG` / `application/javascript` / `application/pdf` / `application/vc+json` | Trailer / no carrier / no carrier / no carrier (P14.14) |
| Trailer whose length exceeds the file size less 24, or whose footer is altered by end-of-line conversion | No trailer (P14.15) |
| Trailer `length` 16,777,192 / 16,777,193 | Trailer / no trailer (P14.14, P14.15) |
| File of 16–23 bytes ending in the footer magic | No trailer (P14.15) |
| Trailer entry line of 70,000 bytes whose JCS form is 60,000 bytes | Within the entry limit, which is measured over the JCS form in every format (P14.14, P14.13) |
| Trailer whose log breaks P14.2 | Trailer found; log invalid (P14.15) |
| Text block whose last line has no line end | Accepted (P14.16) |
| Text block with a blank, unprefixed or non-JSON line between the markers, or no entry line | Text block with an invalid log, not content (P14.16) |
| Text block at the very start of the file, with no line feed before it | No carrier (P14.16) |
| Writer asked for a text block on YAML ending in a block scalar, or Markdown ending in an unclosed fence | Refused (P14.16) |
| Text file with an earlier text block followed by content | The earlier block is content, not a carrier (P14.16) |
| Text block with CR LF line ends, followed by blank lines and spaces | Accepted; the trailing whitespace is part of the carrier (P14.16) |
| Text block in a CR LF file whose separator is CR LF, not a single LF | The added CR is left in the remaining bytes: digest mismatch, and file verification fails (P14.16, P7.12) |
| Text block entry line with `\u` escapes / with a raw non-ASCII character, closer, or `--` inside a `<!--` comment | Accepted, checked over its JCS form / no carrier (P14.16) |
| Writer asked for a text block on a version that is not valid UTF-8 | Refused (P14.16, P7.15) |
| JSON member that is the root object’s last, with entries reformatted and keys reordered | Accepted; entries checked over their JCS form (P14.17) |
| JSON member that is not the root object’s last, as after a tool reorders members | Found; its log verified and reported separately; the file not verified as a version, because removing a member that is not last is not yet defined (P7.12, P14.17) |
| Two root members named `originalLog`, including one spelled with escapes | Rejected; neither is chosen (P14.17) |
| Member named `originalLog` nested below the root | Not a JSON member (P14.17) |
| JSON document with a 64-bit integer or a nested duplicate key outside the member | The member is still found; only the entries are subject to P14.3 (P14.17) |
| JSON document whose root is an array, or has a root member named `originalLog` anywhere | Writer refuses (P7.15, P14.17) |
| JSON last root member `originalLog` whose value is `5` or `[1]` | JSON member with an invalid log (P14.17) |
| JSON document `{"originalLog":[…]}` with a leading byte order mark / with no other member | Member found; the version is the byte order mark and `{}` / `{}` (P14.17) |
| JSON document nested 1,025 levels outside the entries, counting the root object as level 1 | No JSON member (P14.17) |
| Writer asked to carry a draft, a version other than the last entry’s, or, after anchoring, an entry not accepted on the anchor | Refused (P7.15) |
| Writer about to write a carrier | User told what the file discloses first; a JSON carrier says the data gains a member (P7.15) |
| Carried file presented by an SDK or UI | Never labelled an evidence package or complete (P7.11) |
| Carrier added or removed | No entry signed; the version is unchanged (P7.16) |
| Carried log older than the reader’s local history, or on another branch | Local history kept; a branch reported as a conflict (P7.14, P7.5) |
| Anchored Original whose carried log disagrees with its anchor | State from the anchor; the carried log is not preferred (P7.14, P9.13) |
| Anchored Original’s carried log read without access to the anchor | Missing evidence; at most the entries before the anchoring entry valid as of the checkpoint before it; the anchoring entry and later entries not checked against the anchor (P7.14, P3.3, P9.15) |
| Carried log that holds no anchoring entry | Historical checkpoint, valid as of its last entry; no statement about later anchoring (P7.14) |
| Writer asked to inscribe a carried file as a body | The carrier is removed first; the body is the version’s bytes (P7.16, P9.17) |
| Writer making a carried file from the body and entries of an accepted inscription whose body is the full version | Allowed, as for any accepted checkpoint (P7.16, P7.15) |
| Complete evidence package of an anchored Original, read without access to the anchor | Missing evidence; at most the entries before the first anchoring entry reported; the package not preferred to the anchor (P7.1, P7.14) |
| Complete evidence package of an Original with a did:btco signer, read offline | That signer’s history is not in the package; identity evidence incomplete until it is read from Bitcoin (P7.1, P14.10, P5.6) |
| `aliases` holding a DID of any other method, or the same DID twice | Rejected (P14.5) |
| Grant naming the Original’s did:webvh alias | Rejected (P5.15) |
| Signer asked to sign input that is not a well-formed Originals entry, or without showing the signer, the Original, the operation and the resource changes | Refused (P5.11) |
| Exact-checkpoint resolution of a checkpoint the resolver cannot supply | Reports why; the latest checkpoint is not substituted (P3.2) |
| Report for an anchored Original | States the confirmation depth relied on and whether more than one independent index agreed on the sat’s location (P9.5, P9.11) |
| Genesis parameters other than exactly `method` and `scid`; a later entry with a non-empty parameters object that is not a deactivation; a null parameter value | Rejected (P14.1) |
| Plaintext metadata, base64 content or raw storage | Never labelled encrypted (P8.2) |
| Carried file imported, then read again with no separate opt-in to resolve | No resolver request; the import is not an opt-in (P7.13) |
| Carried file read with the caller’s opt-in to resolve, then read again without one | The first read resolves; the second makes no resolver request (P7.13) |
| Caller’s opt-in recorded as a standing or default setting for carried files | Not an opt-in; each read needs its own (P7.13) |
| Carried checkpoint from before the anchoring entry of an Original that is now anchored | Allowed; reported as a historical checkpoint, valid as of it, with no statement about current anchoring (P7.14, P7.15) |
| Carried file with a wrong or missing file name extension | The extension is only a hint; the other carriers are tried, and the carrier found is checked against the verified descriptor’s `mediaType` (P14.14) |
| Descriptor `mediaType` with a parameter, such as `text/plain; charset=utf-8` | Rejected; the parameter is not ignored (P14.6, P14.14) |
| Text block whose closer line is not directly preceded by the END marker, or whose BEGIN marker in a block comment is not directly preceded by the opener | No carrier (P14.16) |
| HTML version ending inside an open `script`, `style` or `textarea` element / inside an open `pre` element | Writer refuses / writer accepts; the block parses as a separate comment (P14.16) |
| Shell or C-family version whose last line ends in a line continuation | Writer refuses (P14.16) |
| HTML version ending inside an open tag, a processing instruction, or an open `iframe`, `noembed` or `noframes` element | Writer refuses; the appended block would not parse as a separate comment (P14.16) |
| Version of a listed type whose ending its format’s parser leaves outside any comment, string, tag or raw-text context | Writer adds the block; it parses as a separate comment (P14.16) |
| Writer with no parser for the version’s syntax asked for a text block | Refused (P14.16) |
| Signed anchoring entry not inscribed on the sat it names | Not anchored (P9.10, P9.12) |
| Two entries whose `versionTime` values differ by less than one millisecond, or a `versionTime` with more than three fractional digits | Rejected (P14.2) |
| Genesis of a set Original signed by every member / with one member’s proof or reference missing | Accepted / rejected (P5.19) |
| Author entry of a set Original signed by exactly the threshold of its parent entry’s set / by one member fewer | Accepted / rejected (P5.20) |
| Author entry of a set Original whose `author` array names a DID outside the parent entry’s set that the entry does not add, even with a valid proof | Rejected (P5.20, P5.4) |
| Author entry that adds a member to `authors` without that member’s proof / with it, and the threshold of the parent entry’s set | Rejected / accepted; the added member does not count toward the threshold (P5.20) |
| Entry with a proof too many or too few for its signer references, proofs out of `author` order, a proof whose `verificationMethod` differs from its reference, or one invalid proof beside a threshold of valid ones | Rejected (P5.2, P5.22, P14.8) |
| Grant whose editor DID is a member of `authors` in the same state, or a did:webvh with the same SCID as a member | Rejected (P5.15) |
| Conversion of a single-author Original signed by the author and every other new member / whose `authors` omits the author / missing a new member’s proof | Accepted, a set Original from that entry on / rejected / rejected (P5.21) |
| Unanchored author entry of a set Original, one of whose signers’ keys is later removed from its DID: signers still passing P7.9 at or above the threshold / below it | Not labelled for the removal / historically authorized only (P5.23, P7.9) |
| Anchoring entry of a set Original signed by fewer members than the threshold, including one inscribed and paid for by the sat holder | Rejected; not an anchor (P5.20, P9.10, P9.12) |
| Derived DID document of a set Original, including a set of one | `controller` is the array `authors.dids` at that version (P14.9) |
| Original without `authors`, including every existing test vector | `author` is one object, each entry has one proof, `controller` is a string; entries and results byte-identical to before (P5.2, P14.4, P14.8, P14.9) |
| `authors` with unsorted or duplicate `dids`, threshold 0 or above the member count, more than 32 members, or a member that is the Original’s did:vh, an alias, or a did:btco DID whose sat is the anchoring sat; a later entry that removes `authors` | Rejected (P5.19, P14.5, P14.13) |
| `author` that is an array in an Original without `authors`, or an object in a set Original; an array unsorted, with a DID twice, or not listing every member in a genesis entry | Rejected (P5.19, P14.4) |
| Editor entry of a set Original whose `author` array differs from its parent entry’s | Rejected (P5.16) |
| Author entry of a set Original inscribed after the anchor, one of whose signers’ keys was removed before its inscription time though the others meet the threshold / one of whose signers’ named versions cannot be verified | Rejected / unverifiable (P5.23, P9.15) |
| Editor entry of a set Original when fewer than the threshold of members’ DIDs are not deactivated: unanchored / inscribed after the anchor | Historically authorized only / rejected (P5.23, P5.18) |
| Editor entry of a child Original with no direct grant, allowed by a grant in the parent Original’s `editors` at the version the entry pins | Accepted; reported as authorized by an inherited grant, with the parent version (P5.24) |
| Child editor entry allowed by an inherited grant that the parent Original’s latest verified state later removes or narrows | Valid; historically authorized only (P5.26) |
| Child entry whose pin is older than its parent entry’s pin, or on another branch of the parent’s log | Rejected (P5.24) |
| Child Original verified without the parent Original’s log through a pin | Incomplete; parent evidence reported missing; never a pass (P5.25) |
| Pin naming a versionId absent from the parent’s verified log, which reaches that version number: parent not anchored / parent anchored, pin outside its accepted history | Incomplete, the pinned parent version reported missing, never a pass / rejected (P5.25) |
| Child editor entry relying on an inherited grant at a pin that names the parent’s deactivation | Rejected; the parent grants nothing there (P5.25) |
| Child editor entry authorized only by an inherited grant when the parent Original has divergent valid branches | Historically authorized only (P5.26) |
| `parent.did` equal to the child’s own did:vh; a later entry that adds or removes `parent` or changes `parent.did` | Rejected (P5.24) |
| Child entry inscribed after the child’s anchor, while the parent is anchored, pinning a parent version older than the parent’s accepted head at the inscription / pinning that head | Rejected / accepted (P5.27) |
| Inherited grant naming the child’s author DID, a member of its signer set, or a did:btco DID whose sat is the child’s anchoring sat | Authorizes nothing (P5.24) |
| Child entry signed by the parent Original’s author, a member of its signer set or its sat holder, with no grant covering the change | Rejected; the parent contributes grants only (P5.24) |
| Child editor entry relying on a grant that the parent itself inherits from its own parent | Rejected; only the parent’s own `editors` are inherited (P5.24) |
| Child editor entry under a metadata-only grant that also advances the pin | Accepted; advancing the pin needs no grant (P5.16, P5.24) |
| Evidence package of a child Original that omits the parent’s log through the highest pin | Partial; lists a `parent` missing item (P7.1, P14.10) |
| Editor entry under a `paths` scope whose changed paths all match a pattern / one changed path matches none | Accepted / rejected, listing the path (P5.28, P5.29) |
| Rename from a path inside a `paths` scope to one outside it | Rejected; both paths are touched (P5.29) |
| Change of a path’s file mode only, in a media type whose path view records the mode | The path is touched (P5.29) |
| Editor entry under an `items` scope that adds, edits or removes an item, with that operation listed / not listed | Accepted / rejected (P5.29) |
| Scope of an unknown type; a known type for a media type whose view the verifier lacks; or missing bytes the check needs | Scope unchecked; not verified as authorized; result incomplete, neither a pass nor a rejection (P5.28) |
| Entry inscribed after the anchor whose scope is unchecked | Unverifiable (P5.28, P9.15) |
| Grant with `scope` and `resource: false` | Rejected (P5.28, P14.5) |
| Editor entry under a scoped grant that changes only the name or metadata | Scope not checked (P5.28) |
| `paths` scope with no patterns or more than 64, unsorted or duplicate patterns, a leading or trailing `/`, an empty, `.` or `..` segment, or a segment such as `a**`; `items` scope with no ops, an unknown op, or unsorted or duplicate ops | Rejected (P14.23, P5.28) |
| Pattern `docs/**` against `docs`, `docs/a` and `docs/a/b`; pattern `*.md` against `a.md` and `d/a.md` | No match, match, match; match, no match (P14.23) |

### Release evidence

Release evidence should include positive and negative fixtures, pinned profile decisions, deterministic results and a dependency inventory. Run fresh-process and partial-package tests. An independent verifier should reproduce the positive checkpoints before interoperability is claimed.
