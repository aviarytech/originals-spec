## Core rules as amended by this addition

When these rules moved out of the core (D13 of the core), the core rules and prose below were narrowed to single-author Originals with no parent, no scopes and no read grants. This section records each changed block as it stood at revision aeab90a, so that adopting this addition restores exactly that text, apart from the identifier now being `did:og`. Blocks changed only by that rename are not listed, and rules not listed here were not changed by the cut.

### §1 of the core

#### Text under “Scope and non-goals”

````text
The working basis is one separate VH history per Original, with one author, or one signer set with a threshold, for its whole life. Each change is signed by the author, by at least the threshold of the signer set, or by an editor granted permission to change named content, directly or through a parent Original (P5.15, P5.19, P5.24). The draft covers resource state, author and controller authority, local operations, portable evidence, and boundaries with storage and publication. It does not invent a new DID method, finalize a wire format or proof suite, promise encryption or key recovery, or treat Bitcoin possession as edit authority.
````

#### Text under “Scope and non-goals”

````text
VH Log and did:vh are drafts. Their algorithms, parameter behavior and resolution semantics remain dependencies to pin and test. The SDK compatibility observations refer to the SDK at main revision 00fc683: the local entry under `packages/sdk/src/v3`, the history engine under `packages/cel/src/v3`, and the full SDK in `packages/sdk/src/core/OriginalsSDK3.ts` that adds hosting and Bitcoin. The SDK is the working reference, not the authority: where this draft departs from it, section 10 says so.
````

#### Text under “Relationship to VH Log and did:vh”

````text
- Defines each entry’s state as the full [[ref: asset state]]: name, metadata, lifecycle, the resource descriptor, aliases, editor grants and, for an inscription, a signed preview of the version (P9.30). State is a full snapshot, never a delta, and never a DID document (section 2).
- Derives the DID document for each version deterministically: its `id`, a `controller` equal to the author DID, or to the members of a signer set, `alsoKnownAs` from the aliases in the asset state, and a `#files` service built from the resource descriptor. No DID document is stored, and the asset is not placed in it (section 2).
- Requires signed state fields for the operation, resource transitions, author DID, author verification method and author DID version, and for an editor entry the editor reference (P5.1, P5.16).
- Takes the log’s controller keys from the author DID, or the members of a signer set [S25], with editor keys limited to the changes their grants allow (P5.16): one proof per signer, using `eddsa-jcs-2022` or `bip340-jcs-2025` [S21], by an assertionMethod key of the signer’s DID at the version the entry names, other than an [[ref: updateKey]] of that DID’s own log. There are no updateKeys, no pre-rotation and no rotation entries (P5.2, P5.3, P5.9, P5.10, P5.12, P5.22).
- Fixes the author DID at genesis (P5.8), lets the author grant editors who sign their own entries for named content only, optionally narrowed by a scope (P5.15–P5.18, P5.28, P5.29), lets a signer set with a threshold govern an Original instead of one author (P5.19–P5.23), lets a child Original inherit its parent Original’s grants at a pinned version (P5.24–P5.27), keeps a signer’s identity across did:webvh moves only through that DID’s own verified history (P5.14), and leaves forks unresolved until anchoring settles them (P6.6, P9.16).
- Defines a resource descriptor bound to a SHA-256 digest, exactly one resource per Original, and history-derived versions (P4.1–P4.4).
- Rejects members that VH Log, did:vh or this extension do not define (P5.7), and requires the deactivated parameter and the lifecycle status to agree (P6.5).
- Does not use VH witnesses in the asset log, hosted or not; ordering off Bitcoin is claimed only (P9.8, P9.9).
- Makes Bitcoin the authoritative source after anchoring [S20]: an Original can be anchored with or without having been published on the web, inscriptions on the anchoring sat decide which entries form the log, and they may carry a compact encoding that decodes deterministically to full entries [S23, S24] (P9.10, P9.13, P9.14).
````

### §2 of the core

#### Text under “Three authorities”

````text
In the baseline profile these two authorities come from one place. The author DID is the asset log’s controller, and the author signs each author entry with a verification method of that DID. One signature therefore shows both who made the change and that it may be appended. A set Original divides them among several people: its signer set is the controller, and an author entry carries one signature from each member who signs, of which at least the threshold must come from the previous entry’s set (P5.19, P5.20).
````

#### Text under “Three authorities”

````text
Editing authority is narrower. The author can grant an [[ref: editor]] permission to change named content, and the editor then signs its own entries, without the author countersigning them. A grant gives no authority over grants, aliases, lifecycle, parameters, anchoring, deactivation or the author DID (P5.15–P5.18). A child Original also inherits the grants of its parent Original, judged at the version each entry pins, and a grant’s scope can narrow the resource changes it allows (P5.24, P5.28). Each entry names its [[ref: signer]], so the Original keeps its author while every change identifies who made it.
````

#### Text under “Conceptual state illustration”

````text
- Original identity → asset log checkpoint → asset state
- Application state → name, metadata, lifecycle, the resource descriptor, aliases, editor grants, and optionally a signer set and a parent Original with its pin
- Resource descriptor → mediaType, size, exact-byte digest
- VH entry → Original identity, parent entry, resulting application state, author identity reference, an editor reference for an editor entry, one proof by each signer’s key
- Evidence package → VH history, author identity evidence, resource bytes
````

