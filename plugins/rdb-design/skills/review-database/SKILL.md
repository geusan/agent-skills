---
name: review-database
description: Review PostgreSQL, MySQL, or MariaDB design and consistency across ERDs, ORM models, native migrations, and relevant queries. Use for DB 점검, 스키마 리뷰, ERD 검토, ORM/DB 불일치, or migration design review. Read-only by default; do not replace the project's ORM/migration workflow or apply schema changes.
---

# Review Database

Review the business data model and its real implementation together. ORM conventions inform physical mapping; the correctness criteria are requirements, relational semantics, access patterns, and the selected engine. A matching ORM diagram alone is not sufficient evidence.

## Find the authoritative representations

Read project instructions, Git status, the requested diff/feature scope, database engine/version, ORM configuration, schema definitions, migration history, and relevant application queries. Use [the ORM and migration contract](../design-database/references/orm-and-migrations.md) to identify which files define desired state and which are generated representations.

Identify the ERD's declared status and scope. A proposed diagram can intentionally differ from implemented code; list the required implementation changes instead of treating that difference as deployed drift. A code-target diagram does not establish which migrations were applied to a running environment. If database access or a schema snapshot is unavailable, state that limitation and review the available code evidence.

Read the relevant section of [engine considerations](../design-database/references/engines.md). Do not infer MariaDB behavior solely from MySQL compatibility or generalize one version's capabilities to another.

## Compare meaning, code, and effective schema

- Check relationships, optionality, keys, uniqueness, referential actions, and data ownership against the business operation.
- Compare physical table/column mappings, types, defaults, nullability, and constraints across the ERD, ORM, and effective migration result. Follow migration order and subsequent alterations; reading the original CREATE TABLE alone is insufficient.
- Distinguish ORM-only relationships from enforced foreign keys. Include meaningful schema objects not represented by the ORM, such as raw-SQL indexes, checks, triggers, or views.
- Review indexes against actual WHERE/JOIN/ORDER BY patterns and write cost. Use real plan evidence where available; do not invent workload sizes, latency, or performance improvements.
- Inspect transaction boundaries, concurrent uniqueness/conflict behavior, idempotency where needed, and tenant/data-lifecycle rules relevant to the scope.
- For migrations, inspect data compatibility, backfills, locking/rebuild behavior, application rollout order, and recovery. Do not assume every DDL operation can be rolled back transactionally.

Use [ERD conventions](../design-database/references/erd-workflow.md) when checking cardinalities and diagram completeness. The optional renderer freshness check only compares the diagram source and SVG bytes; explicitly separate its result from ORM/migration/database semantic consistency.

## Keep review read-only

Leave schemas, model code, migration files, diagrams, and generated images unchanged unless the user requests fixes or documentation updates. Do not run schema push, auto-migration, introspection that overwrites models, or generators against the working tree as part of inspection. Prefer exported schema metadata or configured read-only access. Commands that execute queries or DDL need a suitable authorized target; EXPLAIN ANALYZE is not a non-executing explanation.

If validation requires creating schema or applying migrations, use the project's isolated test database and native tooling within the authorized scope. Otherwise report the check as unperformed. Do not copy production row data or credentials into an ERD/report.

When fixes are requested, use the design workflow and the owning implementation workflow to update the established schema/migrations and derived ERD together. Keep the same migration source of truth and honor the user's existing authorization.

## Report actionable findings

For each finding, give severity, file/line or schema-object evidence, the triggering condition and impact, and the minimal remedy in the project's own tooling. Distinguish confirmed defects, missing evidence, and optional improvements. Do not invent findings because a schema uses a different naming style, ID type, or acceptable normalization tradeoff.

Summarize the diagram/model/migration agreement, database state actually inspected, target versions, and checks versus gaps. For Go + Next.js features, relate database guarantees to the Go operation and frontend API expectations without duplicating database ownership in the frontend.
