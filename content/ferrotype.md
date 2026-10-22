---
title: "Types Worth Keeping"
slug: ferrotype
date: 2026-01-12
kicker: Ferrotype
dek: "[Ferrotype](https://github.com/iamnbutler/ferrotype) derives TypeScript types from Rust types, and they're the kind you'd be happy to have written by hand: tagged unions, template literal IDs, namespaces, and cross-references the Rust compiler checks."
repo: https://github.com/iamnbutler/ferrotype
links:
  - label: iamnbutler/ferrotype
    url: https://github.com/iamnbutler/ferrotype
  - label: ferro-type on crates.io
    url: https://crates.io/crates/ferro-type
  - label: ferro-type-gen on crates.io
    url: https://crates.io/crates/ferro-type-gen
  - label: serde
    url: https://serde.rs
  - label: linkme
    url: https://crates.io/crates/linkme
  - label: Tintype
    url: https://en.wikipedia.org/wiki/Tintype
facts:
  - label: Install
    value: "cargo add ferro-type"
  - label: Crates
    value: ferro-type, ferro-type-derive and ferro-type-gen, at 0.2.0
  - label: Status
    value: Works and tested (258 Rust tests); paused since January 2026
  - label: Built
    value: In three days in January 2026, mostly by worker agents in Gas Town
images:
  - src: figs/ferrotype/fig-1-tree
    alt: "The Message enum from ferrotype's test suite, with variants Ping, Text(String), Binary(Vec<u8>) and Error { code, message }, becomes through Message::typescript() a TypeDef tree: a Named node (name \"Message\", module \"derive_enum\") whose def is a Union of four Objects, each tagged with a type literal; that tree renders to the TypeScript union { type: \"Ping\" } | { type: \"Text\"; value: string } | { type: \"Binary\"; value: number[] } | { type: \"Error\"; code: number; message: string }."
    caption: "Fig. 1. Rust in, a tree in the middle, TypeScript out. Nothing is a string until render(). The real output is one line, wrapped here at ; and |."
  - src: figs/ferrotype/fig-2-registry
    alt: "Every type with #[derive(TS)] adds itself to TYPESCRIPT_TYPES, a linkme slice filled by the linker; TypeRegistry::from_distributed() reads it and keeps one entry per name; ferro-type-gen adds export, skips unchanged writes and writes types.ts, or one file per module. A dashed side path shows registering each type by hand with registry.register::<T>(), which is what agent-foundry does: 14 types, listed twice."
    caption: "Fig. 2. How a derived type reaches the file: added at link time, or by hand."
  - src: figs/ferrotype/fig-3-compile-error
    alt: "A struct field marked #[ts(index = Profile, key = nonexistent)] makes the derive write a hidden const holding fn _validate_indexed_access_0(__val: &Profile) { let _ = &__val.nonexistent; }, so cargo build fails with error E0609, no field `nonexistent` on type `&Profile`, noting the available fields login and email. Beside it, key = login builds and renders username: Profile[\"login\"]."
    caption: "Fig. 3. A TypeScript mistake, caught by the Rust compiler."
  - src: figs/ferrotype/fig-4-drift
    alt: "agent-foundry's SessionDetail struct has #[serde(flatten)] on its info: ApiSession field. serde reads the attribute and sends JSON with id, number, title and the other session fields at the top level next to messages, with no info key; ferrotype reads only #[ts] attributes, so the generated type is export type SessionDetail = { info: ApiSession; messages: ApiMessage[] }. Nothing caught it because the UI only reads messages."
    caption: "Fig. 4. Two readers of the same struct, and only one of them saw serde's attribute."
  - src: figs/ferrotype/fig-5-timeline
    alt: "Every ferrotype commit as a dot on a timeline, marked as a worker agent, the mayor, or under Nate's name: 28 commits on January 9, 5 on the 10th, 39 on the 11th, 3 on the 12th, then 3 on March 19. Notes mark the RPC brief and the decision to start the core over on January 9, the RPC code removed and five crates.io releases from 0.1.0 to 0.2.0 in under nine hours on January 11, the pause on January 12, and agent-foundry adopting 0.2.0 on February 18."
    caption: "Fig. 5. Built in three days, then left alone. One dot per commit."
  - src: figs/ferrotype/ill-1-tintype
    alt: "A small cased tintype: a brass mat with a beaded oval window and, on the dark iron plate inside, a single piece of metal type facing the camera, its face a reversed F."
---

Ferrotype is a Rust derive. Put `#[derive(TS)]` on the types your server sends and receives, and it writes the TypeScript types for your client, so the two can't drift apart.

There are crates that do this already. Their output compiles, but it uses hardly any of what makes TypeScript good, and you wouldn't want to have written it by hand. The bar I had in mind was a types package in [ace](https://github.com/githubnext/ace), written by an engineer who contributes to Svelte's core: discriminated unions with a rich `type` tag, template literal IDs like `` `vm-${string}` ``, intersections like `Claude.Todo & { createdAt: UNIX }`, nested names like `VM.Git.State`, and indexed access to keep one type's field in step with another's. Ferrotype writes types like those.

## What you get

Here's an enum from the test suite and the TypeScript it renders, exactly as the test asserts it:

```rust
#[derive(TS)]
enum Message {
    Ping,
    Text(String),
    Binary(Vec<u8>),
    Error { code: i32, message: String },
}
```

```ts
{ type: "Ping" } | { type: "Text"; value: string } | { type: "Binary"; value: number[] } | { type: "Error"; code: number; message: string }
```