#### Text under “Conceptual state illustration”

````text
The asset log’s state is the full asset state in every entry, not a delta and not a DID document (D1). The DID document for each version is derived, never stored: its `id` is the did:vh, its `controller` is the author DID, or the members of a signer set, its `alsoKnownAs` lists the aliases in the asset state, and its `#files` service is built from the resource descriptor. The asset itself is not placed in the DID document. Resource bytes are not in any state: they are files bound by the digests in their descriptors.
````

### §5 of the core

#### Text under “Signing and verification boundaries”

````text
Originals uses an identity signer and an independent verifier instead of an application-maintained device-key list. Each signer signs the VH entry with a verification method of their own DID: the author, or an editor the author has granted. An Original MAY instead be governed by a [[ref: signer set]], a list of DIDs with a threshold, whose author entries carry one proof for each member who signs, and need at least the threshold (P5.19–P5.23, P5.30). An Original MAY also name a [[ref: parent Original]] whose editor grants it inherits, judged at a version each entry pins (P5.24–P5.27), and a grant MAY carry a scope that narrows the resource changes it allows (P5.28, P5.29). The author DID, or the signer set, is the log’s controller, under VH-Log’s rule for authorized keys from a controller [S25], so the asset log has no updateKeys of its own and no rotation entries.
````

#### Text under “Signing and verification boundaries”

````text
An Original with no `authors` member is governed by its single author DID: the signer-set rules do not apply to it, and its entries, proofs and derived DID documents have the single-author form described below, so the signer-set rules change nothing in how it is written or verified.
````

#### P5.1

````text
P5.1 Each VH entry MUST carry, in its signed state, the Original identity, operation, resulting state commitment, resource transitions, the author DID, the absolute id of the author’s verification method and the exact author DID versionId, or, for a [[ref: set Original]], such a reference for each member who signs (P5.19); an editor entry also carries its editor reference (P5.16). The extension version is identified by the `method` parameter, and the VH entry chain binds the parent checkpoint. The VH proof MUST cover every security-relevant field, and only signed fields MAY affect verified state.
````

#### P5.2

````text
P5.2 An entry’s proof array MUST contain exactly one proof for each signer reference in its signed state, in the order of those references (P5.22): for an editor entry, one proof, the editor’s; for an author entry of an Original without `authors`, one proof, the author’s; for an author entry of a set Original, one proof for each item of its `author` array. The signer binding of each proof MUST be evaluated against that proof’s key, and each proof’s verificationMethod MUST be the absolute id of the verification method named in its signer reference. For an Original without `authors` this is exactly one proof.
````

#### P5.3

````text
P5.3 A verifier MUST check, for each signer reference in the signed state, that the verification method it names is embedded in that signer’s DID document at the version it names, is listed under assertionMethod, is not an updateKey of that DID’s own log at that version, has type Multikey, and has a publicKeyMultibase value that verifies the proof that P5.2 pairs with that reference. Its id MUST be in the namespace of, and its controller MUST equal, that document’s `id`, which is the signer’s DID (the author DID, a member of the signer set, or the editor DID) or, after a did:webvh move, a DID that P5.14 relates to it. Verification methods held in another DID document, and a DID document’s controller property, MUST NOT confer authority, and a proof by one signer’s key MUST NOT count for another signer.
````

#### P5.4

````text
P5.4 A verifier MUST reject an entry whose author binding fails, even when the VH proof is valid. A valid signature by any identity other than the Original’s author DID, the members of its signer set signing as P5.20 requires, or an editor whose grant, in the parent’s state or inherited from a parent Original, covers the change (P5.16, P5.24), MUST NOT grant permission to change it.
````

#### P5.8

````text
P5.8 The author DID MUST be fixed at genesis; an entry naming a different author DID MUST be rejected. A did:webvh author that moves keeps this DID as its identity (P5.14). Authorship never transfers; selling an Original transfers ownership of its anchoring sat only (P9.11). Author DIDs MUST use a DID method with verifiable version history that the profile lists; the baseline profile lists did:vh, did:webvh and did:btco. The versionId an entry names for its signer MUST NOT be older than the one named by the most recent earlier entry signed by the same identity (for did:btco, by chain order, P5.13); for an entry with several signers this applies to each of them. For a set Original, the signer set is fixed in the same sense: it changes only by an author entry signed as P5.20 requires, and an Original without `authors` becomes a set Original only as P5.21 allows. No entry can make authorship pass by sale, by holding a sat or by paying for an inscription (P9.12).
````

#### P5.9

````text
P5.9 The asset log’s controller is the author DID [S25], or, for a set Original, its signer set: an author entry is authorized by any key that meets P5.3 at the author DID version the entry names, or, for a set Original, by the keys of the members P5.20 requires, each meeting P5.3 at the version its reference names. An editor’s key authorizes only an editor entry, and only the change that the grant in the parent’s state allows (P5.16); it gives no other authority over the log. An entry that sets updateKeys or nextKeyHashes MUST be rejected. The author SHOULD remove from their DID any key they no longer hold. Deactivation is the only way to end an Original.
````

#### P5.15

