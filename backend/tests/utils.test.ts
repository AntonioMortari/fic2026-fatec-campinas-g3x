import jwt from 'jsonwebtoken';
import { lerAmbiente } from '../src/config/env';
import { conferirSenha, gerarHashDeSenha } from '../src/utils/senha';
import { assinarToken, verificarToken } from '../src/utils/token';

describe('senha (RNF-SEG-02)', () => {
  it('nunca guarda a senha em texto e confere a senha certa', async () => {
    const hash = await gerarHashDeSenha('uma senha qualquer');

    expect(hash).not.toContain('uma senha qualquer');
    expect(hash).toMatch(/^\$2[aby]\$12\$/);
    await expect(conferirSenha('uma senha qualquer', hash)).resolves.toBe(true);
    await expect(conferirSenha('outra senha', hash)).resolves.toBe(false);
  });
});

describe('token (RNF-SEG-01)', () => {
  it('ida e volta preservam o identificador', () => {
    expect(verificarToken(assinarToken({ sub: 'abc' }))).toEqual({ sub: 'abc' });
  });

  it('recusa token assinado com outra chave', () => {
    const forjado = jwt.sign({ sub: 'abc' }, 'outra-chave-com-mais-de-trinta-e-dois-caracteres');

    expect(() => verificarToken(forjado)).toThrow();
  });

  it('recusa token sem assinatura (alg none)', () => {
    const semAssinatura = jwt.sign({ sub: 'abc' }, '', { algorithm: 'none' });

    expect(() => verificarToken(semAssinatura)).toThrow();
  });
});

describe('ambiente (RNF-SEG-05)', () => {
  const valido = {
    CORS_ORIGENS: 'http://a.example, http://b.example',
    DB_HOST: 'db',
    DB_NOME: 'x',
    DB_USUARIO: 'x',
    DB_SENHA: 'x',
    JWT_SEGREDO: 'k'.repeat(32),
  };

  it('separa as origens do CORS por vírgula', () => {
    expect(lerAmbiente(valido).CORS_ORIGENS).toEqual(['http://a.example', 'http://b.example']);
  });

  it('não sobe com JWT_SEGREDO curto', () => {
    expect(() => lerAmbiente({ ...valido, JWT_SEGREDO: 'curto' })).toThrow(/JWT_SEGREDO/);
  });

  it('não sobe sem as credenciais do banco', () => {
    const { DB_USUARIO: _omitido, ...semUsuario } = valido;

    expect(() => lerAmbiente(semUsuario)).toThrow(/DB_USUARIO/);
  });
});
