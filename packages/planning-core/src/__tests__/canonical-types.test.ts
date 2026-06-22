/**
 * Unit tests – planning-core canonical types and Zod schemas
 *
 * Verifies that the brand helper functions create correct typed IDs
 * and that the Zod schemas properly accept/reject input payloads.
 */

import { describe, it, expect } from 'vitest';
import {
  asOrderId,
  asResourceId,
  asMaterialId,
  asBatchId,
  asSimRunId,
  asOperationId,
  asConstraintId,
} from '../types/canonical.types.js';
import {
  OrderPrioritySchema,
  OrderStatusSchema,
  BatchStatusSchema,
  SchedulingStatusSchema,
  ResourceTypeSchema,
} from '../types/zod-schemas.js';

// ─── Branded ID helpers ───────────────────────────────────────────────────────

describe('Branded ID helpers', () => {
  it('asOrderId returns the original string', () => {
    expect(asOrderId('ORD-001')).toBe('ORD-001');
  });

  it('asResourceId returns the original string', () => {
    expect(asResourceId('RES-001')).toBe('RES-001');
  });

  it('asMaterialId returns the original string', () => {
    expect(asMaterialId('MAT-001')).toBe('MAT-001');
  });

  it('asBatchId returns the original string', () => {
    expect(asBatchId('BATCH-001')).toBe('BATCH-001');
  });

  it('asSimRunId returns the original string', () => {
    const uuid = '123e4567-e89b-12d3-a456-426614174000';
    expect(asSimRunId(uuid)).toBe(uuid);
  });

  it('asOperationId returns the original string', () => {
    expect(asOperationId('OP-001')).toBe('OP-001');
  });

  it('asConstraintId returns the original string', () => {
    expect(asConstraintId('generic.atp.availability')).toBe('generic.atp.availability');
  });
});

// ─── Zod schemas ─────────────────────────────────────────────────────────────

describe('OrderPrioritySchema', () => {
  it('accepts valid priorities', () => {
    for (const val of ['CRITICAL', 'HIGH', 'NORMAL', 'LOW'] as const) {
      expect(() => OrderPrioritySchema.parse(val)).not.toThrow();
    }
  });

  it('rejects invalid priority', () => {
    expect(() => OrderPrioritySchema.parse('ULTRA')).toThrow();
  });
});

describe('OrderStatusSchema', () => {
  it('accepts valid statuses', () => {
    for (const val of ['DRAFT', 'RELEASED', 'IN_PROCESS', 'COMPLETED', 'BLOCKED', 'CANCELLED'] as const) {
      expect(() => OrderStatusSchema.parse(val)).not.toThrow();
    }
  });

  it('rejects invalid status', () => {
    expect(() => OrderStatusSchema.parse('UNKNOWN')).toThrow();
  });
});

describe('BatchStatusSchema', () => {
  it('accepts all GMP batch statuses', () => {
    for (const val of ['PLANNED', 'IN_PRODUCTION', 'QC_HOLD', 'QA_HOLD', 'RELEASED', 'REJECTED', 'EXPIRED', 'QUARANTINE'] as const) {
      expect(() => BatchStatusSchema.parse(val)).not.toThrow();
    }
  });

  it('rejects an unknown batch status', () => {
    expect(() => BatchStatusSchema.parse('PENDING_REVIEW')).toThrow();
  });
});

describe('SchedulingStatusSchema', () => {
  it('accepts valid scheduling statuses', () => {
    for (const val of ['FEASIBLE', 'INFEASIBLE', 'SOFT_VIOLATION', 'UNSCHEDULED', 'PENDING'] as const) {
      expect(() => SchedulingStatusSchema.parse(val)).not.toThrow();
    }
  });
});

describe('ResourceTypeSchema', () => {
  it('accepts all resource types', () => {
    for (const val of ['MACHINE', 'LABOR', 'VESSEL', 'CLEANROOM', 'STORAGE', 'ANALYTICAL_INSTRUMENT', 'VIRTUAL'] as const) {
      expect(() => ResourceTypeSchema.parse(val)).not.toThrow();
    }
  });

  it('rejects an unknown resource type', () => {
    expect(() => ResourceTypeSchema.parse('ROBOT')).toThrow();
  });
});
