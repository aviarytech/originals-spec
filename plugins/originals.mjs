// Spec-Up plugin for the Originals spec. The markdown stays plain ("P5.3 ...",
// "D2 ...", "[S2]", "section 5"); this turns those into anchors and links.
import fs from 'node:fs';
import { JSDOM } from 'jsdom';

const CSS = fs.readFileSync(new URL('./originals.css', import.meta.url), 'utf8');

const LABEL = /^(P\d+\.\d+|D\d+)\s/;
const SOURCE_ENTRY = /^\[(S\d+a?|RFC\d+)\]/;
const XREF = /\bP\d+\.\d+\b|\bD[1-9]\b|\[S\d+a?(?:(?:, |–)S\d+a?)*\]|\bsection (\d+)\b/g;

function sourceId(name) {
  return `src-${name.toLowerCase()}`;
}

function labelParagraphs(document) {
  for (const el of document.querySelectorAll('p, li')) {
    const text = el.textContent;
    const label = text.match(LABEL);
    if (label && el.tagName === 'P') {
      const id = label[1].toLowerCase();
      el.id = id;
      el.classList.add(id.startsWith('d') ? 'decision' : 'rule');
      const first = el.firstChild;
      first.textContent = first.textContent.replace(LABEL, '');
      const anchor = document.createElement('a');
      anchor.className = 'rule-id';
      anchor.href = `#${id}`;
      anchor.textContent = label[1];
      el.insertBefore(anchor, first);
      el.insertBefore(document.createTextNode(' '), first);
      continue;
    }
    if (el.tagName === 'P' && text.startsWith('Sources:')) {
      el.classList.add('sources');
      continue;
    }
    const source = text.match(SOURCE_ENTRY);
    if (source) {
      el.id = sourceId(source[1]);
      el.classList.add('source-entry');
    }
  }
}

// Spec-Up numbers h2 headings in document order, so "section 5" is the fifth h2.
function sectionIds(document) {
  const ids = {};
  [...document.querySelectorAll('h2[id]')].forEach((h, i) => {
    ids[i + 1] = h.id;
  });
  return ids;
}

function link(document, href, text) {
  const a = document.createElement('a');
  a.href = href;
  a.className = 'xref';
  a.textContent = text;
  return a;
}

function linkReferences(document, sections) {
  const walker = document.createTreeWalker(document.body, 4 /* NodeFilter.SHOW_TEXT */);
  const nodes = [];
  while (walker.nextNode()) {
    const node = walker.currentNode;
    if (node.parentElement.closest('a, code, pre, h1, h2, h3, h4')) continue;
    XREF.lastIndex = 0;
    if (XREF.test(node.textContent)) nodes.push(node);
  }

  for (const node of nodes) {
    const fragment = document.createDocumentFragment();
    const text = node.textContent;
    let last = 0;
    XREF.lastIndex = 0;
    for (const match of text.matchAll(XREF)) {
      fragment.append(text.slice(last, match.index));
      const [whole, section] = match;
      if (section) {
        fragment.append(sections[section] ? link(document, `#${sections[section]}`, whole) : whole);
      }
      else if (whole.startsWith('[')) {
        // Link each source name inside a bracketed group such as [S4, S6–S9].
        let inner = 0;
        const body = whole.slice(1, -1);
        fragment.append('[');
        for (const name of body.matchAll(/S\d+a?/g)) {
          fragment.append(body.slice(inner, name.index));
          fragment.append(link(document, `#${sourceId(name[0])}`, name[0]));
          inner = name.index + name[0].length;
        }
        fragment.append(body.slice(inner), ']');
      }
      else {
        const id = whole.toLowerCase();
        fragment.append(document.getElementById(id) ? link(document, `#${id}`, whole) : whole);
      }
      last = match.index + whole.length;
    }
    fragment.append(text.slice(last));
    node.replaceWith(fragment);
  }
}

export default function originalsPlugin() {
  return {
    name: 'originals',
    transformRenderedHtml({ html }) {
      const { document } = new JSDOM(`<body>${html}</body>`).window;
      labelParagraphs(document);
      linkReferences(document, sectionIds(document));
      return document.body.innerHTML;
    },
    transformPageHtml({ html }) {
      return html.replace('</head>', `<style>${CSS}</style></head>`);
    }
  };
}
