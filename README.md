# Originals Protocol specification

[Read the VH-based Editor’s Draft 0.1](SPEC.md).

This is the first review draft of the Originals Protocol. It is a protocol and SDK design for review, not a finalized standard or an implementation.

The draft contains 13 sections, a 51-test conformance matrix, and seven open decisions. Active CEL history is replaced with Verifiable History while useful SDK semantics are retained. Each change has one signature: the author signs the VH entry with a key bound to the author’s DID. Hosted Originals use VH witnesses, declared in the author’s DID, that check the author’s latest DID state, so a removed key cannot add entries.
