import { SignJWT, jwtVerify } from 'jose';

export const COOKIE_NAME = 'sid';
const rawSecret = process.env.AUTH_JWT_SECRET || 'dev-secret-change-me';
const SECRET_KEY = new TextEncoder().encode(rawSecret);

// Enforce a minimum secret size for HS256 (recommend >= 32 bytes / 256 bits)
const MIN_SECRET_BYTES = 32;
if (SECRET_KEY.length < MIN_SECRET_BYTES) {
  const msg = `AUTH_JWT_SECRET is too short (${SECRET_KEY.length} bytes). Use at least ${MIN_SECRET_BYTES} bytes (e.g., 32 random bytes).`;
  if (process.env.NODE_ENV === 'production') {
    throw new Error(msg);
  } else {
    console.warn(msg);
  }
}

export async function signToken(payload, opts = {}) {
  const expHours = opts.expiresInHours || 8;
  const expiration = Math.floor(Date.now() / 1000) + expHours * 60 * 60;
  return await new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime(expiration)
    .setIssuedAt()
    .sign(SECRET_KEY);
}

export async function verifyTokenAsync(token) {
  try {
    const { payload } = await jwtVerify(token, SECRET_KEY, { algorithms: ['HS256'] });
    return payload;
  } catch {
    return null;
  }
}

// Backwards shim for places calling verifyToken(token)
export function verifyToken(token) {
  // This returns a Promise in edge contexts; middleware can await if needed.
  return verifyTokenAsync(token);
}

export function getSpecialUsernames() {
  const env = process.env.SPECIAL_USERNAMES || 'gatunoide,mozarelle20';
  return env.split(',').map(s => s.trim().toLowerCase()).filter(Boolean);
}
