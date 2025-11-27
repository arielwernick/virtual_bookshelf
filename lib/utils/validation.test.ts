import { describe, it, expect } from 'vitest';
import {
  validateUsername,
  validateEmail,
  validatePassword,
  validateItemType,
  validateText,
  validateUrl,
  validateNotes,
} from './validation';

// ============================================================================
// validateUsername Tests
// ============================================================================

describe('validateUsername', () => {
  it('accepts valid username with letters and numbers', () => {
    const result = validateUsername('john123');
    expect(result.valid).toBe(true);
    expect(result.normalized).toBe('john123');
  });

  it('accepts username with underscores and hyphens', () => {
    const result = validateUsername('john_doe-123');
    expect(result.valid).toBe(true);
    expect(result.normalized).toBe('john_doe-123');
  });

  it('normalizes username to lowercase', () => {
    const result = validateUsername('JohnDoe');
    expect(result.valid).toBe(true);
    expect(result.normalized).toBe('johndoe');
  });

  it('trims whitespace from username', () => {
    const result = validateUsername('  john  ');
    expect(result.valid).toBe(true);
    expect(result.normalized).toBe('john');
  });

  it('rejects empty username', () => {
    const result = validateUsername('');
    expect(result.valid).toBe(false);
    expect(result.error).toBe('Username cannot be empty');
  });

  it('rejects whitespace-only username', () => {
    const result = validateUsername('   ');
    expect(result.valid).toBe(false);
    expect(result.error).toBe('Username cannot be empty');
  });

  it('rejects username shorter than 3 characters', () => {
    const result = validateUsername('ab');
    expect(result.valid).toBe(false);
    expect(result.error).toBe('Username must be at least 3 characters');
  });

  it('rejects username longer than 50 characters', () => {
    const result = validateUsername('a'.repeat(51));
    expect(result.valid).toBe(false);
    expect(result.error).toBe('Username must be 50 characters or less');
  });

  it('accepts username exactly 50 characters', () => {
    const result = validateUsername('a'.repeat(50));
    expect(result.valid).toBe(true);
  });

  it('rejects username with spaces', () => {
    const result = validateUsername('john doe');
    expect(result.valid).toBe(false);
    expect(result.error).toBe('Username can only contain letters, numbers, hyphens, and underscores');
  });

  it('rejects username with special characters', () => {
    const result = validateUsername('john@doe');
    expect(result.valid).toBe(false);
    expect(result.error).toBe('Username can only contain letters, numbers, hyphens, and underscores');
  });

  it('rejects username with dots', () => {
    const result = validateUsername('john.doe');
    expect(result.valid).toBe(false);
  });
});

// ============================================================================
// validateEmail Tests
// ============================================================================

describe('validateEmail', () => {
  it('accepts valid email', () => {
    const result = validateEmail('test@example.com');
    expect(result.valid).toBe(true);
    expect(result.normalized).toBe('test@example.com');
  });

  it('normalizes email to lowercase', () => {
    const result = validateEmail('Test@Example.COM');
    expect(result.valid).toBe(true);
    expect(result.normalized).toBe('test@example.com');
  });

  it('trims whitespace from email', () => {
    const result = validateEmail('  test@example.com  ');
    expect(result.valid).toBe(true);
    expect(result.normalized).toBe('test@example.com');
  });

  it('accepts email with subdomain', () => {
    const result = validateEmail('user@mail.example.com');
    expect(result.valid).toBe(true);
  });

  it('accepts email with plus sign', () => {
    const result = validateEmail('user+tag@example.com');
    expect(result.valid).toBe(true);
  });

  it('rejects empty email', () => {
    const result = validateEmail('');
    expect(result.valid).toBe(false);
    expect(result.error).toBe('Email cannot be empty');
  });

  it('rejects email without @ symbol', () => {
    const result = validateEmail('testexample.com');
    expect(result.valid).toBe(false);
    expect(result.error).toBe('Invalid email format');
  });

  it('rejects email without domain', () => {
    const result = validateEmail('test@');
    expect(result.valid).toBe(false);
    expect(result.error).toBe('Invalid email format');
  });

  it('rejects email without TLD', () => {
    const result = validateEmail('test@example');
    expect(result.valid).toBe(false);
    expect(result.error).toBe('Invalid email format');
  });

  it('rejects email longer than 255 characters', () => {
    const longEmail = 'a'.repeat(250) + '@b.com';
    const result = validateEmail(longEmail);
    expect(result.valid).toBe(false);
    expect(result.error).toBe('Email must be 255 characters or less');
  });

  it('rejects email with spaces', () => {
    const result = validateEmail('test @example.com');
    expect(result.valid).toBe(false);
    expect(result.error).toBe('Invalid email format');
  });
});

// ============================================================================
// validatePassword Tests
// ============================================================================

describe('validatePassword', () => {
  it('accepts valid password', () => {
    const result = validatePassword('password123');
    expect(result.valid).toBe(true);
  });

  it('accepts password with special characters', () => {
    const result = validatePassword('P@ssw0rd!');
    expect(result.valid).toBe(true);
  });

  it('accepts password exactly 6 characters', () => {
    const result = validatePassword('123456');
    expect(result.valid).toBe(true);
  });

  it('rejects empty password', () => {
    const result = validatePassword('');
    expect(result.valid).toBe(false);
    expect(result.error).toBe('Password cannot be empty');
  });

  it('rejects password shorter than 6 characters', () => {
    const result = validatePassword('12345');
    expect(result.valid).toBe(false);
    expect(result.error).toBe('Password must be at least 6 characters');
  });

  it('rejects password longer than 100 characters', () => {
    const result = validatePassword('a'.repeat(101));
    expect(result.valid).toBe(false);
    expect(result.error).toBe('Password must be 100 characters or less');
  });

  it('accepts password exactly 100 characters', () => {
    const result = validatePassword('a'.repeat(100));
    expect(result.valid).toBe(true);
  });
});