````text
P5.15 The asset state MAY carry an `editors` list of grants (member names provisional, D4). Each grant names one editor DID and exactly which content that editor may change: `name`, `metadata` and `resource`, each true or false, where `resource` allows new versions of the Original’s one resource (P4.1), and MAY carry a `scope` that narrows what `resource` allows (P5.28). An absent list means no editors. Each editor DID MUST be unique in the list, MUST NOT be the author DID or, for a did:webvh author DID, a did:webvh with the same SCID, MUST NOT be a member of the `authors` of the same state or, for a did:webvh member, a did:webvh with the same SCID, MUST NOT be the did:vh or an alias of the Original’s parent Original (P5.24), and MUST use a method that P5.8 lists. An editor DID MUST NOT be the Original’s did:vh, any of its aliases, or a did:btco DID whose sat is the Original’s anchoring sat, whether the grant is made before or after anchoring, so that holding the sat confers no edit authority (P9.12). A verifier MUST reject a state that breaks these rules, and MUST enforce the profile’s limit on the number of grants (P7.7).
````

#### P5.16

````text
P5.16 Every entry is an [[ref: author entry]] or an [[ref: editor entry]]. An author entry carries no editor reference and is signed by the author under P5.2 and P5.3, or, for a set Original, by members of its signer set under P5.20. Only an author entry may change `editors`, `authors`, aliases, lifecycle status or any parameter, and only an author entry may be the genesis entry, an anchoring entry (P9.10) or a deactivation (P6.5). No entry may change `parent.did`, and only the genesis entry may set `parent` (P5.24); an author entry or an editor entry MAY advance the pin `parent.versionId`, and advancing it is not a change the editor’s grant must allow. An editor entry carries an editor reference in its signed state: the editor DID, the absolute id of the editor’s verification method and the exact editor DID versionId. The editor DID MUST have a grant in the parent entry’s state, or an inherited grant from the parent Original at the version the entry pins (P5.24), and the signing key MUST meet P5.3 with the editor DID in place of the author DID. Its author reference MUST equal its parent’s; for a set Original that is the whole `author` array, unchanged. The author reference of an editor entry is checked only for equality with its parent’s; P5.3, P5.8 and P9.15 apply to it only through the author entry it was copied from. Its operation MUST be update and its parameters MUST be empty. Its state MUST equal its parent’s except for the name, metadata and resource descriptor its grant allows, within the grant’s scope if it has one (P5.28), the `preview` that goes with a new version under a grant that allows the resource (P9.30), the pin (P5.24), the operation, the resource transition and the editor reference. A verifier MUST reject an editor entry that breaks any of these rules, even when its proof is valid.
````

#### P5.17

````text
P5.17 A grant, a change to a grant and a revocation take effect from the entry after the author entry that makes them, because an editor entry is checked against the grants in its parent’s state. To revoke, the author appends an author entry whose `editors` list omits or narrows the grant. An editor entry whose parent’s state does not grant the change is rejected wherever it is published. An editor entry and a revoking author entry with the same parent are a fork (P6.6), not an ordering. If the fork exists before anchoring, it stays unresolved until the anchor settles it by carrying one branch (P6.6, P9.16). If both are offered on the anchoring sat after anchoring, the first in chain order that extends the accepted head is accepted and the other is ignored (P9.13); if the first is unverifiable, the other waits until it is resolved (P9.15). After anchoring, a revocation takes effect only once inscribed on the anchoring sat, which needs its holder (P9.12). A grant, change or revocation in a parent Original reaches a child entry through the version that entry pins (P5.24); P5.26 and P5.27 say how a revocation affects child entries pinning an earlier version.
````

#### P5.18

````text
P5.18 The rules for the author’s keys apply to each editor’s keys with the editor DID in place of the author DID: P5.10 to P5.14, P7.8, P7.9 and P9.15, including P9.15’s exception for a later did:vh or did:webvh version that lists a removed key again. An editor rotates or removes keys, or moves, only in its own DID. An editor entry is also subject to the author DID’s deactivation exactly as an author entry is (P6.5, P9.15), so once the author DID is deactivated no editor can change the Original either; for a set Original, P5.23 says when the signer set counts as deactivated. Editing is never identity administration: no entry can change the author DID or its keys, and an editor’s grant gives it none of the author’s keys.
````

#### Text under “Editors”

````text
An editor cannot change grants, so it cannot widen its own; it cannot add or change aliases, so it cannot publish to a new host or anchor; it cannot deactivate; and it holds none of the author DID’s keys. A grant names an editor DID, not keys, so the editor rotates its own keys in its own DID, and the author revokes the grant by an author entry. A fresh reader needs the asset log, which carries every grant and revocation, plus the history of the author DID, or of every member of a signer set, and of each editor DID that signed an entry (P7.1).
````

### §7 of the core

#### P7.1

````text
P7.1 An evidence package MUST declare whether it is complete or partial. A complete package MUST include the VH evidence through the selected checkpoint, the identity evidence required to check each entry’s signer binding, for the author, or every member of a signer set that signed an entry, and for every editor that signed an entry, and the historical resource bytes referenced by that prefix. For a child Original it MUST also include its parent Original’s asset log through the highest pin in that prefix, with the identity evidence and parent logs that the parent’s own check needs (P5.25), and it MUST include the bytes that each scope check of an entry in that prefix needs (P5.28). It MUST identify the Original, profile and target checkpoint unambiguously. Two things are never in a package, complete or not: the history of a did:btco signer, which is read from Bitcoin (P14.10), and an anchor. For an anchored Original a package is one more source of entries, as P7.14 states for any copy of the log.
````

