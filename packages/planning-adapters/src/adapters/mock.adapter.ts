/**
 * planning-adapters / mock.adapter.ts
 *
 * CSV/Mock adapter – the reference implementation.
 *
 * Generates realistic pharma + CGT planning data for development,
 * testing, and demonstration without any external dependencies.
 */

import {
  asOrderId,
  asResourceId,
  asMaterialId,
  asBatchId,
  asOperationId,
} from '@PCP/planning-core';
import type {
  PlanningOrder,
  PlanningResource,
  PlanningMaterial,
  PlanningBatch,
  InventoryPosition,
  WorkingCalendar,
} from '@PCP/planning-core';
import type {
  IPlanningAdapter,
  AdapterMetadata,
  AdapterHealthResult,
} from '../interfaces/adapter.interface.js';

const now = () => new Date();
const daysFromNow = (days: number) => new Date(Date.now() + days * 86_400_000);

export class MockPharmaAdapter implements IPlanningAdapter {
  readonly metadata: AdapterMetadata = {
    id: 'mock.pharma',
    name: 'Mock Pharma Adapter',
    version: '1.0.0',
    sourceSystem: 'MOCK',
    description: 'Generates realistic pharma manufacturing mock data for development and testing.',
    author: 'Pharma Collective Platform Contributors',
  };

  async testConnection(): Promise<AdapterHealthResult> {
    return { healthy: true, message: 'Mock adapter is always available.', latencyMs: 0 };
  }

  async fetchMaterials(): Promise<PlanningMaterial[]> {
    return [
      {
        id: asMaterialId('MAT-API-001'),
        name: 'Lisinopril API',
        description: 'Active Pharmaceutical Ingredient for Lisinopril 10mg tablets',
        unit: 'KG',
        shelfLifeDays: 730,
        minRemainingShelfLifeDays: 180,
        storageCondition: '2-8°C',
        requiresBatchRelease: true,
        isPatientSpecific: false,
        attributes: { atcCode: 'C09AA03', controlledSubstance: false },
      },
      {
        id: asMaterialId('MAT-FG-001'),
        name: 'Lisinopril 10mg Tablet',
        description: 'Finished Goods – Lisinopril 10mg film-coated tablet',
        unit: 'TAB',
        shelfLifeDays: 1825,
        minRemainingShelfLifeDays: 365,
        storageCondition: 'Room Temperature',
        requiresBatchRelease: true,
        isPatientSpecific: false,
        attributes: { dosageForm: 'Tablet', strength: '10mg', packSize: '30' },
      },
      {
        id: asMaterialId('MAT-CGT-001'),
        name: 'CAR-T Cell Product – Autologous',
        description: 'Patient-specific autologous CAR-T cell therapy product',
        unit: 'DOSE',
        shelfLifeDays: 2,
        minRemainingShelfLifeDays: 1,
        storageCondition: 'Cryogenic (-196°C)',
        requiresBatchRelease: true,
        isPatientSpecific: true,
        attributes: { targetAntigen: 'CD19', vectorType: 'Lentiviral' },
      },
      {
        id: asMaterialId('MAT-BIO-001'),
        name: 'mAb Drug Substance',
        description: 'Monoclonal antibody bulk drug substance',
        unit: 'L',
        shelfLifeDays: 365,
        minRemainingShelfLifeDays: 90,
        storageCondition: '-20°C',
        requiresBatchRelease: true,
        isPatientSpecific: false,
        attributes: { protein: 'IgG1', titer: '5 g/L' },
      },
    ];
  }

