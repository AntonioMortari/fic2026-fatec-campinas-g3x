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
      User: {
        type: 'object',
        required: ['id', 'name', 'email', 'personType', 'wantsToVolunteer', 'wantsToDonate', 'isStaff'],
        properties: {
          id: { type: 'string', format: 'uuid' },
          name: { type: 'string' },
          email: { type: 'string', format: 'email' },
          phone: { type: ['string', 'null'], description: 'Só dígitos, com DDD.' },
          personType: { type: 'string', enum: ['individual', 'organization'] },
          wantsToVolunteer: { type: 'boolean' },
          wantsToDonate: { type: 'boolean' },
          isStaff: { type: 'boolean', description: 'Nunca vem do cadastro: só é concedido direto no banco.' },
        },
      },
      AuthResult: {
        type: 'object',
        required: ['token', 'user'],
        properties: {
          token: { type: 'string', description: 'JWT. Vai em `Authorization: Bearer <token>`.' },
          user: { $ref: '#/components/schemas/User' },
        },
      },
      RegisterRequest: {
        type: 'object',
        required: ['name', 'email', 'password', 'personType', 'confirmsAdult', 'consent'],
        properties: {
          name: { type: 'string', maxLength: 120 },
          email: { type: 'string', format: 'email', maxLength: 254 },
          phone: { type: ['string', 'null'], description: 'Opcional. 10 ou 11 dígitos, com DDD.' },
          password: { type: 'string', minLength: 8, description: 'No máximo 72 bytes (limite do bcrypt).' },
          personType: { type: 'string', enum: ['individual', 'organization'] },
          wantsToVolunteer: { type: 'boolean', default: false },
          wantsToDonate: { type: 'boolean', default: false },
          confirmsAdult: { type: 'boolean', enum: [true], description: 'Só maiores de 18 anos criam conta (RN01). Só o valor `true` é aceito.' },
          consent: { type: 'boolean', enum: [true], description: 'Concordância com o uso dos dados. Só o valor `true` é aceito.' },
        },
        description: 'Ao menos um entre `wantsToVolunteer` e `wantsToDonate` precisa ser `true`. Campos desconhecidos são descartados.',
      },
      LoginRequest: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          email: { type: 'string', format: 'email' },
          password: { type: 'string' },
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
    '/auth/register': {
      post: {
        tags: ['Auth'],
        summary: 'Cria uma conta e já devolve a sessão',
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/RegisterRequest' } } } },
        responses: {
          '201': { description: 'Conta criada', content: { 'application/json': { schema: { $ref: '#/components/schemas/AuthResult' } } } },
          '400': { description: 'Dados inválidos. `error.details` lista cada campo.', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          '409': { description: 'Já existe conta com esse e-mail', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
    },
    '/auth/login': {
      post: {
        tags: ['Auth'],
        summary: 'Entra com e-mail e senha',
        description: 'E-mail inexistente e senha errada respondem igual, para não revelar quem tem conta.',
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/LoginRequest' } } } },
        responses: {
          '200': { description: 'Sessão', content: { 'application/json': { schema: { $ref: '#/components/schemas/AuthResult' } } } },
          '400': { description: 'Dados inválidos', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          '401': { description: 'E-mail ou senha não conferem', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
    },
    '/auth/refresh': {
      post: {
        tags: ['Auth'],
        summary: 'Troca o cookie de renovação por um token de acesso novo',
        description:
          'Lê o cookie httpOnly `af_refresh` (path `/api/auth`), que o cadastro e o login gravam. A cada uso o cookie é trocado por outro (rotação). ' +
          'Usar de novo, depois de 10 segundos, um cookie já trocado encerra todas as sessões da conta. Exige o cabeçalho `X-Requested-With`.',
        parameters: [{ name: 'X-Requested-With', in: 'header', required: true, schema: { type: 'string' } }],
        responses: {
          '200': { description: 'Sessão renovada', content: { 'application/json': { schema: { $ref: '#/components/schemas/AuthResult' } } } },
          '401': { description: 'Sem cookie, expirado, já usado ou conta apagada. O cookie é apagado.', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          '403': { description: 'Falta o cabeçalho `X-Requested-With`', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
    },
    '/auth/logout': {
      post: {
        tags: ['Auth'],
        summary: 'Encerra a sessão: revoga o cookie de renovação e o apaga',
        description: 'Sempre 204, tenha ou não sessão. O token de acesso já emitido vale até vencer (1 hora).',
        parameters: [{ name: 'X-Requested-With', in: 'header', required: true, schema: { type: 'string' } }],
        responses: {
          '204': { description: 'Sessão encerrada' },
          '403': { description: 'Falta o cabeçalho `X-Requested-With`', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
    },
    '/auth/me': {
      get: {
        tags: ['Auth'],
        summary: 'Dados da conta de quem está autenticado',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': {
            description: 'A conta',
            content: {
              'application/json': {
                schema: { type: 'object', required: ['user'], properties: { user: { $ref: '#/components/schemas/User' } } },
              },
            },
          },
          '401': { description: 'Sem token, token inválido ou expirado, ou conta que não existe mais', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
    },
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
