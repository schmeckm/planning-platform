/**
 * planning-pharma – Pharma Manufacturing Industry Pack
 */

import { PharmaGmpBatchReleaseConstraint } from './constraints/batch-release.constraint.js';
import { PharmaHoldTimeConstraint } from './constraints/hold-time.constraint.js';
import { PharmaCountryReleaseTricConstraint } from './constraints/country-release-tric.constraint.js';
import { PharmaCleaningValidationConstraint } from './constraints/cleaning-validation.constraint.js';
import { PharmaCampaignSequencingConstraint } from './constraints/campaign-sequencing.constraint.js';
import { PharmaQaInspectionLotConstraint } from './constraints/qa-inspection-lot.constraint.js';
import type { IConstraintPlugin } from '@PCP/planning-constraints';

export { PharmaGmpBatchReleaseConstraint } from './constraints/batch-release.constraint.js';
export { PharmaHoldTimeConstraint } from './constraints/hold-time.constraint.js';
export { PharmaCountryReleaseTricConstraint } from './constraints/country-release-tric.constraint.js';
export { PharmaCleaningValidationConstraint } from './constraints/cleaning-validation.constraint.js';
export { PharmaCampaignSequencingConstraint } from './constraints/campaign-sequencing.constraint.js';
export { PharmaQaInspectionLotConstraint } from './constraints/qa-inspection-lot.constraint.js';
export { DEFAULT_CLEANING_MATRIX } from './constraints/cleaning-validation.constraint.js';

/** All pharma constraints, ready to be registered. */
export const pharmaConstraints: IConstraintPlugin[] = [
  new PharmaGmpBatchReleaseConstraint(),
  new PharmaHoldTimeConstraint(),
  new PharmaCountryReleaseTricConstraint(),
  new PharmaCleaningValidationConstraint(),
  new PharmaCampaignSequencingConstraint(),
  new PharmaQaInspectionLotConstraint(),
];
