export const openApiDocument = {
  openapi: '3.1.0',
  info: {
    title: 'API do Ateliê Afro Cultural',
    version: '0.1.0',
    description: 'API REST do site e do painel da equipe do Ateliê Afro Cultural.',
  },
  servers: [{ url: '/api' }],
  components: {
    securitySchemes: {
      bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
    },
    schemas: {
      Error: {
        type: 'object',
        required: ['error'],
        properties: {
          error: {
            type: 'object',
            required: ['code', 'message'],
            properties: {
              code: { type: 'string', example: 'invalid_data' },
              message: { type: 'string', example: 'Confira os dados enviados.' },
              details: {},
            },
          },
        },
      },
      Health: {
        type: 'object',
        required: ['status', 'database', 'checkedAt'],
        properties: {
          status: { type: 'string', enum: ['ok', 'degraded'] },
          database: { type: 'string', enum: ['ok', 'unavailable'] },
          checkedAt: { type: 'string', format: 'date-time' },
        },
      },
    },
  },
  paths: {
    '/health': {
      get: {
        tags: ['Health'],
        summary: 'Verifica se a API e o banco estão respondendo',
        responses: {
          '200': {
            description: 'API e banco respondendo',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Health' } } },
          },
          '503': {
            description: 'API de pé, banco fora do ar',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Health' } } },
          },
        },
      },
    },
  },
} as const;
