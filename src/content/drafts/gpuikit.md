---
title: gpuikit
slug: gpuikit
date: 2026-09-04
dek: "A component kit for [gpui](https://www.gpui.rs), [Zed](https://zed.dev)'s Rust UI framework, that took three years and three names to become mostly a set of agreements between its parts."
kicker: Toolkit
draft: true
repo: https://github.com/iamnbutler/gpuikit
links:
  - label: Live showcase
    url: https://nate.rip/gpuikit/
  - label: Source on GitHub
    url: https://github.com/iamnbutler/gpuikit
  - label: API docs (docs.rs)
    url: https://docs.rs/gpuikit
  - label: Crate (crates.io)
    url: https://crates.io/crates/gpuikit
  - label: gpui-unofficial
    url: https://github.com/iamnbutler/gpui-unofficial
  - label: Why it's not gpui-kit
    url: https://github.com/iamnbutler/gpuikit/blob/main/why.md
facts:
  - label: What
    value: UI component library for gpui applications
  - label: Language
    value: Rust, edition 2024, minimum Rust 1.85
  - label: Elements
    value: 44 component modules, accordion to typography
  - label: Control scale
    value: Small 16px, Medium 20px (default), Large 24px
  - label: Themes
    value: 6 bundled (Gruvbox Dark and Light, four Catppuccin flavors)
  - label: Runs on
    value: Native desktop, and the browser via gpui's web platform (WebGPU, falling back to WebGL2)
  - label: Latest release
    value: 0.9.0, September 4, 2026 (pre-1.0)
  - label: First commit
    value: October 4, 2023, as "vitesse"
pullquotes:
  - "gpui gives you a very fast renderer, divs, flexbox and text. It does not give you a select."
  - "A row of controls from a component library should line up. Ours didn't."
  - "No id, no role."
  - "The rules check themselves, or they stop being rules."
images:
  - src: /drafts/gpuikit/showcase-home.png
    alt: The gpuikit showcase home page in the Gruvbox Dark theme. A sidebar lists components by section (Foundations, Input, Display, Layout, Overlay, Data, Content). The main area is a mission-control board for a lunar freight line, with telemetry cards, a crew manifest table, life support gauges and switches, a burn planner with sliders, a comms feed, a checklist, a cargo accordion and a calendar.
    caption: The showcase opens on a mission-control board for a small lunar freight line. Every part of it is a gpuikit component. It's gpui running in a browser.
  - src: /drafts/gpuikit/showcase-control-sizes.png
    alt: The Control Sizes page of the showcase. Three rows labeled Small (16px tall, 11px text), Medium (20px tall, 12px text) and Large (24px tall, 13px text), each holding a button, icon button, badge, keyboard key, checkbox, two switches, a select, a text field, tabs, a toggle group, radio buttons and a slider on a shaded stripe.
    caption: '"One rung per row. The stripe behind each row is exactly the rung''s height." Look closely at Large: the slider has fallen off the end of its row.'
  - src: /drafts/gpuikit/fig-1-layers.svg
    alt: Patent-style exploded drawing of five stacked slabs, numbered 10 to 18 from the bottom. gpui, gpui-unofficial, foundations (theme, control scale, a11y, focus, keymap, input, layout), elements (its top face divided into an 11 by 4 grid of 44 cells), and a dashed slab for your app.
    caption: Fig. 1. The layer cake, exploded. Your app names gpui, gpui_platform and gpuikit directly.
  - src: /drafts/gpuikit/fig-2-rungs.svg
    alt: Patent-style drawing of three dashed stripes 16, 20 and 24 pixels tall at four times scale, each holding a button, a checkbox, a switch and a text field that exactly fill the stripe's height.
    caption: Fig. 2. The control size scale. Every control on a row sits on the same rung.