  async fetchResources(): Promise<PlanningResource[]> {
    return [
      {
        id: asResourceId('RES-MFG-001'),
        name: 'Granulation Line 1',
        type: 'MACHINE',
        capacity: 500,
        parallelCapacity: 1,
        oee: 0.82,
        qualifiedMaterials: [asMaterialId('MAT-API-001'), asMaterialId('MAT-FG-001')],
        attributes: { building: 'Building-A', cleanroomClass: 'Grade-D', maxBatchSize: '400KG' },
      },
      {
        id: asResourceId('RES-MFG-002'),
        name: 'Granulation Line 2',
        type: 'MACHINE',
        capacity: 500,
        parallelCapacity: 1,
        oee: 0.78,
        qualifiedMaterials: [asMaterialId('MAT-API-001'), asMaterialId('MAT-FG-001')],
        attributes: { building: 'Building-A', cleanroomClass: 'Grade-D', maxBatchSize: '400KG' },
      },
      {
        id: asResourceId('RES-BIO-001'),
        name: 'Bioreactor Suite 1 (2000L)',
        type: 'VESSEL',
        capacity: 2000,
        parallelCapacity: 1,
        oee: 0.90,
        qualifiedMaterials: [asMaterialId('MAT-BIO-001')],
        attributes: { volume: '2000L', temperature: '37°C', agitationType: 'Impeller' },
      },
      {
        id: asResourceId('RES-CGT-001'),
        name: 'CGT Suite A – Cell Processing',
        type: 'CLEANROOM',
        capacity: 4,
        parallelCapacity: 4,
        oee: 0.95,
        qualifiedMaterials: [asMaterialId('MAT-CGT-001')],
        attributes: { cleanroomClass: 'Grade-B', isolatorCount: '4', cryoStorageSlots: '100' },
      },
      {
        id: asResourceId('RES-QC-001'),
        name: 'QC Laboratory',
        type: 'ANALYTICAL_INSTRUMENT',
        capacity: 20,
        parallelCapacity: 10,
        oee: 0.88,
        qualifiedMaterials: [
          asMaterialId('MAT-API-001'),
          asMaterialId('MAT-FG-001'),
          asMaterialId('MAT-BIO-001'),
          asMaterialId('MAT-CGT-001'),
        ],
        attributes: { instruments: 'HPLC,GC,ICP-MS,FACS', shift: '24h' },
      },
    ];
  }

  async fetchBatches(): Promise<PlanningBatch[]> {
    return [
      {
        id: asBatchId('BATCH-API-001'),
        materialId: asMaterialId('MAT-API-001'),
        quantity: 850,
        unit: 'KG',
        status: 'RELEASED',
        manufactureDate: daysFromNow(-60),
        expiryDate: daysFromNow(670),
        releaseDate: daysFromNow(-45),
        availableFrom: daysFromNow(-45),
        locationId: 'WH-COLD-001',
        attributes: { coa: 'COA-API-2024-001', supplier: 'PharmaChem AG' },
      },
      {
        id: asBatchId('BATCH-API-002'),
        materialId: asMaterialId('MAT-API-001'),
        quantity: 200,
        unit: 'KG',
        status: 'QA_HOLD',
        manufactureDate: daysFromNow(-10),
        expiryDate: daysFromNow(720),
        availableFrom: daysFromNow(-10),
        locationId: 'WH-COLD-001',
        attributes: { coa: 'pending', deviationRef: 'DEV-2024-042' },
      },
      {
        id: asBatchId('BATCH-BIO-001'),
        materialId: asMaterialId('MAT-BIO-001'),
        quantity: 180,
        unit: 'L',
        status: 'RELEASED',
        manufactureDate: daysFromNow(-30),
        expiryDate: daysFromNow(335),
        releaseDate: daysFromNow(-15),
        availableFrom: daysFromNow(-15),
        locationId: 'WH-FREEZE-001',
        attributes: { purity: '98.5%', endotoxin: '<0.1 EU/mL' },
      },
      {
        id: asBatchId('BATCH-CGT-PAT001'),
        materialId: asMaterialId('MAT-CGT-001'),
        quantity: 1,
        unit: 'DOSE',
        status: 'RELEASED',
        manufactureDate: now(),
        expiryDate: daysFromNow(2),
        releaseDate: now(),
        availableFrom: now(),
        locationId: 'CRYO-TANK-001',
        patientId: 'PAT-001',
        attributes: { viability: '92%', cd3Percent: '78%' },
      },
      {
        id: asBatchId('BATCH-CGT-PAT002'),
        materialId: asMaterialId('MAT-CGT-001'),
        quantity: 1,
        unit: 'DOSE',
        status: 'QC_HOLD',
        manufactureDate: now(),
        expiryDate: daysFromNow(2),
        availableFrom: now(),
        locationId: 'CRYO-TANK-001',
        patientId: 'PAT-002',
        attributes: { viability: '78%', qcStatus: 'pending-sterility' },
      },
    ];
  }

