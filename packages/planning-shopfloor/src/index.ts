export * from './types/shopfloor.types.js';
export * from './schemas/shopfloor.schemas.js';
export * from './interfaces/shopfloor-provider.interface.js';

export const SHOPFLOOR_DEFAULT_TOPIC_PATTERN =
  '{namespace}/plant/{plantId}/{resourceType}/{resourceId}/{eventType}';

export const SHOPFLOOR_UI_ROUTES = {
  board: '/planning/shopfloor-board',
  admin: '/planning/admin',
  adminTab: 'shopfloor',
} as const;

export const SHOPFLOOR_API_PATHS = {
  pcpPrefix: '/api/pcp/v1/shopfloor',
  legacyPrefix: '/api/v1/shopfloor',
} as const;
