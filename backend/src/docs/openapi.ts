/**
 * Documentação da API (RNF-QUA-01), servida em `/api-docs`.
 *
 * Toda rota nova entra aqui no mesmo PR que a cria. Os esquemas de erro são
 * compartilhados: a API responde todo erro no formato de `Erro`.
 */
export const documentoOpenApi = {
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
      Erro: {
        type: 'object',
        required: ['erro'],
        properties: {
          erro: {
            type: 'object',
            required: ['codigo', 'mensagem'],
            properties: {
              codigo: { type: 'string', example: 'dados_invalidos' },
              mensagem: { type: 'string', example: 'Confira os dados enviados.' },
              detalhes: {},
            },
          },
        },
      },
      Saude: {
        type: 'object',
        required: ['status', 'banco', 'verificadoEm'],
        properties: {
          status: { type: 'string', enum: ['ok', 'degradado'] },
          banco: { type: 'string', enum: ['ok', 'indisponivel'] },
          verificadoEm: { type: 'string', format: 'date-time' },
        },
      },
    },
  },
  paths: {
    '/saude': {
      get: {
        tags: ['Saúde'],
        summary: 'Verifica se a API e o banco estão respondendo',
        responses: {
          '200': {
            description: 'API e banco respondendo',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Saude' } } },
          },
          '503': {
            description: 'API de pé, banco fora do ar',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Saude' } } },
          },
        },
      },
    },
  },
} as const;
