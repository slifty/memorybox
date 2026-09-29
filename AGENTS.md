# Agent Guide for memorybox

This document provides context for LLM agents contributing to the
`slifty/memorybox` repository.

## Project Overview

memorybox is a React Native app for saving and viewing memories.

**Key Technologies:**

- React Native with TypeScript
- ESLint 10 (flat config) built on
  [`@biffud/eslint-config`](https://www.npmjs.com/package/@biffud/eslint-config)
- Prettier for formatting
- Node.js for tooling (see `.node-version` for the current version)

For specific dependency versions, consult `package.json`.

**Status:** tooling only. `src/index.ts` exists so that the lint and type check
pipelines have something real to run against; it does nothing. React Native
itself is not installed yet, and neither is a bundler, test runner, or
deployment workflow.

## Quick Reference Commands

```bash
# Install dependencies
npm ci

# Lint everything (eslint, prettier, tsc)
npm run lint

# Lint this branch's commit messages against origin/main
npm run lint:commit

# Auto-fix formatting and fixable lint errors
npm run format
```

## After Making Changes

**Always run the formatter and linter after making ANY changes, including
documentation, configuration, and JSON files:**

```bash
# Auto-fix formatting issues (run this first)
npm run format

# Check for remaining problems
npm run lint
```

`npm run lint:commit` is deliberately not part of `npm run lint`. It reads git
history rather than the working tree and needs `origin/main` fetched.

## Commit Messages

Commits follow [Conventional Commits](https://www.conventionalcommits.org),
checked by commitlint against `.commitlintrc.json`. Nothing is released from
the commit types yet, so choose the type that describes the change honestly:
`feat` and `fix` for the app, `build` for dependencies and the manifest, `ci`
for workflows, `docs`, `chore` for tooling configuration, and so on.

The [seven rules of a great commit message](https://cbea.ms/git-commit/) —
capitalized, imperative, fifty characters, no trailing period — apply to the
**description**, meaning the text after the type. The type is machine metadata
and spends none of that budget:

```
feat: Add the memory detail screen
      ^ the description starts here, and the fifty characters start with it
```

That is why `.commitlintrc.json` turns `header-max-length` off and puts the
limit on `subject-max-length` instead, and why `subject-case` is inverted rather
than disabled: the preset rejects a capitalized description, this project
requires one, so the rule is kept and pointed the other way. It rejects a
wholly lower-case description, which is as close to "capitalized" as the
available checks get.

Bodies are wrapped at seventy-two and explain the why, with the issue reference
closing the prose and any trailers last.

Merge commits are skipped by commitlint's own defaults. Dependabot is exempted
in CI instead, because its messages cannot pass these rules: its descriptions
are lower-case, grouped ones run past fifty characters, and its bodies carry
unwrapped links. None of that is configurable. The only part of its messages
that is ours is the prefix, which `.github/dependabot.yml` sets.

## Project Structure

```
src/
└── index.ts                           # The app entry point, currently empty
types/
└── react-native__eslint-plugin.d.ts   # Declarations for an untyped plugin
.commitlintrc.json                     # Commit message rules
eslint.config.mjs                      # Lint configuration
tsconfig.json                          # The app's TypeScript project
tsconfig.node.json                     # The tooling's TypeScript project
```

The structure will grow as the app does. Update this section when it does.

## Code Conventions

1. **No default exports** — always use named exports. `eslint.config.mjs` is
   the exception, because ESLint requires one there.

2. **Import ordering** — auto-sorted and alphabetized: builtin, external,
   internal, parent, sibling, index, object, type. No blank lines between
   groups.

3. Everything else is decided by `@biffud/eslint-config`. Do not restate or
   override its rules here without a reason specific to this project; a rule
   that would suit every project belongs upstream in that package.

## Linting

`eslint.config.mjs` layers, in order:

- `@biffud/eslint-config` — the core and TypeScript rules
- `eslint-plugin-import-x` — import resolution, ordering, and the
  no-default-export convention, which the shared config does not cover yet
- `@eslint-react/eslint-plugin` and `eslint-plugin-react-hooks` — React
- `@react-native/eslint-plugin` — React Native's own rules
- `eslint-config-prettier` — last, so formatting is Prettier's alone

`eslint-plugin-react` and `eslint-plugin-react-native` are **not** used,
deliberately: both declare an ESLint peer range that stops at 9, and this
project is on ESLint 10 because `@biffud/eslint-config` is. Check their peer
ranges before suggesting either.

`@react-native/eslint-plugin` ships no type declarations, so
`types/react-native__eslint-plugin.d.ts` provides them.

## TypeScript

There are two TypeScript projects, and `npm run lint:tsc` checks both:

| File                 | Covers              | Environment              |
| -------------------- | ------------------- | ------------------------ |
| `tsconfig.json`      | `src/`, `types/`    | React Native, no Node    |
| `tsconfig.node.json` | `eslint.config.mjs` | Node (see .node-version) |

They are separate so that Node's globals and types never leak into app code,
which runs on Hermes rather than Node.

`tsconfig.json` extends `@react-native/typescript-config`, the base the React
Native template uses. It clears that base's `jest` types, since no test runner
is installed yet; restore them when one is. When `react-native` itself is
added, keep `@react-native/typescript-config` and `@react-native/eslint-plugin`
on the same version as it.

## Version Constraints

`.github/dependabot.yml` holds back two dependencies, and the reasons are worth
preserving:

- **TypeScript stays on 6.0.x.** `typescript-eslint` declares a peer range of
  `typescript: ">=4.8.4 <6.1.0"`, so the ceiling is 6.1, not 7. The
  devDependency is therefore `~6.0.3` rather than `^6.0.3`, and Dependabot holds
  back minors as well as majors. Widen both together, and only once the
  `typescript-eslint` peer range actually moves.
- **`@types/node` tracks `.node-version`.** It follows the Node version this
  repository develops against, not the newest Node release. Bump it when
  `.node-version` moves, not before.

`@biffud/eslint-config` uses a tilde range on purpose. That package's minor
versions carry rule changes, so a caret range would let new lint errors arrive
without anyone changing this repository.

**`package.json` declares no `engines` field, deliberately.** npm enforces
`engines` for every package in the tree, so the ranges our dependencies declare
already apply. `.npmrc` sets `engine-strict` so that a mismatch fails rather
than warns.

## CI

`.github/workflows/ci.yml` runs on pushes to `main` and on pull requests, with
one job apiece for:

- `actionlint` — workflow file validity
- `commitlint` — commit messages follow the convention (pull requests only)
- `npm-install` — verifies `package-lock.json` is in sync with `package.json`
- `eslint`, `prettier`, `tsc` — the three parts of `npm run lint`

## Maintaining This Document

Keep this document current as the codebase evolves. Update it when:

- New patterns or conventions are established
- The project structure changes
- New npm scripts or CI jobs are added
- Version constraints are lifted or added

**Guidelines for updates:**

- Keep the document user-agnostic (no local paths or developer-specific
  references)
- Reference version files (`.node-version`, `package.json`) rather than
  hardcoding versions
- Remove outdated information rather than letting it accumulate
