# Originals Protocol specification

[Read the VH-based Editor’s Draft 0.1](https://aviarytech.github.io/originals-spec/).

This is the first review draft of the Originals Protocol. It is a protocol and SDK design for review, not a finalized standard or an implementation.

The draft contains 13 sections, a 144-test conformance matrix, and a decision register (D1–D7) recording the choices taken and those still open. Originals history is built on Verifiable History while useful SDK semantics are retained. Each change has one signature: the author, or an editor the author has granted, signs the VH entry with a key bound to their own DID. Asset logs have no witnesses: off Bitcoin an Original’s ordering is claimed only, and anchoring it on Bitcoin orders its entries on the anchoring sat and gives it a provisional owner.

## Editing

The spec is written in [Spec-Up](https://github.com/decentralized-identity/spec-up) markdown under `spec/`, one file per section. It renders to `docs/index.html`, and pushes to master publish it to GitHub Pages.

```sh
npm install
npm run build   # render once
npm run edit    # re-render on change
```

Write proposed rules as paragraphs starting with their number (`P5.3 A verifier MUST ...`) and open decisions as `D2 ...`. The plugin in `plugins/originals.mjs` gives them anchors and links every mention of `P5.3`, `D2`, `[S4]` or `section 5` in the text.