#### P7.7

````text
P7.7 A verifier MUST enforce profile-defined limits on history length, entry size, identity-history length, the number of editor grants, the members of a signer set, the patterns in a scope and the depth of nested parent Originals (P14.13). When a history exceeds a limit, the verifier reports the last valid prefix as VH requires, and MUST label the result limit-exceeded and MUST NOT report it as complete or current.
````

#### P7.8

````text
P7.8 The verification report MUST state, for the author DID, or each member of a signer set, and each editor DID it relied on, the latest versionId used and whether its freshness was independently established. An Original that is not anchored is never reported as current or currently authorized (P7.10). For an anchored Original, a verifier checks each did:vh or did:webvh signer against the newest version of that DID it knows of: the newest it has obtained from any source or retained from earlier verification. It is not required to show that no newer version exists, and the report MUST state that version and when it was obtained. A verifier that knows of a newer version than the one a package or host supplies MUST use the newer one. A did:vh or did:webvh signer’s freshness is independently established only if that DID’s own witnesses or watchers support its latest version (P9.8); for a log obtained without that support, the report MUST state freshness as not established, together with where the log was obtained, when, and its latest versionId. A verifier MUST NOT treat a did:webvh log fetched from a location as that identity’s latest unless its latest version’s `id` names that location; this does not apply to did:vh logs or to logs from an evidence package. A did:webvh log whose latest version names another location shows that the identity has moved: the verifier MUST still use every verified version in it, including any that removes a key, SHOULD look for the moved log as P5.14 describes, and MUST report freshness as not established until it finds it. A report shown to a person MUST say plainly that the verifier obtained that DID’s history from that place at that time, and that the DID may have a newer version, such as one that removes a key, which the verifier has not seen. did:btco signers are read from Bitcoin (P5.13). Verifiers SHOULD retain the highest verified versionId seen for each author DID and each Original, and compare copies of both logs as VH describes.
````

#### P7.9

````text
P7.9 If the signing key of an entry that is not inscribed on an anchoring sat is not under assertionMethod in the latest verified state of its signer’s DID, or the author DID’s latest verified state is deactivated (P6.5, P5.18), a verifier MUST report that entry as historically authorized only, because it may have been signed after the key was removed or the DID deactivated (section 5), and any result that includes it MUST say so. An entry inscribed on an anchoring sat is checked instead against its signer’s DID state at its inscription time, and an editor entry also against the author DID’s deactivation at that time (P9.15, P5.18). For an author entry of a set Original this test counts signers: the entry is historically authorized only unless at least its authorizing set’s threshold of its signing members pass it, and the set is deactivated only when fewer than its threshold of members have a DID state that is not deactivated (P5.23). An editor entry of a child Original authorized only by an inherited grant is also historically authorized only when the parent Original’s latest verified state does not grant the change, or the parent has divergent valid branches (P5.26).
````

#### Text under “Proposed verification report”

````text
Return separate results for history validity, author binding, identity evidence, resource availability and freshness/order policy. For each entry, list every signer, and say whether the author, the members of a signer set (with the threshold they met), a direct grant or an inherited grant authorized it, and for an inherited grant the parent version it relied on (P5.24). For a child Original, report the parent Original, the pins relied on and whether the parent’s evidence through them was verified, as a separate result (P5.25). For each entry that relies on a scoped grant, report the scope type and whether it was checked; an unchecked scope makes the result incomplete, never a pass (P5.28). List unverifiable inscriptions, and publications waiting on them, as a separate result; a single acceptance check MUST NOT pass while any is listed unless it presents the list with its result (P9.15); for an Original that is not anchored, the result is valid as of a checkpoint, never current (P7.10). Include the verified checkpoint, profile, unresolved dependencies, missing items and failures. Avoid a single green “verified” result that conceals incomplete identity evidence or unavailable historical bytes. If the SDK offers a single acceptance check, its default policy must require every part of the report to pass except content availability and the list of unverifiable inscriptions and waiting publications. Content availability is reported separately: a verified log with unavailable bytes passes as a log, and an application that needs the content checks availability as well. The list is presented with the check’s result (P9.15).
````

### §9 of the core

#### P9.6

````text
P9.6 Transaction retries MUST distinguish rebroadcasting the same intended transaction from preparing a replacement. Asset edits MUST NOT be silently re-signed or rebased because a transaction is retried. A wallet, the holder of an anchoring sat, or whoever pays for or broadcasts an inscription MUST NOT acquire author or VH update authority by that role, and does not count toward a signer set’s threshold (P5.20); for a did:btco author DID, possession of the DID’s sat is control of the author DID (P5.13).
````

#### Text under “Anchoring and ownership”

````text
An Original has one author, or one signer set, for its whole life. Only the author, or at least the threshold of the signer set, anchors it, and after anchoring the author, the threshold of the set, or a granted editor signs each change (P5.16, P5.20). Paying for or broadcasting an inscription is not signing it, and gives no authority. Ownership is separate: the owner is whoever holds the anchoring sat. On Bitcoin a change needs both: an authorized signature, and an inscription on the sat, which only its holder can make. After a sale the Original is frozen unless an authorized signer and the new owner cooperate. Selling or giving an Original means moving the sat, and needs nothing from the author.
````

