![CI](https://github.com/slifty/memorybox/actions/workflows/ci.yml/badge.svg)

# memorybox

Save a memory, view a memory.

A React Native app. There is no app yet — this repository currently holds only
the tooling it will be built with.

## Development

### Requirements

- Node — see [`.node-version`](.node-version) for the expected version

### Setup

Install dependencies:

```bash
npm install
```

### Common Commands

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
