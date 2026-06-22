/**

 * apps/backend – Express server entry point

 *

 * Pharma Collective Platform REST API

 * Port: 3100 (configurable via PORT env)

 */



import express from 'express';

import cors from 'cors';

import swaggerUi from 'swagger-ui-express';



import { openApiSpec } from './swagger/openapi.js';

import { errorHandler } from './middleware/error-handler.js';

import { requireAuth } from './middleware/auth.js';

import { healthRouter } from './routes/health.routes.js';

import { ordersRouter } from './routes/orders.routes.js';

import { resourcesRouter } from './routes/resources.routes.js';

import { batchesRouter } from './routes/batches.routes.js';

import { materialsRouter } from './routes/materials.routes.js';

import { simulationRouter } from './routes/simulation.routes.js';

import { constraintsRouter } from './routes/constraints.routes.js';

import { adaptersRouter } from './routes/adapters.routes.js';

import { shopfloorRouter } from './routes/shopfloor.routes.js';

import { mountLegacyHaeProxy } from './routes/legacy-proxy.routes.js';



const app = express();

const PORT = parseInt(process.env['PORT'] ?? '3100', 10);



app.use(cors());

app.use(express.json());



app.use('/docs', swaggerUi.serve, swaggerUi.setup(openApiSpec));



const pcpApi = express.Router();

pcpApi.use('/health', healthRouter);

pcpApi.use(requireAuth);

pcpApi.use('/orders', ordersRouter);

pcpApi.use('/resources', resourcesRouter);

pcpApi.use('/batches', batchesRouter);

pcpApi.use('/materials', materialsRouter);

pcpApi.use('/simulations', simulationRouter);

pcpApi.use('/constraints', constraintsRouter);

pcpApi.use('/adapters', adaptersRouter);

pcpApi.use('/shopfloor', shopfloorRouter);



app.use('/api/pcp/v1', pcpApi);



mountLegacyHaeProxy(app);



app.use(errorHandler);



app.listen(PORT, () => {

  console.info(`\n🚀 Pharma Collective Platform API`);

  console.info(`   PCP API:  http://localhost:${PORT}/api/pcp/v1/health`);

  console.info(`   HAE proxy: /api/v1–v5 → ${process.env['HAE_API_URL'] ?? 'http://127.0.0.1:8000'}`);

  console.info(`   Shopfloor: http://localhost:${PORT}/api/pcp/v1/shopfloor/module`);

  console.info(`   Swagger:  http://localhost:${PORT}/docs\n`);

});


