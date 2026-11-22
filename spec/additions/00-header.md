Originals Protocol: experimental additions
==========================================

**Specification Status:** [[badge: Experimental, additions-draft.1]]

**Date:** 21 November 2026 · Experimental · Not part of did:og 1.0

**Core specification:**
  [Originals Protocol](../index.html), `did:og` 1.0 (method value `og:1.0-draft.1`)

Editors:
~ Brian Richter ([Aviary Tech](https://aviary.tech))

Participate:
~ [GitHub repo](https://github.com/aviarytech/originals-spec)
~ [File an issue](https://github.com/aviarytech/originals-spec/issues)

------------------------------------

## Status

This document holds the parts of the Originals design that were decided on 19 November 2026 (D8, D9) and then moved out of the core on 21 November 2026, when the design review led to cutting `did:og` 1.0 down to a self-contained core (D13 in the core). They are:

- signer sets, an Original governed by several DIDs with a threshold (P5.19–P5.23, P5.30);
- parent Originals, editor grants inherited from a pinned parent (P5.24–P5.27);
- scoped grants, and the objects a profile names from a resource (P5.28, P5.29, P14.23);
- read authorization, host-enforced read grants in the asset state (P8.6–P8.14, P14.24).

The text is moved unchanged, apart from links, the identifier now being `did:og`, and references to the core’s sections being written as “§N of the core”. Rule numbers are kept, and the core keeps them as tombstones, so neither document reuses them.

This addition is **experimental**. It is not part of `did:og` 1.0, an implementation of the core MUST NOT accept the members it defines (`authors`, `parent`, `readers`, a grant’s `scope`, an `author` array), and a `did:og` 1.0 verifier rejects them under P5.7 and P14.4. If it is adopted, it will be a separately versioned addition with its own method value, not a change under `og:1.0`. It is written against the core as it stood at revision aeab90a, when these rules were part of it; the core rules it cites have since been narrowed to single-author Originals, and the clauses removed from them are recorded in “Core rules as amended by this addition”, at the end of this document.

The design review of 21 November 2026 found open problems in this text, among them that a single author can convert an Original to a set and then be removed (B2), that a child Original can disclose a private parent’s log (B3), that serving by digest lets anyone who names a digest obtain private bytes (B4), that scoped entries break verification from Bitcoin alone (B5), and that inherited grants let editors move the pin (M1). They are tracked as GitHub issues against this document, and must be resolved before any of it is proposed again. The issues to be filed are listed below; links are added once they exist.

| Finding | Problem | Issue |
|---|---|---|
| B2 | Signer sets let authorship transfer, and let a stolen author key take permanent control (P5.20, P5.21; core D11) | To be filed |
| B3 | A child Original discloses a private parent’s log without the parent’s consent (P5.24, P5.25, P8.7, P8.10; core D14) | To be filed |
| B4 | Serving by digest lets anyone who names a digest obtain the private bytes (P8.11; core D14) | To be filed |
| B5, scope half | A scoped editor entry inscribed after the anchor is unverifiable without bytes or a defined view, so conforming verifiers disagree on the anchored head (P5.28) | To be filed |
| M1 | Inherited grants: editors move the pin, revocation does not reach children, and parent activity invalidates children (P5.24–P5.27; core D17) | To be filed |
| M10, reader half | Read authentication accepts stale DID history, has sessions with no limit, and checks readers by DID string (P8.6, P8.9, P14.24) | To be filed |
| M14 | Objects named from a resource form a second content model that is never defined (P5.29, P8.11) | To be filed |
| M18 | Overlapping direct and inherited grants have no rule for combining their scopes (P5.24, P5.28) | To be filed |
| Minor | Reader lists are public in the signed log; read grants freeze behind the sat holder after anchoring; a host may serve while a revocation is pending (P8.6–P8.14) | To be filed |
| Minor | A 32-of-32 set cannot replace a member in one entry, which needs 33 signer references (P5.20, P14.4) | To be filed |
| Minor | Path and item views ignore collection-wide state, such as order, and a change of media type (P5.29) | To be filed |
| Minor | Carried bytes that match their descriptor are not used for scope checks, so a carried file and a package of the same checkpoint give different results (P5.28) | To be filed |
| Minor | The read request still allows `bip340-jcs-2025`, which the core no longer permits (P14.24; core P5.12) | To be filed |
