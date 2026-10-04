---
name: design-database
description: Design PostgreSQL, MySQL, or MariaDB schemas and maintain ERDs as version-controlled Mermaid code with optional SVG exports. Use for DB 설계, ERD 작성, 테이블/관계 설계, or ORM-aligned schema documentation. Discover and reuse the owning project's ORM and migration workflow; do not introduce a parallel schema or migration system.
---

# Design Database and ERD

Design from business meaning and invariants, then express the physical design through the project's existing ORM and migration mechanism. Treat the ERD as a documented view of the intended or implemented schema, not an independent executable schema authority.

## Establish ownership and scope

Read repository instructions, Git changes, database configuration, ORM/schema definitions, migration history, generators, and relevant queries. Identify the owning application, database engine/version, storage engine where relevant, naming conventions, and schema source of truth. Follow [the ORM and migration contract](references/orm-and-migrations.md); do not choose a different ORM or migration tool simply because this skill is used.

Infer whether the request is conceptual design, physical design, documentation of existing code, or implementation. A request for an ERD authorizes documentation work, not a production schema change. If the request is only to inspect existing design, use [review-database](../review-database/SKILL.md). If implementing a feature is also requested, coordinate with its owning application workflow and complete the model/migration/repository changes within that scope.

For Go + Next.js projects where Go owns persistence, keep schema and migrations in the Go project; Next.js consumes the API contract. If another service owns the database, follow that actual ownership instead. A frontend repository containing database-related TypeScript is not by itself evidence of ownership.

## Design at two levels

First identify entities, cardinality, ownership, data lifecycle, and invariants independently of ORM convenience. Separate confirmed requirements from assumptions about volume, access patterns, or future scale. Resolve consequential unknowns before committing to physical choices; continue the logical design where possible.

Then map the design to the actual engine and existing tooling. Read only the relevant profile in [engine considerations](references/engines.md). Decide keys, nullability, uniqueness, referential actions, data types, time/money semantics, and meaningful constraints. Start with normalized relationships and justify denormalization, JSON, soft deletion, or a particular ID strategy from the operation's needs.

Use the expected queries to justify indexes, including ordering, pagination, and write cost. For updates spanning records, identify transaction and concurrency requirements: conflicting updates, duplicate requests, retries, and consistency boundaries. Do not turn every rule into a database constraint if that constraint cannot correctly express it; coordinate database guarantees with application policy.

Preserve existing table/column names, stored values, ORM mappings, API behavior, and migration history during a structural change unless changing them is requested. ORM associations may not create database constraints, and migrations may contain indexes/triggers/views the ORM cannot express; inspect both.

## Maintain a visual, versioned artifact

Follow [the ERD workflow](references/erd-workflow.md). Prefer the existing diagram format/exporter when present; otherwise use Mermaid blocks inside `docs/database/erd.md`, which stores readable code and renders as a diagram on GitHub. For larger schemas, split by bounded feature into separate documents and retain an overview.

Record whether the diagram is **proposed**, **code-target**, or a **database snapshot**, plus engine/version, scope, source paths, and extraction/review method. Do not call an intended ORM model the deployed database state. For an existing project, derive the physical diagram from authoritative model mappings and effective migrations; use an already-authorized read-only schema snapshot when available to check the deployed state.

Document composite keys, index definitions, defaults, nullability, referential actions, and engine-specific constraints in adjacent tables when the diagram cannot express them faithfully. Preserve join tables and physical names, and label unenforced/logical relationships distinctly.

For a standalone image, use the bundled renderer described in the ERD workflow. SVGs are derived artifacts; edit the Mermaid source and regenerate them. The renderer's `--check` verifies source/image freshness only. It does not extract ORM models or prove schema/migration agreement.

## Implement through the owning project

When implementation is requested, update the existing schema authority and use its established process to author/generate the migration. Review the resulting SQL, including data conversion, locking, and compatibility. Validate on the target engine/version in an isolated environment when required. Keep the migration files, version identifiers, metadata, and execution commands in their established location; do not add a second migration directory, history table, or runner.

Update the ERD and its detailed notes in the same change as the model/native migration. An ERD-only proposal remains marked proposed until implemented. Applying migrations to an environment is a separate scoped operation, not an automatic consequence of rendering a diagram.

Report design decisions and unresolved assumptions, diagram/code locations, source-of-truth ownership, native schema/migration changes if any, and checks performed. Distinguish visual rendering, code/schema consistency review, and actual database verification.
