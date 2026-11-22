Originals Protocol
==================

**Specification Status:** [[badge: Editor’s Draft 0.1]]

**Date:** 21 November 2026 · Review draft · Protocol and SDK design

**Latest Draft:**
  [https://aviarytech.github.io/originals-spec](https://aviarytech.github.io/originals-spec)

Depends On:
~ [VH-Log](https://swcurran.github.io/VH-Log/next/), the Verifiable History Log mechanism ([source](https://github.com/swcurran/VH-Log))

Defines:
~ `did:og`, the Originals DID method: each Original is a `did:og:<SCID>` whose log is a VH-Log specialisation defined here

Profiles:
~ [did:webvh](https://github.com/decentralized-identity/didwebvh), for an Original’s web alias and for author DIDs
~ did:btco, for an anchored Original’s Bitcoin alias and for author DIDs
~ [did:vh](https://swcurran.github.io/didvh-old/next/), the VH-Log-based pre-draft, for author and editor DIDs only

Related Specifications:
~ [Experimental did:webvh on VH-Log](https://github.com/decentralized-identity/didwebvh/pull/302)
~ [Experimental additions](additions/index.html): signer sets, parent Originals, scoped grants and read authorization, which are not part of `did:og` 1.0

Editors:
~ Brian Richter ([Aviary Tech](https://aviary.tech))

Participate:
~ [GitHub repo](https://github.com/aviarytech/originals-spec)
~ [File an issue](https://github.com/aviarytech/originals-spec/issues)
~ [Commit history](https://github.com/aviarytech/originals-spec/commits/master)
~ [Security review report](security-review.html) (12–13 October 2026, of an earlier draft)

------------------------------------

Originals preserves the identifiable, signed history of one digital resource, such as a photograph or a document, and its versions, and lets its author create, edit, verify and publish it. That history is built on Verifiable History (VH).

Each signer signs the VH entry with a key bound to their own DID: the author, or an editor the author has granted. Asset logs have no witnesses: off Bitcoin an Original’s ordering is claimed only, and anchoring it on Bitcoin orders its entries on the anchoring sat and gives it a provisional owner. The anchoring sat carries the complete log, so Bitcoin alone verifies it, and each inscription’s body is, by default, a small preview of the Original’s resource at that version, signed in the entry it carries, or the version itself, so the sat shows the current version or its preview; versions not inscribed in full are not needed for that, and only the DID history of a did:vh or did:webvh signer, author or editor, is still fetched from elsewhere. Bitcoin does not prove that no competing anchor exists on another sat.

This is a protocol and SDK design for review, not a finalized standard or an implementation. Each Original is a `did:og`, its own DID method, built as a VH-Log specialisation; the method value is `og:1.0-draft.1` (P14.1). Numbered rules such as [P5.3](#p5.3) are proposed requirements; [D1](#d1)–[D9](#d9) record decisions, taken and open.
