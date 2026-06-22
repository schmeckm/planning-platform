# Scoring & Severity

## When to Use Which Severity

| Severity | Business Meaning | Scheduling Effect |
|---|---|---|
| `BLOCKING` | Order **cannot** be scheduled this way. Hard regulatory or capacity limit. | Order is marked `BLOCKED`. Cannot appear in confirmed plan. |
| `WARNING` | Order **can** be scheduled but the planner should review. | Order appears in plan with a warning indicator. Planner must acknowledge. |
| `SCORING` | No violation, but this slot is better or worse than alternatives. | Influences optimizer score. Does not affect feasibility. |
| `RECOMMENDATION` | A better approach exists. | Advisory message only. No impact on feasibility or score. |

## Decision Guide

```
Is this a hard regulatory requirement (GMP, GxP, safety)?
  └─ YES → BLOCKING

Is this a hard capacity limit (resource overload, missing material)?
  └─ YES → BLOCKING

Is this a business preference that the planner can override?
  └─ YES → WARNING

Does this influence which of two equally feasible slots is preferred?
  └─ YES → SCORING

Is this a suggestion with no compliance implication?
  └─ YES → RECOMMENDATION
```

## Examples

### BLOCKING
- Batch not QA released → cannot ship
- Cleaning validation expired for product family change
- Remaining shelf life of material insufficient for operation duration
- Patient infusion deadline passed (CGT)

### WARNING
- Resource at > 90% utilization on the proposed day
- Campaign sequencing break (same product preferred consecutive)
- Preferred supplier not available (alternate approved)

### SCORING
- Resource R-04 preferred over R-06 for this product family (OEE 94% vs 78%)
- Morning shift preferred for inspection operations (historical quality data)

### RECOMMENDATION
- Consider batching this order with ORD-4712 — same material, adjacent dates
- Resource R-08 is idle on this day and equally qualified
