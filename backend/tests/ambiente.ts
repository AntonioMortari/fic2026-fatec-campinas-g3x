// Ambiente fixo dos testes: nenhum teste depende de um .env local.
Object.assign(process.env, {
  NODE_ENV: 'test',
  CORS_ORIGENS: 'http://localhost:5173',
  DB_HOST: 'localhost',
  DB_NOME: 'atelie_teste',
  DB_USUARIO: 'teste',
  DB_SENHA: 'teste',
  JWT_SEGREDO: 'segredo-de-teste-com-mais-de-32-caracteres',
  JWT_EXPIRA_EM: '1h',
});
