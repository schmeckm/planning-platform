/**
 * planning-constraints / constraint-engine.ts
 *
 * The constraint evaluation engine.
 *
 * Iterates over registered constraints, evaluates each one in parallel,
 * aggregates results, and derives the scheduling status per order.
 *
 * The engine is intentionally free of industry-specific knowledge.
 */

import type { PlanningOrder, SimulationResult, SimRunId } from '@PCP/planning-core';
import { asSimRunId } from '@PCP/planning-core';
import type { ConstraintContext } from '../interfaces/constraint.interface.js';
import type { ConstraintRegistry } from '../registry/constraint-registry.js';
import { randomUUID } from 'node:crypto';

export interface EngineInput {
  orders: PlanningOrder[];
  context: Omit<ConstraintContext, 'order' | 'siblingOrders'>;
  /** Only evaluate constraints with these IDs. Empty = all registered. */
  constraintIds?: string[];
  triggeredBy?: string;
}

export interface EngineOutput {
  simRunId: SimRunId;
  startedAt: Date;
  finishedAt: Date;
  durationMs: number;
  results: SimulationResult[];
  summary: EngineSummary;
}

export interface EngineSummary {
  totalOrders: number;
  feasible: number;
  infeasible: number;
  softViolation: number;
  constraintsEvaluated: number;
  blockersFired: number;
  warningsFired: number;
}

export class ConstraintEngine {
  constructor(private readonly registry: ConstraintRegistry) {}

  async evaluate(input: EngineInput): Promise<EngineOutput> {
    const simRunId = asSimRunId(randomUUID());
    const startedAt = new Date();

    const plugins = input.constraintIds?.length
      ? input.constraintIds
          .map(id => this.registry.get(id as never))
          .filter((p): p is NonNullable<typeof p> => p !== undefined)
      : this.registry.getAll();

    const results = await Promise.all(
      input.orders.map(order =>
        this.evaluateOrder(order, input.orders, input.context, plugins),
      ),
    );

    const finishedAt = new Date();

    return {
      simRunId,
      startedAt,
      finishedAt,
      durationMs: finishedAt.getTime() - startedAt.getTime(),
      results,
      summary: this.buildSummary(results, plugins.length),
    };
  }

  private async evaluateOrder(
    order: PlanningOrder,
    allOrders: PlanningOrder[],
    baseCtx: Omit<ConstraintContext, 'order' | 'siblingOrders'>,
    plugins: ReturnType<ConstraintRegistry['getAll']>,
  ): Promise<SimulationResult> {
    const ctx: ConstraintContext = {
      ...baseCtx,
      order,
      siblingOrders: allOrders.filter(o => o.id !== order.id),
    };

    const constraintResults = await Promise.all(
      plugins.map(async plugin => {
        try {
          return await plugin.evaluate(ctx);
        } catch (err) {
          // Defensive: a crashing plugin must never crash the engine
          return {
            constraintId: plugin.metadata.id,
            constraintVersion: plugin.metadata.version,
            severity: 'BLOCKER' as const,
            passed: false,
            score: 0,
            message: `Plugin crashed: ${String(err)}`,
            explanation: `The constraint plugin ${plugin.metadata.id} threw an unexpected error during evaluation.`,
            correctionHint: 'Contact the plugin maintainer.',
            detail: { error: String(err) },
          };
        }
      }),
    );

    const blockers = constraintResults.filter(r => !r.passed && r.severity === 'BLOCKER');
    const softViolations = constraintResults.filter(r => !r.passed && r.severity === 'WARNING');

    let schedulingStatus: PlanningOrder['schedulingStatus'];
    if (blockers.length > 0) {
      schedulingStatus = 'INFEASIBLE';
    } else if (softViolations.length > 0) {
      schedulingStatus = 'SOFT_VIOLATION';
    } else {
      schedulingStatus = 'FEASIBLE';
    }

    const score =
      constraintResults.length > 0
        ? constraintResults.reduce((s, r) => s + r.score, 0) / constraintResults.length
        : 1;

    const explanation = this.generateExplanation(order, constraintResults, schedulingStatus);

    const baseResult = {
      orderId: order.id,
      schedulingStatus,
      constraintResults,
      score,
      explanation,
    };

    if (schedulingStatus === 'FEASIBLE') {
      return {
        ...baseResult,
        scheduledStart: order.earliestStart,
        scheduledFinish: new Date(order.earliestStart.getTime() + order.durationMinutes * 60_000),
      };
    }

    return baseResult;
  }

  private generateExplanation(
    order: PlanningOrder,
    results: SimulationResult['constraintResults'],
    status: PlanningOrder['schedulingStatus'],
  ): string {
    if (status === 'FEASIBLE') {
      return `Order ${order.id} (Material: ${order.materialId}) passed all ${results.length} constraint(s) and is feasible for scheduling.`;
    }

    const blockers = results.filter(r => !r.passed && r.severity === 'BLOCKER');
    const warnings = results.filter(r => r.severity === 'WARNING');

    const lines: string[] = [
      `Order ${order.id} (Material: ${order.materialId}) has scheduling issues:`,
    ];

    for (const b of blockers) {
      lines.push(`  BLOCKER [${b.constraintId}]: ${b.explanation}`);
      if (b.correctionHint) lines.push(`    → ${b.correctionHint}`);
    }
    for (const w of warnings) {
      lines.push(`  WARNING [${w.constraintId}]: ${w.explanation}`);
    }

    return lines.join('\n');
  }

  private buildSummary(results: SimulationResult[], constraintsEvaluated: number): EngineSummary {
    return {
      totalOrders: results.length,
      feasible: results.filter(r => r.schedulingStatus === 'FEASIBLE').length,
      infeasible: results.filter(r => r.schedulingStatus === 'INFEASIBLE').length,
      softViolation: results.filter(r => r.schedulingStatus === 'SOFT_VIOLATION').length,
      constraintsEvaluated,
      blockersFired: results.flatMap(r => r.constraintResults).filter(
        c => !c.passed && c.severity === 'BLOCKER',
      ).length,
      warningsFired: results.flatMap(r => r.constraintResults).filter(
        c => c.severity === 'WARNING',
      ).length,
    };
  }
}
