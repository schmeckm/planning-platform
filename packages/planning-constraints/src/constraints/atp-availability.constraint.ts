/**
 * Constraint: ATP Availability Check
 *
 * Verifies that sufficient material (ATP = Available-to-Promise) exists
 * to cover the order quantity at the time of scheduling.
 *
 * ID:      generic.atp.availability
 * Domain:  GENERIC
 * Severity: BLOCKER
 *
 * Validation References:
 *   URS-PLAN-001: System shall check material availability before scheduling
 *   FS-PLAN-010:  ATP check against current inventory positions
 */

import type { ConstraintEvaluationResult } from '@PCP/planning-core';
import { asConstraintId } from '@PCP/planning-core';
import type {
  IConstraintPlugin,
  ConstraintContext,
  ConstraintMetadata,
  ConstraintSelfTestResult,
} from '../interfaces/constraint.interface.js';
import { buildPassResult, buildFailResult } from '../interfaces/constraint.interface.js';

const META: ConstraintMetadata = {
  id: asConstraintId('generic.atp.availability'),
  version: '1.0.0',
  name: 'ATP Availability Check',
  description:
    'Checks that the required material quantity is available-to-promise in inventory before allowing the order to be scheduled.',
  domain: 'GENERIC',
  defaultSeverity: 'BLOCKER',
  validationRefs: [
    { type: 'URS', id: 'URS-PLAN-001', description: 'Material availability check before scheduling' },
    { type: 'FS',  id: 'FS-PLAN-010',  description: 'ATP check against current inventory positions' },
  ],
  author: 'Pharma Collective Platform Contributors',
  license: 'Apache-2.0',
  tags: ['atp', 'inventory', 'material', 'generic'],
};

export class AtpAvailabilityConstraint implements IConstraintPlugin {
  readonly metadata = META;

  async evaluate(ctx: ConstraintContext): Promise<ConstraintEvaluationResult> {
    const { order, inventory } = ctx;

    const position = inventory.find(
      p => p.materialId === order.materialId,
    );

    if (!position) {
      return buildFailResult(
        META,
        `No inventory position found for material ${order.materialId}`,
        `Order ${order.id} requires ${order.quantity} ${order.unit} of material ${order.materialId}, ` +
          `but no inventory position exists at any location.`,
        'Create an inventory position for this material or assign a batch to the order.',
        0,
        { materialId: order.materialId, required: order.quantity, available: 0 },
      );
    }

    if (position.quantityAvailable < order.quantity) {
      const shortage = order.quantity - position.quantityAvailable;
      return buildFailResult(
        META,
        `Insufficient ATP: need ${order.quantity} ${order.unit}, have ${position.quantityAvailable}`,
        `Order ${order.id} requires ${order.quantity} ${order.unit} of material ${order.materialId}. ` +
          `Available quantity is ${position.quantityAvailable} ${order.unit} — a shortage of ${shortage} ${order.unit}.`,
        `Increase stock for material ${order.materialId} by at least ${shortage} ${order.unit}, ` +
          `or split the order into smaller quantities.`,
        position.quantityAvailable / order.quantity,
        {
          materialId: order.materialId,
          required: order.quantity,
          available: position.quantityAvailable,
          shortage,
          locationId: position.locationId,
        },
      );
    }

    return buildPassResult(
      META,
      `Order ${order.id}: ATP check passed. Available ${position.quantityAvailable} ${order.unit} ` +
        `≥ required ${order.quantity} ${order.unit} for material ${order.materialId}.`,
      { materialId: order.materialId, required: order.quantity, available: position.quantityAvailable },
    );
  }

  async selfTest(): Promise<ConstraintSelfTestResult> {
    const start = Date.now();
    const tests: ConstraintSelfTestResult['failedTests'] = [];

    // Test 1: Pass when sufficient inventory exists
    try {
      const ctx = buildTestContext(100, 150);
      const result = await this.evaluate(ctx);
      if (!result.passed) {
        tests.push({ name: 'sufficient-inventory', expected: 'passed=true', actual: 'passed=false' });
      }
    } catch (e) {
      tests.push({ name: 'sufficient-inventory', expected: 'no error', actual: String(e), error: String(e) });
    }

    // Test 2: Fail when inventory is insufficient
    try {
      const ctx = buildTestContext(100, 50);
      const result = await this.evaluate(ctx);
      if (result.passed) {
        tests.push({ name: 'insufficient-inventory', expected: 'passed=false', actual: 'passed=true' });
      }
    } catch (e) {
      tests.push({ name: 'insufficient-inventory', expected: 'no error', actual: String(e), error: String(e) });
    }

    // Test 3: Fail when no inventory position exists
    try {
      const ctx = buildTestContext(100, 0, true);
      const result = await this.evaluate(ctx);
      if (result.passed) {
        tests.push({ name: 'no-inventory-position', expected: 'passed=false', actual: 'passed=true' });
      }
    } catch (e) {
      tests.push({ name: 'no-inventory-position', expected: 'no error', actual: String(e), error: String(e) });
    }

    return {
      pluginId: META.id,
      pluginVersion: META.version,
      passed: tests.length === 0,
      testsPassed: 3 - tests.length,
      testsFailed: tests.length,
      failedTests: tests,
      durationMs: Date.now() - start,
    };
  }
}

function buildTestContext(required: number, available: number, noPosition = false): ConstraintContext {
  return {
    order: {
      id: 'test-order-1' as never,
      materialId: 'MAT-001' as never,
      quantity: required,
      unit: 'KG',
      priority: 'NORMAL',
      status: 'RELEASED',
      earliestStart: new Date(),
      latestFinish: new Date(Date.now() + 86_400_000),
      durationMinutes: 60,
      operations: [],
      tags: {},
      schedulingStatus: 'PENDING',
      metadata: {},
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    resources: [],
    batches: [],
    materials: [],
    inventory: noPosition
      ? []
      : [
          {
            materialId: 'MAT-001' as never,
            locationId: 'WH-001',
            quantityOnHand: available,
            quantityReserved: 0,
            quantityAvailable: available,
            unit: 'KG',
            lastUpdated: new Date(),
          },
        ],
    siblingOrders: [],
    evaluationTime: new Date(),
    extensions: {},
  };
}
