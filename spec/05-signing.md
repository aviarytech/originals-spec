## Signing and verification boundaries

Originals uses an identity signer and an independent verifier instead of an application-maintained device-key list such as the one planned for Boop [S11]. Each change has exactly one signature: the author signs the VH entry with a verification method of the author’s DID. The author DID is the log’s controller, under VH-Log’s rule for authorized keys from a controller [S25], so the asset log has no updateKeys of its own and no rotation entries.

### Proposed rules for a signed change

P5.1 Each VH entry MUST carry, in its signed state, the Original identity, operation, resulting state commitment, resource transitions, the author DID, the absolute id of the author’s verification method and the exact author DID versionId. The extension version is identified by the `method` parameter, and the VH entry chain binds the parent checkpoint. The VH proof MUST cover every security-relevant field, and only signed fields MAY affect verified state.

P5.2 An entry’s proof array MUST contain exactly one proof, and the author binding MUST be evaluated against that proof’s key. The proof’s verificationMethod MUST be the absolute id of the author’s verification method named in the signed state.

P5.3 A verifier MUST check that the verification method named in the signed state is embedded in the author DID document at the named version, is listed under assertionMethod and in that version’s Originals declaration (P9.9), has a controller equal to the author DID, has type Multikey, and has a publicKeyMultibase value that verifies the proof. Verification methods held in another DID document, and a DID document’s controller property, MUST NOT confer authority.

P5.4 A verifier MUST reject an entry whose author binding fails, even when the VH proof is valid. A valid signature by any identity other than the Original’s author DID MUST NOT grant permission to change it.

P5.5 VH validation MUST apply the pinned upstream algorithms for entry integrity, chaining, parameters, proofs and controller changes.

P5.6 A candidate MUST NOT become the current state until the VH and author-binding checks succeed. Missing identity history MUST remain an explicit failure or incomplete-verification result; it MUST NOT downgrade to trusting the key alone.

P5.7 Parsers MUST reject duplicate keys, values that the pinned canonicalization cannot represent exactly, and any member of parameters, proof or Originals-defined state that is not defined by the pinned VH Log version, the pinned did:vh version or this extension.

P5.8 The author DID MUST be fixed at genesis; an entry naming a different author DID MUST be rejected. Authorship never transfers; selling an Original transfers ownership of its anchoring sat only (P9.11). Author DIDs MUST use a DID method with verifiable version history that the profile lists; the baseline profile lists did:vh and did:webvh. The author DID versionId referenced by each entry MUST NOT be older than the one referenced by its predecessor.

P5.9 The asset log’s authorized keys MUST come from the author DID [S25]: an entry is authorized by any key that meets P5.3 at the author DID version the entry names. An entry that sets updateKeys or nextKeyHashes MUST be rejected. The author SHOULD remove from their DID, and from its Originals declaration, any key they no longer hold. Deactivation is the only way to end an Original.

P5.10 Key rotation MUST happen only in the author DID. The asset log has no rotation entries: once the author DID adds a key, entries naming that DID version can be signed with it, and once it removes a key, witnesses and Bitcoin readers refuse that key for new entries (P9.8, P9.15).

P5.11 A signer holding an Originals key MUST parse the entry, show the author the Original, operation and resource changes before signing, and refuse input that is not a well-formed Originals entry. The author’s Originals key MUST be a verification method used only for Originals entries, and MUST NOT also be an updateKey of the author DID’s own log. P5.3 enforces this by requiring the key to be in the author DID’s Originals declaration.

P5.12 Each entry’s proof MUST use the `eddsa-jcs-2022` or `bip340-jcs-2025` cryptosuite, which the extension permits under VH-Log’s rule for additional cryptosuites [S21]. A verifier MUST reject any other cryptosuite.

### Key policy

The baseline profile has one author per Original, for the Original’s whole life. The author’s DID is the Original’s controller [S25], and its own history, including any pre-rotation, protects its keys; pre-rotation does not apply to the asset log. VH-Log recommends pre-rotation for a log with an authoritative source [S20], so that the active keys alone cannot get an entry accepted. On Bitcoin that protection comes from the sat: an entry is accepted only if inscribed on the anchoring sat (P9.12). There is no per-Original keypair; one author key can sign for all of the author’s Originals. Naming the author DID in an entry grants no authority by itself; the key must also meet P5.3.

### Collaboration deferred

Only the author’s key may append in the baseline profile. Editors who can change an Original’s state without gaining log control need that boundary enforced by VH verification rules, which is proposed upstream in VH Log issue 5 [S2a]. If VH Log does not adopt it, a later Originals profile will define delegation separately. Collaborative editing is not part of the baseline.

### Key rotation and compromise

To rotate, the author updates their DID: they add the new key to it and to its Originals declaration and, if the old key is compromised, remove it in the same update. Nothing is appended to the asset logs. The SDK sends the DID update to the witnesses of every witnessed Original the author has.

For a witnessed Original, witnesses refuse an entry whose signing key the author’s latest DID no longer lists (P9.8). Once the author’s DID update reaches the witnesses, a thief holding the removed key cannot edit, deactivate or fork the Original. The thief also cannot change the witnesses, because the witness list is declared in the author’s DID (P9.9).

For an anchored Original, Bitcoin readers check each inscribed entry against the author’s DID as it stood at the entry’s inscription time (P9.15). Removing a key refuses it for entries inscribed after the removal; entries already inscribed stay current, so rotating keys after selling an Original does not invalidate it.

These limits remain:

- Before the author removes the stolen key, the thief can edit or deactivate any Original the author controls; deactivation is permanent.
- The protection holds only while fewer than a threshold of witnesses misbehave or see stale author DID history (P9.8).
- For an unwitnessed Original, an entry signed with a removed key can name an older author DID version and cannot be distinguished from earlier entries. Verifiers report it as historically authorized with unproven ordering, never as current (P7.9).
- A lost key can be replaced by updating the author DID, as long as the author still controls the DID; recovering a lost DID is a separate decision (section 8).

Loading evidence does not restore signing authority, and claimed timestamps cannot establish signing before revocation.

Sources: VH update authorization and witnesses [S2]; editor authority proposal [S2a]; identity document rules [S3]; current signer/envelope boundaries [S4, S6, S7].
