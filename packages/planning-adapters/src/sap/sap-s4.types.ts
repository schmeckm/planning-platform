/**
 * Normalized SAP PP shapes (ECC + S/4 OData mapped to one internal model).
 */

export interface SapProductionOrder {
  AUFNR: string;
  MATNR: string;
  CHARG: string;
  MENGE: number;
  GMEIN: string;
  GLTRP: string;
  GSTRS: string;
  FTRMS: string;
  DISPO: string;
  WERKS: string;
  STATU: string;
  PRIOK?: string;
  OPERATIONS: SapOperation[];
}

export interface SapOperation {
  VORNR: string;
  LTXA1: string;
  ARBPL: string;
  VGW01: number;
  VGW02: number;
  VGW03: number;
  ARBEI: number;
}

export interface SapWorkCenter {
  ARBPL: string;
  KTEXT: string;
  WERKS: string;
  KAPAZ?: number;
}

export interface SapMaterial {
  MATNR: string;
  MAKTX: string;
  MEINS: string;
  MHDHB?: number;
  IPRKZ?: string;
}

export interface SapBatch {
  CHARG: string;
  MATNR: string;
  WERKS: string;
  CLABS: number;
  MEINS: string;
  VFDAT: string;
  HSDAT: string;
  STATUS: string;
}

export interface SapInventory {
  MATNR: string;
  WERKS: string;
  LGORT: string;
  CLABS: number;
  MEINS: string;
}

/** OData v2 list wrapper from SAP Gateway */
export interface SapODataList<T> {
  d?: {
    results?: T[];
  };
}

/** Raw row from API_PRODUCTION_ORDER_2_SRV */
export interface SapODataProductionOrderRow {
  ManufacturingOrder?: string;
  Material?: string;
  Batch?: string;
  TotalOrderQuantity?: string | number;
  ProductionUnit?: string;
  MfgOrderPlannedEndDate?: string;
  MfgOrderPlannedStartDate?: string;
  ProductionPlant?: string;
  MRPController?: string;
  ManufacturingOrderType?: string;
  OrderInternalBillOfOperations?: string;
  OrderIsReleased?: boolean;
  OrderIsConfirmed?: boolean;
  OrderIsDelivered?: boolean;
  OrderIsDeleted?: boolean;
  to_ProductionOrderOperation?: {
    results?: SapODataOperationRow[];
  };
}

export interface SapODataOperationRow {
  ManufacturingOrderOperation?: string;
  WorkCenter?: string;
  OperationDescription?: string;
  OpPlannedTotalQuantity?: string | number;
  SetupDuration?: string | number;
  ProcessingDuration?: string | number;
  TeardownDuration?: string | number;
}

export interface SapODataWorkCenterRow {
  WorkCenter?: string;
  WorkCenterDesc?: string;
  Plant?: string;
  WorkCenterCategoryCode?: string;
}

export interface SapODataProductRow {
  Product?: string;
  ProductDescription?: string;
  BaseUnit?: string;
  TotalShelfLife?: string | number;
}

export interface SapODataBatchRow {
  Batch?: string;
  Material?: string;
  Plant?: string;
  BatchIdentifyingPlant?: string;
  ShelfLifeExpirationDate?: string;
  ManufactureDate?: string;
  BatchStatus?: string;
}

export interface SapODataStockRow {
  Material?: string;
  Plant?: string;
  StorageLocation?: string;
  MatlWrhsStkQtyInMatlBaseUnit?: string | number;
  MaterialBaseUnit?: string;
}
