# Originals Protocol specification

[Read the VH-based Editor’s Draft 0.1](https://aviarytech.github.io/originals-spec/).

This is a review draft of the Originals Protocol. It is a protocol and SDK design for review, not a finalized standard or an implementation.

The draft contains 14 sections, a 455-test conformance matrix, each test with a stable ID, and a decision register (D1–D22) recording the choices taken and those still open. Each Original is a `did:og`, the Originals DID method, which defines its own log format, keeping the entry shape and hash algorithms of the Verifiable History Log (VH-Log) and did:vh without depending on either, while useful SDK semantics are retained. Each signer signs the VH entry with a key bound to their own DID: the Original’s one author, or an editor the author has granted. Asset logs have no witnesses: off Bitcoin an Original’s ordering is claimed only, and anchoring it on Bitcoin orders its entries on the anchoring sat and gives it a provisional holder. The anchoring sat carries the complete log, so Bitcoin supplies the publication and anchoring evidence, and the history of every did:btco signer; verifying a did:vh or did:webvh signer also requires its resolved DID log, as separate evidence that is not inscribed (P9.18, P9.33).

## Editing

The spec is written in [Spec-Up](https://github.com/decentralized-identity/spec-up) markdown under `spec/`, one file per section. It renders to `docs/index.html`, and pushes to master publish it to GitHub Pages.

The repository holds two documents. The core, `spec/`, is `did:og` 1.0: one author, editors, and the local, hosted and Bitcoin layers (D13). Signer sets, parent Originals, scoped grants and read authorization are not part of it. They are kept as an experimental additions document under `spec/additions/`, which renders to `docs/additions/index.html`, with its own 66 conformance tests; open review findings against it are tracked as GitHub issues.

```sh
npm install
npm run build   # render once
npm run edit    # re-render on change
npm run vectors        # regenerate the test vectors in vectors/
npm run vectors:check  # verify the test vectors independently
```

Provisional test vectors for the current method value, `og:1.0-draft.1`, are under `vectors/` (P14.26). They cover the local, hosted and Bitcoin (synthetic regtest) layers, and an implementation must reproduce them byte for byte and report for report (D21).

Write proposed rules as paragraphs starting with their number (`P5.3 A verifier MUST ...`) and open decisions as `D2 ...`. The plugin in `plugins/originals.mjs` gives them anchors and links every mention of `P5.3`, `D2`, `[S4]` or `section 5` in the text.
