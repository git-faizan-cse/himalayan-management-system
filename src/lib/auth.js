import { SignJWT, jwtVerify } from 'jose';

const secretKey = process.env.JWT_SECRET || 'super-secret-himalaya-key-change-me';
const encodedKey = new TextEncoder().encode(secretKey);

export async function createSession(userId, role, tenantId) {
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
  const session = await new SignJWT({ userId, role, tenantId })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(encodedKey);
    
  return { session, expiresAt };
}

export async function verifySession(session) {
  try {
    const { payload } = await jwtVerify(session, encodedKey, {
      algorithms: ['HS256'],
    });
    return payload;
  } catch (error) {
    console.log('Failed to verify session');
    return null;
  }
}
