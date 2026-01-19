import { NextResponse } from 'next/server';
import { getUserByUsername } from '@/lib/db/queries';
import { verifyPassword } from '@/lib/utils/password';
import { setSessionCookie } from '@/lib/utils/session';
import { validateUsername, validatePassword } from '@/lib/utils/validation';
import { 
  getLoginRateLimiter, 
  getClientIP, 
  checkRateLimit, 
  isRateLimitingEnabled 
} from '@/lib/utils/rateLimit';
import { createLogger } from '@/lib/utils/logger';
import {
  validationError,
  invalidCredentialsError,
  internalError,
} from '@/lib/utils/errors';

const logger = createLogger('AuthLogin');

export async function POST(request: Request) {
  try {
    // Rate limiting check
    if (isRateLimitingEnabled()) {
      const ip = getClientIP(request);
      const rateLimitResult = await checkRateLimit(getLoginRateLimiter(), ip);
      if (!rateLimitResult.success) {
        return rateLimitResult.response;
      }
    }

    const body = await request.json();
    const { username, password } = body;

    // Validate inputs
    const usernameValidation = validateUsername(username);
    if (!usernameValidation.valid) {
      return validationError('Invalid username');
    }

    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
      return validationError('Invalid password');
    }

    const normalizedUsername = usernameValidation.normalized!;

    // Get user
    const user = await getUserByUsername(normalizedUsername);
    if (!user) {
      return invalidCredentialsError('Invalid username or password');
    }

    // Check if user has password (not Google-only)
    if (!user.password_hash) {
      return invalidCredentialsError('This account uses Google authentication. Please sign in with Google.');
    }

    // Verify password
    const isValid = await verifyPassword(password, user.password_hash);
    if (!isValid) {
      return invalidCredentialsError('Invalid username or password');
    }

    // Set session cookie
    await setSessionCookie({
      userId: user.id,
      username: user.username,
      email: user.email,
    });

    return NextResponse.json({
      success: true,
      data: {
        username: user.username,
      },
    });
  } catch (error) {
    logger.errorWithException('Login failed', error);
    return internalError('Login failed');
  }
}
