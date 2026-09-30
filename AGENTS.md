# Agent Guide for memorybox

This document provides context for LLM agents contributing to the
`slifty/memorybox` repository.

## Project Overview

memorybox is a React Native app for saving and viewing memories.

**Key Technologies:**

- React Native with TypeScript, on [Expo](https://docs.expo.dev)
- Jest, with `jest-expo` and React Native Testing Library
- ESLint 10 (flat config) built on
  [`@biffud/eslint-config`](https://www.npmjs.com/package/@biffud/eslint-config)
- Prettier for formatting
- Node.js for tooling (see `.node-version` for the current version)

For specific dependency versions, consult `package.json`.

**Status:** the app logs a user in to [Permanent](https://www.permanent.org),
its backend, then lets them pick one of the photos they took today and capture
it as a memory. Capturing does not save anything yet: `saveMemory` in
`src/permanent/memories.ts` is a placeholder that reports success. The app
keeps the access token in memory only, so a restart means logging in again (#8
tracks remembering it). There is no deployment workflow yet.

### Permanent

Permanent's own API handles sign-in. It checks the password with FusionAuth on
its servers and returns the FusionAuth access token. The app therefore holds no
FusionAuth configuration and no secrets: the only setting is the API base URL,
`EXPO_PUBLIC_PERMANENT_API_URL`. It defaults to staging, and `.env.example`
lists the other environments. Expo inlines every `EXPO_PUBLIC_` variable into
the bundle, so never put a secret in one.

Two details of the API are easy to trip over:

- **Failures come back as HTTP 200.** `isSuccessful` is false and
  `Results[0].message[0]` holds a code such as `warning.signin.unknown`.
- **Two-factor sign-in relies on a cookie.** `/auth/login` answers
  `warning.auth.mfaToken` when the account needs a code. `/auth/verify` then
  has to carry the session cookie from that login call, so requests set
  `credentials: 'include'`. That cookie lives in the platform's native cookie
  store, not in app state. Nothing clears it yet; logging out (#8) should.

[permanent-ios](https://github.com/PermanentOrg/permanent-ios) is the reference
client.

The `ios/` and `android/` projects are not checked in. Expo generates them from
`app.json` with `npx expo prebuild`, and they are ignored. Configure native
behavior through `app.json` and config plugins rather than by editing those
directories, since the next prebuild discards any edits.

## Quick Reference Commands

```bash
# Install dependencies
npm ci

# Start Metro, the development server
npm start

# Build and launch a native development build
npm run ios
npm run android

# Run the tests
npm test

# Check the Expo configuration and dependency versions
npx expo-doctor

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
├── __mocks__/                         # Jest mocks for native packages
├── components/                        # The component library
├── features/
│   ├── remember/                      # Choosing a photo and capturing it
│   └── sign-in/                       # The sign-in flow: its state and screens
├── permanent/                         # The Permanent API client
│   ├── api.ts                         # Request envelopes and reading replies
│   ├── auth.ts                        # Signing in
│   ├── memories.ts                    # Saving memories (a placeholder)
│   └── testing.ts                     # Response builders for tests
├── photos/                            # The device's photo library
│   ├── library.ts                     # Finding today's photos
│   └── testing.ts                     # The fake library tests control
├── App.tsx                            # The root component
├── App.test.tsx                       # End-to-end paths through the app
├── config.ts                          # Settings read from the environment
├── index.ts                           # The app entry point, registers App
└── theme.ts                           # Design tokens: color, spacing, type
types/
├── env.d.ts                           # The environment variables Expo inlines
└── react-native__eslint-plugin.d.ts   # Declarations for an untyped plugin
.commitlintrc.json                     # Commit message rules
.env.example                           # The environment variables, documented
app.json                               # Expo configuration, and prebuild's input
eslint.config.mjs                      # Lint configuration
tsconfig.json                          # The app's TypeScript project
tsconfig.node.json                     # The tooling's TypeScript project
```

The structure will grow as the app does. Update this section when it does.

### Layers

Code is layered, and imports only point downward:

1. **`theme.ts`** holds the design tokens. Nothing outside `components/` uses
   it directly.
2. **`components/`** is the component library: generic building blocks such as
   `Screen`, `Heading`, `TextField`, and `Button`, plus hooks like `useSubmit`
   that any form needs. Each component owns its styles, built from the theme.
   Components know nothing about Permanent or about any feature.
3. **`permanent/`** is the API client, and **`photos/`** reads the device's
   photo library. Neither knows anything about React.
4. **`features/<name>/`** are the app's features. A feature keeps its state in
   a reducer (`use<Name>Flow.ts`) that is tested as plain functions, and
   builds its screens only from `components/`.
5. **`App.tsx`** composes the features.

The rules that follow from this:

- **Screens contain no styles.** If a screen needs a look that no component
  provides, add or extend a component rather than styling inline.
- **A component is not tied to one use.** Name and shape it for what it is
  (`TextButton`), not where it first appeared (`StartOverLink`).
- **Keyboard and button submit through `useSubmit`**, so both obey the same
  rules: no empty submits, and no second submit while one is running.
- **A request the user has abandoned must not move the UI.** Flows count their
  attempts and ignore results from any but the latest.
- **Failures are values, not exceptions.** The API client returns results
  that describe what went wrong, including a `detail` for the unexpected, and
  the UI shows that detail so problems can be reported.

## Code Conventions

1. **No default exports** — always use named exports. `eslint.config.mjs` is
   the exception, because ESLint requires one there.

2. **Import ordering** — auto-sorted and alphabetized: builtin, external,
   internal, parent, sibling, index, object, type. No blank lines between
   groups.

3. Everything else is decided by `@biffud/eslint-config`. Do not restate or
   override its rules here without a reason specific to this project; a rule
   that would suit every project belongs upstream in that package.

   The one standing exception is `@typescript-eslint/naming-convention` for
   Permanent's wire format. Its field names (`RequestVO`, `AccountVO`) are
   PascalCase and cannot be renamed, so files that build or check those
   payloads disable the rule at the top, with that reason.

4. **Tests sit beside what they test**, as `<name>.test.ts(x)`. Tests that
   touch the network stub `fetch` with a default that rejects, so a test that
   forgets to stub a request fails instead of reaching a real server.

5. **Native modules are mocked in `src/__mocks__/`**, which Jest applies
   automatically because `roots` is `src`. The `expo-media-library` mock reads
   from the fake library in `src/photos/testing.ts`. Tests arrange that fake
   and reset it in `beforeEach`.

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

`tsconfig.json` extends `expo/tsconfig.base`, and adds `strict` because that
base does not set it. `types` is empty so that no package's globals arrive
implicitly. That includes Jest's: tests import `describe`, `it`, and `expect`
from `@jest/globals` instead.

## Version Constraints

`.github/dependabot.yml` holds back several dependencies, and the reasons are
worth preserving:

- **The Expo SDK sets the React Native versions.** Each SDK supports one
  version of `react`, `react-native`, and `@types/react`, and the
  `@react-native/*` packages must match `react-native`. Dependabot leaves them
  alone. Upgrade them together with the SDK: bump `expo`, then run
  `npx expo install --fix`, then `npx expo-doctor`. Dependabot holds back the
  `expo`, `expo-status-bar`, and `jest-expo` majors for the same reason.
- **Jest stays on 29.** `jest-expo` is built on it. Move when `jest-expo` does.
- **`test-renderer` follows React.** Each minor version depends on a newer
  `react-reconciler`, which has a React peer range: 1.3 requires React 19.3, for
  example. Pick the newest minor that accepts the SDK's React version, so an SDK
  upgrade is also the time to move it. Dependabot holds back its minors.

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
- `jest` — the tests
- `expo-doctor` — the Expo configuration, and dependency versions against the
  SDK
- `build-android`, `build-ios` — prebuild the native project, then compile a
  release build: Gradle on Linux, and `xcodebuild` for the simulator on macOS
  with signing disabled. Release is used because it is the configuration that
  bundles the JavaScript, so a broken import fails the build.

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
