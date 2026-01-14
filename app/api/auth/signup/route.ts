import { NextResponse } from 'next/server';
import { getUserByUsername, getUserByEmail, createUser } from '@/lib/db/queries';
import { hashPassword } from '@/lib/utils/password';
import { setSessionCookie } from '@/lib/utils/session';
import { validateUsername, validatePassword, validateEmail } from '@/lib/utils/validation';
import { 
  getSignupRateLimiter, 
  getClientIP, 
  checkRateLimit, 
  isRateLimitingEnabled 
} from '@/lib/utils/rateLimit';
import { createLogger } from '@/lib/utils/logger';
import {
  validationError,
  alreadyExistsError,
  internalError,
} from '@/lib/utils/errors';

const logger = createLogger('AuthSignup');

export async function POST(request: Request) {
  try {
    // Rate limiting check
    if (isRateLimitingEnabled()) {
      const ip = getClientIP(request);
      const rateLimitResult = await checkRateLimit(getSignupRateLimiter(), ip);
      if (!rateLimitResult.success) {
        return rateLimitResult.response;
      }
    }

    const body = await request.json();
    const { username, email, password } = body;

    // Validate inputs
    const usernameValidation = validateUsername(username);
    if (!usernameValidation.valid) {
      return validationError(usernameValidation.error || 'Invalid username');
    }

    const emailValidation = validateEmail(email);
    if (!emailValidation.valid) {
      return validationError('Invalid email address');
    }

    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
      return validationError(passwordValidation.error || 'Invalid password');
    }

    const normalizedUsername = usernameValidation.normalized!;
    const normalizedEmail = emailValidation.normalized!;

    // Check if username already exists
    const existingUsername = await getUserByUsername(normalizedUsername);
    if (existingUsername) {
      return alreadyExistsError('Username already taken');
    }

    // Check if email already exists
    const existingEmail = await getUserByEmail(normalizedEmail);
    if (existingEmail) {
      return alreadyExistsError('Email already registered');
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Create user
    const user = await createUser({
      username: normalizedUsername,
      email: normalizedEmail,
      passwordHash: passwordHash,
    });

    logger.debug('New user created', { userId: user.id, username: user.username });

    // Set session cookie
    await setSessionCookie({
      userId: user.id,
      username: user.username,
      email: user.email,
    });

    return NextResponse.json({
      success: true,
      data: {
        userId: user.id,
        username: user.username,
        email: user.email,
      },
    });
  } catch (error) {
    logger.errorWithException('Signup failed', error);
    return internalError('Signup failed');
  }
}
