import { describe, it, expect } from 'vitest';
import { SDK_VERSION, asOrderId } from '../index.js';

describe('@PCP/planning-sdk', () => {
  it('exports SDK_VERSION', () => {
    expect(SDK_VERSION).toBe('0.1.0');
  });

  it('re-exports planning-core helpers', () => {
    expect(asOrderId('ORD-001')).toBe('ORD-001');
  });
});
