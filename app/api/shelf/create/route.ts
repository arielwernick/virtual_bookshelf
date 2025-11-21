import { NextResponse } from 'next/server';
import { createUser, getUserByUsername, createShelf } from '@/lib/db/queries';
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

    // Hash password and create user account
    const passwordHash = await hashPassword(password);
    const user = await createUser(normalizedUsername, passwordHash);

    // Create a default shelf for the user
    const defaultShelf = await createShelf(user.id, {
      name: 'My Shelf',
      description: null,
      is_default: true,
    });

    return NextResponse.json({
      success: true,
      data: {
        id: user.id,
        username: user.username,
        defaultShelfId: defaultShelf.id,
        created_at: user.created_at,
      },
    });
  } catch (error) {
    console.error('Error creating user account:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create account' },
      { status: 500 }
    );
  }
}
