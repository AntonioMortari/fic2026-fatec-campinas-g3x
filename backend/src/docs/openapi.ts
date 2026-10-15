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
          spotsLeft: {
            type: ['integer', 'null'],
            minimum: 0,
            description: 'Vagas que restam; null quando não há limite ou quando a contagem falhou (aí `registrationStatus` é `unknown`).',
          },
          registrationOnSite: { type: 'boolean', description: 'Falso: evento sem inscrição pelo site.' },
          registrationStatus: {
            type: 'string',
            enum: ['open', 'few_left', 'full', 'not_on_site', 'started', 'unknown'],
            description:
              'Calculado no servidor, na ordem do desenho 13c, vale a primeira que bater: `started` (agora ≥ início), `not_on_site`, `unknown` (a contagem falhou e há limite de vagas: nunca vira zero nem "aberta"), `full`, `few_left` (restam 3 ou menos) e `open`.',
          },
          image: {
            oneOf: [{ type: 'null' }, { type: 'object', required: ['url', 'alt'], properties: { url: { type: 'string', example: '/api/events/{id}/image?v=1760270400123' }, alt: { type: 'string' } } }],
            description: 'A foto do evento, ou null. O `?v=` é a versão: muda quando a foto é trocada, para furar o cache. Os bytes nunca vêm na lista.',
          },
        },
      },
      EventDetail: {
        allOf: [
          { $ref: '#/components/schemas/Event' },
          {
            type: 'object',
            required: ['requiresCpf', 'registrationsOpen'],
            properties: {
              requiresCpf: { type: 'boolean', description: 'Se a inscrição pede o CPF (RN06).' },
              registrationsOpen: { type: 'boolean', description: 'Falso quando o evento já começou, não tem inscrição pelo site ou as vagas acabaram.' },
            },
          },
        ],
      },
      RegistrationRequest: {
        type: 'object',
        required: ['name', 'email', 'consent'],
        description: 'O que vem do corpo além disso é descartado, inclusive `userId`: a conta vem do token, nunca do corpo.',
        properties: {
          name: { type: 'string', maxLength: 120, description: 'De quem vai participar.' },
          email: { type: 'string', format: 'email' },
          phone: { type: ['string', 'null'], description: 'Opcional, com DDD.' },
          cpf: { type: ['string', 'null'], description: 'Só é lido quando o evento pede (`requiresCpf`). Onze dígitos iguais são recusados.' },
          isMinor: { type: 'boolean', default: false },
          guardianName: { type: ['string', 'null'], description: 'Obrigatório se `isMinor`; descartado se não.' },
          guardianPhone: { type: ['string', 'null'], description: 'Obrigatório se `isMinor`, com DDD; descartado se não.' },
          imageAuthorized: { type: 'boolean', default: false, description: 'Opcional: dá para participar sem autorizar (RN07).' },
          consent: { type: 'boolean', enum: [true], description: 'Obrigatório: concordância com o uso dos dados.' },
        },
      },
      AdminEvent: {
        allOf: [
          { $ref: '#/components/schemas/Event' },
          {
            type: 'object',
            required: ['published', 'requiresCpf'],
            properties: {
              published: { type: 'boolean', description: 'Só muda por PATCH /admin/events/{id}/publication.' },
              registrationCount: { type: 'integer', minimum: 0, description: 'Quantas pessoas se inscreveram.' },
              requiresCpf: { type: 'boolean', description: 'Se a inscrição pede CPF (RN06).' },
              updatedAt: { type: 'string', format: 'date-time' },
            },
          },
        ],
      },
      EventInput: {
        type: 'object',
        required: ['title', 'startsAt'],
        description: 'Não há campo `published`: salvar nunca publica. Campos de texto em branco viram null.',
        properties: {
          title: { type: 'string', maxLength: 200 },
          description: { type: ['string', 'null'], maxLength: 5000 },
          category: { type: ['string', 'null'], maxLength: 80 },
          startsAt: { type: 'string', example: '2026-11-20T15:00', description: 'Horário de parede de São Paulo, sem fuso: AAAA-MM-DDTHH:mm.' },
          endsAt: { type: ['string', 'null'], example: '2026-11-20T17:00', description: 'Mesmo formato; precisa ser depois do início.' },
          location: { type: ['string', 'null'], maxLength: 200 },
          ageRange: { type: ['string', 'null'], maxLength: 80 },
          capacity: { type: ['integer', 'null'], minimum: 1, description: 'Em branco = sem limite.' },
          requiresCpf: { type: 'boolean', default: false },
          registrationOnSite: { type: 'boolean', default: true, description: 'Falso: o servidor grava `capacity` null e `requiresCpf` false, porque não fazem sentido sem inscrição pelo site.' },
        },
      },
      EventImageInput: {
        type: 'object',
        required: ['data', 'alt', 'authorized'],
        description: 'Troca a foto: a declaração e a descrição valem de novo a cada envio. O tipo vem dos primeiros bytes do arquivo, nunca do que o cliente diz.',
        properties: {
          data: { type: 'string', format: 'byte', description: 'O arquivo em base64. JPG, PNG, GIF ou WebP, até 4 MB depois de decodificado.' },
          alt: { type: 'string', minLength: 1, maxLength: 300, description: 'Descrição da foto, obrigatória.' },
          authorized: { type: 'boolean', enum: [true], description: 'Declaração de que existe autorização de uso de imagem (RN07). Gravada como data, nunca como booleano.' },
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
      VolunteerArea: {
        type: 'object',
        required: ['id', 'name', 'description'],
        properties: {
          id: { type: 'string', example: 'apoio-pedagogico', description: 'Identificador estável, usado nas candidaturas.' },
          name: { type: 'string', example: 'Apoio pedagógico e oficinas' },
          description: { type: 'string' },
        },
      },
      VolunteerApplicationRequest: {
        type: 'object',
        required: ['areas'],
        description: 'A conta vem do token, nunca do corpo: `userId`, `status` e qualquer outro campo são descartados.',
        properties: {
          areas: { type: 'array', minItems: 1, items: { type: 'string' }, description: 'Ao menos uma área. Repetidas são reduzidas a uma; uma que não existe é recusada.' },
          message: { type: ['string', 'null'], maxLength: 2000, description: 'Opcional: dias e horários, o que já fez, o que quer aprender.' },
        },
      },
      MyVolunteerApplication: {
        type: 'object',
        required: ['id', 'status', 'createdAt', 'areas'],
        properties: {
          id: { type: 'string', format: 'uuid' },
          status: { type: 'string', enum: ['new', 'in_contact', 'volunteering', 'ended'] },
          message: { type: ['string', 'null'] },
          createdAt: { type: 'string', format: 'date-time' },
          areas: { type: 'array', items: { type: 'object', properties: { id: { type: 'string' }, name: { type: 'string' } } } },
        },
      },
      AdminVolunteerApplication: {
        allOf: [
          { $ref: '#/components/schemas/MyVolunteerApplication' },
          {
            type: 'object',
            required: ['name', 'email'],
            properties: {
              name: { type: 'string', description: 'Do perfil da conta.' },
              email: { type: 'string', format: 'email' },
              phone: { type: ['string', 'null'], description: 'Só dígitos, com DDD.' },
              updatedAt: { type: 'string', format: 'date-time' },
            },
          },
        ],
      },
      VolunteerStatusCounts: {
        type: 'object',
        required: ['all', 'new', 'in_contact', 'volunteering', 'ended'],
        properties: {
          all: { type: 'integer', minimum: 0 },
          new: { type: 'integer', minimum: 0 },
          in_contact: { type: 'integer', minimum: 0 },
          volunteering: { type: 'integer', minimum: 0 },
          ended: { type: 'integer', minimum: 0 },
        },
      },
      AdminContact: {
        type: 'object',
        description: 'Nunca traz o hash de origem nem a data de consentimento.',
        properties: {
          id: { type: 'string', format: 'uuid' },
          status: { type: 'string', enum: ['new', 'in_contact', 'done'] },
          name: { type: 'string' },
          email: { type: 'string' },
          phone: { type: ['string', 'null'], description: 'Só os dígitos.' },
          institution: { type: ['string', 'null'] },
          message: { type: 'string' },
          staffNote: { type: ['string', 'null'], description: 'Nota interna: só a equipe vê.' },
          createdAt: { type: 'string', format: 'date-time' },
        },
      },
      ContactCounts: {
        type: 'object',
        required: ['all', 'new', 'in_contact', 'done'],
        properties: {
          all: { type: 'integer', minimum: 0 },
          new: { type: 'integer', minimum: 0 },
          in_contact: { type: 'integer', minimum: 0 },
          done: { type: 'integer', minimum: 0 },
        },
      },
      ContactTriageRequest: {
        type: 'object',
        description: 'Ao menos um dos dois. Qualquer outro campo é descartado: nome, e-mail, telefone e mensagem não mudam por aqui.',
        properties: {
          status: { type: 'string', enum: ['new', 'in_contact', 'done'] },
          staffNote: { type: ['string', 'null'], maxLength: 2000, description: 'Texto vazio ou null apaga a nota.' },
        },
      },
      ContactRequest: {
        type: 'object',
        required: ['name', 'email', 'message', 'consent'],
        description: 'O que vem do corpo além disso é descartado.',
        properties: {
          name: { type: 'string', maxLength: 120 },
          email: { type: 'string', format: 'email', maxLength: 254, description: 'É por ele que a equipe responde. Guardado em minúsculas.' },
          phone: { type: ['string', 'null'], description: 'Opcional, com DDD. Só os dígitos são guardados.' },
          institution: { type: ['string', 'null'], maxLength: 160, description: 'Opcional: escola, empresa, coletivo, veículo de imprensa.' },
          message: { type: 'string', maxLength: 5000 },
          consent: { type: 'boolean', enum: [true], description: 'Obrigatório: concordância com o uso dos dados para responder a mensagem. Guardada como data.' },
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
    '/admin/events': {
      get: {
        tags: ['Admin'],
        summary: 'Lista todos os eventos, rascunhos incluídos (equipe)',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': {
            description: 'Do mais recente ao mais antigo',
            content: { 'application/json': { schema: { type: 'object', properties: { data: { type: 'array', items: { $ref: '#/components/schemas/AdminEvent' } } } } } },
          },
          '401': { description: 'Sem sessão', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          '403': { description: 'Conta que não é da equipe (lido do banco a cada requisição)', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
      post: {
        tags: ['Admin'],
        summary: 'Cadastra um evento como rascunho (equipe)',
        security: [{ bearerAuth: [] }],
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/EventInput' } } } },
        responses: {
          '201': { description: 'Rascunho criado', content: { 'application/json': { schema: { type: 'object', properties: { event: { $ref: '#/components/schemas/AdminEvent' } } } } } },
          '400': { description: 'Dados inválidos. `error.details` lista cada campo.', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          '403': { description: 'Não é da equipe', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
    },
    '/admin/events/{id}': {
      parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
      get: {
        tags: ['Admin'],
        summary: 'Um evento, publicado ou não (equipe)',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': { description: 'O evento', content: { 'application/json': { schema: { type: 'object', properties: { event: { $ref: '#/components/schemas/AdminEvent' } } } } } },
          '404': { description: 'Não existe', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
      put: {
        tags: ['Admin'],
        summary: 'Corrige um evento sem mudar se está publicado (equipe)',
        description: 'Não existe DELETE: apagar um evento levaria junto a lista de inscritos (RF13).',
        security: [{ bearerAuth: [] }],
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/EventInput' } } } },
        responses: {
          '200': { description: 'O evento corrigido', content: { 'application/json': { schema: { type: 'object', properties: { event: { $ref: '#/components/schemas/AdminEvent' } } } } } },
          '400': { description: 'Dados inválidos', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          '404': { description: 'Não existe', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
    },
    '/admin/events/{id}/image': {
      parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
      get: {
        tags: ['Admin'],
        summary: 'A foto do evento, mesmo de um rascunho (equipe)',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': { description: 'Os bytes, com o tipo gravado', content: { 'image/*': { schema: { type: 'string', format: 'binary' } } } },
          '404': { description: 'Evento inexistente ou sem foto', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
      put: {
        tags: ['Admin'],
        summary: 'Sobe ou troca a foto do evento (equipe, RN07)',
        description:
          'Corpo JSON com a foto em base64 (limite de 6 MB só nesta rota; o resto da API segue com 100 KB). Sem `authorized: true` a foto não sobe. O tipo é lido pela assinatura dos bytes. Salvar o evento nunca mexe na foto.',
        security: [{ bearerAuth: [] }],
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/EventImageInput' } } } },
        responses: {
          '200': { description: 'O evento, com `image`', content: { 'application/json': { schema: { type: 'object', properties: { event: { $ref: '#/components/schemas/AdminEvent' } } } } } },
          '400': { description: 'Sem declaração, sem descrição, base64 inválido, ou `invalid_image` (não é JPG, PNG, GIF nem WebP)', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          '404': { description: 'Não existe', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          '413': { description: '`image_too_large` (acima de 4 MB) ou `payload_too_large` (corpo acima de 6 MB)', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
      delete: {
        tags: ['Admin'],
        summary: 'Remove a foto do evento (equipe)',
        description: 'Zera as cinco colunas da foto. Existe para a foto subida por engano poder sair (RN07). O evento não é apagado.',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': { description: 'O evento, com `image: null`', content: { 'application/json': { schema: { type: 'object', properties: { event: { $ref: '#/components/schemas/AdminEvent' } } } } } },
          '404': { description: 'Não existe', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
    },
    '/admin/events/{id}/registrations': {
      get: {
        tags: ['Admin'],
        summary: 'Quem se inscreveu num evento, com contato, CPF e responsável (equipe)',
        description: 'Dado pessoal: só a equipe lê, e a resposta não é guardada em cache. Ordem de chegada. Só leitura: não há como corrigir nem apagar uma inscrição por aqui.',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        security: [{ bearerAuth: [] }],
        responses: {
          '200': {
            description: 'O evento e suas inscrições',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    event: { $ref: '#/components/schemas/AdminEvent' },
                    data: {
                      type: 'array',
                      items: {
                        type: 'object',
                        properties: {
                          id: { type: 'string', format: 'uuid' },
                          name: { type: 'string' },
                          email: { type: 'string' },
                          phone: { type: 'string', nullable: true, description: 'Só dígitos.' },
                          cpf: { type: 'string', nullable: true, description: 'Só dígitos; só existe quando o evento exige CPF.' },
                          isMinor: { type: 'boolean' },
                          guardianName: { type: 'string', nullable: true },
                          guardianPhone: { type: 'string', nullable: true },
                          imageAuthorized: { type: 'boolean', description: 'RN07: se a pessoa autorizou o uso da imagem.' },
                          hasAccount: { type: 'boolean' },
                          attended: { type: 'boolean', nullable: true, description: 'RF17: true veio, false não veio, null ninguém conferiu.' },
                          createdAt: { type: 'string', format: 'date-time' },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
          '401': { description: 'Sem sessão', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          '403': { description: 'Não é da equipe', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          '404': { description: 'Evento inexistente', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
    },
    '/admin/events/{id}/registrations.csv': {
      get: {
        tags: ['Admin'],
        summary: 'Planilha dos inscritos (equipe)',
        description:
          'CSV com `;` e BOM UTF-8, para abrir direto no Excel em português. Células que começariam com `=`, `+`, `-` ou `@` levam um apóstrofo na frente: sem isso viram fórmula. ' +
          'A coluna "Autorizou imagem" vem antes das de contato; "Presença" é Veio, Faltou ou Não conferido.',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        security: [{ bearerAuth: [] }],
        responses: {
          '200': { description: 'Arquivo CSV', content: { 'text/csv': { schema: { type: 'string' } } } },
          '401': { description: 'Sem sessão', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          '403': { description: 'Não é da equipe', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          '404': { description: 'Evento inexistente', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
    },
    '/admin/events/{id}/attendance': {
      get: {
        tags: ['Admin'],
        summary: 'Lista de presença: só nome, menor de idade e a marca (equipe, RF17)',
        description: 'Em ordem alfabética, sem e-mail, telefone nem CPF (o telefone do responsável de um menor vem mascarado, como `(11) 9····-1234`): é a tela que fica virada para uma fila. Três estados: `true` veio, `false` não veio, `null` ninguém conferiu.',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        security: [{ bearerAuth: [] }],
        responses: {
          '200': {
            description: 'O evento e quem se inscreveu',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    event: { $ref: '#/components/schemas/AdminEvent' },
                    data: {
                      type: 'array',
                      items: {
                        type: 'object',
                        properties: {
                          id: { type: 'string', format: 'uuid' },
                          name: { type: 'string' },
                          isMinor: { type: 'boolean' },
                          guardianPhoneHint: { type: 'string', nullable: true, description: 'Só para menor de idade, mascarado.' },
                          attended: { type: 'boolean', nullable: true },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
          '401': { description: 'Sem sessão', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          '403': { description: 'Não é da equipe', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          '404': { description: 'Evento inexistente', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
    },
    '/admin/events/{id}/attendance/{registrationId}': {
      patch: {
        tags: ['Admin'],
        summary: 'Marca se a pessoa veio (equipe, RF17)',
        description: 'Grava só a coluna de presença. `null` desmarca. A inscrição precisa ser deste evento, senão 404.',
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
          { name: 'registrationId', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
        ],
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { type: 'object', required: ['attended'], properties: { attended: { type: 'boolean', nullable: true } } } } },
        },
        responses: {
          '200': { description: 'A linha atualizada' },
          '400': { description: '`attended` precisa ser true, false ou null', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          '403': { description: 'Não é da equipe', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          '404': { description: '`registration_not_found` ou evento inexistente', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
    },
    '/me': {
      patch: {
        tags: ['Account'],
        summary: 'Altera os meus dados (RF11)',
        description:
          'Grava só `name`, `phone` e `personType` da conta do token. E-mail, senha e papéis **não mudam por aqui**, seja qual for o corpo (trocar o e-mail pede confirmação por e-mail, que ainda não existe). Telefone em branco apaga o número; telefone a um dígito de valer responde "Falta um dígito".',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['name', 'personType'],
                properties: {
                  name: { type: 'string', maxLength: 120 },
                  phone: { type: 'string', nullable: true, description: 'Com DDD; só os dígitos são guardados.' },
                  personType: { type: 'string', enum: ['individual', 'organization'] },
                },
              },
            },
          },
        },
        responses: {
          '200': { description: 'A conta já com os dados novos', content: { 'application/json': { schema: { type: 'object', properties: { user: { $ref: '#/components/schemas/User' } } } } } },
          '400': { description: 'Dados inválidos. `error.details` lista cada campo.', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          '401': { description: 'Sem sessão, ou conta que não existe mais', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
    },
    '/me/registrations': {
      get: {
        tags: ['Account'],
        summary: 'As inscrições ligadas à minha conta (RF11)',
        description:
          'Só as feitas com sessão aberta (as de visitante não têm dono). Do mais próximo ao mais distante. `attendanceRecorded` é verdadeiro só quando a equipe marcou presença: "não veio" e "ninguém conferiu" aparecem iguais, porque a marca de falta é anotação de trabalho da equipe.',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': { description: 'Lista (pode ser vazia)' },
          '401': { description: 'Sem sessão', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
    },
    '/admin/report': {
      get: {
        tags: ['Admin'],
        summary: 'Relatório do período: números e atividades (equipe, RF30–RF32)',
        description:
          'Janela de 1, 3 ou 6 meses que termina no mês atual (`offset` 0) ou nas anteriores (`-1`, `-2`…), com os meses fechados à meia-noite de São Paulo. ' +
          '"Atividades realizadas" são as publicadas que já acabaram dentro da janela; todo outro número conta as inscrições delas, **sem as canceladas**. ' +
          'Veio / faltou / sem conferir somam as inscrições: quem ninguém marcou **não** é falta. Uma contagem que falhou vem `null` (a tela mostra um traço), nunca `0`. ' +
          'A tabela traz as 5 atividades mais recentes (`events`); `eventsTotal` é quantas há. Só números: nenhum nome, e-mail ou documento.',
        parameters: [
          { name: 'period', in: 'query', schema: { type: 'string', enum: ['month', 'quarter', 'semester'], default: 'month' } },
          { name: 'offset', in: 'query', schema: { type: 'integer', maximum: 0, minimum: -240, default: 0 } },
        ],
        security: [{ bearerAuth: [] }],
        responses: {
          '200': { description: 'O relatório' },
          '400': { description: 'Período inválido', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          '401': { description: 'Sem sessão', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          '403': { description: 'Não é da equipe', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
    },
    '/admin/report/csv': {
      get: {
        tags: ['Admin'],
        summary: 'Planilha do relatório (equipe)',
        description: 'As mesmas contagens, com **todas** as atividades da janela (não só as 5 da tela) e uma linha de total. Traço (—) onde a contagem falhou. `;`, BOM UTF-8, fórmulas neutralizadas.',
        parameters: [
          { name: 'period', in: 'query', schema: { type: 'string', enum: ['month', 'quarter', 'semester'], default: 'month' } },
          { name: 'offset', in: 'query', schema: { type: 'integer', maximum: 0, minimum: -240, default: 0 } },
        ],
        security: [{ bearerAuth: [] }],
        responses: {
          '200': { description: 'Arquivo CSV', content: { 'text/csv': { schema: { type: 'string' } } } },
          '401': { description: 'Sem sessão', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          '403': { description: 'Não é da equipe', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
    },
    '/admin/events/{id}/publication': {
      patch: {
        tags: ['Admin'],
        summary: 'Publica ou tira do ar (equipe)',
        description: 'O único caminho que muda `published`. O corpo aceita só esse campo.',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { type: 'object', required: ['published'], properties: { published: { type: 'boolean' } } } } },
        },
        responses: {
          '200': { description: 'O evento', content: { 'application/json': { schema: { type: 'object', properties: { event: { $ref: '#/components/schemas/AdminEvent' } } } } } },
          '400': { description: '`published` precisa ser true ou false', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          '404': { description: 'Não existe', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
    },
    '/events': {
      get: {
        tags: ['Events'],
        summary: 'Lista os eventos publicados',
        description:
          'Só eventos publicados. "upcoming" são os que ainda não começaram (início depois de agora) e vêm do mais próximo ao mais distante; "past" são os que já começaram, do mais recente ao mais antigo. Se a contagem de inscritos falhar, a lista vem mesmo assim, com `registrationStatus: unknown`.',
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
    '/events/{id}': {
      get: {
        tags: ['Events'],
        summary: 'Um evento publicado, com o que o formulário de inscrição precisa',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        responses: {
          '200': { description: 'O evento', content: { 'application/json': { schema: { type: 'object', properties: { event: { $ref: '#/components/schemas/EventDetail' } } } } } },
          '404': { description: 'Não existe ou não está publicado', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
    },
    '/events/{id}/image': {
      get: {
        tags: ['Events'],
        summary: 'A foto de um evento publicado',
        description: 'Só de evento publicado e com foto. Tipo gravado, `nosniff`, `inline`, cache de uma hora e ETag (304 quando não mudou).',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        responses: {
          '200': { description: 'Os bytes da foto', content: { 'image/*': { schema: { type: 'string', format: 'binary' } } } },
          '304': { description: 'Não mudou desde o `If-None-Match`' },
          '404': { description: 'Rascunho, inexistente ou sem foto: a mesma resposta', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
    },
    '/events/{id}/registrations': {
      post: {
        tags: ['Events'],
        summary: 'Inscreve alguém num evento, com ou sem conta (RF15)',
        description:
          'Sem token, a inscrição é de um visitante. Com `Authorization: Bearer`, ela fica ligada à conta do token — e um token ruim responde 401 em vez de virar visitante, para o cliente renovar e repetir. ' +
          'A vaga é conferida no banco com a linha do evento travada: duas pessoas enviando ao mesmo tempo não ocupam o mesmo último lugar. Cada e-mail inscreve até 5 pessoas por evento e cada conexão, até 30 por hora; o IP nunca é gravado, só um hash com chave.',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        security: [{}, { bearerAuth: [] }],
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/RegistrationRequest' } } } },
        responses: {
          '201': { description: 'Inscrição registrada; devolve o evento com as vagas já descontadas e `registration.cancelCode`, o código do link pessoal que cancela esta inscrição' },
          '400': { description: 'Dados inválidos. `error.details` lista cada campo.', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          '401': { description: 'Token enviado, mas inválido ou de conta que não existe mais', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          '404': { description: 'Evento inexistente ou não publicado', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          '409': { description: '`event_full`, `registrations_closed` (o evento já começou), `registrations_not_offered` (sem inscrição pelo site) ou `already_registered`', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          '429': { description: '`too_many_registrations` (5 pessoas por e-mail no evento) ou `too_many_requests` (30 inscrições por hora vindas da mesma conexão)', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
    },
    '/registrations/cancel/{code}': {
      get: {
        tags: ['Events'],
        summary: 'Mostra a inscrição que o link pessoal cancelaria (RF15)',
        description:
          'Aberta, sem sessão: quem se inscreveu sem conta também precisa poder desistir. O código é um UUID aleatório que só quem se inscreveu recebeu. Devolve só o evento e o nome abreviado ("Ana S."), nunca contato, CPF nem responsável. `state`: `active`, `cancelled` ou `over` (a atividade já aconteceu).',
        parameters: [{ name: 'code', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        responses: {
          '200': { description: 'A inscrição e o estado' },
          '400': { description: 'Não é um UUID', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          '404': { description: '`registration_not_found`', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
      post: {
        tags: ['Events'],
        summary: 'Cancela a inscrição do link pessoal (RF15)',
        description:
          'Marca `cancelled_at`; a linha fica como registro e deixa de contar (vagas, lista da equipe, presença, planilha, "Minhas inscrições"). Quem cancelou pode se inscrever de novo. Dois toques ao mesmo tempo cancelam uma vez só.',
        parameters: [{ name: 'code', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        responses: {
          '200': { description: 'A inscrição, já com `state: cancelled`' },
          '404': { description: '`registration_not_found`', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          '409': { description: '`already_cancelled` ou `registrations_closed` (a atividade já aconteceu)', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
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
    '/volunteer-areas': {
      get: {
        tags: ['Volunteering'],
        summary: 'As áreas de voluntariado (RF24)',
        description: 'Pública. Na ordem em que a equipe definiu, com o texto de cada área.',
        responses: {
          '200': { description: 'As cinco áreas', content: { 'application/json': { schema: { type: 'object', properties: { data: { type: 'array', items: { $ref: '#/components/schemas/VolunteerArea' } } } } } } },
        },
      },
    },
    '/volunteer-applications': {
      post: {
        tags: ['Volunteering'],
        summary: 'Candidata a conta do token ao voluntariado (RF25)',
        description:
          'Exige sessão: a conta vem do token verificado, nunca do corpo, e já registra a maioridade (RN01). Quem tem candidatura viva (`new`, `in_contact` ou `volunteering`) não manda outra — a regra vale no banco, com um índice único, contra dois envios ao mesmo tempo. `ended` devolve o direito de se candidatar de novo. A candidatura e as áreas são gravadas numa transação só.',
        security: [{ bearerAuth: [] }],
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/VolunteerApplicationRequest' } } } },
        responses: {
          '201': { description: 'Candidatura registrada', content: { 'application/json': { schema: { type: 'object', properties: { application: { $ref: '#/components/schemas/MyVolunteerApplication' } } } } } },
          '400': { description: 'Dados inválidos (nenhuma área, área inexistente, texto acima de 2000 caracteres). `error.details` lista cada campo.', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          '401': { description: 'Sem sessão', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          '409': { description: '`already_applied`: já existe uma candidatura em andamento', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
    },
    '/me/volunteer-applications': {
      get: {
        tags: ['Account'],
        summary: 'As minhas candidaturas ao voluntariado (RF11, RF25)',
        description: 'Só as da conta do token. As em andamento primeiro, a mais recente em cima; as encerradas descem e nunca somem.',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': { description: 'Lista (pode ser vazia)', content: { 'application/json': { schema: { type: 'object', properties: { data: { type: 'array', items: { $ref: '#/components/schemas/MyVolunteerApplication' } } } } } } },
          '401': { description: 'Sem sessão', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
    },
    '/admin/volunteer-applications': {
      get: {
        tags: ['Admin'],
        summary: 'A fila de candidaturas ao voluntariado (equipe, RF26)',
        description:
          'Filtros por query: `status` e `area`. Vem a candidatura com nome, e-mail e telefone do perfil. `counts` conta por situação respeitando só o filtro de área, para os chips mostrarem quantas há em cada uma. Ordem: nova, em contato, voluntariando, encerrada; dentro de cada uma, a mais recente primeiro.',
        parameters: [
          { name: 'status', in: 'query', schema: { type: 'string', enum: ['new', 'in_contact', 'volunteering', 'ended'] } },
          { name: 'area', in: 'query', schema: { type: 'string' } },
        ],
        security: [{ bearerAuth: [] }],
        responses: {
          '200': {
            description: 'A fila e as contagens',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    data: { type: 'array', items: { $ref: '#/components/schemas/AdminVolunteerApplication' } },
                    counts: { $ref: '#/components/schemas/VolunteerStatusCounts' },
                  },
                },
              },
            },
          },
          '400': { description: 'Filtro inválido', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          '401': { description: 'Sem sessão', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          '403': { description: 'Não é da equipe', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
    },
    '/admin/volunteer-applications/counts': {
      get: {
        tags: ['Admin'],
        summary: 'Quantas candidaturas há em cada situação (equipe)',
        description: 'Só as contagens, sem nenhuma linha: é o que o selo do menu do painel lê.',
        parameters: [{ name: 'area', in: 'query', schema: { type: 'string' } }],
        security: [{ bearerAuth: [] }],
        responses: {
          '200': { description: 'Contagens', content: { 'application/json': { schema: { type: 'object', properties: { counts: { $ref: '#/components/schemas/VolunteerStatusCounts' } } } } } },
          '401': { description: 'Sem sessão', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          '403': { description: 'Não é da equipe', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
    },
    '/admin/volunteer-applications/export.csv': {
      get: {
        tags: ['Admin'],
        summary: 'Planilha das candidaturas (equipe)',
        description:
          'CSV com `;` e BOM UTF-8, com os mesmos filtros da fila. Células que começariam com `=`, `+`, `-` ou `@` levam um apóstrofo na frente: sem isso viram fórmula. A situação usa os rótulos da equipe.',
        parameters: [
          { name: 'status', in: 'query', schema: { type: 'string', enum: ['new', 'in_contact', 'volunteering', 'ended'] } },
          { name: 'area', in: 'query', schema: { type: 'string' } },
        ],
        security: [{ bearerAuth: [] }],
        responses: {
          '200': { description: 'Arquivo CSV', content: { 'text/csv': { schema: { type: 'string' } } } },
          '401': { description: 'Sem sessão', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          '403': { description: 'Não é da equipe', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
    },
    '/admin/volunteer-applications/{id}': {
      get: {
        tags: ['Admin'],
        summary: 'Uma candidatura (equipe)',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        security: [{ bearerAuth: [] }],
        responses: {
          '200': { description: 'A candidatura', content: { 'application/json': { schema: { type: 'object', properties: { application: { $ref: '#/components/schemas/AdminVolunteerApplication' } } } } } },
          '401': { description: 'Sem sessão', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          '403': { description: 'Não é da equipe', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          '404': { description: '`application_not_found`', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
    },
    '/admin/volunteer-applications/{id}/status': {
      patch: {
        tags: ['Admin'],
        summary: 'Muda a situação de uma candidatura (equipe, RF26)',
        description:
          'Qualquer passagem entre as quatro situações existe, e o corpo aceita só `status`. Encerrar devolve à pessoa o direito de se candidatar de novo; reabrir uma encerrada quando a pessoa já tem outra em andamento responde 409.',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { type: 'object', required: ['status'], properties: { status: { type: 'string', enum: ['new', 'in_contact', 'volunteering', 'ended'] } } } } },
        },
        responses: {
          '200': { description: 'A candidatura atualizada', content: { 'application/json': { schema: { type: 'object', properties: { application: { $ref: '#/components/schemas/AdminVolunteerApplication' } } } } } },
          '400': { description: 'Situação inválida', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          '401': { description: 'Sem sessão', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          '403': { description: 'Não é da equipe', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          '404': { description: '`application_not_found`', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          '409': { description: '`live_application_exists`', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
    },
    '/admin/contacts': {
      get: {
        tags: ['Admin'],
        summary: 'A fila de mensagens de contato (equipe, RF29)',
        description:
          'Filtro `status` e paginação por `page` (1 em diante) e `pageSize` (padrão 20, até 100). Ordem: nova, em contato, concluída; dentro de cada uma, a mais recente primeiro, e a página é cortada sobre essa ordem. `counts` conta por situação sem olhar o filtro, para os chips. Não há DELETE nem POST: a mensagem é registro.',
        parameters: [
          { name: 'status', in: 'query', schema: { type: 'string', enum: ['new', 'in_contact', 'done'] } },
          { name: 'page', in: 'query', schema: { type: 'integer', minimum: 1, default: 1 } },
          { name: 'pageSize', in: 'query', schema: { type: 'integer', minimum: 1, maximum: 100, default: 20 } },
        ],
        security: [{ bearerAuth: [] }],
        responses: {
          '200': {
            description: 'A página, as contagens e a paginação',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    data: { type: 'array', items: { $ref: '#/components/schemas/AdminContact' } },
                    counts: { $ref: '#/components/schemas/ContactCounts' },
                    pagination: {
                      type: 'object',
                      properties: {
                        page: { type: 'integer' },
                        pageSize: { type: 'integer' },
                        total: { type: 'integer', description: 'Quantas há no filtro atual.' },
                        totalPages: { type: 'integer', minimum: 1 },
                      },
                    },
                  },
                },
              },
            },
          },
          '400': { description: 'Filtro ou página inválidos', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          '401': { description: 'Sem sessão', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          '403': { description: 'Não é da equipe', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
    },
    '/admin/contacts/counts': {
      get: {
        tags: ['Admin'],
        summary: 'Quantas mensagens há em cada situação (equipe)',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': { description: 'Contagens', content: { 'application/json': { schema: { type: 'object', properties: { counts: { $ref: '#/components/schemas/ContactCounts' } } } } } },
          '401': { description: 'Sem sessão', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          '403': { description: 'Não é da equipe', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
    },
    '/admin/contacts/export.csv': {
      get: {
        tags: ['Admin'],
        summary: 'Planilha das mensagens (equipe)',
        description:
          'CSV com `;`, BOM UTF-8 e CRLF, todas as mensagens do filtro (sem paginação). Células que começariam com `=`, `+`, `-` ou `@` levam um apóstrofo na frente. Colunas: Nome, Situação, Instituição, E-mail, Telefone, Mensagem, Nota interna, Recebida em.',
        parameters: [{ name: 'status', in: 'query', schema: { type: 'string', enum: ['new', 'in_contact', 'done'] } },],
        security: [{ bearerAuth: [] }],
        responses: {
          '200': { description: 'Arquivo CSV', content: { 'text/csv': { schema: { type: 'string' } } } },
          '400': { description: 'Filtro inválido', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          '401': { description: 'Sem sessão', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          '403': { description: 'Não é da equipe', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
    },
    '/admin/contacts/{id}': {
      get: {
        tags: ['Admin'],
        summary: 'Uma mensagem (equipe)',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        security: [{ bearerAuth: [] }],
        responses: {
          '200': { description: 'A mensagem', content: { 'application/json': { schema: { type: 'object', properties: { contact: { $ref: '#/components/schemas/AdminContact' } } } } } },
          '400': { description: 'Identificador inválido', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          '401': { description: 'Sem sessão', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          '403': { description: 'Não é da equipe', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          '404': { description: '`contact_not_found`', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
      patch: {
        tags: ['Admin'],
        summary: 'Muda a situação e/ou a nota interna de uma mensagem (equipe)',
        description: 'Grava só essas duas colunas. Qualquer passagem de situação existe, inclusive voltar atrás.',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        security: [{ bearerAuth: [] }],
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/ContactTriageRequest' } } } },
        responses: {
          '200': { description: 'A mensagem atualizada', content: { 'application/json': { schema: { type: 'object', properties: { contact: { $ref: '#/components/schemas/AdminContact' } } } } } },
          '400': { description: 'Corpo vazio, situação fora da lista ou nota acima de 2000 caracteres', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          '401': { description: 'Sem sessão', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          '403': { description: 'Não é da equipe', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          '404': { description: '`contact_not_found`', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
    },
    '/contacts': {
      post: {
        tags: ['Contact'],
        summary: 'Envia uma mensagem para a equipe, sem conta (RF07)',
        description:
          'Aberta, sem sessão: quem escreve para o Ateliê não precisa ter conta. A resposta não devolve a mensagem nem dado pessoal. ' +
          'Cada conexão envia até 30 mensagens por hora (cabe uma turma de escola saindo por um IP só); o IP nunca é gravado, só um hash com chave. Não há leitura nem listagem de mensagens.',
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/ContactRequest' } } } },
        responses: {
          '201': { description: 'Mensagem registrada', content: { 'application/json': { schema: { type: 'object', properties: { received: { type: 'boolean', enum: [true] } } } } } },
          '400': { description: 'Dados inválidos. `error.details` lista cada campo.', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          '429': { description: '`too_many_requests`: mais de 30 mensagens na última hora vindas da mesma conexão', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
    },
  },
} as const;
