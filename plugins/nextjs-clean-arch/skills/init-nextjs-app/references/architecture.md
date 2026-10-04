# Next.js clean architecture contract

## Feature boundaries

Keep business code independent of the framework while letting Next.js own rendering and routing. The default layout is feature-first:

| Location | Responsibility | Inward dependencies |
|---|---|---|
| `features/<feature>/domain` | Business values, entities, invariants | Other domain values; no runtime I/O |
| `features/<feature>/application` | Use cases and consumed repository/service ports | Domain, framework-free shared business values |
| `features/<feature>/infrastructure` | HTTP, storage, external DTO validation/mapping | Application ports and domain |
| `features/<feature>/presentation` | Components, hooks, forms, view models | Application contracts/domain, shared UI |
| `composition` | Concrete dependency construction | The assembled layers; separate server/client modules |
| `app` | Routes, layouts, runtime input/output adapters | Composition and presentation |
| `shared/ui` | Reusable visual primitives | React/Tailwind and other presentation primitives |

Use functions and structural TypeScript interfaces when sufficient; no mandatory base classes, DI container, or generic repository hierarchy. Define interfaces where consumed. Do not turn React state, a button interaction, or a layout into a business use case solely to satisfy the folder structure.

Avoid a feature reaching into another feature's private adapters/components. Extract a narrow shared business contract or use a deliberate public feature API when real cross-feature use exists. Keep exports separate for server and client code. Aliases and barrels do not change dependency direction.

The starter ESLint config rejects common framework imports, outward layer imports, and browser/network/environment access in domain/application files. It is intentionally not a full graph analyzer: relative-path tricks, new aliases, barrels, and extra packages still need import review. Do not suppress a violation simply to complete a feature.

## Data and composition

External response shapes belong in infrastructure. Parse unknown data before mapping to domain/application results. Keep transport status codes, Next request objects, ORM rows, tokens, and cookie APIs out of use-case signatures. Model expected failures explicitly and map them at the runtime/UI boundary.

An application factory may accept a repository port, for example `makeListProducts(repository)`, and return the use-case function. An HTTP adapter implements that port; server or client composition selects the appropriate implementation. A Client Component can receive a use-case capability from a client provider/factory, but an ordinary function created on the server is not a serializable prop.

For server-fetched views, call the server use case and pass a plain view model into presentation. Do not fetch the app's own route handler from a Server Component merely to reach code that can be invoked directly. Calls to a separate backend, such as the user's Go server, remain external adapter calls.

Do not cache user-specific repositories, credentials, or request state in module globals. Honor cancellation for network operations and choose caching/revalidation semantics for the feature rather than inheriting accidental defaults.

## Server and Client Components

Pages/layouts start on the server. Add `"use client"` at the smallest interactive boundary. Privileged adapters/composition use `server-only` when introduced; do not import them into client modules or hide them behind a mixed barrel. Keep secrets out of `NEXT_PUBLIC_*`. Transfer only serializable data across ordinary Server-to-Client props; Server Action references have their own framework contract.

Treat Server Actions and route handlers as inbound adapters: parse/validate input, establish identity, invoke a use case, and translate the result. A hidden button is not authorization. Rendering logic, cookies, navigation, and cache invalidation stay outside the pure core. Follow the selected Next.js version for async request APIs and action behavior.

## Testing contract

The bundled Vitest config has two projects: `unit` runs `src/**/*.test.ts` in Node; `components` runs `src/**/*.test.tsx` in jsdom with jest-dom and cleanup. The React plugin and Vite's native `resolve.tsconfigPaths` preserve JSX and `@/*` resolution. Explicit imports from `vitest` avoid relying on global test declarations.

Test invariants, expected errors, and orchestration using fake ports. Test UI roles, interactions, and relevant view states with Testing Library/user-event. Mock external I/O, not the business code under test. Use the project's integration tests to verify real persistence or API behavior when those contracts change.

Vitest does not currently render async Server Components as supported component tests. Test extracted business functions in Node and cover the Next runtime path with integration/E2E tests. Calling an async page function manually does not verify rendering, hydration, routing, or request context. Do not make a page synchronous merely to satisfy a test.

Tailwind runs through the Next/PostCSS integration; no Vite app configuration or standalone Vite dev server is needed. Keep production builds and unit testing as separate toolchains. The starter uses local system fonts so a build does not require a font download.

## Sources and version handling

Official references checked on 2026-10-04; recheck version-specific behavior when changing dependencies:

- [Next.js scaffolding CLI](https://nextjs.org/docs/app/api-reference/cli/create-next-app)
- [Next.js Server and Client Components](https://nextjs.org/docs/app/getting-started/server-and-client-components)
- [Next.js Vitest guide and async component limitation](https://nextjs.org/docs/app/guides/testing/vitest)
- [Vitest test projects](https://vitest.dev/guide/projects)
- [Vite native TypeScript path resolution](https://vite.dev/config/shared-options#resolve-tsconfigpaths)
- [Tailwind's Next.js integration](https://tailwindcss.com/docs/installation/framework-guides/nextjs)

Initialization resolves the requested `create-next-app` tag/version, installs compatible current testing dependencies with strict engine checks, and records versions plus a lockfile. The initial target must remain untouched when generation or installation fails. Do not bypass peer/engine checks with `--force` or report an uninstalled scaffold as development-ready.

The starter was verified with Node 24.21.0, Next.js 16.3.8, React 19.2.8, Tailwind 4.3.3, TypeScript 5.9.3, Vitest 5.0.3, and Vite 8.3.2. That Next.js generator emitted `@types/node` for Node 20, while Vitest 5 required newer types; the initializer therefore installs types matching the selected runtime major. Vite 8's native path resolution also avoids the older `vite-tsconfig-paths` recipe. These are tested compatibility observations, not universal pins for existing applications.
