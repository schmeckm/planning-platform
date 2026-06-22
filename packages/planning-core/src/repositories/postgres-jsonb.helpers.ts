/**
 * Shared JSONB serialization helpers for PostgreSQL repositories.
 */

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/;

export function parseIsoDate(value: unknown): Date | undefined {
  if (value instanceof Date) return value;
  if (typeof value === 'string' && ISO_DATE_RE.test(value)) {
    return new Date(value);
  }
  return undefined;
}

export function reviveOrder(raw: Record<string, unknown>): Record<string, unknown> {
  const order: Record<string, unknown> = { ...raw };
  for (const key of ['earliestStart', 'latestFinish', 'scheduledStart', 'scheduledFinish', 'createdAt', 'updatedAt']) {
    const parsed = parseIsoDate(order[key]);
    if (parsed) order[key] = parsed;
  }
  if (Array.isArray(order['operations'])) {
    order['operations'] = (order['operations'] as Record<string, unknown>[]).map(op => {
      const copy: Record<string, unknown> = { ...op };
      for (const key of ['scheduledStart', 'scheduledFinish']) {
        const parsed = parseIsoDate(copy[key]);
        if (parsed) copy[key] = parsed;
      }
      return copy;
    });
  }
  return order;
}

export function reviveBatch(raw: Record<string, unknown>): Record<string, unknown> {
  const batch: Record<string, unknown> = { ...raw };
  for (const key of ['manufactureDate', 'expiryDate', 'releaseDate', 'availableFrom']) {
    const parsed = parseIsoDate(batch[key]);
    if (parsed) batch[key] = parsed;
  }
  return batch;
}

export function reviveInventory(raw: Record<string, unknown>): Record<string, unknown> {
  const pos: Record<string, unknown> = { ...raw };
  const parsed = parseIsoDate(pos['lastUpdated']);
  if (parsed) pos['lastUpdated'] = parsed;
  return pos;
}
