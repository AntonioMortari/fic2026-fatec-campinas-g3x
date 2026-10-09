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
      Event: {
        type: 'object',
        required: ['id', 'title', 'startsAt'],
        properties: {
          id: { type: 'string', format: 'uuid' },
          title: { type: 'string', example: 'Cafú e o Café' },
          description: { type: ['string', 'null'] },
          category: { type: ['string', 'null'], example: 'Contação de história' },
          startsAt: { type: 'string', format: 'date-time' },
          endsAt: { type: ['string', 'null'], format: 'date-time' },
          location: { type: ['string', 'null'] },
          ageRange: { type: ['string', 'null'], example: 'Livre' },
          capacity: { type: ['integer', 'null'], minimum: 1 },
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
    '/events': {
      get: {
        tags: ['Events'],
        summary: 'Lista os eventos publicados',
        description: 'Só eventos publicados. "upcoming" vem do mais próximo ao mais distante; "past", do mais recente ao mais antigo.',
        parameters: [
          { name: 'period', in: 'query', schema: { type: 'string', enum: ['upcoming', 'past'], default: 'upcoming' } },
          { name: 'limit', in: 'query', schema: { type: 'integer', minimum: 1, maximum: 100 } },
        ],
        responses: {
          '200': {
            description: 'Lista de eventos',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['data'],
                  properties: { data: { type: 'array', items: { $ref: '#/components/schemas/Event' } } },
                },
              },
            },
          },
          '400': { description: 'Parâmetros inválidos', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
    },
    '/events/{id}/calendar.ics': {
      get: {
        tags: ['Events'],
        summary: 'Baixa o evento como arquivo de calendário (.ics)',
        description: 'Sem horário de término cadastrado, o fim é início + 2 horas.',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        responses: {
          '200': { description: 'Arquivo iCalendar', content: { 'text/calendar': { schema: { type: 'string' } } } },
          '400': { description: 'Identificador inválido', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          '404': { description: 'Evento inexistente ou não publicado', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
    },
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
