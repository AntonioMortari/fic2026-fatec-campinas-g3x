import { isValidCpf } from '../src/utils/cpf';

describe('isValidCpf', () => {
  it.each(['52998224725', '11144477735', '39053344705'])('accepts the real check digits of %s', (cpf) => {
    expect(isValidCpf(cpf)).toBe(true);
  });

  it.each([
    '00000000000',
    '11111111111',
    '22222222222',
    '33333333333',
    '44444444444',
    '55555555555',
    '66666666666',
    '77777777777',
    '88888888888',
    '99999999999',
  ])('refuses %s: eleven equal digits pass the arithmetic and are not a document', (cpf) => {
    expect(isValidCpf(cpf)).toBe(false);
  });

  it('refuses a wrong first or second check digit', () => {
    expect(isValidCpf('52998224715')).toBe(false);
    expect(isValidCpf('52998224726')).toBe(false);
  });

  it.each(['', '123', '5299822472', '529982247250', '529.982.247-25', 'abcdefghijk', '5299822472a'])('refuses %j: only eleven digits, already cleaned', (cpf) => {
    expect(isValidCpf(cpf)).toBe(false);
  });
});
