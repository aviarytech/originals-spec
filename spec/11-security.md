## Security considerations

This section collects the threats discussed throughout the draft.

| Adversary | Can | Cannot, under the baseline |
|---|---|---|
| Malicious host or mirror | Withhold bytes or evidence, serve an old valid prefix of the asset log or the author’s DID log, show different branches to different readers | Alter bytes or entries without failing digest or proof checks (P2.3, P4.3); hide a fork from a reader that checks witness proofs, unless a threshold of witnesses misbehaves (P9.8) |
| Network attacker | Observe fetches; block or delay them | Forge entries or bytes; steer resolvers at private addresses (P8.5) |
| Holder of a stolen author key, before the author removes it | Edit or deactivate any Original the key controls; deactivation is permanent. Rotate an Original to another key the author DID still lists | Move control to a key outside the author’s DID (P5.9, P5.10); change an Original’s witnesses (P9.9) |
| Holder of a stolen author key, after the removal reaches the witnesses | Sign entries on unwitnessed Originals, reported as ordering unproven and never current (P7.9) | Add witnessed entries to a witnessed Original, or rotate it to any key the author’s latest DID does not list, unless a threshold of witnesses misbehaves (P9.8) |
| Malicious archive or package | Exhaust verifier resources; attempt path traversal; roll back to an older prefix | Pass verification over its limits, or replace newer local history (P7.5, P7.7) |
| Malicious host application, or other software holding the key | Ask the signer to sign an unintended change | Obtain a signature from a conforming signer for a change it did not show the author, when the key is used only for Originals (P5.11) |
| Malicious content author | Publish signed active content | Run script on the platform origin or in a client (P9.7) |
| Wallet or sat holder | Hold or transfer the inscription | Gain edit or update authority (P9.6) |
| Author who sold the inscription | Keep editing or deactivate the Original; change its witnesses through their DID; show different branches to different readers of an unwitnessed Original | Hide a fork from a reader that checks witness proofs, unless a threshold of witnesses misbehaves (P9.8) |
| Faulty, censoring or colluding witness | Delay or refuse approvals; below the threshold, nothing else | Block or approve entries alone (P9.8). A threshold of colluding witnesses can approve a fork or a stolen key’s entries |
| Bitcoin reorganization | Undo an observed publication | Advance the durable published boundary (P9.4, P9.5) |

Witnessed Originals get their ordering from witnesses (P9.8), and the author’s DID controls who the witnesses are (P9.9). An unwitnessed Original has claimed ordering only: a valid prefix is not proof of current state, and recovery from key compromise is limited (section 5). Witness selection, independence and freshness bounds remain open (D3).

Permanent history cannot be redacted (P8.3). A key or DID used across Originals links them publicly.