#### P9.10

````text
P9.10 An Original MAY be anchored from the local layer or from the web layer. The author, or for a set Original at least its authorizing set’s threshold (P5.20), anchors it with an ordinary update entry (section 6) whose asset state adds the did:btco alias of the anchoring sat (section 3), inscribed on that sat. The first entry whose asset state lists a did:btco alias is the [[ref: anchoring entry]], and an entry inscribed on a sat whose alias its state does not list is not one. P9.16 decides which anchoring entry is the anchor. A did:btco DID in this profile has the form `did:btco:` followed by an optional network prefix, `sig:` for signet, `test:` for testnet or `reg:` for regtest, with no prefix meaning mainnet, and then the sat number in decimal with no sign and no leading zeros, below the total supply of sats (D6). The did:btco method does not yet define the network prefixes; this profile uses them pending that [S30]. A verifier MUST reject any other form. It MUST treat an inscription as on the sat a did:btco DID names only if the Bitcoin index it uses, on that network, reports the inscription on the sat with that number; the label under which inscriptions were supplied to it does not count. An inscription the index places on another sat, or a read from a different network, is not on that sat. Placement rests on the index: a verifier SHOULD use an index it runs itself or two independent indexes, MUST report which it used (P9.11), and MUST NOT accept an anchoring entry, a later inscription or a did:btco version whose placement two indexes it uses disagree on; it reports missing evidence until they agree. Anchoring MUST happen at most once and is terminal: every later entry MUST keep that did:btco alias, and a later entry that removes or changes it, or adds another did:btco alias, MUST be rejected. After anchoring, an entry MUST NOT add a did:webvh alias that the anchoring entry’s state does not list, including one that replaces an existing alias, and a verifier MUST reject it: the web is a layer before Bitcoin, and an Original does not move back to an earlier layer (D7). A did:webvh alias the anchoring entry’s state lists MAY stay or be removed, but once removed it MUST NOT be added again. An anchored Original is found through its did:btco alias, whose sat carries its complete log (P9.17).
````

#### P9.12

````text
P9.12 After anchoring, an entry MUST NOT be reported as current unless it is signed by the author under P5.3, or for a set Original by at least its authorizing set’s threshold under P5.20, or by an editor under P5.16, and inscribed on the anchoring sat, extending the accepted head. This applies to every operation, including deactivation. An entry the author or an editor signs but that is not inscribed on the sat, and an inscription on the sat that neither signed, MUST NOT change the Original’s state. Holding the sat, or paying for or broadcasting an inscription on it, MUST NOT confer author or VH update authority, and transferring an Original MUST mean transferring the sat. For a child Original, an inscribed entry’s pin is also checked against its anchored parent (P5.27).
````

#### P9.15

