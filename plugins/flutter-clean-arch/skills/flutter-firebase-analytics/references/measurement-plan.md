# Measurement plan and event taxonomy

Use this reference before adding broad instrumentation. The plan is the contract between product questions, emitted events, GA4 configuration, and analysis.

## Start from decisions

For every proposed metric, write this chain:

```text
business question -> decision it can change -> metric -> event/parameter -> trigger -> analysis
```

Remove an event when no owner can name a decision it supports. Start with the smallest set covering activation, core value, conversion, retention, and critical failure points that apply to the product.

## Measurement-plan artifact

Create or update one version-controlled document in the target repository's documentation convention. Include:

| Field | Required content |
|---|---|
| Event name | Stable SDK name |
| Business question | The question this event helps answer |
| Trigger | Exact observable action and success/failure timing |
| Source | Feature and code boundary that emits it |
| Parameters | Name, type, allowed values, nullable rule, example without PII |
| User properties | Only durable, low-cardinality segmentation attributes |
| Platforms/environments | Expected coverage and exclusions |
| Consent basis | When collection is allowed |
| GA4 setup | Recommended event, key-event decision, custom definitions needed |
| Analysis | Metric or funnel, denominator, segments, and expected decision |
| Owner/status | Responsible person/team and proposed/implemented/verified state |

Also maintain a parameter dictionary so shared concepts such as `source`, `method`, or `result` keep one meaning and one bounded value set across events.

## Taxonomy rules

1. Prefer [recommended events](https://support.google.com/analytics/answer/9267735) and their prescribed parameters when semantics match. Use a custom event only when no recommended event fits.
2. Use lowercase `snake_case`, start names with a letter, and avoid reserved names and the `firebase_`, `ga_`, `google_`, and `gtag.` prefixes. Names are case-sensitive; verify the current [event naming rules](https://support.google.com/analytics/answer/13316687).
3. Name meaningful actions or outcomes, not UI widgets. Prefer `search`, `sign_up`, or `project_created` over `button_clicked`.
4. Keep names and parameter meaning stable. For breaking semantic changes, document a migration and use an explicit schema version or a new name instead of silently redefining historical data.
5. Use bounded categorical parameters. Never use timestamps, UUIDs, raw URLs/routes, free-form search text, exception messages, or per-record identifiers as report dimensions.
6. Distinguish intent, success, and failure only when each answers a question. Define the denominator explicitly for every rate.

Google Analytics currently supports up to 500 distinct custom events and custom events should remain within 25 parameters per event; re-check limits before finalizing a large plan. GA4 standard properties currently expose limited custom-dimension/metric slots, and high-cardinality dimensions can collapse reporting into `(other)`. Use predefined dimensions and metrics whenever possible. See [custom dimensions and metrics](https://support.google.com/analytics/answer/14240153) and [custom event limits](https://support.google.com/analytics/answer/12229021).

## Privacy review

Analytics must not receive personally identifiable information. Reject names, email addresses, phone numbers, exact addresses, precise coordinates, secrets, full user-entered text, and identifiers that directly or permanently identify a person or device. Treat screen names, routes, error strings, campaign values, and search terms as possible leak paths. Consult the current [PII guidance](https://support.google.com/analytics/answer/6366371) and the product's legal/privacy owner when classification is uncertain.

Use user properties only for durable, low-cardinality segmentation. Do not mirror mutable event context into user properties. Record retention, deletion, consent withdrawal, and advertising-personalization requirements alongside the taxonomy when applicable.

## Analysis readiness review

Before implementation, verify that every planned insight has:

- An unambiguous numerator and denominator.
- A stable user/session identity assumption.
- A date/timezone and environment rule.
- Required parameters registered as GA4 custom dimensions or metrics when UI reporting needs them.
- A BigQuery extraction rule when raw-event analysis is expected.
- A validation example and expected event ordering.
- Enough volume to be useful without exposing tiny cohorts.

After implementation, mark an event verified only after unit contract tests and DebugView show the expected trigger and parameter values. Production-volume validation is separate and must account for reporting latency, consent, offline delivery, and version adoption.
