import * as queries from '../database/queries';
import { hashPassword, comparePassword } from '../utils/password';
import { generateToken, generateTwoFactorChallengeToken, verifyTwoFactorChallengeToken } from '../utils/jwt';
import { User } from '../types';
import { decryptCredential, encryptCredential } from '../utils/encryption';
import speakeasy from 'speakeasy';
import QRCode from 'qrcode';

interface LoginSuccessResult {
  user: User;
  token: string;
  requires_2fa: false;
}

interface LoginChallengeResult {
  user: User;
  requires_2fa: true;
  challenge_token: string;
}

export type LoginResult = LoginSuccessResult | LoginChallengeResult;

function generateBackupCodes(): string[] {
  const codes: string[] = [];
  for (let i = 0; i < 8; i += 1) {
    const code = `${Math.random().toString(36).slice(2, 6)}-${Math.random().toString(36).slice(2, 6)}`;
    codes.push(code.toUpperCase());
  }
  return codes;
}

export async function registerUser(email: string, password: string, name: string, department: string): Promise<User> {
  // Verificar se usuário já existe
  const existingUser = await queries.getUserByEmail(email);
  if (existingUser) {
    throw new Error('Email já cadastrado');
  }

  const passwordHash = await hashPassword(password);
  const user = await queries.createUser(email, name, department, passwordHash);

  return user;
}

export async function loginUser(email: string, password: string): Promise<LoginResult> {
  const user = await queries.getUserByEmail(email);

  if (!user) {
    throw new Error('Email ou senha inválidos');
  }

  if (!user.is_active) {
    throw new Error('Usuário inativo');
  }

  const isPasswordValid = await comparePassword(password, user.password_hash);

  if (!isPasswordValid) {
    throw new Error('Email ou senha inválidos');
  }

  if (user.two_factor_enabled) {
    const challengeToken = generateTwoFactorChallengeToken({
      id: user.id,
      email: user.email,
      name: user.name,
      department: user.department,
    });

    return {
      user,
      requires_2fa: true,
      challenge_token: challengeToken,
    };
  }

  // Atualizar último login
  await queries.updateLastLogin(user.id);

  // Gerar token
  const token = generateToken({
    id: user.id,
    email: user.email,
    name: user.name,
    department: user.department,
  });

  return { user, token, requires_2fa: false };
}

export async function getUserInfo(userId: string): Promise<User | null> {
  return queries.getUserById(userId);
}

export async function getTwoFactorStatus(userId: string): Promise<{ enabled: boolean }> {
  const user = await queries.getUserById(userId);

  if (!user) {
    throw new Error('Usuário não encontrado');
  }

  return {
    enabled: Boolean(user.two_factor_enabled),
  };
}

export async function setupTwoFactor(userId: string): Promise<{ manual_entry_key: string; qr_code_data_url: string }> {
  const user = await queries.getUserById(userId);

  if (!user) {
    throw new Error('Usuário não encontrado');
  }

  const secret = speakeasy.generateSecret({
    name: `Workflow (${user.email})`,
    length: 32,
  });

  if (!secret.base32 || !secret.otpauth_url) {
    throw new Error('Não foi possível gerar segredo de 2FA');
  }

  await queries.setUserTwoFactorSecret(userId, encryptCredential(secret.base32));

  const qrCodeDataUrl = await QRCode.toDataURL(secret.otpauth_url);

  return {
    manual_entry_key: secret.base32,
    qr_code_data_url: qrCodeDataUrl,
  };
}

export async function verifyTwoFactorSetup(userId: string, code: string): Promise<{ backup_codes: string[] }> {
  const user = await queries.getUserById(userId);

  if (!user || !user.two_factor_secret_encrypted) {
    throw new Error('Configuração 2FA não iniciada');
  }

  const secret = decryptCredential(user.two_factor_secret_encrypted);

  const verified = speakeasy.totp.verify({
    secret,
    encoding: 'base32',
    token: code,
    window: 1,
  });

  if (!verified) {
    throw new Error('Código 2FA inválido');
  }

  const backupCodes = generateBackupCodes();
  const backupCodesHash = await Promise.all(backupCodes.map((item) => hashPassword(item)));

  await queries.enableUserTwoFactor(userId, backupCodesHash);
  await queries.createAuditLog(userId, 'TWO_FACTOR_ENABLED', 'user', userId, {
    method: 'totp',
    backup_codes_issued: backupCodes.length,
  });

  return { backup_codes: backupCodes };
}