````text
P9.15 The entries before the anchoring entry, carried in the anchoring inscription, have claimed ordering (P7.6): each is checked against the signer DID version it names (P5.3), and a key’s removal after it was signed does not invalidate it, though the anchoring entry itself must be signed by a key valid at its inscription time. A verifier MUST check each entry inscribed on the anchoring sat, from the anchoring entry on, against its signer’s DID state at its inscription time, not its latest state. The rules below are stated for the author DID, which is the signer of an author entry. For an editor entry, they apply to the editor DID instead: its named version, its state at the inscription time and its signing key. For an author entry of a set Original, they apply to each signer’s DID, and every signer MUST pass (P5.23). Separately, an editor entry MUST be rejected if the author DID’s state at its inscription time is deactivated (P5.18). An inscription’s inscription time is the greatest block timestamp among the block containing it and that block’s ancestors, so it never decreases along the chain. The state at an inscription is the later of the author DID version the entry names and the latest author DID version whose versionTime is no later than the inscription time. The signing key MUST meet P5.3 both at the named version and in that state, and an entry inscribed when that state is deactivated MUST be rejected. A key removal or author DID deactivation therefore refuses entries whose inscription time is at or after its versionTime, unless, for a did:vh or did:webvh author DID, the entry names a later version that lists the key again (see below), and MUST NOT make non-current an accepted entry whose inscription time precedes it. Miners set block timestamps within consensus bounds, so inscription time can lag real time and an entry inscribed shortly after a removal can still be accepted. For a did:vh or did:webvh signer, a verifier uses the newest version of its DID that it knows of (P7.8); if that version is older than the inscription time, it checks the entry against that version and reports which version it relied on, rather than reporting incomplete identity evidence. For an entry in the anchoring inscription, a verifier that has no verified version at or after the one the entry names reports incomplete identity evidence (P5.6). For any entry inscribed on the anchoring sat, in the anchoring inscription or after it, a verifier that holds the signer’s DID history through a version numbered at or above the one the entry names, but not under the versionId it names, MUST reject the entry; for a did:btco signer whose sat it has read in full, it rejects one naming a version that is not in that history (P5.13). For an inscription after the anchoring inscription, a verifier that cannot otherwise verify the signer’s named version MUST report the inscription as unverifiable; an inscription that fails any check not depending on the unverified version is rejected, not unverifiable. An unverifiable inscription does not make the identity evidence of the accepted state incomplete and does not stop that state being current, because the sat’s holder chooses what is inscribed and has no authority over the Original (P9.12). For a did:btco signer, an inscription after the anchoring inscription is also unverifiable when the named version is known but the verifier has not read every inscription on that DID’s sat before the candidate, because one of them could remove the key: the candidate is unverifiable until it has, and MUST NOT be accepted against an older known state. If such a gap is found after an inscription was accepted, that inscription becomes unverifiable and the verifier recomputes the head under the rule below, reporting the change; an entry in the anchoring inscription with such a gap has incomplete identity evidence (P5.6). The report MUST list each unverifiable inscription with the signer DID and version it names. An unverifiable inscription does not extend the accepted head until it is verified, and a later publication that extends the same head MUST NOT be accepted while an earlier inscription extending that head is unverifiable: chain order, not the verifier’s evidence, decides between them (P9.13). The verifier reports such a publication as waiting on the unverifiable inscription. When it can verify that inscription, it accepts it if valid, or otherwise rejects it and considers the next publication in chain order that extends that head; either way it MUST report the resulting change of head and MUST NOT change its result silently. Publications that extend an unverifiable inscription, directly or through other waiting publications, are listed as waiting on it; once it is accepted the verifier follows them under P9.13, and if it is rejected they are ignored. A verifier therefore never accepts a later publication because evidence about an earlier one is missing; its result can still change when an unverifiable inscription is resolved, or through a reorganization (P9.5), a retroactive revocation conflict, a did:btco gap found later, or an earlier anchor (P9.16), and each change is reported. An unverifiable inscription can leave an Original waiting: whoever holds the anchoring sat can inscribe an entry naming a did:vh or did:webvh signer version that does not exist, and no later publication from that head is accepted, even after the sat is transferred, until the named signer’s DID reaches that version number under another versionId, after which the entry is rejected. A verifier MUST reject an entry naming a did:vh or did:webvh version numbered above the limit of P14.13, which this profile never verifies (P7.7), or later than a deactivated version of that DID it holds, which cannot exist. The wait is permanent if the named signer never updates its DID that far. This profile accepts that risk; a did:btco signer cannot be named this way, because a verifier that reads its sat in full rejects a version not in it. For a did:btco author DID, the state is selected by chain order instead, and an entry naming a version that does not precede its inscription is rejected (P5.13). For a did:vh or did:webvh author DID, versionTime is claimed by the DID’s controller, so the report MUST state whether the author DID’s own witnesses or watchers support it. That controller can publish a version whose versionTime precedes inscriptions already accepted, though not its own previous version; a verifier that retained an earlier acceptance and then finds such a version MUST report a retroactive revocation conflict rather than silently change its result. Because the later version is used, for a did:vh or did:webvh author DID a version that the entry names can also re-authorize a key that the version in effect at the inscription time had removed; only the author DID’s controller can arrange this. Block timestamps can lag real time, which is why a named version with a later versionTime is accepted for these methods; for did:btco, chain order leaves no such lag and P5.13 applies.
````

#### P9.16

````text
P9.16 An Original has claimed ordering before its anchor (P7.6); the anchoring inscription’s block is the first ordering evidence for that history, showing that every earlier entry existed no later than that block. A holder of an authorized author key, or of the threshold of a signer set’s keys, can anchor a different branch of the same Original on another sat. The anchor is the first valid anchoring entry, including under P9.15, that is inscribed on the sat it names, in chain order (P5.13) under the adapter’s confirmation policy (P9.5). Anchoring settles any fork of the Original (P6.6): the anchor’s branch is the Original’s history. A verifier MUST report every anchoring entry it knows of for the Original. Any other than the anchor MUST be reported as a conflicting anchor; it and its descendants MUST NOT be reported as current and MUST NOT confer ownership. No index lists every sat, so a verifier MUST report the anchor’s uniqueness as not established and the ownership it reports as provisional (P9.11). If a verifier later learns of a valid anchoring entry earlier in chain order than the one it reported as the anchor, it MUST report the earlier one as the anchor and the previous one as a conflicting anchor, together with the change in owner, and MUST NOT change its result silently. This is an accepted risk: a holder of a stolen author key who also holds a sat can anchor first, making the author’s later anchor a conflicting one, so an author who needs protection SHOULD anchor early.
````

#### P9.18

