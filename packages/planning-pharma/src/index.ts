/**
 * planning-pharma – Pharma Manufacturing Industry Pack
 *
 * Re-exports all pharma-specific constraints and templates.
 * Register them against the global constraint registry at startup.
 *
 * @example
 * import { pharmaConstraints, globalRegistry } from '@PCP/planning-pharma';
 * globalRegistry.registerMany(pharmaConstraints);
 */

import { PharmaGmpBatchReleaseConstraint } from './constraints/batch-release.constraint.js';
import { PharmaHoldTimeConstraint } from './constraints/hold-time.constraint.js';
import type { IConstraintPlugin } from '@PCP/planning-constraints';

export { PharmaGmpBatchReleaseConstraint } from './constraints/batch-release.constraint.js';
export { PharmaHoldTimeConstraint } from './constraints/hold-time.constraint.js';

/** All pharma constraints, ready to be registered. */
export const pharmaConstraints: IConstraintPlugin[] = [
  new PharmaGmpBatchReleaseConstraint(),
  new PharmaHoldTimeConstraint(),
];
