---
name: init-nextjs-app
description: Initialize a Next.js frontend with React, Tailwind CSS, TypeScript, Vitest, and Clean Architecture. Use for Next.js 앱 만들어줘, 프론트엔드 초기화, or init-nextjs-app when Next.js is requested or established by context, even without the skill name. Do not reinitialize an existing app for a feature or convert an unrelated Vite/React project automatically.
---

# Initialize Next.js App

Create a runnable frontend and persistent development rules, not just a folder diagram. Use the bundled initializer to compose the official Next.js scaffold with clean architecture, Vitest, and meaningful starter UI coverage. Read [the architecture contract](references/architecture.md) before adapting the starter.

## Select the destination from context

Inspect repository instructions, Git changes, existing `package.json` files, lockfiles, and workspaces. For a new Next.js request, use the specified path or the current empty/metadata-only directory. In a backend-only repository, an unoccupied `./frontend` is a reasonable default; state that choice. A generic frontend request with no framework context does not by itself select Next.js.

If a Next.js application already exists, use [add-nextjs-feature](../add-nextjs-feature/SKILL.md) for feature work and [nextjs-clean-arch](../nextjs-clean-arch/SKILL.md) for review/refactoring. An explicit request to adopt this stack in an existing app requires targeted configuration changes that preserve source, dependencies, routes, and data; do not run the initializer over it. Existing Vite projects are not new Next.js destinations.

For "Next.js 앱 만들고 로그인 화면도 추가해줘", initialize and then continue through the feature skill in the same task. Do not require the user to name either skill or reconfirm the architecture choice.

## Initialize with working defaults

Resolve `skill_root` to this file's directory. The script uses Python 3.9+, npm, and a Node version accepted by the selected dependencies. A current Node 24 LTS release is the default toolchain recommendation; honor the user's pinned compatible runtime. Package engine checks are strict. Do not silently upgrade the user's global Node installation or suppress engine failures.

```bash
python3 "$skill_root/scripts/init_nextjs_app.py" --dir /absolute/path/to/app
```

The directory name becomes the package name; pass `--name` if specified. `--create-next-app-version` accepts an npm version/tag and defaults to `latest`, resolved to an exact version before generation. The script:

- Refuses existing application source; preserves Git, README, instruction, and license metadata.
- Runs `create-next-app` in a temporary directory with TypeScript, Tailwind, ESLint, App Router, `src/`, `@/*`, and no Git initialization.
- Adds feature layers, a thin route and interactive starter view, server/client composition guidance, and ESLint checks for common inner-layer violations.
- Installs Vitest, Vite, the React plugin, React Testing Library, user-event, jest-dom, and jsdom; uses Vite's native TypeScript path resolution and writes `test`, `test:watch`, `typecheck`, and lint commands.
- Configures `*.test.ts` in Node and `*.test.tsx` in jsdom, matches `@types/node` to the selected runtime major, and records `.node-version` plus a lockfile. Next.js remains the dev/build server; Vite is only the test tool's infrastructure.
- Adds `AGENTS.md` and `CLAUDE.md` for all later feature requests, preserving existing text. Review existing instructions for semantic conflicts before appending.
- Publishes staged files only after dependency installation succeeds and reports resolved versions.

The bundled path uses npm. If the user explicitly chose another package manager or an existing monorepo requires one, perform equivalent initialization with that manager, preserve its workspace/lockfile rules, and run the same checks. Do not create competing lockfiles or silently alter unrelated workspace membership.

Defaults contain no auth provider, backend URL, database, global state library, or fabricated business domain. Add those only when requested behavior requires them. Adapt the saved instructions when changing the generated layout or stack. Inspect generated framework instructions as well as the skill's appended architecture rules.

## Verify and continue

Run `npm run lint`, `npm run typecheck`, `npm test`, and `npm run build` in the new app using the selected Node runtime. Smoke-test the built application locally and stop only the preview process started for the check. Verify the component test exercises interaction, not just mounting. Unit tests and jsdom do not prove async Server Component or hydration behavior; use the appropriate runtime/E2E checks when those become part of a requested feature.

If initialization includes a product feature, continue with [add-nextjs-feature](../add-nextjs-feature/SKILL.md). Report destination, resolved framework/testing versions, commands, checks, and how subsequent ordinary feature requests follow `AGENTS.md`.
