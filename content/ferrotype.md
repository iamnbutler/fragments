---
title: "Types Worth Keeping"
slug: ferrotype
date: 2026-01-12
kicker: Ferrotype
dek: "[Ferrotype](https://github.com/iamnbutler/ferrotype) derives TypeScript types from Rust types. The bar was types you'd be happy to have written by hand. It took three days, a swarm of agents, and one rewrite from scratch."
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
  - label: Built
    value: January 9–12, 2026, mostly by worker agents in Gas Town
  - label: History
    value: 78 commits, 39 of them on January 11; last commit March 19
  - label: Published
    value: ferro-type, ferro-type-derive and ferro-type-gen, five versions in nine hours, now 0.2.0
  - label: Size
    value: About 4,900 lines of Rust in the three published crates, tests included
  - label: Tests
    value: 258 Rust tests, all passing
  - label: Install
    value: "cargo add ferro-type"
---

When a Rust service talks to a TypeScript client, I want the client's types generated from the server's, so the two can't drift apart. There are crates for this, but I couldn't find one that wrote good types. They compile, but they use hardly any of what makes TypeScript good, and you wouldn't want to have written them by hand.

The bar I had in mind was a types package in ace, the collaborative coding app I was working on at GitHub Next. It was written by an engineer who contributes to Svelte's core, and it uses the language well: discriminated unions with a rich `type` tag, template literal IDs like `` `vm-${string}` ``, intersections like `Claude.Todo & { createdAt: UNIX }`, nested names like `VM.Git.State`, and indexed access to keep one type's field in step with another's. I wanted a Rust derive to produce types like those.

