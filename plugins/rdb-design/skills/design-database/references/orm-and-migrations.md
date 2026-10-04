# ORM, migration, and diagram ownership

## Discover the existing workflow

Inspect the owning application's dependency manifest, configuration, model/schema declarations, migration directories and metadata, CI/deployment commands, and generators. Identify actual tool versions before suggesting commands. Read relevant official tool documentation when exact flags or engine support matter.

Examples of evidence, not a requirement to adopt any tool:

| Existing workflow | Authoritative inputs to inspect |
|---|---|
| Go with GORM or another ORM | Model fields/tags, naming/table overrides, relationships, configured engine, and the existing migration mechanism |
| Prisma | Prisma schema/mappings and the project's Prisma migration history and custom SQL |
| Drizzle | TypeScript table definitions, configuration, and the existing migration snapshots/journal/SQL |
| SQL-first with a runner | Ordered native SQL migrations and actual effective schema; generated model/query code is derived |
| Database-first | The designated schema definition or authorized database snapshot and the established change/introspection process |

An ORM does not necessarily own migration execution. For example, a Go ORM project may already use a separate migration runner. Preserve that established combination. SQLC is a query/code generator, not an ORM schema authority; do not edit generated structs to redefine its database.

Record the owning service, engine/version, schema authority, migration tool/location, generation/apply commands, and which of these facts are verified. If a project has only runtime auto-migration, report that fact; creating versioned migrations is an additional implementation decision, not something to introduce silently for an ERD.

## Separate levels of truth

1. **Business design:** The meaning of data, relations, and invariants. ORM limitations may require a different physical representation but do not define the business meaning.
2. **Code target:** The desired physical schema expressed through the existing authoritative schema/model and migration files. Raw SQL in a native migration can represent capabilities the ORM cannot express.
3. **Applied database state:** What exists in a specific environment after its actual migration history. Code alone does not prove that state.
4. **ERD and images:** Versioned documentation of one explicitly identified level above. These are derived views after implementation, not a second migration input.

For a new design, an ERD can start as a proposal. Once implemented, regenerate/reconcile its physical view against the native schema definitions and migration result. Retain the proposal separately only when its history or an unimplemented alternative is still useful; do not silently relabel it as the live database.

## One implementation change, one history

Update the existing ORM schema/models or SQL authority, author/generate the migration using the configured tool, review the actual SQL, and update dependent repository code plus ERD documentation in the same change. Retain native migration identifiers, ordering, checksums/journals/snapshots, and runner configuration. Do not create `docs/database/migrations/` or an independent history table for this skill.

Use a configured schema/ERD exporter if available. Otherwise inspect mappings and migrations and document the extraction method and its limits; a generic text search is not a reliable parser for arbitrary ORM schemas. Reconstruct a complex effective schema with the native tools in an isolated database when needed and authorized.

Code-generated entities, logical ORM relations, inherited/default naming, and ORM defaults may differ from physical tables. Check names and actual constraints instead of diagramming language structs mechanically. Never run an introspection command that rewrites source during a read-only review.

In a Go-owned database with a Next.js UI, schema and migrations stay with Go. Next.js changes its API adapter and view contracts. A database design review should trace both sides when relevant while keeping one owner for persistence.
