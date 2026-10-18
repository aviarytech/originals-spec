## Signing and verification boundaries

Originals uses an identity signer and an independent verifier instead of an application-maintained device-key list such as the one planned for Boop [S11]. In the baseline profile each change has exactly one signature: the author signs the VH entry with a key that is both an active updateKey and a verification method of the author’s DID.

### Proposed rules for a signed change

P5.1 Each VH entry MUST carry, in its signed state, the profile discriminator, Original identity, operation, resulting state commitment, resource transitions, the author DID, the absolute id of the author’s verification method and the exact author DID versionId. The VH entry chain binds the parent checkpoint. The VH proof MUST cover every security-relevant field, and only signed fields MAY affect verified state.

P5.2 An entry’s proof array MUST contain exactly one proof, and the author binding MUST be evaluated against that proof’s key. The proof’s verificationMethod MUST be a did:key URL for the updateKey, so that VH resolvers never resolve external identities; the author’s verification method is referenced only in the signed state.

P5.3 A verifier MUST check that the signing key is the active updateKey under the pinned VH rules and that the verification method named in the signed state is embedded in the author DID document at the named version, is listed under assertionMethod, has a controller equal to the author DID, has type Multikey and has a publicKeyMultibase value byte-identical to the updateKey. Verification methods held in another DID document, and a DID document’s controller property, MUST NOT confer authority.

P5.4 A verifier MUST reject an entry whose author binding fails, even when the VH proof is valid. A valid signature by a recognized identity MUST NOT grant permission to change an Original whose updateKeys do not include that identity’s key.

P5.5 VH validation MUST apply the pinned upstream algorithms for entry integrity, chaining, parameters, proofs and controller changes.

P5.6 A candidate MUST NOT become the current state until the VH and author-binding checks succeed. Missing identity history MUST remain an explicit failure or incomplete-verification result; it MUST NOT downgrade to trusting the key alone.

P5.7 Parsers MUST reject duplicate keys, values that the pinned canonicalization cannot represent exactly, and any member of parameters, proof or Originals-defined state that is not defined by the pinned VH Log version or this profile.

P5.8 The author DID MUST be fixed at genesis; an entry naming a different author DID MUST be rejected. Authorship never transfers; selling an Original transfers ownership of its anchoring sat only (P9.11). Author DIDs MUST use a DID method with verifiable version history that the profile lists; the baseline profile lists did:vh and did:webvh. The author DID versionId referenced by each entry MUST NOT be older than the one referenced by its predecessor.

P5.9 Every entry MUST set or inherit exactly one updateKey, and that key MUST be an assertionMethod key of the author DID at the version the entry references. The author SHOULD remove from their DID any key they no longer hold, because a thief can rotate an Original to any listed key. An empty updateKeys list MUST be rejected except in a deactivation entry, where VH recommends it; deactivation is the only way to end an Original.

P5.10 A rotation entry’s parameters MUST contain only updateKeys, holding exactly one key that differs from the signing key. Its state MUST be identical to its predecessor’s except for the operation, which is rotate, the author verification method id and the author DID versionId. That version MUST be one in which the new key meets P5.3, and P5.8 applies. The rotation entry is signed by the asset log’s active updateKey as VH requires; that signing key need not still be listed in the author DID. Every other entry is an ordinary entry, and its signing key MUST meet P5.3 at the version it references.

P5.11 A signer holding an Originals key MUST parse the entry, show the author the Original, operation and resource changes before signing, and refuse input that is not a well-formed Originals entry. The author’s Originals key MUST be a verification method used only for Originals entries, and MUST NOT also be an updateKey of the author DID’s own log.

### Key policy

The baseline profile has one author per Original, for the Original’s whole life. The author’s DID is the Original’s controller, and its prerotation protects the DID itself; asset logs do not activate VH prerotation. An asset log lists one current key of the author, and P5.9 keeps that key inside the author’s DID. There is no dedicated per-Original keypair by default; a compatible author key can control several logs. Naming the author DID in an entry grants no log authority by itself.

### Collaboration deferred

Only the author’s key may append in the baseline profile. Editors who can change an Original’s state without gaining log control need that boundary enforced by VH verification rules, which is proposed upstream in VH Log issue 5 [S2a]. If VH Log does not adopt it, a later Originals profile will define delegation separately. Collaborative editing is not part of the baseline.

### Rotation and key compromise

To rotate, the author first updates their DID: they add the new key and, if the old key is compromised, remove it in the same update. The SDK sends the DID update to the witnesses of every affected Original, then appends a rotation entry to each asset log the old key controls. The rotation entry is signed by the old key, references the new DID version and sets updateKeys to the new key (P5.10).

For a witnessed Original, witnesses refuse an ordinary entry whose signing key the author’s latest DID no longer lists, and refuse a rotation entry whose new key that DID does not list (P9.8). Once the author’s DID update reaches the witnesses, a thief holding the removed key cannot edit, deactivate or fork the Original, and can perform only the rotation the author wants. The thief also cannot change the witnesses, because the witness list is declared in the author’s DID, which the asset key does not control (P9.9).

These limits remain:

- Before the author removes the stolen key, the thief can edit or deactivate any Original the key controls; deactivation is permanent. The thief can also rotate an Original to another key the author DID still lists, which is why P5.9 asks the author to remove keys they no longer hold.
- The protection holds only while fewer than a threshold of witnesses misbehave or see stale author DID history (P9.8).
- For an unwitnessed Original, entries signed with a removed key cannot be distinguished from earlier ones. Verifiers report them as historically authorized with unproven ordering, never as current (P7.9).
- A lost key that was never rotated cannot be replaced; recovery is a separate decision (section 8).

A VH extension that lets a log name a DID as its controller would remove the rotation entries; it is a candidate upstream change alongside VH Log issue 5 [S2a]. Loading evidence does not restore signing authority, and claimed timestamps cannot establish signing before revocation.

Sources: VH update authorization and witnesses [S2]; editor authority proposal [S2a]; identity document rules [S3]; current signer/envelope boundaries [S4, S6, S7].
