## Security considerations

This section collects the threats discussed throughout the draft.

| Adversary | Can | Cannot, under the baseline |
|---|---|---|
| Malicious host or mirror | Withhold bytes or evidence, serve an old valid prefix of the asset log or the author’s DID log, show different branches to different readers | Alter bytes or entries without failing digest or proof checks (P2.3, P4.3); hide a fork from a reader that checks witness proofs, unless a threshold of witnesses misbehaves (P9.8) |
| Network attacker | Observe fetches; block or delay them | Forge entries or bytes; steer resolvers at private addresses (P8.5) |
| Holder of a stolen author key, before the author removes it | Edit or deactivate any Original the key controls that is not anchored, or whose sat the thief also holds; deactivation is permanent | Move control away from the author DID (P5.9); change an Original’s witnesses (P9.9) |
| Holder of a stolen author key, after the removal reaches the witnesses | Sign entries on unwitnessed Originals, reported as ordering unproven and never current (P7.9) | Add witnessed entries to a witnessed Original, unless a threshold of witnesses misbehaves (P9.8) |
| Malicious archive or package | Exhaust verifier resources; attempt path traversal; roll back to an older prefix | Have an over-limit history reported as complete or current, or replace newer local history (P7.5, P7.7) |
| Malicious host application, or other software holding the key | Ask the signer to sign an unintended change | Obtain a signature from a conforming signer for a change it did not show the author, because the key is used only for Originals (P5.11) |
| Malicious content author | Publish signed active content | Run script on the platform origin or in a client (P9.7) |
| Owner, the holder of the anchoring sat | Sell or give away the Original by moving the sat; refuse to inscribe the author’s changes, freezing the Original; inscribe changes the author signed | Author, rotate, change witnesses or deactivate on their own (P9.12) |
| Thief of the owner’s wallet | Take ownership by moving the sat; freeze the Original | Author any change (P9.12) |
| Thief of the wallet holding a did:btco author DID’s sat | Take permanent control of the author DID, which the author cannot recover; add their own Originals keys, change witnesses and sign as the author; deactivate the author DID, making every unanchored Original non-current (P6.5) | Change an anchored Original without its sat’s holder (P9.12); change the author DID named by any Original (P5.8) |
| Host of a did:vh or did:webvh author DID, after anchoring | Withhold the author DID log, leaving anchored Originals with incomplete identity evidence | Affect the author binding of Originals whose author DID is a did:btco (P5.13) |
| Copier who inscribes the same evidence on another sat | Hold an inscription of it | Become the owner, or change the Original (P9.11) |
| Author after selling an anchored Original | Sign changes, which take effect only if the owner inscribes them; rotate keys or deactivate their DID, which refuses later inscriptions only; publish a did:vh or did:webvh author DID update with a backdated versionTime, no earlier than their previous DID update, that removes the key and so rejects entries inscribed since, unless the author DID’s witnesses or watchers refute that time; a verifier that accepted those entries earlier reports a retroactive revocation conflict | Change or deactivate the Original alone; change the owner or move it to another sat (P9.10, P9.12); make the Original non-current by a timely rotation or deactivation (P9.15) |
| Faulty, censoring or colluding witness | Delay or refuse approvals; below the threshold, nothing else | Block or approve entries alone (P9.8). A threshold of colluding witnesses can approve a fork or a stolen key’s entries |
| Bitcoin reorganization | Undo an observed publication | Advance the durable published boundary (P9.4, P9.5) |

Witnessed Originals get their ordering from witnesses (P9.8), and the author’s DID controls who the witnesses are (P9.9). Anchored Originals get it from inscription order on the sat instead; witnesses stop at the anchoring entry (P9.10, P9.13). An unwitnessed Original has claimed ordering only: a valid prefix is not proof of current state, and recovery from key compromise is limited (section 5). Witnesses accept author DID state no more than 60 seconds old (P9.8); witness selection, independence and the verifier freshness policy remain open (D3).

Permanent history cannot be redacted (P8.3). A key or DID used across Originals links them publicly.
