import type {
  PsProductionOrderRow,
  PsWorkCenterRow,
  PsMaterialRow,
  PsBatchRow,
  PsInventoryRow,
  PsSetupMatrix,
} from './production-sequencing.types.js';

/** Demo plant for fixture mode. */
export const PS_FIXTURE_PLANT = 'PLANT-01';

/**
 * Sequence-dependent setup matrix (minutes) — validated changeover times between products.
 * Vendor-neutral; maps to canonical operation setup durations.
 */
export const PS_FIXTURE_SETUP_MATRIX: PsSetupMatrix = {
  'API-LISINOPRIL': { 'FG-LISINOPRIL-10MG': 45, 'FG-IBUPROFEN-400MG': 120 },
  'FG-LISINOPRIL-10MG': { 'FG-IBUPROFEN-400MG': 90, 'API-LISINOPRIL': 60 },
  'FG-IBUPROFEN-400MG': { 'FG-LISINOPRIL-10MG': 90 },
};

export const PRODUCTION_SEQUENCING_FIXTURES = {
  plant: PS_FIXTURE_PLANT,
  setupMatrix: PS_FIXTURE_SETUP_MATRIX,
  orders: [
    {
      orderId: 'PS-ORD-100',
      materialId: 'FG-LISINOPRIL-10MG',
      batchId: 'PS-BATCH-FG-001',
      plantId: PS_FIXTURE_PLANT,
      quantity: 120000,
      unit: 'EA',
      status: 'RELEASED',
      priority: 2,
      earliestStart: '2026-06-25',
      latestFinish: '2026-07-05',
      peggedSupplyOrderId: 'PS-ORD-090',
      sequenceGroup: 'SEQ-Q3-A',
      previousMaterialId: 'API-LISINOPRIL',
      operations: [
        {
          sequence: 10,
          workCenterId: 'WC-BLEND-01',
          description: 'Dry blending',
          setupMinutes: 30,
          runMinutes: 180,
          teardownMinutes: 15,
          minLagMinutes: 0,
        },
        {
          sequence: 20,
          workCenterId: 'WC-TABLET-01',
          description: 'Compression',
          setupMinutes: 20,
          runMinutes: 360,
          teardownMinutes: 20,
          minLagMinutes: 60,
          maxLagMinutes: 480,
        },
        {
          sequence: 30,
          workCenterId: 'WC-COAT-01',
          description: 'Film coating',
          setupMinutes: 25,
          runMinutes: 240,
          teardownMinutes: 15,
          minLagMinutes: 30,
        },
      ],
    },
    {
      orderId: 'PS-ORD-090',
      materialId: 'API-LISINOPRIL',
      batchId: 'PS-BATCH-API-001',
      plantId: PS_FIXTURE_PLANT,
      quantity: 850,
      unit: 'KG',
      status: 'RELEASED',
      priority: 1,
      earliestStart: '2026-06-20',
      latestFinish: '2026-06-28',
      sequenceGroup: 'SEQ-Q3-API',
      operations: [
        {
          sequence: 10,
          workCenterId: 'WC-REACT-01',
          description: 'API synthesis',
          setupMinutes: 45,
          runMinutes: 720,
          teardownMinutes: 30,
          minLagMinutes: 0,
        },
      ],
    },
    {
      orderId: 'PS-ORD-110',
      materialId: 'FG-IBUPROFEN-400MG',
      batchId: 'PS-BATCH-FG-002',
      plantId: PS_FIXTURE_PLANT,
      quantity: 80000,
      unit: 'EA',
      status: 'RELEASED',
      priority: 3,
      earliestStart: '2026-06-26',
      latestFinish: '2026-07-08',
      sequenceGroup: 'SEQ-Q3-B',
      previousMaterialId: 'FG-LISINOPRIL-10MG',
      operations: [
        {
          sequence: 10,
          workCenterId: 'WC-BLEND-01',
          description: 'Granulation',
          setupMinutes: 40,
          runMinutes: 200,
          teardownMinutes: 20,
          minLagMinutes: 0,
        },
        {
          sequence: 20,
          workCenterId: 'WC-TABLET-01',
          description: 'Compression',
          setupMinutes: 25,
          runMinutes: 300,
          teardownMinutes: 20,
          minLagMinutes: 45,
        },
      ],
    },
  ] satisfies PsProductionOrderRow[],
  workCenters: [
    { workCenterId: 'WC-REACT-01', name: 'API Reactor 1', plantId: PS_FIXTURE_PLANT, capacityPerHour: 120, parallelCapacity: 1 },
    { workCenterId: 'WC-BLEND-01', name: 'Blending Line 1', plantId: PS_FIXTURE_PLANT, capacityPerHour: 500, parallelCapacity: 1 },
    { workCenterId: 'WC-TABLET-01', name: 'Tablet Press 1', plantId: PS_FIXTURE_PLANT, capacityPerHour: 400000, parallelCapacity: 1 },
    { workCenterId: 'WC-COAT-01', name: 'Coating Line 1', plantId: PS_FIXTURE_PLANT, capacityPerHour: 350000, parallelCapacity: 1 },
  ] satisfies PsWorkCenterRow[],
  materials: [
    { materialId: 'API-LISINOPRIL', name: 'Lisinopril API', unit: 'KG', shelfLifeDays: 730 },
    { materialId: 'FG-LISINOPRIL-10MG', name: 'Lisinopril 10mg Tablets', unit: 'EA', shelfLifeDays: 1825 },
    { materialId: 'FG-IBUPROFEN-400MG', name: 'Ibuprofen 400mg Tablets', unit: 'EA', shelfLifeDays: 1095 },
  ] satisfies PsMaterialRow[],
  batches: [
    {
      batchId: 'PS-BATCH-API-001',
      materialId: 'API-LISINOPRIL',
      quantity: 900,
      unit: 'KG',
      status: 'RELEASED',
      manufactureDate: '2026-05-01',
      expiryDate: '2028-05-01',
    },
    {
      batchId: 'PS-BATCH-FG-001',
      materialId: 'FG-LISINOPRIL-10MG',
      quantity: 150000,
      unit: 'EA',
      status: 'RELEASED',
      manufactureDate: '2026-06-01',
      expiryDate: '2031-06-01',
    },
    {
      batchId: 'PS-BATCH-FG-002',
      materialId: 'FG-IBUPROFEN-400MG',
      quantity: 95000,
      unit: 'EA',
      status: 'RELEASED',
      manufactureDate: '2026-06-05',
      expiryDate: '2029-06-05',
    },
  ] satisfies PsBatchRow[],
  inventory: [
    { materialId: 'API-LISINOPRIL', locationId: 'WH-RM-01', quantityAvailable: 900, unit: 'KG' },
    { materialId: 'FG-LISINOPRIL-10MG', locationId: 'WH-FG-01', quantityAvailable: 140000, unit: 'EA' },
    { materialId: 'FG-IBUPROFEN-400MG', locationId: 'WH-FG-01', quantityAvailable: 90000, unit: 'EA' },
  ] satisfies PsInventoryRow[],
};
