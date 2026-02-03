# Contributing to Virtual Bookshelf

Thank you for your interest in contributing to Virtual Bookshelf! This document provides guidelines and best practices for contributing to the project.

---

## Table of Contents

1. [Getting Started](#getting-started)
2. [Development Workflow](#development-workflow)
3. [Code Standards](#code-standards)
4. [Commit Guidelines](#commit-guidelines)
5. [Pull Request Process](#pull-request-process)
6. [Documentation](#documentation)
7. [Testing](#testing)

---

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL database ([Neon](https://neon.tech) recommended)
- Git
- VS Code (recommended)

### Initial Setup

```bash
# Clone the repository
git clone https://github.com/arielwernick/virtual_bookshelf.git
cd virtual_bookshelf

# Install dependencies
npm install

# Copy environment template
cp .env.example .env.local
# Edit .env.local with your credentials

# Start development server
npm run dev
```

### Recommended VS Code Extensions

- ESLint
- Prettier
- Tailwind CSS IntelliSense
- TypeScript Importer

---

## Development Workflow

### Branch Naming

Use descriptive branch names with prefixes:

| Prefix | Use Case | Example |
|--------|----------|---------|
| `feature/` | New features | `feature/text-to-shelf-import` |
| `fix/` | Bug fixes | `fix/modal-close-button` |
| `chore/` | Maintenance | `chore/update-dependencies` |
| `docs/` | Documentation | `docs/api-documentation` |
| `refactor/` | Code refactoring | `refactor/auth-flow` |

### Standard Workflow

```bash
# 1. Create a branch from main
git checkout main
git pull
git checkout -b feature/your-feature-name

# 2. Make changes and commit frequently
git add .
git commit -m "feat: add new component"

# 3. Push to remote
git push -u origin feature/your-feature-name

# 4. Create Pull Request on GitHub
```

---

## Code Standards

### File Organization

```
app/                    # Next.js App Router pages and API routes
components/             # React components (grouped by feature)
lib/
  ├── api/              # External API clients
  ├── constants/        # Application constants
  ├── db/               # Database client and queries
  ├── hooks/            # Custom React hooks
  ├── types/            # TypeScript type definitions
  └── utils/            # Utility functions
docs/                   # All documentation
test/                   # Test setup and utilities
```

### Required Reading

Before contributing, please read:

1. **[Code Patterns](docs/PATTERNS.md)** - Standard patterns to follow
2. **[Anti-Patterns](docs/ANTI_PATTERNS.md)** - Patterns to avoid
3. **[Copilot Instructions](.github/copilot-instructions.md)** - Project context

### TypeScript Guidelines

- Define types in `lib/types/shelf.ts`
- No implicit `any` types
- Use `interface` for object shapes
- Use `type` for unions and aliases

```typescript
// ✅ GOOD
interface UserProps {
  user: User;
  onSelect?: (user: User) => void;
}

// ❌ BAD
interface UserProps {
  user: any;
  onSelect?: Function;
}
```

### Import Order

```typescript
// 1. External packages
import { useState } from 'react';
import { NextResponse } from 'next/server';

// 2. Internal absolute imports
import { User } from '@/lib/types/shelf';
import { getUser } from '@/lib/db/queries';

// 3. Relative imports
import { UserCard } from './UserCard';
```

### Component Structure

```typescript
'use client'; // Only if using client features

import { ... } from '...';

// Types
interface ComponentProps { ... }

// Component
export function Component({ prop1, prop2 }: ComponentProps) {
  // State
  const [state, setState] = useState();

  // Handlers
  const handleClick = () => { ... };

  // Render
  return ( ... );
}
```

---

## Commit Guidelines

### Commit Message Format

```
<type>: <description>

[optional body]

[optional footer]
```

### Types

| Type | Description |
|------|-------------|
| `feat` | New feature |
| `fix` | Bug fix |
| `docs` | Documentation only |
| `style` | Formatting, no code change |
| `refactor` | Code change that neither fixes bug nor adds feature |
| `test` | Adding or updating tests |
| `chore` | Maintenance, dependencies |

### Examples

```bash
# Feature
git commit -m "feat: add star rating to items"

# Bug fix
git commit -m "fix: prevent modal from closing on outside click"

# With body
git commit -m "feat: add text-to-shelf import feature

- Parse text input for book/podcast/music items
- Support multiple formats (numbered lists, bullet points)
- Add preview before import"

# Breaking change
git commit -m "feat!: change API response format

BREAKING CHANGE: API now returns { success, data } instead of raw data"
```

---

## Pull Request Process

### Before Creating PR

1. **Run tests**: `npm run test:run`
2. **Run linter**: `npm run lint`
3. **Build check**: `npm run build`
4. **Update documentation** if needed

### PR Title Format

Use the same format as commit messages:

```
feat: add text-to-shelf import feature
fix: resolve modal accessibility issues
docs: update API documentation
```

### PR Description Template

```markdown
## Summary
Brief description of changes

## Changes
- List of specific changes
- Another change

## Testing
- How to test the changes
- Any specific test cases

## Screenshots (if UI changes)
[Add screenshots]

## Checklist
- [ ] Tests pass locally
- [ ] Linting passes
- [ ] Documentation updated
- [ ] No console errors
```

### Review Process

1. At least 1 approval required
2. All CI checks must pass
3. No unresolved conversations
4. Branch must be up to date with main

---

## Documentation

### Where Documentation Lives

```
docs/
├── guides/           # Setup and operational guides
├── prds/             # Product requirement documents
├── task-lists/       # Implementation task lists
├── architecture/     # System design documentation
├── PATTERNS.md       # Code patterns to follow
└── ANTI_PATTERNS.md  # Patterns to avoid
```

### When to Document

- New features require a PRD in `docs/prds/`
- New patterns should be added to `docs/PATTERNS.md`
- API changes require updating relevant docs
- Complex logic should have inline comments

### Documentation Style

- Use Markdown
- Include code examples
- Keep it up to date
- Use tables for structured data

---

## Testing

### Running Tests

```bash
# Run all tests in watch mode
npm run test

# Run tests once
npm run test:run

# Run with coverage
npm run test:ci

# Run specific test file
npm run test -- ItemCard.test.tsx
```

### Test File Location

- Place tests next to the code they test
- Use `.test.ts(x)` extension

```
components/shelf/
├── ItemCard.tsx
├── ItemCard.test.tsx
├── ShelfGrid.tsx
└── ShelfGrid.test.tsx
```

### Test Structure

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';

// Mock setup
vi.mock('@/lib/db/queries', () => ({ ... }));

// Helper functions
function createMockData(overrides = {}) { ... }

describe('ComponentName', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders correctly', () => { ... });
  });

  describe('Interactions', () => {
    it('handles click', () => { ... });
  });

  describe('Edge Cases', () => {
    it('handles empty data', () => { ... });
  });
});
```

### What to Test

- ✅ Component rendering with different props
- ✅ User interactions (clicks, typing)
- ✅ Error states and edge cases
- ✅ API response handling
- ❌ Implementation details
- ❌ Third-party library internals

---

## Questions?

- Check existing documentation in `docs/`
- Review similar code in the codebase
- Open an issue for discussion

Thank you for contributing! 🎉
