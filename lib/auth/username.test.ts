import { describe, it, expect } from 'vitest';
import { isValidUsername, usernameFromEmail } from './username';

const takenSet = (...names: string[]) => async (name: string) => names.includes(name);

describe('isValidUsername', () => {
  it('accepts what validateUsername accepts', () => {
    expect(isValidUsername('abc')).toBe(true);
    expect(isValidUsername('reader_1-x')).toBe(true);
    expect(isValidUsername('a'.repeat(50))).toBe(true);
  });

  it('rejects short, long, uppercase and dotted names', () => {
    expect(isValidUsername('ab')).toBe(false);
    expect(isValidUsername('a'.repeat(51))).toBe(false);
    expect(isValidUsername('Reader')).toBe(false);
    expect(isValidUsername('has.dot')).toBe(false);
  });
});

describe('usernameFromEmail', () => {
  it('uses the part before the @, cleaned like the old Google callback', async () => {
    expect(await usernameFromEmail('Jane.Doe+news@example.com', takenSet())).toBe('janedoenews');
  });

  it('adds a number when the name is taken', async () => {
    expect(await usernameFromEmail('sam@example.com', takenSet('sam', 'sam1'))).toBe('sam2');
  });

  it('pads names that would be too short', async () => {
    const name = await usernameFromEmail('al@example.com', takenSet());
    expect(isValidUsername(name)).toBe(true);
    expect(name.startsWith('al')).toBe(true);
  });

  it('always returns a valid username', async () => {
    const long = `${'x'.repeat(80)}@example.com`;
    expect(isValidUsername(await usernameFromEmail(long, takenSet()))).toBe(true);
  });
});
