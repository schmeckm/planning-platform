/**
 * Unit tests – ConstraintRegistry
 *
 * Verifies plugin registration, lookup, deduplication, and filtering.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { ConstraintRegistry } from '../registry/constraint-registry.js';
import { AtpAvailabilityConstraint } from '../constraints/atp-availability.constraint.js';
import { RemainingShelfLifeConstraint } from '../constraints/remaining-shelf-life.constraint.js';
import { ResourceCapacityConstraint } from '../constraints/resource-capacity.constraint.js';

describe('ConstraintRegistry', () => {
  let registry: ConstraintRegistry;

  beforeEach(() => {
    registry = new ConstraintRegistry();
  });

  it('registers a plugin and retrieves it by ID', () => {
    const plugin = new AtpAvailabilityConstraint();
    registry.register(plugin);
    expect(registry.get(plugin.metadata.id)).toBe(plugin);
  });

  it('returns undefined for an unknown constraint ID', () => {
    expect(registry.get('does.not.exist' as never)).toBeUndefined();
  });

  it('getAll() returns all registered plugins', () => {
    registry.registerMany([
      new AtpAvailabilityConstraint(),
      new RemainingShelfLifeConstraint(),
      new ResourceCapacityConstraint(),
    ]);
    expect(registry.getAll()).toHaveLength(3);
  });

  it('does not register the same plugin+version twice', () => {
    const plugin = new AtpAvailabilityConstraint();
    registry.register(plugin);
    registry.register(plugin); // duplicate registration
    expect(registry.getAll()).toHaveLength(1);
  });

  it('getByDomain() returns plugins matching the domain or GENERIC', () => {
    registry.registerMany([
      new AtpAvailabilityConstraint(),   // GENERIC
      new RemainingShelfLifeConstraint(), // GENERIC
    ]);
    const genericPlugins = registry.getByDomain('GENERIC');
    expect(genericPlugins).toHaveLength(2);
  });

  it('getByTag() returns plugins matching a specific tag', () => {
    registry.registerMany([
      new AtpAvailabilityConstraint(),    // tags: ['atp', 'inventory', ...]
      new RemainingShelfLifeConstraint(), // tags: ['rmsl', 'shelf-life', ...]
    ]);
    const atpTagged = registry.getByTag('atp');
    expect(atpTagged).toHaveLength(1);
    expect(atpTagged[0].metadata.id).toBe('generic.atp.availability');
  });

  it('listMetadata() returns metadata for all registered plugins', () => {
    registry.registerMany([
      new AtpAvailabilityConstraint(),
      new RemainingShelfLifeConstraint(),
    ]);
    const metadata = registry.listMetadata();
    expect(metadata).toHaveLength(2);
    expect(metadata.every(m => typeof m.id === 'string')).toBe(true);
    expect(metadata.every(m => typeof m.version === 'string')).toBe(true);
  });
});