art: >-
  The metaphor is a parts catalog: gpuikit as a mail-order hardware catalog
  for interface parts, "Catalog No. 0.9", with every component a numbered part
  on a specimen sheet. Line art is patent-plate style throughout: Fig. 1's
  exploded layer cake (reference numerals 10–18) and Fig. 2's three control
  rungs drawn at 4:1 with dimension lines, plus hand-redrawn single parts (a
  switch, a checkbox, a slider thumb, a calendar chevron) as small plates. Ink
  pairing: blue and black for the engineering material, fluorescent orange for
  the rules and the things that broke, fluorescent pink reserved for the
  opener and one stamp. Three spreads. Spread 1, the opener: "GPUIKIT" set
  huge across the gutter in black, over the showcase home screenshot run as a
  coarse blue halftone so the lunar-freight board reads as a dot field; the
  name history (vitesse → gpui-kit → gpuikit) as a strip of three rubber
  stamps in pink, the first two struck through; dek and kicker in a corner
  box like a catalog cover's issue line. Spread 2, the specimen sheet: all 44
  element module names set as a dense catalog index in a numbered grid (11 ×
  4, matching the cells on Fig. 1's elements slab), with Fig. 1 large in blue
  on the facing page and the real Button snippet as a clipping taped at an
  angle. Spread 3, the rules: Fig. 2 as the full-width plate in black with the
  three rungs overprinted in blue, the control-sizes screenshot as an orange
  halftone clipping with the slider that fell off its row circled in hand-drawn
  orange; "No id, no role." and "The rules check themselves, or they stop
  being rules." as huge pull quotes; the removed Skeleton and Grain components
  as two "discontinued" catalog entries with orange DISCONTINUED stamps.
  Structural device: a running catalog part number in the folio (GK-001,
  GK-002...) and a tear-off order-form strip along the bottom of the last
  spread holding the three Cargo.toml dependency lines.
---

gpuikit is a UI toolkit for [gpui](https://www.gpui.rs), the Rust UI framework that Zed is built on. It's buttons, selects, dialogs, tables, a calendar, a markdown renderer, an optional editor, and the theme and sizing plumbing that holds them together. You can [poke at all of it in your browser](https://nate.rip/gpuikit/), which still surprises me a little.

## Three names in three years

The first commit is from October 4, 2023, and its message is "The stary of something great." Typo included. It was called `vitesse` then. In May 2024 it became `gpui-kit`, and then it mostly sat. In November 2025 I picked it back up, dropped the hyphen, and started building for real. Nearly all of what exists now was written after that.

I worked at Zed, so gpui isn't new to me. What I kept running into outside of Zed is that gpui gives you a very fast renderer, divs, flexbox and text. It does not give you a select. Every app starts by rebuilding the same twenty controls, slightly differently each time. The README says the target is "a conceptual union of SwiftUI and web-style component libraries," which is a fancy way of saying: the vocabulary of a native toolkit, the ergonomics of a web component library.

The other unglamorous problem was distribution. gpui lived in Zed's repo as a git dependency, and you can't publish a crate to crates.io that depends on a git rev. So I made [gpui-unofficial](https://github.com/iamnbutler/gpui-unofficial), which publishes gpui to crates.io on Zed's release tags. As of 0.4.0, gpuikit depends on that, and so does your app.

## The layer cake

Here is the whole thing, bottom to top (Fig. 1):

1. **gpui**, which does the actual drawing.
2. **gpui-unofficial**, the same gpui, packaged so Cargo can find it.
3. **Foundations**: the theme, a shared control size scale, an accessibility convention, focus, keymaps, text input, and some layout helpers like `h_stack` and `v_stack`.
4. **Elements**: 44 component modules, accordion to typography.
5. **Your app**, which names `gpui`, `gpui_platform` and `gpuikit` as three separate dependencies. gpuikit deliberately doesn't re-export gpui.

Using a component looks like ordinary gpui code, because it is:

```rust
use gpuikit::elements::button::button;
use gpuikit::layout::h_stack;

h_stack()
    .child(button("cancel", "Cancel"))
    .child(button("delete", "Delete").destructive().on_click(|_, _, _| {
        // ...
    }))
```

`destructive()` exists because a delete button should look the same everywhere in an app instead of being re-derived from the palette at each call site. That's most of what a toolkit is for.

## Agreements, not components

The more I worked on it, the clearer it got that the components were the easy part. The hard part is the agreements between them.

A row of controls from a component library should line up. Ours didn't. `Button` was 16px tall, `Toggle` 20px, `Switch` and `IconButton` 24px, and a few never declared a height at all and let padding decide. Nothing in the crate would have noticed. Now there's one control scale with three rungs: Small at 16px, Medium at 20px (the default), and Large at 24px (Fig. 2). Every control resolves its dimensions from the rung it's on. Change the scale and every control moves together. The showcase has a page that draws each rung as a stripe exactly as tall as the rung, so a control that overhangs it is visibly off. It still catches things.

Accessibility got the same treatment. An element declares its role and name in one place and applies it with one `.announce(...)` call. Because gpui only lets an element carry a role once it has an id, the type system enforces a nice rule for free. No id, no role. A button with no name trips a debug assertion, because a control that announces "button" and nothing else is arguably worse than one that isn't in the tree.

Theming starts small: a `Theme` is five colors (foreground, background, surface, border, accent), and everything else is derived from them unless you override it. Six themes ship in the box, Gruvbox and Catppuccin. On `main` there's also `ThemeExtension`, for crates that need colors gpuikit has never heard of, like a diff view's added and removed fills.

## The showcase is the docs

The showcase is one example file, `showcase.rs`. It runs natively with `cargo run --example showcase --features examples`, and the exact same file is built for WebAssembly and deployed to nate.rip/gpuikit on every push to `main`. That's gpui running in a browser tab, on WebGPU or, failing that, WebGL2. It's a roughly 31 MB download, so the page now shows a download meter instead of a blank screen. Getting that loading state honest took a couple of tries.

It opens on a mission-control board for a small lunar freight line: crew manifest, burn planner, life support, launch windows. I didn't do this for the bit (well, a little). Component pages show one part at a time, and a board shows whether the parts work together. The propellant readout is the actual rocket equation, recomputed from the sliders every frame.

## Rules that check themselves

The thing I'm proudest of is unglamorous. A lot of this crate's conventions are enforced by tests that read the repo:

- Every element module needs a page in the showcase, or a written reason why it doesn't have one.
- No doc example may be marked `ignore`. In the 0.9.0 release, every published example compiles, and 42 of the 47 run against a real gpui app. Before that, the Quick Start on docs.rs named a function that no longer existed.
- Nothing calls gpui's accessibility builders directly. Everything goes through the convention.
- No thread gets spawned that can't be joined, after one that couldn't crashed an otherwise green test run.

This year a lot of the work happened with Claude in the loop, and plenty of commits are co-authored. That's part of why the guards exist. People and agents both drift, and a convention that lives only in someone's head (or a context window) doesn't survive the next PR. The rules check themselves, or they stop being rules.

Some things got removed. `Skeleton` used a repeating animation, and in gpui a live animation asks for another frame forever, so one loading placeholder pinned its whole window at the display's refresh rate. `Grain` painted one quad per 4px cell, about 60,000 quads for a 1200×800 overlay. Both are gone until they can come back as something that doesn't cost that much.

## Where it's at

It's pre-1.0, and the README says so with construction emoji on both sides: expect breaking changes, pin your version. 0.9.0 came out September 4, 2026. The open issues are honest about what's left. Checkbox, switch, toggle and slider don't announce themselves yet, the web build ships the wrong keymap, and an empty combobox opens a little strip of padding.

One more thing. In September 2026, `gpui-component` renamed itself to `gpui-kit`, the name this project already wore and moved on from. So: gpuikit is not gpui-kit. There's a [why.md](https://github.com/iamnbutler/gpuikit/blob/main/why.md) with the timeline if you ever need it.
