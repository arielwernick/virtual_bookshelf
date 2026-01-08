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
      return NextResponse.json(
        { success: false, error: usernameValidation.error || 'Invalid username' },
        { status: 400 }
      );
    }

    const emailValidation = validateEmail(email);
    if (!emailValidation.valid) {
      return NextResponse.json(
        { success: false, error: 'Invalid email address' },
        { status: 400 }
      );
    }

    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
      return NextResponse.json(
        { success: false, error: passwordValidation.error || 'Invalid password' },
        { status: 400 }
      );
    }

    const normalizedUsername = usernameValidation.normalized!;
    const normalizedEmail = emailValidation.normalized!;

    // Check if username already exists
    const existingUsername = await getUserByUsername(normalizedUsername);
    if (existingUsername) {
      return NextResponse.json(
        { success: false, error: 'Username already taken' },
        { status: 409 }
      );
    }

    // Check if email already exists
    const existingEmail = await getUserByEmail(normalizedEmail);
    if (existingEmail) {
      return NextResponse.json(
        { success: false, error: 'Email already registered' },
        { status: 409 }
      );
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
    return NextResponse.json(
      { success: false, error: 'Signup failed' },
      { status: 500 }
    );
  }
}
