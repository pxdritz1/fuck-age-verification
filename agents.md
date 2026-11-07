# agent guidelines

## core philosophy

Work with intention, precision, and consistency.

The goal is not simply to make something work, but to deliver something well-designed, maintainable, properly tested, and thoughtfully implemented.

Prioritize:
- quality over implementation speed;
- research over assumptions;
- consistency over unnecessary innovation;
- simplicity over unnecessary complexity;
- working solutions over superficial implementations.

Never assume that a technically functional implementation is automatically a good implementation.

## understanding the project

Before making changes:

1. Read the existing codebase and understand its architecture.
2. Read the project's documentation, README, contribution guidelines, and relevant specifications.
3. Inspect existing implementations before introducing new patterns.
4. Research relevant APIs, frameworks, libraries, and upstream implementations when necessary.
5. Understand existing dependencies and reuse them when appropriate.

Do not implement something based solely on assumptions about how a library or framework works.

When working with unfamiliar technologies, consult their official documentation first.

## coding style

**Adapt to the project's existing coding style and, whenever possible, take inspiration from Chloe's own coding style.**

Do not impose an unrelated coding style or unnecessarily rewrite existing code.

Prioritize:
- consistency in naming and organization;
- readable and straightforward implementations;
- sensible abstractions;
- minimal unnecessary indirection;
- predictable behavior;
- maintainable architecture.

Avoid:
- unnecessary comments;
- redundant documentation inside the source code;
- excessive abstractions;
- overly complicated implementations;
- duplicated logic;
- unnecessary dependencies;
- artificial design patterns.

### comments

Keep comments minimal.

Comments should exist only when they provide meaningful information, such as:

- explaining non-obvious behavior;
- documenting important implementation details;
- identifying specific sections of the code;
- warning about known issues or fragile parts;
- explaining workarounds that cannot be easily understood from the implementation itself.

Do not narrate what the code is already doing.

## implementation workflow

Follow this workflow whenever implementing a feature or fixing a bug:

1. **Inspect** — understand the existing implementation.
2. **Research** — read documentation and investigate relevant solutions.
3. **Plan** — identify affected components, dependencies, and potential side effects.
4. **Implement** — make the changes while respecting the existing architecture.
5. **Debug** — actively investigate possible failures and edge cases.
6. **Stress-test** — test behavior under different conditions, not only the happy path.
7. **Validate** — run relevant tests, builds, formatters, and static analysis.
8. **Review** — inspect the final diff for regressions, duplication, and unnecessary changes.

Do not skip validation just because the implementation appears to work.

Whenever possible, validate the actual modified source code rather than relying on stale binaries, caches, or previous build artifacts.

## testing and reliability

Code should be debugged and thoroughly tested before being presented as finished.

Consider:
- edge cases;
- invalid inputs;
- unexpected application states;
- asynchronous behavior;
- state synchronization;
- race conditions;
- performance implications;
- regressions in existing functionality;
- interactions with other components.

Do not claim something is fixed without verifying it.

If a test cannot be performed, explicitly explain why and identify what remains unverified.

## documentation and research

Research before implementing.

Prefer:
1. official documentation;
2. official source code and repositories;
3. upstream issues and discussions;
4. reliable technical references;
5. community implementations when relevant.

When porting features or reproducing existing implementations, inspect the original source instead of approximating its behavior.

Do not reinvent existing functionality without understanding what already exists.

## decision-making

**Do not invent requirements.**

If a design decision, interaction, behavior, or implementation detail is unclear:

- ask Chloe what she prefers;
- present the relevant alternatives when useful;
- explain the implications of each option;
- wait for clarification when the decision materially affects the result.

Do not silently introduce features, remove existing functionality, change visual behavior, or make architectural decisions that were not requested.

Use reasonable judgment for minor implementation details, but never mistake creative freedom for permission to redefine the project.

## transparency

Be transparent about implementation differences.

If the final implementation differs from the original request, explain:

- what changed;
- why it changed;
- what limitations were encountered;
- what behavior is different;
- whether the difference is temporary or intentional.

Never present an approximation as an exact implementation.

Never hide incomplete work, known bugs, or unverified behavior.

If something cannot be implemented as requested, say so before silently substituting another solution.

## git and commits

Use **Conventional Commits**, preferably written in English.

Examples:

- `feat: add animated dock interactions`
- `fix: correct island timeline alignment`
- `refactor: simplify overlay state management`
- `style: improve dashboard spacing`
- `perf: optimize blur rendering`
- `docs: update installation instructions`
- `test: cover notification state transitions`

### commit organization

Commits should be logically partitioned.

Each commit should represent a meaningful, coherent change.

For example, a feature involving UI components, state management, and animations may deserve multiple commits when those changes are independently understandable.

However:

- do not create a commit for every trivial line change;
- do not group unrelated modifications into one enormous commit;
- do not mix unrelated fixes with feature implementations;
- keep commits understandable and easy to review;
- preserve a coherent and useful project history.

The objective is a clean, meaningful history, not an excessive number of commits.

## dependencies and frameworks

Prefer existing project dependencies whenever possible.

When evaluating new libraries or frameworks, consider:

- maintenance status;
- documentation quality;
- performance;
- compatibility;
- ecosystem maturity;
- long-term maintainability;
- whether the dependency actually solves a problem.

Frameworks and technologies Chloe appreciates include:

- React
- Angular
- Nue
- Riot.js
- Tailwind CSS
- Bootstrap
- HTMX
- Imba
- Gleam + Lustre
- Elm + elm-ui

These are preferences, not mandatory requirements. Choose technologies according to the project's actual needs.

## final delivery

Before declaring a task complete:

- verify the implementation;
- inspect the final diff;
- remove temporary debugging artifacts;
- ensure there are no unnecessary duplicated elements;
- verify that existing functionality remains intact;
- report relevant tests and their results.

Provide a concise but honest summary of what was changed.

**Quality, consistency, and transparency are more important than simply finishing quickly.**
