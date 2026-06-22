# Cell & Gene Therapy Pack

The `@PCP/planning-cgt` pack provides constraints for **personalized medicine manufacturing** — where each batch is produced for a specific patient and scheduling errors can be life-threatening.

## What Makes CGT Planning Unique

Cell & Gene Therapy manufacturing is fundamentally different from conventional batch manufacturing:

- **Patient-specific orders** — every batch belongs to exactly one patient. Materials from different patients must **never** be mixed.
- **Fixed deadline** — the patient's infusion date is set by the clinical team. The entire manufacturing timeline works backwards from that date.
- **Vein-to-Vein** — the clock starts when apheresis material is collected and ends at patient infusion. Everything in between must fit in that window.
- **Cryogenic storage** — frozen intermediates occupy a limited number of cryogenic storage slots.
- **QC release timeline** — QC testing takes a defined minimum time. If the QC window overlaps the infusion date, the product cannot be released in time.

## Installation

```bash
pnpm add @PCP/planning-cgt
```

## Included Constraints

| Constraint | Severity | Description |
|---|---|---|
| `cgt.chain-of-identity` | BLOCKING | Patient materials must never be co-located or mixed |
| `cgt.vein-to-vein` | BLOCKING | Manufacturing window cannot exceed patient infusion deadline |
| `cgt.cryogenic-storage` | BLOCKING | Cryo storage slots are fully occupied on proposed date |
| `cgt.apheresis-window` | BLOCKING | Apheresis must precede all downstream operations |
| `cgt.qc-release-timeline` | WARNING | QC release window may not complete before infusion date |
| `cgt.courier-window` | BLOCKING | Shipment window to infusion site must be respected |

## Configuration via Order Tags

```typescript
const order: Order = {
  id: 'CGT-00234',
  tags: {
    'cgt.patientId': 'PAT-DE-0047',
    'cgt.infusionDate': '2026-08-15',
    'cgt.apheresisDate': '2026-07-20',
    'cgt.veinToVeinWindowDays': '26',
    'cgt.qcMinReleaseDays': '5',
    'cgt.destinationSite': 'UKE-Hamburg',
  }
}
```

## Chain of Identity — How It Works

The `cgt.chain-of-identity` constraint verifies at every scheduling decision:

1. No other patient's materials are assigned to the same room at the same time
2. No equipment used for this patient's batch is used for another patient within the defined decontamination window
3. The audit trail records every co-location check

```
ORD-CGT-0047 (Patient: PAT-DE-0047) → Room A-201 → 2026-07-22 08:00–16:00
ORD-CGT-0051 (Patient: PAT-DE-0051) → Room A-201 → 2026-07-22 10:00–18:00
                                         ↑
                              BLOCKED: chain-of-identity violation
                              Two patients' materials in the same room simultaneously.
```

## Roadmap

- [ ] Multi-site manufacturing support (apheresis in one country, manufacturing in another)
- [ ] Clinical protocol version tracking
- [ ] Patient slot reservation across planning horizons
- [ ] Integration with clinical trial management systems
