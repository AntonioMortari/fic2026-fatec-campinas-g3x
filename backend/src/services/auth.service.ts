import { UniqueConstraintError } from 'sequelize';
import { User, type PersonType } from '../models';
import { ApiError } from '../utils/api-error';
import { hashPassword, verifyPassword } from '../utils/password';
import { signToken } from '../utils/token';

// Compared against when the e-mail is unknown, so a missing account costs the same time as a wrong password.
const TIMING_HASH = '$2b$12$ojNtZZOwldnCikA59y710.hPUW.Q1k4wxCD09O4mrYnNxr8raXVVe';

export interface PublicUser {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  personType: PersonType;
  wantsToVolunteer: boolean;
  wantsToDonate: boolean;
  isStaff: boolean;
}

export interface AuthResult {
  token: string;
  user: PublicUser;
}

export interface RegisterInput {
  name: string;
  email: string;
  phone: string | null;
  personType: PersonType;
  password: string;
  wantsToVolunteer: boolean;
  wantsToDonate: boolean;
}

export function toPublicUser(user: User): PublicUser {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    personType: user.personType,
    wantsToVolunteer: user.wantsToVolunteer,
    wantsToDonate: user.wantsToDonate,
    isStaff: user.isStaff,
  };
}

function authResult(user: User): AuthResult {
  return { token: signToken({ sub: user.id }), user: toPublicUser(user) };
}

export async function registerUser(input: RegisterInput, now: Date = new Date()): Promise<AuthResult> {
  const passwordHash = await hashPassword(input.password);

  try {
    // Every column is listed by hand: nothing from the request body reaches the table by spreading.
    const user = await User.create({
      name: input.name,
      email: input.email,
      phone: input.phone,
      personType: input.personType,
      passwordHash,
      wantsToVolunteer: input.wantsToVolunteer,
      wantsToDonate: input.wantsToDonate,
      isStaff: false,
      adultConfirmedAt: now,
      consentedAt: now,
    });
    return authResult(user);
  } catch (error) {
    if (error instanceof UniqueConstraintError) {
      throw new ApiError(409, 'email_taken', 'Já existe uma conta com esse e-mail. Entre com a sua senha.', [
        { location: 'body', field: 'email', message: 'Já existe uma conta com esse e-mail. Entre com a sua senha.' },
      ]);
    }
    throw error;
  }
}

export async function loginUser(input: { email: string; password: string }): Promise<AuthResult> {
  const user = await User.findOne({ where: { email: input.email } });
  const matches = await verifyPassword(input.password, user?.passwordHash ?? TIMING_HASH);

  if (!user || !matches) {
    throw new ApiError(401, 'invalid_credentials', 'E-mail ou senha não conferem.');
  }
  return authResult(user);
}

export interface ProfileInput {
  name: string;
  phone: string | null;
  personType: PersonType;
}

// The three columns are listed by hand: e-mail, password and the roles are not changed from here, whatever the body carries.
export async function updateProfile(userId: string, input: ProfileInput): Promise<PublicUser> {
  const user = await User.findByPk(userId, { attributes: { exclude: ['passwordHash'] } });
  if (!user) throw new ApiError(401, 'unauthenticated', 'Entre na sua conta para continuar.');
  await user.update({ name: input.name, phone: input.phone, personType: input.personType });
  return toPublicUser(user);
}

export async function getProfile(userId: string): Promise<PublicUser> {
  const user = await User.findByPk(userId, { attributes: { exclude: ['passwordHash'] } });
  if (!user) throw new ApiError(401, 'unauthenticated', 'Entre na sua conta para continuar.');
  return toPublicUser(user);
}
