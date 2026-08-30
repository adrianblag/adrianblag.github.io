---
title: "Sample post: everything the Markdown renderer supports"
date: 2025-08-04
description: "A placeholder post that exercises headings, links, lists, blockquotes, tables and code so you can see how each one is styled before you write your own."
category: "Research life"
---

This is a placeholder post. Replace the file, keep the frontmatter shape. The
first paragraph carries the same weight as the rest of the body — there is no
special "lede" treatment, so open with whatever sentence you actually want
people to read.

## A second-level heading

Body copy is set in Newsreader at a comfortable measure. Paragraphs sit close
enough to read continuously but far enough apart to scan. Inline formatting
works as you would expect: **bold**, *italic*, `inline code`, and
[a link to somewhere](https://example.com).

### A third-level heading

Lists are indented and the markers are muted so they stay out of the way:

- A first item in an unordered list.
- A second item, slightly longer, to show how a wrapped line sits under the
  marker rather than beside it.
- A third item.

Ordered lists work the same way:

1. Establish the question.
2. Say what you tried.
3. Say what happened, including the part that did not work.

> A blockquote sits behind a hairline rule in the accent-adjacent grey. Use it
> for quotations from papers, reviewer comments, or the sentence from your own
> notes that turned out to be the whole argument.

## Code

Fenced code blocks are syntax-highlighted at build time, so there is no
JavaScript cost on the page:

```python
def calibration_error(probs, labels, bins=10):
    """Expected calibration error, the short version."""
    edges = [i / bins for i in range(bins + 1)]
    total = 0.0
    for lo, hi in zip(edges, edges[1:]):
        chunk = [(p, y) for p, y in zip(probs, labels) if lo < p <= hi]
        if not chunk:
            continue
        conf = sum(p for p, _ in chunk) / len(chunk)
        acc = sum(y for _, y in chunk) / len(chunk)
        total += abs(conf - acc) * len(chunk) / len(probs)
    return total
```

Long lines inside a code block wrap rather than scrolling the whole page
sideways.

## Tables

| Column | What it holds | Notes |
| --- | --- | --- |
| One | A short value | Tables scroll on their own on narrow screens |
| Two | Another value | The page body never scrolls sideways |

---

A horizontal rule closes a section without needing a heading. Below it, the
last paragraph — and then the "All writing" link back to the index.
