# Engine-specific review points

Use the actual engine, version, storage engine, and relevant configuration. Select only the applicable section; produce SQL for that project. Compare multiple engines when portability is an explicit requirement. These are review prompts, not a universal SQL dialect or permission to alter a database.

## Common decisions

Record the intended meaning of primary/business keys, nullable values, money precision, timestamps/time zones, string comparison, deletion/history, and tenant scope. Check generated defaults and ID behavior as well as types. Prefer justified constraints and normalized relationships; choose JSON/denormalization from access patterns and lifecycle requirements.

Tie each index to a query or integrity requirement. Consider leading columns, predicates, ordering, selectivity, and maintenance cost. Distinguish measured plans/volumes from estimates. Transactions should preserve the operation's invariants under concurrency, including conflicts and retries where applicable.

For populated tables, evaluate conversion/backfill, lock/rebuild cost, application compatibility, and recovery using the actual migration tool. A reversible-looking down migration does not restore discarded data.

## PostgreSQL

Inspect identity/sequence behavior, types and precision, JSON versus JSONB usage, constraints, partial/expression indexes, schema/search-path assumptions, and any row-level policies actually used by the project. An ORM's generic declaration may omit database-specific objects present in migrations.

Foreign-key declarations do not automatically create an index on the referencing columns. Evaluate those indexes against workload and referential actions rather than duplicating indexes blindly. Consult the selected version's [constraint documentation](https://www.postgresql.org/docs/current/ddl-constraints.html).

For index/schema changes, verify lock behavior and transaction restrictions for the specific operation using [CREATE INDEX](https://www.postgresql.org/docs/current/sql-createindex.html) and [ALTER TABLE](https://www.postgresql.org/docs/current/sql-altertable.html). Keep the migration runner's transaction wrapping compatible with the chosen operation.

## MySQL

Verify storage engine, SQL mode, charset/collation, signedness, default/time semantics, key lengths, and exact version support for constraints/index features. Confirm actual foreign keys and indexes rather than assuming a model association creates both correctly.

Online DDL capabilities depend on the operation. Even an online alteration may need metadata locks and wait for other transactions. Consult [online DDL operations](https://dev.mysql.com/doc/refman/8.4/en/innodb-online-ddl-operations.html) and [limitations](https://dev.mysql.com/doc/refman/8.4/en/innodb-online-ddl-limitations.html), selecting the project's manual version. Do not equate an atomic DDL implementation with application-controlled transactional rollback of every migration.

## MariaDB

Inspect MariaDB's own version and configuration instead of inheriting MySQL assumptions. Its `JSON` type is an alias for `LONGTEXT COLLATE utf8mb4_bin`; account for actual storage, validation, indexing, and comparison requirements. See [JSON data type](https://mariadb.com/docs/server/reference/data-types/string-data-types/json).

Check charset/collation, SQL mode, storage engine, generated columns/indexes, and referential actions as supported by the selected version. Alteration algorithms and lock behavior require MariaDB-specific verification: [ALTER TABLE](https://mariadb.com/docs/server/reference/sql-statements/data-definition/alter/alter-table) and [metadata locking](https://mariadb.com/docs/server/reference/sql-statements/transactions/metadata-locking).

## Verification boundary

Use the target engine/version for meaningful schema/migration tests; a different lightweight database or ORM mock does not prove equivalent SQL behavior. Separate syntax validation, schema reconstruction, representative query/concurrency checks, and actual production application. Explicitly report which were performed.
