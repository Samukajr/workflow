import * as queries from '../database/queries';
import { hashPassword, comparePassword } from '../utils/password';
import { generateToken } from '../utils/jwt';
import { User } from '../types';

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

export async function loginUser(email: string, password: string): Promise<{ user: User; token: string }> {
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

  // Atualizar último login
  await queries.updateLastLogin(user.id);

  // Gerar token
  const token = generateToken({
    id: user.id,
    email: user.email,
    name: user.name,
    department: user.department,
  });

  return { user, token };
}

export async function getUserInfo(userId: string): Promise<User | null> {
  return queries.getUserById(userId);
}