  async fetchOrders(): Promise<PlanningOrder[]> {
    const base = now();
    return [
      // ─── Pharma Order 1: Feasible ───────────────────────────────────────
      {
        id: asOrderId('ORD-PH-001'),
        externalId: 'SAP-100000001',
        sourceSystem: 'MOCK',
        materialId: asMaterialId('MAT-FG-001'),
        batchId: asBatchId('BATCH-API-001'),
        quantity: 300,
        unit: 'KG',
        priority: 'HIGH',
        status: 'RELEASED',
        earliestStart: daysFromNow(1),
        latestFinish: daysFromNow(14),
        durationMinutes: 480,
        operations: [
          {
            id: asOperationId('OP-PH-001-001'),
            orderId: asOrderId('ORD-PH-001'),
            sequence: 10,
            type: 'SETUP',
            description: 'Granulation line setup',
            resourceId: asResourceId('RES-MFG-001'),
            durationMinutes: 60,
            setupMinutes: 0,
            teardownMinutes: 0,
            minLagMinutes: 0,
          },
          {
            id: asOperationId('OP-PH-001-002'),
            orderId: asOrderId('ORD-PH-001'),
            sequence: 20,
            type: 'RUN',
            description: 'Wet granulation',
            resourceId: asResourceId('RES-MFG-001'),
            durationMinutes: 300,
            setupMinutes: 60,
            teardownMinutes: 30,
            minLagMinutes: 0,
          },
          {
            id: asOperationId('OP-PH-001-003'),
            orderId: asOrderId('ORD-PH-001'),
            sequence: 30,
            type: 'HOLD',
            description: 'Granule drying hold',
            durationMinutes: 120,
            setupMinutes: 0,
            teardownMinutes: 0,
            minLagMinutes: 60,  // 60 min minimum hold after granulation
            maxLagMinutes: 480, // Maximum 8h hold
          },
        ],
        tags: { campaign: 'CAMPAIGN-2024-Q4', productFamily: 'Antihypertensive' },
        schedulingStatus: 'PENDING',
        metadata: {},
        createdAt: base,
        updatedAt: base,
      },
      // ─── Pharma Order 2: Blocked (QA Hold batch) ────────────────────────
      {
        id: asOrderId('ORD-PH-002'),
        externalId: 'SAP-100000002',
        sourceSystem: 'MOCK',
        materialId: asMaterialId('MAT-API-001'),
        batchId: asBatchId('BATCH-API-002'), // QA_HOLD batch → blocked
        quantity: 150,
        unit: 'KG',
        priority: 'NORMAL',
        status: 'RELEASED',
        earliestStart: daysFromNow(2),
        latestFinish: daysFromNow(10),
        durationMinutes: 240,
        operations: [],
        tags: { campaign: 'CAMPAIGN-2024-Q4' },
        schedulingStatus: 'PENDING',
        metadata: {},
        createdAt: base,
        updatedAt: base,
      },
      // ─── Pharma Order 3: No qualified resource ──────────────────────────
      {
        id: asOrderId('ORD-PH-003'),
        externalId: 'SAP-100000003',
        sourceSystem: 'MOCK',
        materialId: asMaterialId('MAT-FG-001'),
        quantity: 50000,  // exceeds all resource capacity
        unit: 'KG',
        priority: 'LOW',
        status: 'RELEASED',
        earliestStart: daysFromNow(3),
        latestFinish: daysFromNow(7),
        durationMinutes: 60, // impossibly fast → capacity violation
        operations: [],
        tags: {},
        schedulingStatus: 'PENDING',
        metadata: {},
        createdAt: base,
        updatedAt: base,
      },
      // ─── CGT Order 1: Feasible (matching patient IDs) ───────────────────
      {
        id: asOrderId('ORD-CGT-001'),
        sourceSystem: 'MOCK',
        materialId: asMaterialId('MAT-CGT-001'),
        batchId: asBatchId('BATCH-CGT-PAT001'),
        patientId: 'PAT-001',
        quantity: 1,
        unit: 'DOSE',
        priority: 'CRITICAL',
        status: 'RELEASED',
        earliestStart: daysFromNow(0),
        latestFinish: daysFromNow(5),
        scheduledFinish: daysFromNow(4),
        durationMinutes: 480,
        operations: [],
        tags: { veinToVeinStart: new Date().toISOString(), productType: 'CAR-T' },
        schedulingStatus: 'PENDING',
        metadata: {
          apheresisDate: daysFromNow(-3).toISOString(),
          maxVeinToVeinDays: 28,
        },
        createdAt: base,
        updatedAt: base,
      },
      // ─── CGT Order 2: Blocked (QC Hold batch) ───────────────────────────
      {
        id: asOrderId('ORD-CGT-002'),
        sourceSystem: 'MOCK',
        materialId: asMaterialId('MAT-CGT-001'),
        batchId: asBatchId('BATCH-CGT-PAT002'),
        patientId: 'PAT-002',
        quantity: 1,
        unit: 'DOSE',
        priority: 'CRITICAL',
        status: 'RELEASED',
        earliestStart: daysFromNow(0),
        latestFinish: daysFromNow(3),
        durationMinutes: 480,
        operations: [],
        tags: { productType: 'CAR-T' },
        schedulingStatus: 'PENDING',
        metadata: {
          apheresisDate: daysFromNow(-5).toISOString(),
          maxVeinToVeinDays: 28,
        },
        createdAt: base,
        updatedAt: base,
      },
    ];
  }

