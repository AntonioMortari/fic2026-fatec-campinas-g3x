import 'dotenv/config';
import { z } from 'zod';

/**
 * Variáveis de ambiente validadas na subida (RNF-SEG-05).
 *
 * Falta de segredo é erro de inicialização, não de requisição: a API não sobe
 * sem JWT_SEGREDO ou sem as credenciais do banco, em vez de subir e falhar no
 * primeiro login.
 */
const esquema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORTA: z.coerce.number().int().positive().default(3333),
  CORS_ORIGENS: z
    .string()
    .min(1, 'informe ao menos uma origem')
    .transform((valor) =>
      valor
        .split(',')
        .map((origem) => origem.trim())
        .filter(Boolean),
    ),
  DB_HOST: z.string().min(1),
  DB_PORTA: z.coerce.number().int().positive().default(3306),
  DB_NOME: z.string().min(1),
  DB_USUARIO: z.string().min(1),
  DB_SENHA: z.string(),
  JWT_SEGREDO: z.string().min(32, 'JWT_SEGREDO precisa de pelo menos 32 caracteres'),
  JWT_EXPIRA_EM: z.string().default('1h'),
});

export type Ambiente = z.infer<typeof esquema>;

export function lerAmbiente(origem: NodeJS.ProcessEnv): Ambiente {
  const resultado = esquema.safeParse(origem);
  if (!resultado.success) {
    const problemas = resultado.error.issues
      .map((problema) => `  - ${problema.path.join('.')}: ${problema.message}`)
      .join('\n');
    throw new Error(`Variáveis de ambiente inválidas:\n${problemas}`);
  }
  return resultado.data;
}

export const ambiente = lerAmbiente(process.env);
