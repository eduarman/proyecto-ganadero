import { randomBytes, createHash } from 'node:crypto';

// Patrón de token de un solo uso: el valor crudo solo existe en el link
// enviado por email; en base solo se guarda su hash SHA-256 (mismo criterio
// que tokens_recuperacion / tokens_verificacion_email).
export function hashOpaqueToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

export function generateOpaqueToken(): { raw: string; hash: string } {
  const raw = randomBytes(32).toString('hex');
  return { raw, hash: hashOpaqueToken(raw) };
}
