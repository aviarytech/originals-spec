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

The design review of 21 November 2026 found open problems in this text, among them that a single author can convert an Original to a set and then be removed (B2), that a child Original can disclose a private parent’s log (B3), that serving by digest lets anyone who names a digest obtain private bytes (B4), that scoped entries break verification from Bitcoin alone (B5), and that inherited grants let editors move the pin (M1). They are tracked as GitHub issues against this document, and must be resolved before any of it is proposed again.
