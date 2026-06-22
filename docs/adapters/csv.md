# CSV / Excel Adapter

The CSV adapter is the quickest way to get started with PCP locally. It reads canonical planning data from CSV files — no ERP connection required.

## Installation

The CSV adapter is included by default in the development setup:

```bash
pnpm --filter @PCP/backend db:seed  # loads the built-in pharma mock data
```

Or point it at your own CSV files:

```typescript
import { CsvAdapter } from '@PCP/adapter-csv'

const adapter = new CsvAdapter({
  ordersFile: './my-data/orders.csv',
  resourcesFile: './my-data/resources.csv',
  calendarsFile: './my-data/calendars.csv',
  inventoryFile: './my-data/inventory.csv',
})
```

## CSV Formats

### orders.csv

```csv
id,externalId,materialId,quantity,unit,earliestStart,latestEnd,priority,status,batchId
ORD-001,4711,MAT-DRUG-A,200,KG,2026-07-01T06:00:00Z,2026-07-05T18:00:00Z,1,RELEASED,BATCH-001
ORD-002,4712,MAT-DRUG-B,150,KG,2026-07-02T06:00:00Z,2026-07-06T18:00:00Z,2,RELEASED,
```

### resources.csv

```csv
id,name,type,capacity
R-01,Reactor 1,MACHINE,1
R-02,Reactor 2,MACHINE,1
ROOM-A,Filling Room A,ROOM,2
```

### calendars.csv

```csv
resourceId,dayOfWeek,startTime,endTime,timezone
R-01,1,06:00,14:00,Europe/Berlin
R-01,1,14:00,22:00,Europe/Berlin
R-01,2,06:00,14:00,Europe/Berlin
```

`dayOfWeek`: 0 = Sunday, 1 = Monday, ... 6 = Saturday.

### inventory.csv

```csv
materialId,locationId,quantity,unit,restrictedQuantity
MAT-DRUG-A,WAREHOUSE-01,500,KG,0
MAT-EXCIPIENT-B,WAREHOUSE-01,1200,KG,200
```

## Using the Excel Adapter

For `.xlsx` files, use the Excel variant (requires `xlsx` peer dependency):

```typescript
import { ExcelAdapter } from '@PCP/adapter-csv'

const adapter = new ExcelAdapter({
  file: './planning-data.xlsx',
  sheets: {
    orders: 'Orders',
    resources: 'Work Centers',
    calendars: 'Shift Calendar',
    inventory: 'Inventory',
  }
})
```

Column names in the Excel sheet must match the CSV column names above (case-insensitive).
