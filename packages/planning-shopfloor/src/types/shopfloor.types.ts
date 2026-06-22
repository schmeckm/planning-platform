/**
 * Canonical shopfloor types for live line transparency.
 * Operational data — shadow storage only, never writes to ERP/planning master data.
 */

export type ShopfloorResourceType = 'packaging-line' | 'work-center';

export type ShopfloorLineState = 'RUNNING' | 'SETUP' | 'TEARDOWN' | 'IDLE' | 'DOWN';

export type ShopfloorKpiEventType =
  | 'line-status'
  | 'schedule-adherence'
  | 'oee'
  | 'progress'
  | 'scrap'
  | 'phase-event';

export type ShopfloorLegacyEventType = 'status' | 'progress' | 'confirmation' | 'alarm';

export type ShopfloorEventType = ShopfloorKpiEventType | ShopfloorLegacyEventType;

export type ShopfloorSimulationScenario = 'on-schedule' | 'delayed' | 'high-scrap';

export interface ShopfloorMqttConfig {
  namespace: string;
  brokerUrl: string;
  enabled: boolean;
  qos: number;
  username: string | null;
  hasPassword: boolean;
  topicPattern: string;
  eventTypes: ShopfloorEventType[];
  updatedAt?: string;
  updatedBy?: string;
}

export interface ShopfloorTopicBinding {
  id: string;
  resourceType: ShopfloorResourceType;
  resourceId: string;
  plantId: string;
  resourceName: string;
  topics: Record<string, string>;
  subscribed: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ShopfloorMqttMessage {
  id: string;
  receivedAt: string;
  topic: string;
  eventType: string;
  format: 'json' | 'text';
  payload: unknown;
  qos?: number | null;
  resourceType?: ShopfloorResourceType | null;
  resourceId?: string | null;
  resourceName?: string | null;
  plantId?: string | null;
  bindingId?: string | null;
  orderId?: string | null;
  simulated?: boolean;
}

export interface ShopfloorMqttConnectionState {
  connected: boolean;
  lastError: string | null;
  lastConnectedAt: string | null;
  lastDisconnectedAt: string | null;
  subscribedTopics: string[];
  messageCount: number;
}

export interface ShopfloorMqttStatus {
  config: Pick<ShopfloorMqttConfig, 'namespace' | 'brokerUrl' | 'enabled' | 'qos'>;
  connection: ShopfloorMqttConnectionState;
  bindingCount: number;
  subscribedBindingCount: number;
}

export interface ShopfloorDisturbance {
  id: string;
  type: string;
  label: string;
  startAt?: string;
  endAt?: string;
  severity?: string;
  source?: string;
}

export interface ShopfloorLineKpi {
  oee?: number | null;
  adherence?: number | null;
  source?: Partial<Record<'oee' | 'adherence', 'mqtt' | 'derived'>>;
}

export interface ShopfloorLineQuantity {
  planned?: number | null;
  produced?: number | null;
  progressPct?: number | null;
  source?: 'mqtt' | 'derived';
}

export interface ShopfloorActiveOrder {
  orderId: string;
  orderNumber?: string;
  productName?: string;
  phase?: string;
  planVsActual?: {
    plannedEnd?: string;
    projectedEnd?: string;
    deltaMinutes?: number;
  };
}

export interface ShopfloorLineBoard {
  lineId: string;
  lineName: string;
  plantId: string;
  lineState: ShopfloorLineState;
  activeOrder: ShopfloorActiveOrder | null;
  kpi: ShopfloorLineKpi;
  quantity: ShopfloorLineQuantity;
  scrap?: number | null;
  disturbances: {
    planned: ShopfloorDisturbance[];
    unplanned: ShopfloorDisturbance[];
  };
  dataFreshness: {
    hasMqttData: boolean;
    lastMessageAt: string | null;
  };
  lastUpdated: string;
}

export interface ShopfloorBoardSummary {
  lineCount: number;
  runningLines: number;
  wipOrderCount: number;
  linesWithMqtt: number;
  plannedDisturbanceCount: number;
  unplannedDisturbanceCount: number;
  totalPlannedQty: number;
  totalProducedQty: number;
  avgProgressPct: number;
  linesWithPlanCount: number;
}

export interface ShopfloorBoard {
  generatedAt: string;
  plantId: string | null;
  summary: ShopfloorBoardSummary;
  mqttServer: {
    enabled: boolean;
    brokerUrl: string;
    connected: boolean;
    lastConnectedAt: string | null;
    lastDisconnectedAt: string | null;
    lastError: string | null;
    messageCount: number;
  };
  lines: ShopfloorLineBoard[];
}

export interface ShopfloorTopicCatalogEntry {
  eventType: string;
  labelDe: string;
  labelEn: string;
  descriptionDe: string;
  descriptionEn: string;
}

export interface ShopfloorWipOrder {
  orderId: string;
  orderNumber: string;
  productionLine: string;
  lineName?: string;
  productName?: string;
  status: string;
  plannedQty?: number;
  producedQty?: number;
  phases?: Array<{ phase: string; startPlanned?: string; endPlanned?: string }>;
}

export interface ShopfloorStreamStatus {
  active: boolean;
  lineId?: string;
  orderId?: string;
  intervalSeconds?: number;
  startedAt?: string;
  lastTickAt?: string;
  tickCount?: number;
}

export const SHOPFLOOR_MODULE_ID = 'planning-shopfloor' as const;

export const SHOPFLOOR_FEATURE_IDS = {
  board: 'shopfloor-addon-board',
  admin: 'admin-system',
} as const;
