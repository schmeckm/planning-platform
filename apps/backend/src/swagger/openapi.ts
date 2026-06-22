/**
 * apps/backend – OpenAPI specification
 *
 * Full Swagger/OpenAPI 3.0 spec for the Pharma Collective Platform REST API.
 */

export const openApiSpec = {
  openapi: '3.0.0',
  info: {
    title: 'Pharma Collective Platform API',
    version: '0.1.0',
    description:
      'REST API for the Pharma Collective Platform – a modular, extensible scheduling kernel for manufacturing.',
    contact: {
      name: 'Pharma Collective Platform',
      url: 'https://github.com/schmeckm/planningplatform',
    },
    license: { name: 'Apache-2.0' },
  },
  servers: [
    { url: 'http://localhost:3100/api/v1', description: 'Local development' },
  ],
  tags: [
    { name: 'Health', description: 'System health checks' },
    { name: 'Orders', description: 'Planning order management' },
    { name: 'Resources', description: 'Resource management' },
    { name: 'Batches', description: 'Batch management' },
    { name: 'Materials', description: 'Material management' },
    { name: 'Simulation', description: 'Constraint evaluation and scheduling simulation' },
    { name: 'Constraints', description: 'Constraint plugin registry' },
    { name: 'Adapters', description: 'Data adapter management' },
  ],
  paths: {
    '/health': {
      get: {
        tags: ['Health'],
        summary: 'Health check',
        operationId: 'getHealth',
        responses: {
          200: {
            description: 'System is healthy',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/HealthResponse' },
              },
            },
          },
        },
      },
    },
    '/orders': {
      get: {
        tags: ['Orders'],
        summary: 'List all planning orders',
        operationId: 'listOrders',
        parameters: [
          { name: 'status', in: 'query', schema: { type: 'string' } },
          { name: 'schedulingStatus', in: 'query', schema: { type: 'string' } },
          { name: 'materialId', in: 'query', schema: { type: 'string' } },
        ],
        responses: {
          200: {
            description: 'List of orders',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/OrderList' } } },
          },
        },
      },
      post: {
        tags: ['Orders'],
        summary: 'Create a planning order',
        operationId: 'createOrder',
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/CreateOrderRequest' } } },
        },
        responses: {
          201: { description: 'Order created' },
          400: { description: 'Validation error' },
        },
      },
    },
    '/orders/{id}': {
      get: {
        tags: ['Orders'],
        summary: 'Get a planning order by ID',
        operationId: 'getOrder',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          200: { description: 'Order found' },
          404: { description: 'Order not found' },
        },
      },
    },
    '/resources': {
      get: {
        tags: ['Resources'],
        summary: 'List all planning resources',
        operationId: 'listResources',
        responses: {
          200: { description: 'List of resources' },
        },
      },
    },
    '/batches': {
      get: {
        tags: ['Batches'],
        summary: 'List all planning batches',
        operationId: 'listBatches',
        responses: {
          200: { description: 'List of batches' },
        },
      },
    },
    '/materials': {
      get: {
        tags: ['Materials'],
        summary: 'List all materials',
        operationId: 'listMaterials',
        responses: {
          200: { description: 'List of materials' },
        },
      },
    },
    '/simulations': {
      get: {
        tags: ['Simulation'],
        summary: 'List all simulation runs',
        operationId: 'listSimulations',
        responses: {
          200: { description: 'List of simulation runs' },
        },
      },
      post: {
        tags: ['Simulation'],
        summary: 'Run a constraint evaluation simulation',
        operationId: 'runSimulation',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/RunSimulationRequest' },
            },
          },
        },
        responses: {
          200: {
            description: 'Simulation completed',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/SimulationResponse' } },
            },
          },
        },
      },
    },
    '/simulations/{id}': {
      get: {
        tags: ['Simulation'],
        summary: 'Get simulation run by ID',
        operationId: 'getSimulation',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          200: { description: 'Simulation run found' },
          404: { description: 'Simulation run not found' },
        },
      },
    },
    '/constraints': {
      get: {
        tags: ['Constraints'],
        summary: 'List all registered constraint plugins',
        operationId: 'listConstraints',
        responses: {
          200: { description: 'List of constraint plugin metadata' },
        },
      },
    },
    '/constraints/self-test': {
      post: {
        tags: ['Constraints'],
        summary: 'Run self-tests for all registered constraint plugins',
        operationId: 'runConstraintSelfTests',
        responses: {
          200: { description: 'Self-test results for all plugins' },
        },
      },
    },
    '/adapters/load': {
      post: {
        tags: ['Adapters'],
        summary: 'Load planning data from an adapter into the simulation context',
        operationId: 'loadAdapterData',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/LoadAdapterRequest' },
            },
          },
        },
        responses: {
          200: { description: 'Data loaded from adapter' },
          400: { description: 'Unknown adapter ID' },
        },
      },
    },
  },
  components: {
    schemas: {
      HealthResponse: {
        type: 'object',
        properties: {
          status: { type: 'string', example: 'ok' },
          version: { type: 'string', example: '0.1.0' },
          uptime: { type: 'number' },
          registeredConstraints: { type: 'number' },
        },
      },
      OrderList: {
        type: 'object',
        properties: {
          data: { type: 'array', items: { type: 'object' } },
          total: { type: 'number' },
        },
      },
      CreateOrderRequest: {
        type: 'object',
        required: ['materialId', 'quantity', 'unit', 'earliestStart', 'latestFinish'],
        properties: {
          materialId: { type: 'string' },
          quantity: { type: 'number' },
          unit: { type: 'string' },
          priority: { type: 'string', enum: ['CRITICAL', 'HIGH', 'NORMAL', 'LOW'] },
          earliestStart: { type: 'string', format: 'date-time' },
          latestFinish: { type: 'string', format: 'date-time' },
          patientId: { type: 'string' },
          tags: { type: 'object' },
        },
      },
      RunSimulationRequest: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          orderIds: {
            type: 'array',
            items: { type: 'string' },
            description: 'Order IDs to evaluate. Empty = all loaded orders.',
          },
          constraintIds: {
            type: 'array',
            items: { type: 'string' },
            description: 'Constraint IDs to evaluate. Empty = all registered.',
          },
        },
      },
      SimulationResponse: {
        type: 'object',
        properties: {
          simRunId: { type: 'string' },
          startedAt: { type: 'string', format: 'date-time' },
          finishedAt: { type: 'string', format: 'date-time' },
          durationMs: { type: 'number' },
          summary: { type: 'object' },
          results: { type: 'array', items: { type: 'object' } },
        },
      },
      LoadAdapterRequest: {
        type: 'object',
        required: ['adapterId'],
        properties: {
          adapterId: {
            type: 'string',
            enum: ['mock.pharma', 'sap.s4hana'],
            example: 'mock.pharma',
          },
        },
      },
    },
  },
};
