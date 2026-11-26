## Conformance tests

These rows were in the core’s test matrix (§12 of the core) at revision aeab90a. Each has a stable ID of the form `A-<number>`: a row keeps its ID when rows are added or moved, a new row takes the next unused number, and the number of a removed row is never reused.

| ID | Test | Required result |
|---|---|---|
| A-001 | Original whose state has no `readers` list, requested without a read request | Served (P8.6) |
| A-002 | Private Original’s log, entries, resource versions, bundle or carried file, requested without an accepted read request, including through `#files` or by digest | Refused; a resolver or verifier reports missing evidence, not invalid evidence (P8.7, P3.3) |
| A-003 | Private Original with an empty `readers` list, requested by its author or an editor with an accepted read request / by any other DID | Served / refused (P8.6) |
| A-004 | Private set Original requested by any member of its signer set with an accepted read request | Served (P8.6, P5.30) |
| A-005 | Private Original requested by a DID in `readers` with an accepted read request | Served (P8.6, P8.9) |
| A-006 | `readers` naming the author DID, a member of the signer set, an editor DID, a DID twice, a DID of a method P5.8 does not list such as did:key, the Original’s did:og, one of its aliases, or a did:btco DID of the anchoring sat | Rejected (P8.6) |
| A-007 | Editor entry that adds, changes or removes `readers` | Rejected (P8.6, P5.16) |
| A-008 | `readers` with 128 / 129 read grants, or a read grant with a member other than `did`, including a `paths` or `items` scope | Accepted / rejected (P14.5, P14.13, P8.14) |
| A-009 | Read request whose `domain` is another origin, whose challenge the host did not issue or already accepted, that has expired, or whose `expires` is more than five minutes after `created` | Refused (P8.9, P14.24) |
| A-010 | Read request signed with a key listed only under `assertionMethod`, or with a key that the newest version of the DID that the host holds no longer lists | Refused (P8.9) |
| A-011 | Requester submitting a DID history older than the newest the host has seen for that DID | Refused (P8.9) |
| A-012 | Requester whose read grant an author entry removes, using a session issued before the host accepted that entry | Refused from the moment the host accepts it (P8.8) |
| A-013 | Host holding two valid branches of an unanchored Original, one of whose heads no longer permits the requester | Refused (P8.8) |
| A-014 | Host holding no verified state of a private Original | Refuses every requester (P8.8) |
| A-015 | Host’s decision that a requester may read | Never reported as showing that a grant is current (P8.8, P7.10) |
| A-016 | Child Original, requested by a DID the parent permits / whose read grant the parent has since revoked, though the child’s entries pin an earlier parent version | Served / refused (P8.10) |
| A-017 | Child editor entry relying on an inherited grant that the parent has since revoked | Still valid, historically authorized only (P5.26); reads under that editor’s DID follow P8.10 |
| A-018 | Requester permitted to read a child but not its parent | Served the parent’s log through the child’s highest pin; refused the parent’s resource versions and later entries (P8.10, P5.25) |
| A-019 | Child Original whose state has `readers` | Rejected (P8.10) |
| A-020 | Child Original whose parent’s state the host does not hold | Served only to the child’s author or signer set members and its editors (P8.10) |
| A-021 | Digest named only by private Originals the requester may not read / also named by a public Original | Answered exactly as a digest the host does not hold / served (P8.11) |
| A-022 | Session credential sent automatically by a browser to an origin that serves active content | Not permitted (P8.9, P9.7) |
| A-023 | Writing a bundle or carried file of a private Original for sharing | User told that the recipient can read all of it and that no host’s read grants apply (P8.12) |
| A-024 | Revoking a read grant after a bundle was shared | Bundle still readable; the SDK does not describe the revocation as withdrawing it (P8.12) |
| A-025 | Anchoring a private Original | Author told that the whole log, its grants and the inscribed body become public permanently; not signed without explicit confirmation (P8.13) |
| A-026 | Resource version of an anchored private Original that no inscription carries | Served only under P8.7 (P8.13) |
| A-027 | Genesis of a set Original signed by every member / with one member’s proof or reference missing | Accepted / rejected (P5.19) |
| A-028 | Author entry of a set Original signed by exactly the threshold of its parent entry’s set / by one member fewer | Accepted / rejected (P5.20) |
| A-029 | Author entry of a set Original whose `author` array names a DID outside the parent entry’s set that the entry does not add, even with a valid proof | Rejected (P5.20, P5.4) |
| A-030 | Author entry that adds a member to `authors` without that member’s proof / with it, and the threshold of the parent entry’s set | Rejected / accepted; the added member does not count toward the threshold (P5.20) |
| A-031 | Entry with a proof too many or too few for its signer references, proofs out of `author` order, a proof whose `verificationMethod` differs from its reference, or one invalid proof beside a threshold of valid ones | Rejected (P5.2, P5.22, P14.8) |
| A-032 | Grant whose editor DID is a member of `authors` in the same state, or a did:webvh with the same SCID as a member | Rejected (P5.15) |
| A-033 | Conversion of a single-author Original signed by the author and every other new member / whose `authors` omits the author / missing a new member’s proof | Accepted, a set Original from that entry on / rejected / rejected (P5.21) |
| A-034 | Unanchored author entry of a set Original, one of whose signers’ keys is later removed from its DID: signers still passing P7.9 at or above the threshold / below it | Not labelled for the removal / historically authorized only (P5.23, P7.9) |
| A-035 | Anchoring entry of a set Original signed by fewer members than the threshold, including one inscribed and paid for by the sat holder | Rejected; not an anchor (P5.20, P9.10, P9.12) |
| A-036 | Derived DID document of a set Original, including a set of one | `controller` is the array `authors.dids` at that version (P14.9) |
| A-037 | Original without `authors`, including every existing test vector | `author` is one object, each entry has one proof, `controller` is a string; entries and results byte-identical to before (P5.2, P14.4, P14.8, P14.9) |
| A-038 | `authors` with unsorted or duplicate `dids`, threshold 0 or above the member count, more than 32 members, or a member that is the Original’s did:og, an alias, or a did:btco DID whose sat is the anchoring sat; a later entry that removes `authors` | Rejected (P5.19, P14.5, P14.13) |
| A-039 | `author` that is an array in an Original without `authors`, or an object in a set Original; an array unsorted, with a DID twice, or not listing every member in a genesis entry | Rejected (P5.19, P14.4) |
| A-040 | Editor entry of a set Original whose `author` array differs from its parent entry’s | Rejected (P5.16) |
| A-041 | Author entry of a set Original inscribed after the anchor, one of whose signers’ keys was removed before its inscription time though the others meet the threshold / one of whose signers’ named versions cannot be verified | Rejected / unverifiable (P5.23, P9.15) |
| A-042 | Editor entry of a set Original when fewer than the threshold of members’ DIDs are not deactivated: unanchored / inscribed after the anchor | Historically authorized only / rejected (P5.23, P5.18) |
| A-043 | Editor entry of a child Original with no direct grant, allowed by a grant in the parent Original’s `editors` at the version the entry pins | Accepted; reported as authorized by an inherited grant, with the parent version (P5.24) |
| A-044 | Child editor entry allowed by an inherited grant that the parent Original’s latest verified state later removes or narrows | Valid; historically authorized only (P5.26) |
| A-045 | Child entry whose pin is older than its parent entry’s pin, or on another branch of the parent’s log | Rejected (P5.24) |
| A-046 | Child Original verified without the parent Original’s log through a pin | Incomplete; parent evidence reported missing; never a pass (P5.25) |
| A-047 | Pin naming a versionId absent from the parent’s verified log, which reaches that version number: parent not anchored / parent anchored, pin outside its accepted history | Incomplete, the pinned parent version reported missing, never a pass / rejected (P5.25) |
| A-048 | Child editor entry relying on an inherited grant at a pin that names the parent’s deactivation | Rejected; the parent grants nothing there (P5.25) |
| A-049 | Child editor entry authorized only by an inherited grant when the parent Original has divergent valid branches | Historically authorized only (P5.26) |
| A-050 | `parent.did` equal to the child’s own did:og; a later entry that adds or removes `parent` or changes `parent.did` | Rejected (P5.24) |
| A-051 | Child entry inscribed after the child’s anchor, while the parent is anchored, pinning a parent version older than the parent’s accepted head at the inscription / pinning that head | Rejected / accepted (P5.27) |
| A-052 | Inherited grant naming the child’s author DID, a member of its signer set, or a did:btco DID whose sat is the child’s anchoring sat | Authorizes nothing (P5.24) |
| A-053 | Child entry signed by the parent Original’s author, a member of its signer set or its sat holder, with no grant covering the change | Rejected; the parent contributes grants only (P5.24) |
| A-054 | Child editor entry relying on a grant that the parent itself inherits from its own parent | Rejected; only the parent’s own `editors` are inherited (P5.24) |
| A-055 | Child editor entry under a metadata-only grant that also advances the pin | Accepted; advancing the pin needs no grant (P5.16, P5.24) |
| A-056 | Bundle of a child Original that omits the parent’s log through the highest pin | Partial; lists a `parent` missing item (P7.1, P14.10) |
| A-057 | Editor entry under a `paths` scope whose changed paths all match a pattern / one changed path matches none | Accepted / rejected, listing the path (P5.28, P5.29) |
| A-058 | Rename from a path inside a `paths` scope to one outside it | Rejected; both paths are touched (P5.29) |
| A-059 | Change of a path’s file mode only, in a media type whose path view records the mode | The path is touched (P5.29) |
| A-060 | Editor entry under an `items` scope that adds, edits or removes an item, with that operation listed / not listed | Accepted / rejected (P5.29) |
| A-061 | Scope of an unknown type; a known type for a media type whose view the verifier lacks; or missing bytes the check needs | Scope unchecked; not verified as authorized; result incomplete, neither a pass nor a rejection (P5.28) |
| A-062 | Entry inscribed after the anchor whose scope is unchecked | Unverifiable (P5.28, P9.15) |
| A-063 | Grant with `scope` and `resource: false` | Rejected (P5.28, P14.5) |
| A-064 | Editor entry under a scoped grant that changes only the name or metadata | Scope not checked (P5.28) |
| A-065 | `paths` scope with no patterns or more than 64, unsorted or duplicate patterns, a leading or trailing `/`, an empty, `.` or `..` segment, or a segment such as `a**`; `items` scope with no ops, an unknown op, or unsorted or duplicate ops | Rejected (P14.23, P5.28) |
| A-066 | Pattern `docs/**` against `docs`, `docs/a` and `docs/a/b`; pattern `*.md` against `a.md` and `d/a.md` | No match, match, match; match, no match (P14.23) |
