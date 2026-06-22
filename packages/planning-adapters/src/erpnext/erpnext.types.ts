/** Normalized ERPNext shapes (Frappe REST API mapped internally). */

export interface ErpNextWorkOrder {
  name: string;
  production_item: string;
  qty: number;
  stock_uom: string;
  status: string;
  planned_start_date: string;
  planned_end_date: string;
  batch_size?: number;
  workstation?: string;
  priority?: string;
  company: string;
  operations: ErpNextWorkOrderOperation[];
}

export interface ErpNextWorkOrderOperation {
  operation: string;
  workstation: string;
  time_in_mins: number;
  description?: string;
  idx: number;
}

export interface ErpNextWorkstation {
  name: string;
  workstation_name: string;
  production_capacity?: number;
  hour_rate?: number;
}

export interface ErpNextItem {
  name: string;
  item_name: string;
  stock_uom: string;
  shelf_life_in_days?: number;
  has_batch_no?: number;
}

export interface ErpNextBatch {
  name: string;
  item: string;
  batch_qty: number;
  stock_uom: string;
  expiry_date?: string;
  manufacturing_date?: string;
  batch_id: string;
}

export interface ErpNextBin {
  item_code: string;
  warehouse: string;
  actual_qty: number;
  stock_uom: string;
}

/** Frappe list response */
export interface ErpNextListResponse<T> {
  data?: T[];
}

/** Raw Work Order row from ERPNext API */
export interface ErpNextWorkOrderRow {
  name?: string;
  production_item?: string;
  qty?: number;
  stock_uom?: string;
  status?: string;
  planned_start_date?: string;
  planned_end_date?: string;
  company?: string;
  priority?: string;
}

export interface ErpNextWorkOrderOperationRow {
  operation?: string;
  workstation?: string;
  time_in_mins?: number;
  description?: string;
  idx?: number;
  parent?: string;
}
