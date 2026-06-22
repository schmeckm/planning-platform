import { describe, it, expect } from 'vitest';
import { SCENARIOS_PACKAGE_VERSION } from '../index.js';

describe('@PCP/planning-scenarios', () => {
  it('exports SCENARIOS_PACKAGE_VERSION', () => {
    expect(SCENARIOS_PACKAGE_VERSION).toBe('0.1.0');
  });
});
