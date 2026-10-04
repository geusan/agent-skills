---
name: add-nextjs-feature
description: Add frontend features to an existing Next.js/React app using Clean Architecture, TypeScript, Tailwind CSS, and Vitest. Use for 로그인 화면 추가, 상품 목록 구현, 폼/API 연동, or add-nextjs-feature when the owning app is Next.js, even without naming this skill. Do not select for review/refactor-only requests, Go backend endpoints, new-app scaffolding, or unrelated Vite projects.
---

# Add Next.js Feature

Implement the requested frontend behavior through the project's architecture and verify it. Ordinary feature requests in the initialized Next.js app should select this workflow without an explicit skill command.

For code inspection or structural migration without a new feature, use [nextjs-clean-arch](../nextjs-clean-arch/SKILL.md). A review request alone does not authorize implementation changes.

Read project instructions, package/lockfile, nearby features, API contracts, and tests. In a mixed Go/Next.js repository, select the owning frontend first; backend endpoint work belongs to the backend workflow. A feature spanning both may need both workflows, each limited to its own code. If the user requested a new Next.js app that does not yet exist, use [init-nextjs-app](../init-nextjs-app/SKILL.md) first and return here.

Read [the architecture contract](../init-nextjs-app/references/architecture.md), especially the runtime and testing sections. Preserve established router, feature layout, package manager, and API behavior; do not migrate an entire app just to match the starter tree.

## Build one vertical feature

1. Establish the user interaction, route, inputs/results, external data contract, and relevant loading/empty/error/success states. Reuse existing product/auth/design conventions; ask only for consequential missing behavior.
2. Add or reuse pure TypeScript domain rules. Define the use case and the minimal ports it consumes in the feature's application layer. Inject collaborators with functions or constructors; avoid a global service locator.
3. Implement HTTP/storage/platform adapters with DTO validation and mapping, cancellation, and explicit failure semantics. Untrusted JSON is not validated by a TypeScript cast. Use an existing client library when suitable; do not introduce a backend or storage system merely to fill a layer.
4. Assemble dependencies in the appropriate server/client composition root. Keep request identity and secrets on the server and out of global mutable singletons. Server Actions and route handlers authenticate/validate then invoke the use case; authorization must protect the actual operation.
5. Implement React presentation with Tailwind, accessible controls, and the required view states. Inject capabilities into hooks/components or pass serializable view data. Do not construct repositories or put business rules/network calls directly in components. A cosmetic or local UI-state change need not create a domain model or use case.
6. Connect the feature to its real Next.js route. Default to Server Components and add client boundaries only for interaction/browser APIs. Keep caching, revalidation, navigation, and error boundaries in the runtime adapters. Update changed configuration/API documentation.
7. Add meaningful Vitest tests: rules and use cases in Node with fake ports; UI behavior and user actions in jsdom with React Testing Library. Cover relevant failures as well as the happy path. Test adapter mappings where they changed.

## Verify the whole path

Run focused tests during implementation, then the app's lint, typecheck, Vitest suite, and production build. Review inward imports, feature ownership, and client/server import graphs. Do not blanket-mock Next.js or `server-only` to make an invalid client import pass tests.

For async Server Components, cookie/session behavior, Server Actions, or navigation/hydration changes, add or run the relevant existing integration/E2E checks. Testing an extracted use case does not validate the surrounding Next runtime. If an external API or auth provider is unavailable, report the unverified behavior instead of claiming full feature completion based on a mock.

Report implemented behavior, route and layer changes, exact checks, and remaining external prerequisites. Preserve the saved architecture rules so the next feature follows the same boundaries.
