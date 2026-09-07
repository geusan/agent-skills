# Event analysis

Use this reference when validating received events or answering product questions with collected data. Do not treat instrumentation completion as proof that production data is complete.

## Choose the data source

| Source | Best use | Limitation |
|---|---|---|
| Firebase DebugView | Verify a development device, trigger, ordering, and parameters | Not a production-volume analysis source |
| GA4 Reports/Explorations | Aggregated trends, segments, funnels, paths, and audiences | Custom parameters need custom definitions; processing, thresholding, sampling, and cardinality can affect results |
| BigQuery daily export | Reproducible raw-event queries and joins | Requires a configured link, permissions, SQL, governance, and query-cost control |
| BigQuery intraday export | Operational same-day checks | Best effort and incomplete; do not use as a final daily result |
| Exported CSV/JSON | Local, reviewable analysis when console access is unavailable | Limited to exported fields and filters |

Custom dimensions and metrics can take 24–48 hours to become reportable after registration. BigQuery raw `event_params` do not require GA4 custom-definition registration. The Analytics UI and BigQuery can differ because they do not apply identical reporting logic.

## Analysis contract

Before querying, state:

- Product question and decision.
- Firebase/GA4 property or BigQuery project and dataset.
- Production/environment and app/platform filters.
- Inclusive date range, property timezone, and event-time interpretation.
- User identity (`user_id`, `user_pseudo_id`, or another approved key) and session definition.
- Numerator, denominator, funnel order/window, and segmentation.
- Expected reporting delay and minimum data-completeness date.
- Query-cost ceiling and whether a dry run is required.

If these choices materially change the answer and are unavailable, ask rather than choosing silently. Never claim access to console or BigQuery data that was not actually provided or queried.

## DebugView verification

Follow the current [DebugView instructions](https://firebase.google.com/docs/analytics/debugview). Android uses the target package name when enabling debug mode; iOS uses the Firebase debug launch argument. Verify consent state, app/flavor, event name, parameter types and values, screen context, ordering, duplicate emissions, and user-property transitions. Disable debug mode afterward and record the evidence.

## GA4 analysis

Use Events reports for basic receipt/volume and Explorations for funnels, cohorts, paths, and segment comparisons. Register only the event-scoped dimensions or custom metrics required by the measurement plan. Label key events only when they represent a meaningful business outcome; do not mark every event.

Document report configuration precisely enough to reproduce it: technique, dimensions, metrics, segments, filters, funnel open/closed choice, step order, time window, date range, and timezone. Export the result when the user needs a reviewable artifact.

## BigQuery setup boundary

Linking Firebase/GA4 to BigQuery changes cloud configuration and can incur storage, streaming, and query charges. Confirm project, billing, dataset region, export type, streams, excluded events, and authorization before enabling it. Historical data before the link is not backfilled. See [Firebase BigQuery linking](https://support.google.com/firebase/answer/6318765) and [export behavior](https://support.google.com/analytics/answer/9358801).

Daily export creates `analytics_<property_id>.events_YYYYMMDD`; streaming creates `events_intraday_YYYYMMDD`. Prefer completed daily tables for stable reporting. Daily tables may be updated for late arrivals for up to three days, so label recent results preliminary. Inspect the current [BigQuery export schema](https://support.google.com/analytics/answer/7029846) rather than assuming parameter types.

Use dry runs and `maximum_bytes_billed` or an equivalent control before scanning a new or wide range. Select only required columns, filter `_TABLE_SUFFIX`, and avoid repeatedly scanning the same raw range.

## Query templates

Replace identifiers and dates with validated values. These templates use Standard SQL and intentionally expose identity and denominator choices.

Daily event volume and distinct observed identities:

```sql
SELECT
  event_date,
  event_name,
  COUNT(*) AS event_count,
  COUNT(DISTINCT COALESCE(user_id, user_pseudo_id)) AS observed_users
FROM `project.analytics_PROPERTY_ID.events_*`
WHERE _TABLE_SUFFIX BETWEEN 'YYYYMMDD' AND 'YYYYMMDD'
  AND event_name IN ('event_a', 'event_b')
GROUP BY event_date, event_name
ORDER BY event_date, event_name;
```

Parameter coverage and bounded values:

```sql
SELECT
  event_name,
  (SELECT value.string_value FROM UNNEST(event_params) WHERE key = 'source') AS source,
  COUNT(*) AS event_count,
  COUNTIF((SELECT value.string_value FROM UNNEST(event_params) WHERE key = 'source') IS NULL)
    AS missing_source
FROM `project.analytics_PROPERTY_ID.events_*`
WHERE _TABLE_SUFFIX BETWEEN 'YYYYMMDD' AND 'YYYYMMDD'
  AND event_name = 'event_a'
GROUP BY event_name, source
ORDER BY event_count DESC;
```

Ordered two-step user funnel:

```sql
WITH per_user AS (
  SELECT
    COALESCE(user_id, user_pseudo_id) AS analytics_user,
    MIN(IF(event_name = 'step_a', event_timestamp, NULL)) AS step_a_at,
    MIN(IF(event_name = 'step_b', event_timestamp, NULL)) AS step_b_at
  FROM `project.analytics_PROPERTY_ID.events_*`
  WHERE _TABLE_SUFFIX BETWEEN 'YYYYMMDD' AND 'YYYYMMDD'
    AND event_name IN ('step_a', 'step_b')
  GROUP BY analytics_user
)
SELECT
  COUNTIF(step_a_at IS NOT NULL) AS step_a_users,
  COUNTIF(step_b_at > step_a_at) AS step_b_users,
  SAFE_DIVIDE(
    COUNTIF(step_b_at > step_a_at),
    COUNTIF(step_a_at IS NOT NULL)
  ) AS conversion_rate
FROM per_user
WHERE analytics_user IS NOT NULL;
```

Extend the funnel with an explicit conversion window when the business question requires one. Do not interpret `COUNT(DISTINCT user_pseudo_id)` as the GA4 Active Users metric; identity, consent, modeled data, and UI reporting logic differ.

## Quality checks before interpretation

- Compare event availability by app version, platform, environment, and release date.
- Measure missing/invalid parameter rates and unexpected high-cardinality values.
- Look for duplicate bursts, impossible ordering, and events emitted on both intent and success paths.
- Exclude developer/debug traffic using the documented environment strategy.
- Separate instrumentation adoption from behavioral change after a release.
- Treat the newest daily tables as provisional during the late-arrival window.
- Avoid exposing or exporting row-level identities and suppress tiny cohorts in shared results.

## Report findings

For each result, provide the metric definition, source/query or report configuration, observation window, sample/coverage, finding, confidence/caveat, and product decision it informs. Separate facts from hypotheses. Recommend instrumentation fixes when data quality blocks interpretation; do not manufacture a business conclusion from incomplete events.
