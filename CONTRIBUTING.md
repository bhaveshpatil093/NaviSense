# Contributing to NaviSense

Thank you for considering contributing to NaviSense! This project is an open-source assistive technology app and contributions of all kinds are welcome.

## 📋 Table of Contents

- [Code of Conduct](#code-of-conduct)
- [How to Contribute](#how-to-contribute)
- [Development Setup](#development-setup)
- [Branch Naming](#branch-naming)
- [Commit Messages](#commit-messages)
- [Pull Request Process](#pull-request-process)
- [Code Style](#code-style)
- [Testing](#testing)

---

## 🤝 Code of Conduct

This project follows a simple rule: **be respectful and inclusive**. Harassment, discrimination, and toxic behaviour will not be tolerated. We are building tools for accessibility — that spirit should extend to our community too.

---

## 🛠️ How to Contribute

### Reporting Bugs

1. Check if the bug is already reported in [Issues](https://github.com/bhaveshpatil093/NaviSense/issues).
2. If not, open a new issue using the **Bug Report** template.
3. Include:
   - Steps to reproduce
   - Expected vs actual behaviour
   - Device/OS/Expo version
   - Relevant logs or screenshots

### Suggesting Features

Open an issue with the **Feature Request** template. Describe:
- The problem your feature solves
- How you'd expect it to work
- Any alternatives you considered

### Submitting Code

1. Fork the repo and create a branch from `main`
2. Write your changes with tests
3. Open a Pull Request

---

## 💻 Development Setup

```bash
# Clone your fork
git clone https://github.com/<your-username>/NaviSense.git
cd NaviSense

# Install dependencies
npm install

# Start the dev server (with cache cleared)
npx expo start -c
```

See the [README](README.md) for full setup instructions.

---

## 🌿 Branch Naming

Use the following prefixes:

| Prefix | Use case |
|---|---|
| `feat/` | New features |
| `fix/` | Bug fixes |
| `docs/` | Documentation changes |
| `chore/` | Tooling, dependencies, configs |
| `test/` | Adding or fixing tests |
| `refactor/` | Code changes with no feature/fix impact |

Example: `feat/battery-low-warning`, `fix/sos-double-dial`

---

## ✏️ Commit Messages

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <short summary>

[optional body]
```

Examples:
```
feat(sos): add countdown cancellation on back press
fix(store): deduplicate alerts with same type and timestamp
docs(readme): add ESP32 API contract section
test(deviceStore): add setStatus edge case for null input
```

---

## 🔄 Pull Request Process

1. Ensure your branch is up to date with `main` before opening a PR.
2. Fill in the PR template completely.
3. All tests must pass (`npm test`).
4. Add or update tests for any changed behaviour.
5. Keep PRs focused — one feature or fix per PR.
6. At least one reviewer must approve before merging.

---

## 🎨 Code Style

- **TypeScript** — use proper types, avoid `any`.
- **Components** — functional components only, no class components.
- **Styles** — use `StyleSheet.create()`. No inline style objects in JSX.
- **State** — use the Zustand store for shared state. No prop drilling.
- **Accessibility** — every interactive element must have `accessibilityRole`, `accessibilityLabel`, and `accessibilityHint` (if non-obvious).
- **No console.log** — use `utils/logger.ts` instead.

---

## 🧪 Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm test -- --watch

# Run with coverage report
npm test -- --coverage
```

Write tests for:
- New store actions
- New hooks (especially side effects)
- Service functions (mock fetch)
- Any utility function

Test files go in `__tests__/` mirroring the source structure.

---

## ❓ Questions?

Open a [GitHub Discussion](https://github.com/bhaveshpatil093/NaviSense/discussions) or drop a comment on a related issue.