export async function completeTwoFactorLogin(challengeToken: string, code: string): Promise<{ user: User; token: string }> {
  const challenge = verifyTwoFactorChallengeToken(challengeToken);

  if (!challenge) {
    throw new Error('Token de desafio 2FA inválido ou expirado');
  }

  const user = await queries.getUserById(challenge.id);

  if (!user || !user.is_active) {
    throw new Error('Usuário inválido para autenticação');
  }

  if (!user.two_factor_enabled || !user.two_factor_secret_encrypted) {
    throw new Error('2FA não está habilitado para este usuário');
  }

  let twoFactorValid = false;
  const secret = decryptCredential(user.two_factor_secret_encrypted);

  twoFactorValid = speakeasy.totp.verify({
    secret,
    encoding: 'base32',
    token: code,
    window: 1,
  });

  if (!twoFactorValid && user.two_factor_backup_codes && user.two_factor_backup_codes.length > 0) {
    const normalizedCode = code.trim().toUpperCase();
    let matchedIndex = -1;

    for (let i = 0; i < user.two_factor_backup_codes.length; i += 1) {
      const hash = user.two_factor_backup_codes[i];
      if (await comparePassword(normalizedCode, hash)) {
        twoFactorValid = true;
        matchedIndex = i;
        break;
      }
    }

    if (twoFactorValid && matchedIndex >= 0) {
      const remaining = user.two_factor_backup_codes.filter((_, index) => index !== matchedIndex);
      await queries.updateUserTwoFactorBackupCodes(user.id, remaining);
    }
  }

  if (!twoFactorValid) {
    throw new Error('Código 2FA inválido');
  }

  await queries.updateLastLogin(user.id);
  await queries.createAuditLog(user.id, 'TWO_FACTOR_LOGIN_SUCCESS', 'user', user.id, {
    method: 'totp_or_backup',
  });

  const token = generateToken({
    id: user.id,
    email: user.email,
    name: user.name,
    department: user.department,
  });

  return { user, token };
}

export async function disableTwoFactor(userId: string, code: string): Promise<void> {
  const user = await queries.getUserById(userId);

  if (!user || !user.two_factor_enabled || !user.two_factor_secret_encrypted) {
    throw new Error('2FA não está habilitado para este usuário');
  }

  const secret = decryptCredential(user.two_factor_secret_encrypted);

  let verified = speakeasy.totp.verify({
    secret,
    encoding: 'base32',
    token: code,
    window: 1,
  });

  if (!verified && user.two_factor_backup_codes && user.two_factor_backup_codes.length > 0) {
    const normalizedCode = code.trim().toUpperCase();
    for (const hash of user.two_factor_backup_codes) {
      if (await comparePassword(normalizedCode, hash)) {
        verified = true;
        break;
      }
    }
  }

  if (!verified) {
    throw new Error('Código 2FA inválido');
  }

  await queries.disableUserTwoFactor(userId);
  await queries.createAuditLog(userId, 'TWO_FACTOR_DISABLED', 'user', userId, {
    method: 'totp_or_backup',
  });
}

export async function changePassword(userId: string, currentPassword: string, newPassword: string): Promise<void> {
  const user = await queries.getUserById(userId);

  if (!user) {
    throw new Error('Usuário não encontrado');
  }

  if (!user.is_active) {
    throw new Error('Usuário inativo');
  }

  const isPasswordValid = await comparePassword(currentPassword, user.password_hash);

  if (!isPasswordValid) {
    throw new Error('Senha atual inválida');
  }

  if (newPassword.length < 8) {
    throw new Error('A nova senha deve ter no mínimo 8 caracteres');
  }

  const newPasswordHash = await hashPassword(newPassword);

  await queries.updateUserPassword(userId, newPasswordHash);

  await queries.createAuditLog(userId, 'PASSWORD_CHANGED', 'user', userId, {
    timestamp: new Date().toISOString(),
  });
}