[Ferrotype](https://github.com/iamnbutler/ferrotype) is that derive. It's published as `ferro-type`, because someone already had `ferrotype` on crates.io.

## It started as RPC

It didn't start as a type generator. On January 9 I asked for an RPC library like tRPC, with a Rust server and a TypeScript client. The brief was that the Rust side "generates sophisticated, modern types, with proper unions, no use of `as`, `any`, etc." and to "focus on correctness of types over codebase simplicity."

By that evening it was clear the RPC wasn't the hard part. As I put it then, "the type gen and validation of the type gen is most of the work, and useful beyond the rpc bit." I often want Rust services that talk to TypeScript without RPC at all. So the plan changed: `ferrotype` would be type generation only, and an RPC layer could come later as its own crate. It never did.

The other decision that night was to start over. serde was the model, and rather than refactor the RPC-era code toward it, the core was rewritten from scratch, "so we aren't trying to both do api design AND keep all the things we've built so far working at the same time." The RPC traits and tests were deleted two days later, once the new core could stand on its own.

## A tree, not a string

The foundation is one trait, modeled on serde's `Serialize`:

```rust
pub trait TS {
    fn typescript() -> TypeDef;
}
```

`TypeDef` is an enum that describes a TypeScript type: primitives, arrays, tuples, objects, unions, intersections, records, literals, template literals, indexed access, references, and named types that carry a namespace and the Rust module they came from. Nothing becomes a string until the end. A derived type comes back as a named node wrapping its definition, so a registry can collect every named type once, however many places refer to it, and render a file.

`#[derive(TS)]` writes that impl for you. Here's an enum from the test suite and the TypeScript it renders, exactly as the test asserts it:

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

Every variant carries its tag, so TypeScript narrows on `type` in a `switch` without a cast. An enum with only unit variants becomes a union of strings instead, like `"Pending" | "Active" | "Completed"`. `Option<T>` becomes `T | null`, `Vec<T>` an array, `HashMap` a `Record`, tuples tuples, and `i128` and `u128` become `bigint`. `Result<T, E>` becomes `{ ok: true; value: T } | { ok: false; error: E }`.

Registration had to be automatic. Early on, using the registry meant calling `registry.register::<T>()` once per type, and I didn't want that: "There could be hundreds of structs." Now the derive also adds each type to a [linkme](https://crates.io/crates/linkme) distributed slice, which the linker assembles at build time, and `TypeRegistry::from_distributed()` picks them all up. linkme won over `inventory` because it costs nothing at runtime and doesn't depend on code running before `main`. A second crate, `ferro-type-gen`, writes the result to a file, adds `export`, can write one file per Rust module, and skips the write when nothing changed, which keeps `build.rs` from triggering rebuilds.

## serde's vocabulary

The attributes follow serde's names, so anyone who knows serde can read them: `rename`, `rename_all`, `skip`, `flatten`, `transparent`, and for enums `tag`, `content` and `untagged`. An adjacently tagged enum from the tests:

```rust
#[derive(TS)]
#[ts(tag = "tag", content = "data")]
enum AdjacentStructVariant {
    Error { code: i32, message: String },
    Info { text: String },
}
```

```ts
{ tag: "Error"; data: { code: number; message: string } } | { tag: "Info"; data: { text: string } }
```

There are two kinds of optional, because TypeScript has two. A plain `Option<T>` is `field: T | null`: the key is always there and may be null. `#[ts(optional)]` makes it `field?: T`: the key may be missing.

## The good parts of TypeScript

Then the features from ace's types. A template literal pattern turns a string into a checked shape:

```rust
#[derive(TS)]
#[ts(pattern = "vm-${string}")]
struct VmId(String);
```

```ts
type VmId = `vm-${string}`;
```

TypeScript will now reject `"abc123"` where a `VmId` belongs. `#[ts(namespace = "VM::Git")]` puts a type inside nested `namespace` blocks and references it as `VM.Git.GitState`. `#[ts(extends = "Claude.Todo")]` makes an intersection, `Claude.Todo & { … }`, with a type that lives only on the TypeScript side. `#[ts(wrapper = "Prettify")]` wraps a definition in the helper that's in almost every TypeScript codebase, `type Prettify<T> = { [K in keyof T]: T[K] } & {}`, and the generator can emit `Prettify` itself so the file stands alone.

Indexed access goes furthest. `#[ts(index = Profile, key = login)]` renders a field as `Profile["login"]`, so it follows whatever type `login` has. Rust has no indexed types, but a derive macro can still check one. As I said at the time, "we are in a derive macro... magic can happen here." The derive writes a small function that reads `login` from a `&Profile`, and if the field isn't there, the build fails:

```
error[E0609]: no field `nonexistent` on type `&Profile`
  --> tests/compile_fail/indexed_access_invalid_field.rs:13:33
   |
13 |     #[ts(index = Profile, key = nonexistent)]
   |                                 ^^^^^^^^^^^ unknown field
   |
   = note: available fields are: `login`, `email`
```

That's a broken TypeScript reference caught by `cargo build`, before any TypeScript exists. With string arguments instead, `index = "ExternalType"`, it points at types Rust can't see and skips the check.

## Built by a swarm

Almost none of this was typed by me. I ran it through Gas Town, a multi-agent setup in which a coordinating "mayor" session files tasks, a pool of worker agents picks them up, and a merge queue lands their branches. The commit log reads like a cast list: furiosa, nux, slit, dementus, rictus, toast. There are 78 commits, 39 of them on January 11 alone.

That Sunday covered serde parity, the README, the crates.io release, auto-registration, the generator crate, template literals, namespaces, intersections, indexed access, `Prettify`, and renaming the derive from `TypeScript` to `TS`. The crates went from 0.1.0 to 0.2.0 in five releases over about nine hours. crates.io won't accept a version twice, so every release meant bumping all three to the same number. A script does that now. Rust 2024 made `gen` a keyword, which broke every example that named its generator `gen`. The root README still described the crate as an RPC library for a while after the rewrite.

The swarm took watching. A worker renamed `typescript_type()` to `typescript()` and pushed with the fixtures crate still calling the old name, and it took two warnings, the second headed "CRITICAL: Tests failing!", to get it fixed. Merged work often never reached GitHub. On the morning of the 11th, the newest commit on `main` was 23 hours old after a full day of work. The first hello-world example only simulated its server's responses. For an example of an RPC server, that's "worse than useless", and it runs a real Axum server now.

On January 12 I moved the swarm to other work, and ferrotype was paused.

## Using it

I tried it first in ace on January 11, the afternoon `ferro-type-gen` went up, exporting ace's API types to a file with `collect_all()`. The problems it turned up were fixed in 0.1.2 that evening. ferro-type never landed in ace, though: its Tauri desktop client already used tauri-specta for typed commands, and kept it.

The longer use came in February, in agent-foundry, a Rust agent of mine with a Svelte UI. Nineteen request, response and event types derive `TS`. A `--gen-types` flag writes them to `ui/src/generated/types.ts`, and the server also serves them over HTTP. The streaming events come out as the kind of union I wanted:

```ts
export type PromptEvent = { type: "TextDelta"; text: string } | { type: "ThinkingDelta"; text: string } | { type: "ToolStart"; id: string; name: string } | { type: "ToolInput"; delta: string } | { type: "ToolResult"; id: string; content: string; is_error: boolean } | { type: "Complete"; session: ApiSession } | { type: "Error"; message: string };
```

It also showed where ferrotype falls short.

## Where it falls short

**It reads `#[ts]`, not `#[serde]`.** The attributes have serde's names, but the derive only looks at its own. In agent-foundry, `SessionDetail` has `#[serde(flatten)]` on its `info` field, so the JSON puts the session's fields at the top level. The generated type says `{ info: ApiSession; messages: ApiMessage[] }`. That's the drift ferrotype exists to prevent, and nothing caught it, because the UI only ever read `messages`. The same goes for `#[ts(optional)]`: it's only true if serde actually leaves the key out. Every attribute has to be written twice, and a forgotten one is a type that lies. The fix is to read serde's attributes, not to mirror them: the type should come from the same source of truth as the JSON.

**Registration still ended up manual.** agent-foundry doesn't use `from_distributed()`. It lists 14 types by hand, twice, once for the file and once for the endpoint.

**Generics aren't generic.** `Paginated<User>` renders as a plain type called `Paginated` with `User[]` inside, not `type Paginated<T>`. Register `Paginated<User>` and `Paginated<Post>` and they share a name, so the second is dropped. `TypeDef` can describe a generic definition, like the `Core<T>` pattern ace's types use, but you have to build that tree by hand. The derive won't, and generic types aren't auto-registered.

**Smaller gaps.** Types come out in registration order, so `Post` can appear before the `User` it refers to. TypeScript doesn't mind, but the README says otherwise. One-file-per-module output doesn't write imports between the files yet. Every type is on one line.

## Where it stands

`ferro-type` 0.2.0 has been the current release since January 12. The last commit, in March, added CI: rustfmt, clippy with warnings as errors, tests and docs. All 258 Rust tests still pass on today's stable Rust. The repo still carries leftovers: a TypeScript client package from the RPC days that was never published, and `ferro-type-import`, an unpublished crate that goes the other way, parsing TypeScript with swc and writing Rust structs and enums with serde derives.

## What I'd keep

The types were the product. The RPC library I asked for was a wrapper around them, and the plan changed the evening that became clear.

Starting the core over was the other big call. The new core went from an empty trait to 0.1.0 on crates.io in about a day and a half, and it never had to keep the RPC code's tests passing along the way.

Make the mistakes compile errors. Workers that can't look at what they built can still run `cargo build`. Indexed access checking follows a rule I'd given the swarm on another project: "compile time errors ARE the goal."

And the release chores are part of the work: bump the crates together, check every README on every release, and write the examples from scratch. I'd pasted private ace code to show the types I wanted, and the README needed different ones.

The name is an old one. A ferrotype is another name for a [tintype](https://en.wikipedia.org/wiki/Tintype), a photograph made on a thin sheet of iron. Ferro for iron, which is to say Rust, and type for types.
