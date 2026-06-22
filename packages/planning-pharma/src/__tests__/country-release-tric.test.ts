import { describe, it, expect } from 'vitest';
import { PharmaCountryReleaseTricConstraint } from '../constraints/country-release-tric.constraint.js';
import type { ConstraintContext } from '@PCP/planning-constraints';

describe('PharmaCountryReleaseTricConstraint', () => {
  const plugin = new PharmaCountryReleaseTricConstraint();
  const now = new Date();

  function ctx(destination: string): ConstraintContext {
    return {
      order: {
        id: 'ORD-1' as never,
        materialId: 'MAT-1' as never,
        batchId: 'B-1' as never,
        quantity: 1,
        unit: 'EA',
        priority: 'NORMAL',
        status: 'RELEASED',
        destinationCountry: destination,
        earliestStart: now,
        latestFinish: new Date(now.getTime() + 86_400_000),
        durationMinutes: 60,
        operations: [],
        tags: {},
        schedulingStatus: 'PENDING',
        metadata: {},
        createdAt: now,
        updatedAt: now,
      },
      batches: [
        {
          id: 'B-1' as never,
          materialId: 'MAT-1' as never,
          quantity: 1,
          unit: 'EA',
          status: 'RELEASED',
          availableFrom: now,
          approvedCountries: ['DE', 'US'],
          attributes: {},
        },
      ],
      resources: [],
      materials: [],
      inventory: [],
      siblingOrders: [],
      evaluationTime: now,
      extensions: {},
    };
  }

  it('passes when batch is approved for destination', async () => {
    const result = await plugin.evaluate(ctx('DE'));
    expect(result.passed).toBe(true);
  });

  it('fails when destination not in approved countries', async () => {
    const result = await plugin.evaluate(ctx('JP'));
    expect(result.passed).toBe(false);
    expect(result.constraintId).toBe('pharma.batch.country-release-tric');
  });
});
