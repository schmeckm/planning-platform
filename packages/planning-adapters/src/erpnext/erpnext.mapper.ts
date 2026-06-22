import type { ErpNextWorkOrder, ErpNextWorkOrderOperationRow, ErpNextWorkOrderRow } from './erpnext.types.js';

export const ERPNEXT_WO_STATUS_MAP: Record<string, string> = {
  Draft: 'CRTD',
  'Not Started': 'REL',
  'In Process': 'PCNF',
  Completed: 'CNF',
  Stopped: 'DLFL',
  Cancelled: 'DLFL',
};

export function mapErpNextWorkOrderRow(
  row: ErpNextWorkOrderRow,
  operations: ErpNextWorkOrderOperationRow[] = [],
): ErpNextWorkOrder {
  return {
    name: row.name ?? '',
    production_item: row.production_item ?? '',
    qty: row.qty ?? 0,
    stock_uom: row.stock_uom ?? 'Nos',
    status: row.status ?? 'Draft',
    planned_start_date: row.planned_start_date ?? '',
    planned_end_date: row.planned_end_date ?? '',
    company: row.company ?? '',
    ...(row.priority ? { priority: row.priority } : {}),
    operations: operations.map(op => ({
      operation: op.operation ?? 'Operation',
      workstation: op.workstation ?? '',
      time_in_mins: op.time_in_mins ?? 60,
      idx: op.idx ?? 10,
      ...(op.description ? { description: op.description } : {}),
    })),
  };
}