Every variant carries its tag, so TypeScript narrows on `type` in a `switch` without a cast. An enum of unit variants becomes a union of strings, like `"Pending" | "Active" | "Completed"`. `Option<T>` becomes `T | null`, `Vec<T>` an array, `HashMap` a `Record`, `i128` and `u128` become `bigint`, and `Result<T, E>` becomes `{ ok: true; value: T } | { ok: false; error: E }`.

That's what made it worth using in agent-foundry, a Rust agent of mine with a Svelte UI. Nineteen request, response and event types derive `TS`, and the streaming events arrive in the UI as one union it can switch on:

```ts
export type PromptEvent = { type: "TextDelta"; text: string } | { type: "ThinkingDelta"; text: string } | { type: "ToolStart"; id: string; name: string } | { type: "ToolInput"; delta: string } | { type: "ToolResult"; id: string; content: string; is_error: boolean } | { type: "Complete"; session: ApiSession } | { type: "Error"; message: string };
```

## The good parts of TypeScript

The attributes follow [serde](https://serde.rs)'s names, so anyone who knows serde can read them: `rename`, `rename_all`, `skip`, `flatten`, `transparent`, and for enums `tag`, `content` and `untagged`. There are two kinds of optional, because TypeScript has two: a plain `Option<T>` is `field: T | null`, and `#[ts(optional)]` makes it `field?: T`.

Beyond serde, the attributes reach for the features ace's types use. A template literal pattern turns a string into a checked shape:

```rust
#[derive(TS)]
#[ts(pattern = "vm-${string}")]
struct VmId(String);
```

```ts
type VmId = `vm-${string}`;
```

TypeScript will now reject `"abc123"` where a `VmId` belongs. `#[ts(namespace = "VM::Git")]` puts a type inside nested `namespace` blocks and references it as `VM.Git.GitState`. `#[ts(extends = "Claude.Todo")]` makes an intersection with a type that lives only on the TypeScript side. `#[ts(wrapper = "Prettify")]` wraps a definition in the helper that's in almost every TypeScript codebase, and the generator can emit `Prettify` itself so the file stands alone.

## Mistakes that don't compile

Indexed access goes furthest. `#[ts(index = Profile, key = login)]` renders a field as `Profile["login"]`, so it follows whatever type `login` has. Rust has no indexed types, but a derive macro can still check one: it writes a small function that reads `login` from a `&Profile`, and if the field isn't there, the build fails (Fig. 3):

```
error[E0609]: no field `nonexistent` on type `&Profile`
  --> tests/compile_fail/indexed_access_invalid_field.rs:13:33
   |
13 |     #[ts(index = Profile, key = nonexistent)]
   |                                 ^^^^^^^^^^^ unknown field
   |
   = note: available fields are: `login`, `email`
```

That's a broken TypeScript reference caught by `cargo build`, before any TypeScript exists. With a string argument instead, `index = "ExternalType"`, it can point at types Rust can't see, and skips the check.

## Using it

Add `ferro-type`, derive `TS`, and generate the file from `build.rs` or a flag on your binary with `ferro-type-gen`. Every derived type registers itself, so there's no list to keep:

```rust
let registry = TypeRegistry::from_distributed();
```

The generator adds `export`, can write one file per Rust module, and skips the write when nothing changed, which keeps `build.rs` from triggering rebuilds. agent-foundry writes `ui/src/generated/types.ts` behind a `--gen-types` flag and also serves the same types over HTTP.

## How it works

The foundation is one trait, modeled on serde's `Serialize`:

```rust
pub trait TS {
    fn typescript() -> TypeDef;
}
```

`TypeDef` describes a TypeScript type as a tree: primitives, arrays, tuples, objects, unions, intersections, records, literals, template literals, indexed access, references, and named types that carry a namespace and the Rust module they came from (Fig. 1). Nothing becomes a string until it's rendered, so a registry can collect every named type once, however many places refer to it, and write one file.

Registration uses [linkme](https://crates.io/crates/linkme): the derive adds each type to a distributed slice that the linker assembles at build time (Fig. 2). It costs nothing at runtime and doesn't depend on code running before `main`, which is why it won over `inventory`.

## Caveats

- **It reads `#[ts]`, not `#[serde]`.** The attributes share serde's names, but the derive only looks at its own. In agent-foundry, `SessionDetail` has `#[serde(flatten)]` on its `info` field, so the JSON puts the session's fields at the top level, while the generated type says `{ info: ApiSession; messages: ApiMessage[] }` (Fig. 4). Nothing caught it because the UI only reads `messages`. Every attribute has to be written twice, and a forgotten one is a type that lies. The fix is to read serde's attributes directly.
- **Generics aren't generic.** `Paginated<User>` renders as a plain `Paginated` with `User[]` inside, not `type Paginated<T>`, and registering `Paginated<Post>` too drops one of them. `TypeDef` can describe a generic definition, but you have to build that tree by hand.
- **Auto-registration is easy to skip.** agent-foundry ended up listing its 14 types by hand, twice. Nothing stops you from doing that, and then nothing reminds you to add the fifteenth.
- **Output order and layout.** Types come out in registration order, one per line. One-file-per-module output doesn't write imports between the files yet.
- **It's paused.** It was built in three days by a swarm of agents in [Gas Town](https://github.com/gastownhall/gastown) and has been at 0.2.0 since January (Fig. 5). The tests pass on today's stable Rust, and CI runs rustfmt, clippy and the tests, but nobody's adding to it.

The repo also has an unpublished crate that goes the other way, `ferro-type-import`, which parses TypeScript with [swc](https://swc.rs) and writes Rust with serde derives.

The name is an old one. A ferrotype is another name for a [tintype](https://en.wikipedia.org/wiki/Tintype), a photograph made on a thin sheet of iron: ferro for iron, which is to say Rust, and type for types. The point is the same as the bar it started from. Generated types should be ones you'd keep.
