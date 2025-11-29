# Contributing to Hotel Billing Management System

Thank you for your interest in contributing! This document provides guidelines and instructions for contributing to this project.

## 📋 Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Process](#development-process)
- [Pull Request Process](#pull-request-process)
- [Coding Standards](#coding-standards)
- [Testing Guidelines](#testing-guidelines)
- [Commit Message Guidelines](#commit-message-guidelines)

## 📜 Code of Conduct

- Be respectful and inclusive
- Welcome newcomers and help them get started
- Focus on constructive feedback
- Respect differing viewpoints and experiences

## 🚀 Getting Started

1. **Fork the repository**
   ```bash
   # Click "Fork" on GitHub
   ```

2. **Clone your fork**
   ```bash
   git clone https://github.com/your-username/hotel-billing-admin.git
   cd hotel-billing-admin
   ```

3. **Add upstream remote**
   ```bash
   git remote add upstream https://github.com/original-owner/hotel-billing-admin.git
   ```

4. **Install dependencies**
   ```bash
   npm install
   ```

5. **Set up environment**
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your configuration
   ```

6. **Run the development server**
   ```bash
   npm run dev
   ```

## 💻 Development Process

### 1. Create a Branch

```bash
# Update your fork
git checkout main
git pull upstream main

# Create a feature branch
git checkout -b feature/your-feature-name
# or
git checkout -b fix/your-bug-fix
```

### 2. Make Your Changes

- Write clean, readable code
- Follow the existing code style
- Add comments for complex logic
- Update documentation as needed

### 3. Test Your Changes

```bash
# Run all tests
npm test

# Run specific test
npm test -- path/to/test

# Run tests in watch mode
npm run test:watch

# Check for linting errors
npm run lint
```

### 4. Commit Your Changes

```bash
git add .
git commit -m "feat: add new feature"
```

See [Commit Message Guidelines](#commit-message-guidelines) below.

### 5. Push to Your Fork

```bash
git push origin feature/your-feature-name
```

## 🔄 Pull Request Process

1. **Update your branch**
   ```bash
   git checkout main
   git pull upstream main
   git checkout feature/your-feature-name
   git rebase main
   ```

2. **Create Pull Request**
   - Go to GitHub and create a PR
   - Fill in the PR template
   - Link any related issues

3. **PR Requirements**
   - ✅ All tests pass
   - ✅ No linting errors
   - ✅ Code is documented
   - ✅ Changes are described clearly
   - ✅ Screenshots for UI changes

4. **Review Process**
   - Maintainers will review your PR
   - Address any requested changes
   - Once approved, your PR will be merged

## 📝 Coding Standards

### TypeScript/JavaScript

- Use TypeScript for all new code
- Use functional components with hooks
- Prefer `const` over `let`, avoid `var`
- Use meaningful variable names
- Keep functions small and focused

```typescript
// Good
const calculateTotal = (items: OrderItem[]): number => {
  return items.reduce((sum, item) => sum + item.price * item.quantity, 0);
};

// Avoid
function calc(x: any) {
  let t = 0;
  for (let i = 0; i < x.length; i++) {
    t = t + x[i].p * x[i].q;
  }
  return t;
}
```

### React Components

- Use functional components
- Extract reusable logic into custom hooks
- Keep components focused on one responsibility
- Use proper TypeScript types

```typescript
// Good
interface ButtonProps {
  label: string;
  onClick: () => void;
  disabled?: boolean;
}

export function Button({ label, onClick, disabled = false }: ButtonProps) {
  return (
    <button onClick={onClick} disabled={disabled}>
      {label}
    </button>
  );
}
```

### CSS/Styling

- Use Tailwind CSS utility classes
- Follow mobile-first approach
- Keep custom CSS minimal
- Use consistent spacing

```tsx
// Good
<div className="flex items-center gap-4 p-4 rounded-lg bg-white shadow-md">
  <span className="text-lg font-semibold">Title</span>
</div>
```

### File Organization

```
app/
  ├── (auth)/          # Auth-related pages
  ├── (dashboard)/     # Dashboard pages
  └── api/             # API routes
components/            # Reusable components
contexts/              # React contexts
lib/                   # Utility functions
types/                 # TypeScript types
__tests__/             # Test files
```

## 🧪 Testing Guidelines

### Unit Tests

- Test individual functions and components
- Mock external dependencies
- Use descriptive test names

```typescript
describe('calculateTotal', () => {
  it('should calculate total for multiple items', () => {
    const items = [
      { price: 10, quantity: 2 },
      { price: 5, quantity: 3 },
    ];
    expect(calculateTotal(items)).toBe(35);
  });

  it('should return 0 for empty array', () => {
    expect(calculateTotal([])).toBe(0);
  });
});
```

### Property-Based Tests

- Use fast-check for property tests
- Test with random inputs
- Verify invariants hold

```typescript
test('Property: Total is always non-negative', () => {
  fc.assert(
    fc.property(
      fc.array(fc.record({ price: fc.float({ min: 0 }), quantity: fc.nat() })),
      (items) => {
        const total = calculateTotal(items);
        expect(total).toBeGreaterThanOrEqual(0);
      }
    )
  );
});
```

### Integration Tests

- Test API endpoints
- Test component interactions
- Use realistic test data

## 📝 Commit Message Guidelines

Follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

### Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

### Examples

```bash
feat(billing): add discount calculation

Add support for percentage-based discounts on invoices.
Discounts are applied before GST and service charges.

Closes #123

---

fix(auth): resolve login redirect issue

Users were not being redirected to dashboard after login.
Fixed by updating the redirect logic in the login handler.

---

docs(readme): update installation instructions

Added steps for database setup and environment configuration.

---

test(menu): add property tests for menu CRUD

Added fast-check property tests to verify menu operations
maintain data integrity across all inputs.
```

## 🐛 Reporting Bugs

### Before Submitting

- Check if the bug has already been reported
- Verify it's reproducible in the latest version
- Collect relevant information

### Bug Report Template

```markdown
**Describe the bug**
A clear description of what the bug is.

**To Reproduce**
Steps to reproduce the behavior:
1. Go to '...'
2. Click on '...'
3. See error

**Expected behavior**
What you expected to happen.

**Screenshots**
If applicable, add screenshots.

**Environment:**
- OS: [e.g. Windows 11]
- Browser: [e.g. Chrome 120]
- Version: [e.g. 1.0.0]

**Additional context**
Any other relevant information.
```

## 💡 Suggesting Features

### Feature Request Template

```markdown
**Is your feature request related to a problem?**
A clear description of the problem.

**Describe the solution you'd like**
A clear description of what you want to happen.

**Describe alternatives you've considered**
Other solutions you've thought about.

**Additional context**
Any other relevant information, mockups, or examples.
```

## 📞 Questions?

- Open an issue with the `question` label
- Join our community discussions
- Check existing documentation

## 🙏 Thank You!

Your contributions make this project better for everyone. We appreciate your time and effort!

---

**Happy Coding!** 🚀
