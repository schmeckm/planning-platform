/**
 * planning-cgt – Cell & Gene Therapy Industry Pack
 */

import { CgtChainOfIdentityConstraint } from './constraints/chain-of-identity.constraint.js';
import { CgtVeinToVeinDeadlineConstraint } from './constraints/vein-to-vein-deadline.constraint.js';
import { CgtCryogenicStorageConstraint } from './constraints/cryogenic-storage.constraint.js';
import { CgtCourierWindowConstraint } from './constraints/courier-window.constraint.js';
import type { IConstraintPlugin } from '@PCP/planning-constraints';

export { CgtChainOfIdentityConstraint } from './constraints/chain-of-identity.constraint.js';
export { CgtVeinToVeinDeadlineConstraint } from './constraints/vein-to-vein-deadline.constraint.js';
export { CgtCryogenicStorageConstraint } from './constraints/cryogenic-storage.constraint.js';
export { CgtCourierWindowConstraint } from './constraints/courier-window.constraint.js';

/** All CGT constraints, ready to be registered. */
export const cgtConstraints: IConstraintPlugin[] = [
  new CgtChainOfIdentityConstraint(),
  new CgtVeinToVeinDeadlineConstraint(),
  new CgtCryogenicStorageConstraint(),
  new CgtCourierWindowConstraint(),
];
