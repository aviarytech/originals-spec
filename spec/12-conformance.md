## Conformance and negative tests

All requirements here are proposed. A conformance claim needs a named, pinned Originals profile plus the upstream VH and identity-method versions. “VH-based” alone is not an interoperable conformance target. Open profile choices are blockers to a release claim, not reasons to accept unverified evidence.

### Proposed minimum test matrix

| Test | Required result |
|---|---|
| Fresh create, edit, package and verify | Same asset checkpoint and resource versions; no private key in reader |
| Byte changed at same URL | Digest failure; no verified resource result |
| Wrong genesis or Original ID | Identifier binding failure |
| Broken chain or reordered entry | History invalid; no derived accepted state beyond failure |
| Valid key of an identity other than the Original’s author DID | Rejected; identity alone grants no edit right |
| Valid VH entry, key not a method of the named author DID | Author binding failure; VH validity cannot rescue it |
| Wrong DID method binding or relationship | Identity authorization failure |
| Old identity version with claimed old time | Unanchored: ordering unproven; no timestamp-only acceptance. Anchored: checked against the author DID state at the inscription time (P9.15) |
| Missing identity history | Incomplete identity evidence; no blanket verified result |
| Missing historical resource bytes | Explicit partial availability; supplied bytes still checked |
| Caller changes version counter | Counter ignored or rejected; history-derived version retained |
| Stale parent or prior digest | Conflict; no silent rebase or commit |
| Signer rejects or returns invalid proof | No partial state commit |
| Interrupted local commit | Recover prior or fully committed checkpoint; no false success |
| Identical accepted retry | Existing result or explicit duplicate; no unintended extra version |
| Resource added, removed or renamed | Rejected in baseline fixed-resource profile |
| Metadata supplied, omitted or null | Replacement, unchanged or removed, respectively |
| Name set to null | Rejected |
| Update that leaves a resource’s digest unchanged | That resource’s version does not advance |
| Import then edit without authority | Read succeeds where evidence valid; edit authorization fails |
| Update after deactivation | Rejected; historical evidence retained |
| Old valid prefix served as current | Freshness unresolved or failed under policy, never assumed |
| Divergent valid branches not settled on Bitcoin | Unresolved conflict; every branch reported; none current; no timestamp winner |
| Hosted mixed snapshot | Rejected before public result is marked verified |
| Anchoring sat moved to a new holder | Owner reported as the new holder; author unchanged |
| After anchoring, author-signed entry not inscribed on the sat | Not current |
| Inscription on the anchoring sat not signed by the author, including by the owner | Rejected; state unchanged |
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
| Entry signed by a key removed from the author DID | Unanchored: historically authorized, ordering unproven, never current. Anchored: rejected if its inscription time is at or after the removal’s versionTime, unless it names a later did:vh or did:webvh version that lists the key again (P9.15) |
| Accepted anchored entry whose key the author DID later removes | Remains current |
| Author DID deactivated after an Original is anchored | Accepted state remains current; entries inscribed later rejected |
| Anchored entry naming a did:vh or did:webvh author DID version whose versionTime is later than its inscription time | Checked against the named version (P9.15) |
| Block whose timestamp is earlier than an ancestor’s | Inscription time is the greatest ancestor timestamp |
| Author DID history missing through an inscription time | Incomplete identity evidence; not reported as current |
| Author DID version published with a versionTime before an already accepted inscription it would reject | Retroactive revocation conflict reported; result not silently changed |
| Any entry after the author DID is deactivated | Not anchored: Original reported as non-current. Anchored: accepted state remains current; entries inscribed later rejected (P9.15) |
| Entry that sets updateKeys or nextKeyHashes | Rejected |
| Asset log entry that sets the witness parameter to anything other than an empty object | Rejected |
| Entry signed by a key the author DID added, with no asset log entry for the change | Accepted |
| Author key not under assertionMethod in the author DID | Author binding failure |
| Author key that is also an updateKey of the author DID’s own log | Author binding failure |
| Author DID versionId absent from signed state | Rejected |
| Verification method from another DID, with a different controller, or under authentication only | Author binding failure |
| Key expressed as JWK or a different multikey encoding | Author binding failure |
| Later entry names a different author DID, or an older author DID version than its predecessor | Rejected |
| Author DID using a method the profile does not list | Rejected |
| Anchored Original with a did:btco author DID, verified with no author DID host | Author binding checked against inscribed DID versions in chain order |
| did:btco author DID version inscribed after an Originals inscription in the same block | Not in effect for that inscription |
| Anchoring entry naming the author DID’s own did:btco sat | Rejected |
| Inscription on a did:btco author DID’s sat after its deactivation | Not a version; author DID remains deactivated |
| Anchored Original whose did:vh or did:webvh author DID log is unavailable | Incomplete identity evidence; not reported as current |
| Two proofs in the proof array | Rejected |
| Stale author DID history served with a current asset log | Identity freshness not established; not reported as currently authorized |
| VH-valid log that fails Originals rules, read through a generic resolver | Not reported as Originals-verified |
| did:webvh whose document points to a did:vh that does not list it | Not an alias; no Originals result through that did:webvh |
| Asset state lists a did:webvh whose document points elsewhere | Alias not confirmed; the did:vh still verifiable directly |
| Served DID document for the did:vh that differs from the one derived from the log | Ignored; the derived document is used |
| Derived DID document | Same for every resolver; `controller`, `alsoKnownAs` and `#files` match the author DID and asset state |
| Plain did:vh resolver given an Originals log | Rejected by its unrecognised `method` value |
| Later entry that moves the log between plain did:vh and the Originals extension | Rejected |
| Proof using a cryptosuite other than `eddsa-jcs-2022` or `bip340-jcs-2025` | Rejected |
| Entry whose state is a delta rather than the full asset state | Rejected |
| Inscription carrying a compact delta | Decoded to the full entry; hashes and proofs checked over the decoded entry |
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
| Inscription of the Originals media type on the anchoring sat carrying did:btco DID-document metadata | Rejected |
| did:btco DID document inscribed on the anchoring sat by its holder | Ignored for the Original; a generic did:btco result is not reported as Originals verification |
| Inscription carrying more than one entry | Rejected |
| Anchored Original whose entries before the anchor are unavailable from any copy | Resolution fails; missing evidence |
| Copy of the history before the anchor that the anchoring entry does not extend | Not this Original’s history |
| Anchoring sat whose inscriptions cannot be read in full | Resolution fails |
| Inscription with no confirmations | Reported as observed; not in the accepted log |
| Reorganization that removes an accepted inscription | Reported with `authoritative-source-changed`; not silent |
| Inscribed entry naming a did:btco author DID version inscribed in a later block | Rejected; the version was not in effect (P5.13) |
| Inscribed entry naming a did:btco author DID version inscribed later in the same block | Rejected (P5.13) |
| Inscribed entry naming a did:btco author DID version inscribed earlier in the same block, whose key it holds | Accepted (P5.13) |
| Entry before the anchor naming a did:btco author DID version inscribed after the anchoring inscription | Rejected (P5.13) |
| Inscribed entry naming a preceding did:btco version whose key a later preceding version removed | Rejected; the key must hold in the latest preceding version (P5.13) |
| Anchored Original whose historical resource bytes are unavailable | History valid; content availability partial for the affected resources (P7.4, P9.18) |
| Anchored entry naming a did:vh or did:webvh author DID version, later than its inscription time, that lists again a key removed before that time | Accepted against the named version (P9.15) |
| Verifier learns of a valid anchoring entry earlier in chain order than the one it reported | Earlier one reported as the anchor, previous one as conflicting, owner change reported; not silent (P9.16) |
| Anchoring when the history or signer identity evidence through the signed anchoring entry is incomplete or does not verify | SDK refuses to inscribe; missing historical resource bytes instead make the package partial, and the author is told; a package that verifies is labelled pending Bitcoin acceptance until the inscription is confirmed (P9.18) |

### Release evidence

Release evidence should include positive and negative fixtures, pinned profile decisions, deterministic results and a dependency inventory. Run fresh-process and partial-package tests. An independent verifier should reproduce the positive checkpoints before interoperability is claimed.
