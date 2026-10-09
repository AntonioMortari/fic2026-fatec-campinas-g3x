import type { Request, Response } from 'express';
import { z } from 'zod';
import { getProfile, loginUser, registerUser } from '../services/auth.service';
import { issueRefreshToken, refreshSession, revokeRefreshToken } from '../services/session.service';
import { ApiError } from '../utils/api-error';
import { clearRefreshCookie, readRefreshCookie, setRefreshCookie } from '../utils/refresh-cookie';

const MAX_PASSWORD_BYTES = 72;
const EMAIL_MESSAGE = 'Confira o e-mail: ele precisa ter um endereço completo, como nome@exemplo.com.';
const PASSWORD_MIN_MESSAGE = 'A senha precisa ter pelo menos 8 caracteres.';
const PHONE_MESSAGE = 'O telefone precisa incluir o DDD, como (11) 95396-8344.';
const PHONE_MISSING_DIGIT_MESSAGE = 'Falta um dígito. Exemplo: (11) 98765-4321.';

const emailField = z
  .string({ error: EMAIL_MESSAGE })
  .trim()
  .toLowerCase()
  .max(254, 'O e-mail passou de 254 caracteres.')
  .pipe(z.email(EMAIL_MESSAGE));

const fitsBcrypt = (value: string) => Buffer.byteLength(value) <= MAX_PASSWORD_BYTES;

export const nameField = z.string({ error: 'Escreva seu nome.' }).trim().min(1, 'Escreva seu nome.').max(120, 'O nome passou de 120 caracteres.');

export const phoneField = z
  .string({ error: PHONE_MESSAGE })
  .trim()
  .nullish()
  .superRefine((value, ctx) => {
    if (!value) return;
    const digits = value.replace(/\D/g, '');
    if (/^\d{10,11}$/.test(digits)) return;
    ctx.addIssue({ code: 'custom', message: digits.length === 9 ? PHONE_MISSING_DIGIT_MESSAGE : PHONE_MESSAGE });
  })
  .transform((value) => (value ? value.replace(/\D/g, '') : null));

export const personTypeField = z.enum(['individual', 'organization'], { error: 'Escolha se a conta é de uma pessoa ou de uma instituição.' });

const registerFields = z.object({
  name: nameField,
  email: emailField,
  phone: phoneField,
  personType: personTypeField,
  password: z
    .string({ error: PASSWORD_MIN_MESSAGE })
    .min(8, PASSWORD_MIN_MESSAGE)
    .refine(fitsBcrypt, 'A senha é longa demais. Use no máximo 72 caracteres (acentos e símbolos contam mais de um).'),
  wantsToVolunteer: z.boolean({ error: 'Resposta inválida.' }).default(false),
  wantsToDonate: z.boolean({ error: 'Resposta inválida.' }).default(false),
  confirmsAdult: z.literal(true, {
    error:
      'Só quem tem 18 anos ou mais pode criar uma conta. Crianças e adolescentes participam das atividades por inscrição feita por um responsável.',
  }),
  consent: z.literal(true, { error: 'Para criar a conta, precisamos que você concorde com o uso dos seus dados.' }),
});

// An intersection, not a refine on registerFields: a refine is skipped when any other field fails by type,
// and the person would only see this error after fixing the rest.
const participation = z
  .object({ wantsToVolunteer: z.boolean().default(false), wantsToDonate: z.boolean().default(false) })
  .superRefine((data, ctx) => {
    if (!data.wantsToVolunteer && !data.wantsToDonate) {
      ctx.addIssue({
        code: 'custom',
        path: ['participation'],
        message: 'Escolha ao menos uma forma de participar: voluntariado, doação, ou as duas.',
      });
    }
  });

export const registerBody = registerFields.and(participation);

export const loginBody = z.object({
  email: emailField,
  password: z
    .string({ error: 'Escreva sua senha.' })
    .min(1, 'Escreva sua senha.')
    .refine(fitsBcrypt, 'E-mail ou senha não conferem.'),
});

export async function register(req: Request, res: Response): Promise<void> {
  const result = await registerUser(req.body as z.output<typeof registerBody>);
  setRefreshCookie(res, await issueRefreshToken(result.user.id));
  res.status(201).json(result);
}

export async function login(req: Request, res: Response): Promise<void> {
  const result = await loginUser(req.body as z.output<typeof loginBody>);
  setRefreshCookie(res, await issueRefreshToken(result.user.id));
  res.json(result);
}

export async function refresh(req: Request, res: Response): Promise<void> {
  const token = readRefreshCookie(req);
  if (!token) throw new ApiError(401, 'session_expired', 'Sua sessão terminou. Entre de novo para continuar.');

  try {
    const { refreshToken, ...result } = await refreshSession(token);
    setRefreshCookie(res, refreshToken);
    res.json(result);
  } catch (error) {
    clearRefreshCookie(res);
    throw error;
  }
}

export async function logout(req: Request, res: Response): Promise<void> {
  const token = readRefreshCookie(req);
  if (token) await revokeRefreshToken(token);
  clearRefreshCookie(res);
  res.status(204).end();
}

export async function me(req: Request, res: Response): Promise<void> {
  if (!req.user) throw new ApiError(401, 'unauthenticated', 'Entre na sua conta para continuar.');
  res.json({ user: await getProfile(req.user.id) });
}
