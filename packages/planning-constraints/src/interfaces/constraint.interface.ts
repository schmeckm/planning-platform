/**
 * planning-constraints / constraint.interface.ts
 *
 * The universal constraint plugin contract.
 *
 * Every constraint – whether from the community, a pharma pack, or a CGT pack –
 * MUST implement IConstraintPlugin. This ensures the kernel can evaluate any
 * constraint without knowing its internals.
 *
 * Inspired by the Linux Kernel module interface: small, stable, and generic.
 */

import type {
  PlanningOrder,
  PlanningResource,
  PlanningBatch,
  PlanningMaterial,
  InventoryPosition,
  ConstraintEvaluationResult,
  ConstraintId,
  ConstraintSeverity,
  ValidationReference,
} from '@PCP/planning-core';

// ─── Constraint Evaluation Context ───────────────────────────────────────────

/**
 * Everything a constraint plugin needs to evaluate one order.
 * Passed in by the constraint engine – plugins never call external APIs.
 */
export interface ConstraintContext {
  order: PlanningOrder;
  resources: PlanningResource[];
  batches: PlanningBatch[];
  materials: PlanningMaterial[];
  inventory: InventoryPosition[];
  /** All other orders in the same simulation (for campaign / sequencing checks) */
  siblingOrders: PlanningOrder[];
  /** Current simulation point in time (for time-based checks) */
  evaluationTime: Date;
  /** Arbitrary context data injected by adapters or industry packs */
  extensions: Record<string, unknown>;
}

// ─── Constraint Plugin Metadata ───────────────────────────────────────────────

export interface ConstraintMetadata {
  /** Globally unique constraint identifier, e.g. 'pharma.atp.availability' */
  readonly id: ConstraintId;
  /** Semantic version of this constraint implementation */
  readonly version: string;
  /** Short human-readable name */
  readonly name: string;
  /** Detailed description of what this constraint checks */
  readonly description: string;
  /** Domain this constraint belongs to */
  readonly domain: ConstraintDomain;
  /** Severity when the constraint fires */
  readonly defaultSeverity: ConstraintSeverity;
  /** Validation references for GxP traceability */
  readonly validationRefs: ValidationReference[];
  /** Human-readable documentation URL */
  readonly documentationUrl?: string;
  /** Author / maintainer */
  readonly author: string;
  /** SPDX license identifier */
  readonly license: string;
  /** Tags for filtering and discovery */
  readonly tags: string[];
}

export type ConstraintDomain =
  | 'GENERIC'
  | 'PHARMA'
  | 'CGT'
  | 'BIOLOGICS'
  | 'FOOD'
  | 'SEMICONDUCTOR'
  | 'PACKAGING'
  | 'LOGISTICS';

// ─── Plugin Interface ─────────────────────────────────────────────────────────

/**
 * The core plugin interface every constraint must implement.
 *
 * @example
 * class AtpCheck implements IConstraintPlugin {
 *   readonly metadata = { id: 'generic.atp.availability', ... };
 *   async evaluate(ctx: ConstraintContext): Promise<ConstraintEvaluationResult> { ... }
 *   async selfTest(): Promise<ConstraintSelfTestResult> { ... }
 * }
 */
export interface IConstraintPlugin {
  /** Static metadata – never changes at runtime */
  readonly metadata: ConstraintMetadata;

  /**
   * Evaluate the constraint against a single order context.
   * Must be side-effect-free and deterministic.
   * Must never throw – return a failed result instead.
   */
  evaluate(ctx: ConstraintContext): Promise<ConstraintEvaluationResult>;

  /**
   * Run the plugin's built-in test cases.
   * Called during validation / IQ-OQ-PQ phases.
   */
  selfTest(): Promise<ConstraintSelfTestResult>;
}

export interface ConstraintSelfTestResult {
  pluginId: ConstraintId;
  pluginVersion: string;
  passed: boolean;
  testsPassed: number;
  testsFailed: number;
  failedTests: Array<{
    name: string;
    expected: string;
    actual: string;
    error?: string;
  }>;
  durationMs: number;
}

// ─── Helper: Build a standard passing result ─────────────────────────────────

export function buildPassResult(
  meta: ConstraintMetadata,
  explanation: string,
  detail: Record<string, unknown> = {},
): ConstraintEvaluationResult {
  return {
    constraintId: meta.id,
    constraintVersion: meta.version,
    severity: meta.defaultSeverity,
    passed: true,
    score: 1,
    message: `${meta.name}: passed`,
    explanation,
    validationRefs: meta.validationRefs,
    detail,
  };
}

export function buildFailResult(
  meta: ConstraintMetadata,
  message: string,
  explanation: string,
  correctionHint: string,
  score = 0,
  detail: Record<string, unknown> = {},
): ConstraintEvaluationResult {
  return {
    constraintId: meta.id,
    constraintVersion: meta.version,
    severity: meta.defaultSeverity,
    passed: false,
    score,
    message,
    explanation,
    correctionHint,
    validationRefs: meta.validationRefs,
    detail,
  };
}

export function buildWarnResult(
  meta: ConstraintMetadata,
  message: string,
  explanation: string,
  correctionHint: string,
  score = 0.5,
  detail: Record<string, unknown> = {},
): ConstraintEvaluationResult {
  return {
    constraintId: meta.id,
    constraintVersion: meta.version,
    severity: 'WARNING',
    passed: true, // warnings don't block scheduling
    score,
    message,
    explanation,
    correctionHint,
    validationRefs: meta.validationRefs,
    detail,
  };
}