````text
P9.18 Bitcoin alone verifies an anchored Original’s log (P9.17) and, for a signer whose DID is a did:btco, that signer’s identity (P5.13): no host or copy is needed. The previews inscribed on the sat and the resource versions inscribed in full (P9.17, P9.30) are on Bitcoin too. Two things are not. Versions that were not inscribed in full, such as those before the anchoring entry’s and, by default, the current one, are not needed for the log to verify: a reader without them MUST report the log as verified and the missing content as unavailable (P7.4), never as a verification failure. The DID history of a did:vh or did:webvh signer is needed: without it identity evidence is incomplete (P5.6) and its freshness cannot come from Bitcoin; an inscription after the anchor that the signer signs is unverifiable and leaves later publications from that head waiting (P9.15). An author who wants Bitcoin to be all a reader needs SHOULD use a did:btco author DID and grant only editors whose DIDs are did:btco; anchoring does not require it (P5.15). Before inscribing the anchoring entry, the SDK MUST verify the log through the signed anchoring entry and the identity evidence of every signer of an entry in that log, including every member of a signer set, and, for a child Original, its parent’s evidence through the highest pin (P5.25), and MUST NOT inscribe otherwise. That log, like any log a writer checks before publishing an entry, is its own committed log, not yet on Bitcoin, and for an anchored Original only what is on Bitcoin is trusted (P9.13), so it cannot verify as published. A writer verifies it as a local copy: it verifies the copy whole, from genesis through the entry it is about to publish, and reports it as unverified on Bitcoin and never as current. A local-copy result is valid only for the writer’s own check before it publishes, and MUST NOT appear in a report given to anyone else. After submitting it, the SDK MUST label the result pending Bitcoin acceptance only while its Bitcoin evidence shows the inscription’s transactions held in the mempool, or confirmed but not yet verified, and submitted, not observed while it does not, including after rejection or eviction or when its Bitcoin provider has no mempool view; it MUST NOT present a submitted inscription the network is not observed to hold as on its way to acceptance. The checks of P5.13, P9.15 and P9.16 depend on the inscription’s position, so once it is confirmed the SDK verifies the Original and reports it as anchored, not anchored, or anchored with incomplete identity evidence (P5.6). Before inscribing any entry, it MUST tell the author whether the inscription carries the preview, the full version or no body (P9.30); that this body, and the log with its name and metadata, become public and permanent on Bitcoin and cannot be removed by a later entry (P8.3); what the inscription will cost at the fee rate the SDK will use; and, for active content such as HTML or SVG in the body, that Bitcoin explorers may render it outside this profile’s isolation rules (P9.7). It MUST tell the author what Bitcoin will not hold: the versions not inscribed in full, including the current one when the body is a preview or absent, and any did:vh or did:webvh signer DID histories. This profile does not guarantee their replication or availability. When the anchoring sat is transferred, the sender’s SDK SHOULD give the recipient the versions not inscribed in full and off-chain signer DID histories it holds, and the recipient’s SDK SHOULD verify them.
````

### §14 of the core

#### Text under “Wire format (partly provisional)”

````text
This section pins the byte-level choices that independent implementations must share. D6 decides the 350,000-byte inscription limit and the did:btco network prefixes in P14.12, and D4 the limits in P14.13. D4 decides JCS canonicalization (P14.3), as the canonicalization the pinned VH Log version uses; SHA-256 multihashes for resource digests (P14.7, P4.2); the two cryptosuites (P14.8, P5.12); and the parts of P14.2, P14.3, P14.5, P14.8 and P14.10 that it records as decided. D3 decides that an asset log has no witness file (P14.2, P9.8). D6 decides the inscription body, metadata and media type in P14.12 (P9.17, P9.30), and the 8,192-byte preview limit in P14.13, except the JSON-to-CBOR mapping of the metadata, which stays provisional, and that a did:btco signer version is identified by its own metadata alone (P14.12, P5.13). The carried-log values (P14.14–P14.17) are proposed and provisional. D8 decides signer sets, parent Originals and scoped grants; the members that carry them (P14.4, P14.5, P14.8–P14.10, P14.23) are provisional, as the other entry state fields are, and so are the three limits P14.13 adds for them. They are an additive change under the same `method` value: an Original without `authors` or `parent`, and a grant without `scope`, are exactly as before. Everything else in this section, including the entry state fields and the evidence package format, is **provisional**: it is taken from the Originals SDK at revision 1b3cabdd [S29], which is the only implementation, and recorded so that it is reviewed as a decision rather than adopted silently (D1, D4). Where the SDK and this section differ, this section says so and the SDK is expected to change. A provisional value may still change before an interoperable release; until then a change keeps the `method` value `originals:1.0`, and Originals written under an earlier provisional value no longer verify. After an interoperable release, changing a value changes the `method` value.
````

#### Text after P14.4

````text
- `id` is the Original’s did:vh, `did:vh:<SCID>`.
- `operation` is `create` in the genesis entry and `update` or `deactivate` in every other entry. Anchoring is an `update` (P9.10).
- `editor`, and `author` when `asset` has no `authors`, are each a [[ref: signer]] reference, exactly `{did, verificationMethod, versionId}`, all strings (P5.1, P5.16). For a did:btco signer, `versionId` is the inscription id of the version (P5.13).
- When `asset` has `authors`, `author` is instead an array of 1 to 32 signer references, sorted by `did` in the order of UTF-16 code units, as JCS sorts member names, with no `did` twice (P5.19). A verifier MUST reject an `author` that is an array when `asset` has no `authors`, or an object when it has.
- `asset` has the required members `name`, `status`, `resource` and `aliases`, and the optional members `metadata`, `editors`, `readers`, `preview`, `authors` and `parent`.
- `transitions` is an array of `{from, to}` with at most one item, where `from` is the previous digest, or null in the genesis entry, and `to` is the new digest. It MUST have one item exactly when the resource’s digest changes: in the genesis entry `{from: null, to}`, and in a later entry that changes the digest `{from, to}`. It is empty in any other entry, including a deactivation (P4.1, P4.2).
````

#### Text after P14.5

