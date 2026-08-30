import { randomBytes } from 'crypto';

/**
 * Generates a temporary credential for admin-issued accounts.
 * Returned once at creation time; only the Argon2 hash is persisted.
 */
export function generateTemporaryPassword(length = 14): string {
  const alphabet =
    'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%';
  const bytes = randomBytes(length);
  let password = '';

  for (let index = 0; index < length; index += 1) {
    password += alphabet[bytes[index] % alphabet.length];
  }

  return password;
}
