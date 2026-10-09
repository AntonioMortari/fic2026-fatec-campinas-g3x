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
          spotsLeft: { type: ['integer', 'null'], minimum: 0, description: 'Vagas que restam; null quando não há limite.' },
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
              registrationsOpen: { type: 'boolean', description: 'Falso quando o evento já acabou ou as vagas acabaram.' },
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
          '201': { description: 'Inscrição registrada; devolve o evento com as vagas já descontadas' },
          '400': { description: 'Dados inválidos. `error.details` lista cada campo.', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          '401': { description: 'Token enviado, mas inválido ou de conta que não existe mais', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          '404': { description: 'Evento inexistente ou não publicado', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          '409': { description: '`event_full`, `registrations_closed` (evento acabou) ou `already_registered`', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          '429': { description: '`too_many_registrations` (5 pessoas por e-mail no evento) ou `too_many_requests` (30 inscrições por hora vindas da mesma conexão)', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
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