  async fetchInventory(): Promise<InventoryPosition[]> {
    return [
      {
        materialId: asMaterialId('MAT-API-001'),
        locationId: 'WH-COLD-001',
        quantityOnHand: 1050,
        quantityReserved: 300,
        quantityAvailable: 750,
        unit: 'KG',
        lastUpdated: now(),
      },
      {
        materialId: asMaterialId('MAT-FG-001'),
        locationId: 'WH-AMBIENT-001',
        quantityOnHand: 50000,
        quantityReserved: 10000,
        quantityAvailable: 40000,
        unit: 'TAB',
        lastUpdated: now(),
      },
      {
        materialId: asMaterialId('MAT-BIO-001'),
        locationId: 'WH-FREEZE-001',
        quantityOnHand: 180,
        quantityReserved: 50,
        quantityAvailable: 130,
        unit: 'L',
        lastUpdated: now(),
      },
    ];
  }

  async fetchCalendars(): Promise<WorkingCalendar[]> {
    return [
      {
        id: 'CAL-24-7' as never,
        name: '24/7 Production Calendar',
        timezone: 'Europe/Zurich',
        shifts: [
          { dayOfWeek: 0, startTime: '00:00', endTime: '23:59' },
          { dayOfWeek: 1, startTime: '00:00', endTime: '23:59' },
          { dayOfWeek: 2, startTime: '00:00', endTime: '23:59' },
          { dayOfWeek: 3, startTime: '00:00', endTime: '23:59' },
          { dayOfWeek: 4, startTime: '00:00', endTime: '23:59' },
          { dayOfWeek: 5, startTime: '00:00', endTime: '23:59' },
          { dayOfWeek: 6, startTime: '00:00', endTime: '23:59' },
        ],
        exceptions: [],
      },
    ];
  }
}
