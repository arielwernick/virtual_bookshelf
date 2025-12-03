# TASK-004: Improve Password Complexity Requirements

**Priority:** 🟠 High  
**Estimated Effort:** 1 hour  
**Security Impact:** Prevent weak password attacks

---

## Context

Current password validation only checks minimum length (6 characters). Users can set extremely weak passwords like:
- `123456`
- `password`
- `qwerty`
- `aaaaaa`

This makes accounts vulnerable to dictionary attacks and credential stuffing.

---

## Requirements

1. Increase minimum password length to 8 characters
2. Require at least one uppercase letter
3. Require at least one lowercase letter
4. Require at least one number
5. Optionally block common passwords
6. Update error messages to be user-friendly
7. Update signup form to show password requirements

---

## Implementation Guide

### Step 1: Update Password Validation

Modify `lib/utils/validation.ts`:

```typescript
/**
 * Common passwords to block (top 100 most common)
 */
const COMMON_PASSWORDS = new Set([
  'password', 'password1', 'password123', '12345678', '123456789',
  'qwerty123', 'abc12345', 'password1!', 'iloveyou', 'sunshine',
  'princess', 'football', 'welcome1', 'shadow12', 'superman',
  'michael1', 'jennifer', 'charlie1', 'ashley12', 'jessica1',
  // Add more as needed
]);

/**
 * Password validation result with detailed feedback
 */
export interface PasswordValidationResult {
  valid: boolean;
  error?: string;
  requirements?: {
    minLength: boolean;
    hasUppercase: boolean;
    hasLowercase: boolean;
    hasNumber: boolean;
    notCommon: boolean;
  };
}

/**
 * Validate password strength
 */
export function validatePassword(password: string): PasswordValidationResult {
  const requirements = {
    minLength: password.length >= 8,
    hasUppercase: /[A-Z]/.test(password),
    hasLowercase: /[a-z]/.test(password),
    hasNumber: /[0-9]/.test(password),
    notCommon: !COMMON_PASSWORDS.has(password.toLowerCase()),
  };

  if (password.length === 0) {
    return { valid: false, error: 'Password is required', requirements };
  }

  if (password.length > 100) {
    return { valid: false, error: 'Password must be 100 characters or less', requirements };
  }

  if (!requirements.minLength) {
    return { 
      valid: false, 
      error: 'Password must be at least 8 characters',
      requirements 
    };
  }

  if (!requirements.hasUppercase) {
    return { 
      valid: false, 
      error: 'Password must contain at least one uppercase letter',
      requirements 
    };
  }

  if (!requirements.hasLowercase) {
    return { 
      valid: false, 
      error: 'Password must contain at least one lowercase letter',
      requirements 
    };
  }

  if (!requirements.hasNumber) {
    return { 
      valid: false, 
      error: 'Password must contain at least one number',
      requirements 
    };
  }

  if (!requirements.notCommon) {
    return { 
      valid: false, 
      error: 'This password is too common. Please choose a stronger password.',
      requirements 
    };
  }

  return { valid: true, requirements };
}

/**
 * Get password requirements text for UI display
 */
export function getPasswordRequirementsText(): string[] {
  return [
    'At least 8 characters',
    'At least one uppercase letter (A-Z)',
    'At least one lowercase letter (a-z)',
    'At least one number (0-9)',
  ];
}
```

### Step 2: Update Validation Tests

Add to `lib/utils/validation.test.ts`:

```typescript
describe('validatePassword', () => {
  it('should reject passwords shorter than 8 characters', () => {
    expect(validatePassword('Short1A').valid).toBe(false);
    expect(validatePassword('Short1A').error).toContain('8 characters');
  });

  it('should reject passwords without uppercase', () => {
    expect(validatePassword('lowercase1').valid).toBe(false);
    expect(validatePassword('lowercase1').error).toContain('uppercase');
  });

  it('should reject passwords without lowercase', () => {
    expect(validatePassword('UPPERCASE1').valid).toBe(false);
    expect(validatePassword('UPPERCASE1').error).toContain('lowercase');
  });

  it('should reject passwords without numbers', () => {
    expect(validatePassword('NoNumbersHere').valid).toBe(false);
    expect(validatePassword('NoNumbersHere').error).toContain('number');
  });

  it('should reject common passwords', () => {
    expect(validatePassword('Password123').valid).toBe(false);
    expect(validatePassword('Password123').error).toContain('common');
  });

  it('should accept strong passwords', () => {
    expect(validatePassword('StrongP4ss!').valid).toBe(true);
    expect(validatePassword('MySecure123').valid).toBe(true);
  });

  it('should return requirements object', () => {
    const result = validatePassword('weak');
    expect(result.requirements).toBeDefined();
    expect(result.requirements?.minLength).toBe(false);
  });
});
```

