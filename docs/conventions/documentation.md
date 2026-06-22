# Documentation Requirements

Every constraint, adapter, and industry pack contribution must include documentation. This is non-negotiable — planning knowledge that isn't documented isn't actually shared.

## What Must Be Documented

### For Every Constraint

1. **Business purpose** — what manufacturing problem does this rule solve?
2. **Regulatory reference** — which regulation, guideline, or standard requires this? (if applicable)
3. **Requirement ID** — traceability back to a URS/FS/DS document
4. **Severity rationale** — why is this BLOCKING and not WARNING?
5. **Tag documentation** — what `order.tags` or `resource.tags` does this constraint read?
6. **Example violation** — what does the `message` and `suggestedAction` look like for a real case?

### For Every Adapter

1. **System description** — what ERP/MES/LIMS does this connect to?
2. **Field mapping** — which source fields map to which canonical model fields?
3. **Authentication** — how is the connection configured?
4. **Limitations** — what data is not available or not mapped?

### For Every Industry Pack

1. **Industry overview** — what makes planning in this industry unique?
2. **List of included constraints** with links
3. **Sample data** — a realistic mock dataset for testing
4. **Getting started** — how to activate the pack in a simulation

## Documentation Location

| What | Where |
|---|---|
| Constraint reference | `/docs/constraints/builtin.md` |
| New industry pack | `/docs/industries/<industry>.md` |
| New adapter | `/docs/adapters/<system>.md` |
| Platform release (user-facing) | `/docs/community/release-notes/<version>.md` |
| Platform release (developer registry) | `/docs/.vitepress/data/releases.ts` |
| Code-level docs | JSDoc in the `.ts` source file |

For release notes, follow [Release Notes Convention](/conventions/release-notes).

## Writing Style

- Write for an **audience from a different company** — assume no shared context
- Use **concrete examples** — a real order number, a real constraint violation message
- Keep sentences short and direct
- Use tables for comparisons and lists for steps
- All documentation is in **English**
