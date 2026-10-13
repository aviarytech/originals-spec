## Conformance and negative tests

All requirements here are proposed. A conformance claim needs a named, pinned Originals profile plus the upstream VH and identity-method versions. “VH-based” alone is not an interoperable conformance target. Open profile choices are blockers to a release claim, not reasons to accept unverified evidence.

### Proposed minimum test matrix

| Test | Required result |
|---|---|
| Fresh create, edit, export and verify | Same asset checkpoint and resource versions; no private key in reader |
| Byte changed at same URL | Digest failure; no verified resource result |
| Wrong genesis or Original ID | Identifier binding failure |
| Broken chain or reordered entry | History invalid; no derived accepted state beyond failure |
| Recognized author key not in this Original’s updateKeys | Rejected; identity alone grants no edit right |
| Valid VH entry, key not a method of the named author DID | Author binding failure; VH validity cannot rescue it |
| Wrong DID method binding or relationship | Identity authorization failure |
| Old identity version with claimed old time | Witnessed: witness ordering applies. Unwitnessed: ordering unproven; no timestamp-only acceptance |
| Missing identity history | Incomplete identity evidence; no blanket verified result |
| Missing historical resource bytes | Explicit partial availability; supplied bytes still checked |
| Caller changes version counter | Counter ignored or rejected; history-derived version retained |
| Stale parent or prior digest | Conflict; no silent rebase or commit |
| Signer rejects or returns invalid proof | No partial state commit |
| Interrupted local commit | Recover prior or fully committed checkpoint; no false success |
| Identical accepted retry | Existing result or explicit duplicate; no unintended extra version |
| Resource added, removed or renamed | Rejected in baseline fixed-resource profile |
| Metadata supplied versus omitted | Replacement versus unchanged, respectively |
| Import then edit without authority | Read succeeds where evidence valid; edit authorization fails |
| Update after deactivation | Rejected; historical evidence retained |
| Old valid prefix served as current | Freshness unresolved or failed under policy, never assumed |
| Divergent valid branches | Explicit fork/conflict, no timestamp winner |
| Hosted mixed snapshot | Rejected before public result is marked verified |
| Bitcoin failure, retry or reorganization | Durable boundary follows adapter policy, not pending intent |
| Legacy bytes with new discriminator | Rejected; legacy verification remains separate |
| Ordinary entry signed by a key removed from the author DID | Witnessed: refused by witnesses and not current. Unwitnessed: historically authorized, ordering unproven, never current |
| Rotation entry by a removed key to a key in the latest author DID | Accepted |
| Rotation entry to a key not in the referenced author DID version | Rejected |
| Rotation entry that also changes state or another parameter, or rotates to its own signing key | Rejected as a rotation; checked as an ordinary entry |
| Witnessed rotation entry referencing an older DID version, to a key the latest author DID no longer lists | Refused by witnesses |
| Entry changes the witness parameter to a list the author DID does not declare | Rejected |
| Entry sets the witness parameter to an empty object after witnesses are active | Rejected |
| Entry after witness activation without enough witness proofs, whatever the deployment | Not current |
| Entries before witness activation, signed by a key later removed | Ordering unproven; not made current by activation |
| Any entry after the author DID is deactivated | Refused by witnesses; Original reported as non-current |
| Entry sets updateKeys to an empty list or to more than one key | Rejected |
| Author DID versionId absent from signed state | Rejected |
| Verification method from another DID, with a different controller, or under authentication only | Author binding failure |
| Key expressed as JWK or a different multikey encoding | Author binding failure |
| Later entry names a different author DID, or an older author DID version than its predecessor | Rejected |
| Two proofs in the proof array | Rejected |
| Stale author DID history served with a current asset log | Identity freshness not established; not reported as currently authorized |
| VH-valid log that fails Originals rules, read through a generic resolver | Not reported as Originals-verified |
| Lifecycle status deactivated without VH deactivated: true, or the reverse | Rejected |
| Older prefix imported over a newer local history | Local current state not rolled back |
| Log file larger than the profile cap | Distinct limit-exceeded failure |
| Entry with duplicate JSON keys or an unsigned state field | Parse failure; no verified state |
| Resource digest with an unlisted algorithm | Unsupported-profile failure |
| Locator resolving or redirecting to a private address | Fetch refused; reported as unavailable |
| History or identity history beyond profile limits | Distinct limit-exceeded failure |
| Archive with a symbolic link, `..` path or duplicate entry | Rejected before extraction |
| SVG resource containing script, or a name containing markup | Not executed on the platform origin or in a client |

### Release evidence

Release evidence should include positive and negative fixtures, pinned profile decisions, deterministic results and an active-dependency inventory without CEL. Run fresh-process and partial-package tests. An independent verifier should reproduce the positive checkpoints before interoperability is claimed.