### Step 3: Update Signup Form UI

Update `app/signup/page.tsx` to show requirements:

```tsx
import { getPasswordRequirementsText } from '@/lib/utils/validation';

// In the component:
const passwordRequirements = getPasswordRequirementsText();

// In the JSX, add after password input:
<div className="mt-2 text-sm text-gray-500">
  <p className="font-medium mb-1">Password must have:</p>
  <ul className="list-disc list-inside space-y-1">
    {passwordRequirements.map((req, i) => (
      <li key={i}>{req}</li>
    ))}
  </ul>
</div>
```

### Step 4: Add Real-time Validation (Optional Enhancement)

```tsx
// Component state
const [passwordStrength, setPasswordStrength] = useState<PasswordValidationResult | null>(null);

// On password change
const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  const newPassword = e.target.value;
  setPassword(newPassword);
  if (newPassword.length > 0) {
    setPasswordStrength(validatePassword(newPassword));
  } else {
    setPasswordStrength(null);
  }
};

// Visual indicator in JSX
{passwordStrength && (
  <div className="mt-2 space-y-1">
    <RequirementCheck met={passwordStrength.requirements?.minLength} text="8+ characters" />
    <RequirementCheck met={passwordStrength.requirements?.hasUppercase} text="Uppercase letter" />
    <RequirementCheck met={passwordStrength.requirements?.hasLowercase} text="Lowercase letter" />
    <RequirementCheck met={passwordStrength.requirements?.hasNumber} text="Number" />
  </div>
)}

// Helper component
function RequirementCheck({ met, text }: { met?: boolean; text: string }) {
  return (
    <div className={`flex items-center text-sm ${met ? 'text-green-600' : 'text-gray-400'}`}>
      {met ? '✓' : '○'} {text}
    </div>
  );
}
```

---

## Files to Modify

| File | Action |
|------|--------|
| `lib/utils/validation.ts` | Modify - Add password complexity rules |
| `lib/utils/validation.test.ts` | Add - New test cases |
| `app/signup/page.tsx` | Modify - Show password requirements |
| `app/api/auth/signup/route.ts` | No change - uses existing validation |

---

## Acceptance Criteria

- [ ] Passwords must be at least 8 characters
- [ ] Passwords must contain uppercase letter
- [ ] Passwords must contain lowercase letter
- [ ] Passwords must contain number
- [ ] Common passwords are rejected
- [ ] Signup form shows password requirements
- [ ] Error messages are user-friendly
- [ ] Existing tests still pass
- [ ] New tests cover all requirements

---

## Testing Instructions

### Manual Testing

1. Try to sign up with weak passwords:
   - `short` - should fail (too short)
   - `longenoughbutnocase123` - should fail (no uppercase)
   - `ALLUPPERCASE123` - should fail (no lowercase)
   - `NoNumbersHere` - should fail (no number)
   - `Password123` - should fail (common password)
2. Sign up with strong password: `MyStr0ngP4ss` - should succeed
3. Verify UI shows requirements

### Run Tests

```bash
npm run test -- validation.test.ts
```

---

## Migration Considerations

**Existing Users:** This change only affects new signups and password changes. Existing users with weak passwords will continue to work until they change their password.

**Optional:** Consider prompting existing users to update weak passwords on their next login (future enhancement).

---

## References

- Original audit finding: `docs/SECURITY_AUDIT.md` - Finding #4
- NIST SP 800-63B: [Digital Identity Guidelines](https://pages.nist.gov/800-63-3/sp800-63b.html)
- OWASP: [Authentication Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html)