// ============================================================================
// validateItemType Tests
// ============================================================================

describe('validateItemType', () => {
  it('accepts "book" type', () => {
    const result = validateItemType('book');
    expect(result.valid).toBe(true);
  });

  it('accepts "podcast" type', () => {
    const result = validateItemType('podcast');
    expect(result.valid).toBe(true);
  });

  it('accepts "music" type', () => {
    const result = validateItemType('music');
    expect(result.valid).toBe(true);
  });

  it('rejects invalid type', () => {
    const result = validateItemType('movie');
    expect(result.valid).toBe(false);
    expect(result.error).toBe('Type must be one of: book, podcast, music');
  });

  it('rejects empty type', () => {
    const result = validateItemType('');
    expect(result.valid).toBe(false);
  });

  it('rejects uppercase type', () => {
    const result = validateItemType('BOOK');
    expect(result.valid).toBe(false);
  });
});

// ============================================================================
// validateText Tests
// ============================================================================

describe('validateText', () => {
  it('accepts valid text', () => {
    const result = validateText('Hello World', 'Title');
    expect(result.valid).toBe(true);
  });

  it('accepts text with special characters', () => {
    const result = validateText("The Great Gatsby: A Novel!", 'Title');
    expect(result.valid).toBe(true);
  });

  it('rejects empty text', () => {
    const result = validateText('', 'Title');
    expect(result.valid).toBe(false);
    expect(result.error).toBe('Title cannot be empty');
  });

  it('rejects whitespace-only text', () => {
    const result = validateText('   ', 'Title');
    expect(result.valid).toBe(false);
    expect(result.error).toBe('Title cannot be empty');
  });

  it('rejects text longer than default max (255)', () => {
    const result = validateText('a'.repeat(256), 'Title');
    expect(result.valid).toBe(false);
    expect(result.error).toBe('Title must be 255 characters or less');
  });

  it('accepts text exactly at max length', () => {
    const result = validateText('a'.repeat(255), 'Title');
    expect(result.valid).toBe(true);
  });

  it('uses custom field name in error', () => {
    const result = validateText('', 'Author');
    expect(result.error).toBe('Author cannot be empty');
  });

  it('respects custom max length', () => {
    const result = validateText('a'.repeat(11), 'Code', 10);
    expect(result.valid).toBe(false);
    expect(result.error).toBe('Code must be 10 characters or less');
  });
});

// ============================================================================
// validateUrl Tests
// ============================================================================

describe('validateUrl', () => {
  it('accepts valid http URL', () => {
    const result = validateUrl('http://example.com');
    expect(result.valid).toBe(true);
  });

  it('accepts valid https URL', () => {
    const result = validateUrl('https://example.com');
    expect(result.valid).toBe(true);
  });

  it('accepts URL with path', () => {
    const result = validateUrl('https://example.com/path/to/resource');
    expect(result.valid).toBe(true);
  });

  it('accepts URL with query params', () => {
    const result = validateUrl('https://example.com?foo=bar&baz=qux');
    expect(result.valid).toBe(true);
  });

  it('accepts empty URL (optional field)', () => {
    const result = validateUrl('');
    expect(result.valid).toBe(true);
  });

  it('rejects URL without protocol', () => {
    const result = validateUrl('example.com');
    expect(result.valid).toBe(false);
    expect(result.error).toBe('URL must be a valid URL');
  });

  it('rejects URL with invalid protocol', () => {
    const result = validateUrl('ftp://example.com');
    expect(result.valid).toBe(false);
    expect(result.error).toBe('URL must use http or https protocol');
  });

  it('rejects javascript protocol', () => {
    const result = validateUrl('javascript:alert(1)');
    expect(result.valid).toBe(false);
  });

  it('rejects URL longer than 2048 characters', () => {
    const result = validateUrl('https://example.com/' + 'a'.repeat(2040));
    expect(result.valid).toBe(false);
    expect(result.error).toBe('URL must be 2048 characters or less');
  });

  it('uses custom field name in error', () => {
    const result = validateUrl('invalid', 'Image URL');
    expect(result.error).toBe('Image URL must be a valid URL');
  });
});

// ============================================================================
// validateNotes Tests
// ============================================================================

describe('validateNotes', () => {
  it('accepts valid notes', () => {
    const result = validateNotes('This is a great book!');
    expect(result.valid).toBe(true);
  });

  it('accepts empty notes (optional field)', () => {
    const result = validateNotes('');
    expect(result.valid).toBe(true);
  });

  it('accepts notes with special characters and newlines', () => {
    const result = validateNotes('Line 1\nLine 2\n- Bullet point\n* Another point');
    expect(result.valid).toBe(true);
  });

  it('accepts notes up to 5000 characters', () => {
    const result = validateNotes('a'.repeat(5000));
    expect(result.valid).toBe(true);
  });

  it('rejects notes longer than 5000 characters', () => {
    const result = validateNotes('a'.repeat(5001));
    expect(result.valid).toBe(false);
    expect(result.error).toBe('Notes must be 5000 characters or less');
  });
});
