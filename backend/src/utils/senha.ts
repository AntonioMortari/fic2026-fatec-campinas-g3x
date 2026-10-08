import bcrypt from 'bcryptjs';

// Custo do bcrypt (RNF-SEG-02). 12 é ~250 ms por hash num servidor comum.
const CUSTO = 12;

export function gerarHashDeSenha(senha: string): Promise<string> {
  return bcrypt.hash(senha, CUSTO);
}

export function conferirSenha(senha: string, hash: string): Promise<boolean> {
  return bcrypt.compare(senha, hash);
}
