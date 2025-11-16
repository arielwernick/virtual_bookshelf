import { NextResponse } from 'next/server';
import { createUser, getUserByUsername } from '@/lib/db/queries';
import { hashPassword } from '@/lib/utils/password';
import { validateUsername, validatePassword } from '@/lib/utils/validation';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { username, password } = body;

    // Validate username
    const usernameValidation = validateUsername(username);
    if (!usernameValidation.valid) {
      return NextResponse.json(
        { success: false, error: usernameValidation.error },
        { status: 400 }
      );
    }

    // Validate password
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
      return NextResponse.json(
        { success: false, error: passwordValidation.error },
        { status: 400 }
      );
    }

    const normalizedUsername = usernameValidation.normalized!;

    // Check if username already exists
    const existingUser = await getUserByUsername(normalizedUsername);
    if (existingUser) {
      return NextResponse.json(
        { success: false, error: 'Username already taken' },
        { status: 409 }
      );
    }

    // Hash password and create user
    const passwordHash = await hashPassword(password);
    const user = await createUser(normalizedUsername, passwordHash);

    return NextResponse.json({
      success: true,
      data: {
        id: user.id,
        username: user.username,
        created_at: user.created_at,
      },
    });
  } catch (error) {
    console.error('Error creating shelf:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create shelf' },
      { status: 500 }
    );
  }
}