````text
- `name`: a string of 1 to 1,024 UTF-16 code units.
- `metadata`: a JSON object. When absent, there is no metadata (P4.6).
- `status`: `active` or `deactivated`, agreeing with the operation and the deactivated parameter (P6.5).
- `aliases`: an array of DIDs with at most one did:webvh and at most one did:btco. It holds no DID of any other method and no DID twice, and a verifier MUST reject one that does (P3.9). The genesis entry lists none.
- `resource`: the descriptor of the Original’s one resource, at its version in this entry (P4.1).
- `preview`: exactly `{mediaType, size, digest}`, the preview of the version that `resource` names, for an inscription (P9.30). Each member follows P14.6 and P14.7 as for a resource descriptor, and `size` MUST be at least 1 and at most 8,192. It is allowed only in an entry whose `aliases` list a did:btco DID.
- `editors`: an array of 1 to 32 grants, each with exactly the members `did`, `name`, `metadata` and `resource`, all but `did` booleans, and optionally `scope`. An empty array MUST NOT be used; absence means no editors (P5.15). `scope` is an object with a string member `type` and the members its scope type defines (P5.28, P14.23); it MUST NOT be present when `resource` is false.
- `readers`: an array of 0 to 128 read grants, each exactly `{did}`, a string (P8.6). Absence means the Original is public, unless it has a `parent` (P8.10); an empty array means it is private, readable only by its author, or the members of its signer set, and its editors. A `scope` member, as editor grants have (P5.28), is reserved for read scopes; until a profile defines them a verifier MUST reject a read grant that has one (P8.14).
- `authors`: exactly `{threshold, dids}`, where `dids` is an array of 1 to 32 DIDs, sorted in the order of UTF-16 code units, with no DID twice, and `threshold` is an integer from 1 to the length of `dids` (P5.19). Once present it is never removed.
- `parent`: exactly `{did, versionId}`, both strings: the parent Original’s did:vh, `did:vh:<SCID>`, and the pin, a versionId of the parent’s asset log (P5.24). It is set only in the genesis entry, and only `versionId` changes.
````

#### P14.8

````text
P14.8 Each entry has exactly one proof per signer reference, in the order P5.22 gives: one for an Original without `authors` and for every editor entry, and one per item of `author`, in that array’s order, for an author entry of a set Original. VH-Log’s `proof` is then an array of those proofs; for an entry with one proof it is exactly as before. Each proof has `type` `DataIntegrityProof`, `proofPurpose` `assertionMethod`, a `cryptosuite` of `eddsa-jcs-2022` or `bip340-jcs-2025` (P5.12), a `verificationMethod` byte-identical to the signer reference’s, and a `proofValue` of `z` followed by the base58btc encoding of the 64-byte signature. Each proof is computed over the entry without any proof (P5.22). Signer keys are Multikeys in base58btc: Ed25519 with prefix 0xed01 and 32 bytes, or secp256k1 with prefix 0xe701 and a 33-byte compressed key. Ed25519 verification MUST reject small-order points. A proof has exactly the members `type`, `cryptosuite`, `verificationMethod`, `proofPurpose` and `proofValue` (P14.4).
````

#### Text after P14.9

````text
For a set Original, `controller` is instead the array `authors.dids` at that version, in its order, even for a set of one; for any other Original it is the author DID string, as above. `parent`, the grants and their scopes are not in the derived document. The `#files` service is the resource’s descriptor at that version; where to fetch the bytes comes from a did:webvh alias, a `src` location, an evidence package, a carried file (P7.11) or, for a version inscribed in full on the anchoring sat, that inscription’s body (P9.17). The `preview` member (P14.5) is not in the derived document.
````

#### Text after P14.10

````text
- `originals-evidence.json`, the manifest: exactly `{format, profile, original, checkpoint, head, completeness, missing}`, where `format` is `originals-evidence/0.1`, `profile` is `originals:1.0`, `completeness` is `complete` or `partial` (P7.1), and `missing` lists `{kind: "resource", version, digest, versionId}`, `{kind: "identity", did, role}`, `{kind: "parent", did, versionId}` and `{kind: "object", digest}` items, `role` being `author`, for the author or a member of a signer set, or `editor`, a `parent` item naming a parent Original whose log through that pin is missing (P5.25), and an `object` item naming bytes that a scope check needs and the package lacks (P5.28);
- `asset/did.jsonl`, the asset log;
- `signers/<hex SHA-256 of the DID>/did.jsonl`, and `did-witness.json` where that DID method has witnesses, for each did:vh or did:webvh signer; did:btco signers are read from Bitcoin and are not packaged (P9.18);
- `parents/<hex SHA-256 of the parent Original’s did:vh>/did.jsonl`, the asset log of each parent Original, and of its own parent in turn, through the highest pin that the packaged entries depend on (P5.25); their signers are under `signers/` with the child’s;
- `resources/<digest>`, the bytes of each version of the resource included, and of each object that a version references and that a scope check needs (P5.29).
````

#### Text after P14.13

````text
| Limit | Value |
|---|---|
| Entries in an asset log | 10,000 |
| Bytes in one entry, as its JCS form in UTF-8, in every format | 65,536 |
| Editor grants | 32 |
| Members of a signer set, and items of an `author` array (provisional) | 32 |
| Patterns in a `paths` scope (provisional) | 64 |
| Nested parent Originals, from a child to its furthest ancestor (provisional) | 8 |
| Bytes in a preview (P9.30) | 8,192 |
| Read grants (provisional) | 128 |
| Versions of one signer DID | 1,000 |
| Bytes in a fetched log file | 16 MiB |
| Bytes in one fetched resource | 64 MiB |
| Time for one fetch | 15 seconds |
````
