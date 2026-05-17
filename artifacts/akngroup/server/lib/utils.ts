import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User } from '../../shared/mlm-types';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-it';
const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET || 'your-refresh-secret-key-change-it';

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 10);
}

export function generateReferralCode(length: number | string = 6) {
  if (typeof length === 'string') {
    // create a short deterministic code from the string
    return Buffer.from(length).toString('base64').replace(/[^A-Z0-9]/gi, '').substring(0, 8).toUpperCase();
  }
  return Math.random().toString(36).substring(2, 2 + length).toUpperCase();
}

export function generateId(): string {
  return Math.random().toString(36).substr(2, 9);
}

export const hashPasswordBcrypt = hashPassword;

export function verifyPassword(password: string, hash: string) {
  if (!password || !hash) {
    return false;
  }
  try {
    return bcrypt.compareSync(String(password), hash);
  } catch (e) {
    return false;
  }
}

export const verifyPasswordBcrypt = verifyPassword;
export const comparePassword = verifyPassword;

export function generateAccessToken(user: { id?: string; userId?: string; email?: string; role?: string }) {
  const id = (user as any).id || (user as any).userId;
  return jwt.sign({ userId: id, email: (user as any).email, role: (user as any).role }, JWT_SECRET, { expiresIn: '15m' });
}

export function generateRefreshToken(user: { id?: string; userId?: string }) {
  const id = (user as any).id || (user as any).userId;
  return jwt.sign({ userId: id }, REFRESH_TOKEN_SECRET, { expiresIn: '7d' });
}

export function verifyAccessToken(token: string) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
}

export function verifyRefreshToken(token: string) {
  try {
    return jwt.verify(token, REFRESH_TOKEN_SECRET);
  } catch (error) {
    return null;
  }
}

export function sanitizeUserData(user: User) {
  const { password, ...userWithoutPassword } = user;
  return userWithoutPassword;
}

export function isValidPhone(phone: string) {
  return /^\+?[\d\s-]{10,}$/.test(phone);
}

export function calculateSpiritualNumber(name: string, birthDate: Date | string): number {
  return 7; // Mock calculation
}

export function calculateMembershipExpiry(startDate: Date, durationDays: number): Date {
  const date = new Date(startDate);
  date.setDate(date.getDate() + durationDays);
  return date;
}
