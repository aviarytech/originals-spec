Originals Protocol
==================

**Specification Status:** [[badge: Editor’s Draft 0.1]]

**Date:** 15 October 2026 · First review draft · Protocol and SDK design

**Latest Draft:**
  [https://aviarytech.github.io/originals-spec](https://aviarytech.github.io/originals-spec)

Editors:
~ Brian Richter ([Aviary Tech](https://aviary.tech))

Participate:
~ [GitHub repo](https://github.com/aviarytech/originals-spec)
~ [File an issue](https://github.com/aviarytech/originals-spec/issues)
~ [Commit history](https://github.com/aviarytech/originals-spec/commits/master)
~ [Security review report](https://github.com/aviarytech/originals-spec/blob/master/security-review.html)

------------------------------------

Originals preserves the identifiable, signed history of named digital resources, such as a photograph or a document, and lets its author create, edit, verify and publish it. That history is built on Verifiable History (VH).

Each change has one signature: the author signs the VH entry with a key bound to the author’s DID. Hosted Originals use VH witnesses, declared in the author’s DID, that check the author’s latest DID state, so a removed key cannot add entries.

This is a protocol and SDK design for review, not a finalized standard or an implementation. Numbered rules such as [P5.3](#p5.3) are proposed requirements; [D1](#d1)–[D7](#d7) record decisions, taken and open.
