![CI](https://github.com/slifty/memorybox/actions/workflows/ci.yml/badge.svg)

# memorybox

Save a memory, view a memory.

A React Native app, built with [Expo](https://docs.expo.dev). So far it says
hello, and that is all.

## Development

### Requirements

- Node — see [`.node-version`](.node-version) for the expected version
- For iOS: Xcode and CocoaPods
- For Android: Android Studio and JDK 17

The app runs as a native development build, not in Expo Go. Expo's
[environment setup guide](https://docs.expo.dev/get-started/set-up-your-environment/?mode=development-build&buildEnv=local)
covers the platform tools.

### Setup

Install dependencies:

```bash
npm install
```

### Common Commands

To build the app and launch it in a simulator or emulator:

```bash
npm run ios
npm run android
```

After the first build, `npm start` alone brings back the development server.

To run the tests:

```bash
npm test
```

To type check, lint, and check formatting:

```bash
npm run lint
```

To automatically fix what can be fixed:

```bash
npm run format
```

### Commit messages

Commits follow [Conventional Commits](https://www.conventionalcommits.org),
with the description after the type following the
[seven rules of a great commit message](https://cbea.ms/git-commit/):

```
feat: Add the memory detail screen
```

To check this branch's commits before opening a pull request:

```bash
npm run lint:commit
```

Contributors, human or otherwise, should read [`AGENTS.md`](AGENTS.md) for
the reasoning behind the tooling.

## License

[AGPL-3.0](LICENSE)
