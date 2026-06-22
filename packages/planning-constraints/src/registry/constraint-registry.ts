/**
 * planning-constraints / constraint-registry.ts
 *
 * The constraint registry is the "plugin loader" of the platform.
 * Industry packs register their constraints here; the engine reads from here.
 *
 * Analogous to Linux's module registration: a plugin calls register() and
 * the kernel discovers it automatically.
 */

import type { IConstraintPlugin, ConstraintDomain } from '../interfaces/constraint.interface.js';
import type { ConstraintId } from '@PCP/planning-core';

export class ConstraintRegistry {
  private readonly plugins = new Map<ConstraintId, IConstraintPlugin>();

  /** Register a constraint plugin. Overwrites if same ID + version is re-registered. */
  register(plugin: IConstraintPlugin): void {
    const existing = this.plugins.get(plugin.metadata.id);
    if (existing && existing.metadata.version === plugin.metadata.version) {
      console.warn(
        `[ConstraintRegistry] Plugin ${plugin.metadata.id}@${plugin.metadata.version} is already registered. Skipping.`,
      );
      return;
    }
    this.plugins.set(plugin.metadata.id, plugin);
    console.info(
      `[ConstraintRegistry] Registered: ${plugin.metadata.id}@${plugin.metadata.version}`,
    );
  }

  registerMany(plugins: IConstraintPlugin[]): void {
    for (const p of plugins) this.register(p);
  }

  get(id: ConstraintId): IConstraintPlugin | undefined {
    return this.plugins.get(id);
  }

  getAll(): IConstraintPlugin[] {
    return Array.from(this.plugins.values());
  }

  getByDomain(domain: ConstraintDomain): IConstraintPlugin[] {
    return this.getAll().filter(p => p.metadata.domain === domain || p.metadata.domain === 'GENERIC');
  }

  getByTag(tag: string): IConstraintPlugin[] {
    return this.getAll().filter(p => p.metadata.tags.includes(tag));
  }

  listMetadata() {
    return this.getAll().map(p => p.metadata);
  }
}

/** Singleton default registry – shared across the application. */
export const globalRegistry = new ConstraintRegistry();
