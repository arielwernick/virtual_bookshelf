import { NextResponse } from 'next/server';
import { getUserByUsername } from '@/lib/db/queries';
import { verifyPassword } from '@/lib/utils/password';
import { setSessionCookie } from '@/lib/utils/session';
import { validateUsername, validatePassword } from '@/lib/utils/validation';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { username, password } = body;

    // Validate inputs
    const usernameValidation = validateUsername(username);
    if (!usernameValidation.valid) {
      return NextResponse.json(
        { success: false, error: 'Invalid username' },
        { status: 400 }
      );
    }

    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
      return NextResponse.json(
        { success: false, error: 'Invalid password' },
        { status: 400 }
      );
    }

    const normalizedUsername = usernameValidation.normalized!;

    // Get user
    const user = await getUserByUsername(normalizedUsername);
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Invalid username or password' },
        { status: 401 }
      );
    }

    // Verify password
    const isValid = await verifyPassword(password, user.password_hash);
    if (!isValid) {
      return NextResponse.json(
        { success: false, error: 'Invalid username or password' },
        { status: 401 }
      );
    }

    // Set session cookie
    await setSessionCookie({
      userId: user.id,
      username: user.username,
    });

    return NextResponse.json({
      success: true,
      data: {
        username: user.username,
      },
    });
  } catch (error) {
    console.error('Error during login:', error);
    return NextResponse.json(
      { success: false, error: 'Login failed' },
      { status: 500 }
    );
  }
}
