# Contributing to ChatApp 2026

> **Version**: 3.0.0  
> **Last Updated**: 2026-09-27  
> **Status**: Active Development ✅

Thank you for your interest in contributing to ChatApp! This guide will help you get started with our development workflow, coding standards, and review process.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Quick Start](#quick-start)
- [Development Environment](#development-environment)
- [Branching Strategy](#branching-strategy)
- [Commit Convention](#commit-convention)
- [Code Quality](#code-quality)
- [Testing Requirements](#testing-requirements)
- [Accessibility Requirements](#accessibility-requirements)
- [Security Guidelines](#security-guidelines)
- [Performance Guidelines](#performance-guidelines)
- [Pull Request Process](#pull-request-process)
- [Review Process](#review-process)
- [Pre-commit Hooks](#pre-commit-hooks)
- [Troubleshooting](#troubleshooting)
- [Getting Help](#getting-help)

---

## Code of Conduct

This project adheres to the [Contributor Covenant Code of Conduct](CODE_OF_CONDUCT.md). By participating, you are expected to:

- Be respectful and inclusive
- Welcome newcomers and help them get started
- Focus on constructive feedback
- Accept responsibility and apologize for mistakes
- Prioritize the community's best interests

**Report violations**: `conduct@chatapp.com`

---

## Quick Start

```bash
# 1. Fork and clone
git clone https://github.com/your-username/chatapp.git
cd messaging-application

# 2. Add upstream remote
git remote add upstream https://github.com/original-org/chatapp.git
git fetch upstream

# 3. Install dependencies
npm install

# 4. Install iOS dependencies (macOS only)
cd client/ios && pod install && cd ../..

# 5. Set up environment
cp .env.example .env
# Edit .env with your configuration

# 6. Verify setup
npm run validate
npm test

# 7. Start development
npm run dev
```

---

## Development Environment

### Prerequisites

| Tool               | Version         | Purpose                 |
| ------------------ | --------------- | ----------------------- |
| **Node.js**        | ≥ 18.18.0 (LTS) | Runtime                 |
| **npm**            | ≥ 9.8.0         | Package manager         |
| **Git**            | ≥ 2.40.0        | Version control         |
| **Expo CLI**       | Latest          | Development server      |
| **Watchman**       | ≥ 2023.01.02    | File watching (macOS)   |
| **Android Studio** | Latest          | Android development     |
| **Xcode 15+**      | Latest          | iOS development (macOS) |

### Recommended Tools

| Tool                         | Purpose                     | Setup                                     |
| ---------------------------- | --------------------------- | ----------------------------------------- |
| **Volta**                    | Node version management     | `volta install node@18 npm@9`             |
| **Husky**                    | Git hooks                   | `npm run prepare`                         |
| **lint-staged**              | Run linters on staged files | Auto-configured                           |
| **EditorConfig**             | Consistent editor settings  | `.editorconfig` in repo                   |
| **Thunder Client / Postman** | API testing                 | Import `docs/API.postman_collection.json` |

### IDE Setup

#### VS Code (Recommended)

```json
// .vscode/settings.json
{
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "typescript.tsdk": "node_modules/typescript/lib",
  "typescript.enablePromptUseWorkspaceTsdk": true,
  "files.eol": "\n",
  "files.insertFinalNewline": true,
  "files.trimTrailingWhitespace": true
}
```

**Recommended Extensions**:

- ESLint
- Prettier
- TypeScript Vue/React (if using Vue/React)
- GitLens
- Thunder Client

---

## Branching Strategy

We follow **Trunk-Based Development** with feature branches.

### Branch Types

| Type         | Pattern                        | Description               |
| ------------ | ------------------------------ | ------------------------- |
| **Feature**  | `feature/<short-description>`  | New features              |
| **Fix**      | `fix/<short-description>`      | Bug fixes                 |
| **Docs**     | `docs/<short-description>`     | Documentation only        |
| **Refactor** | `refactor/<short-description>` | Code refactoring          |
| **Perf**     | `perf/<short-description>`     | Performance improvements  |
| **Test**     | `test/<short-description>`     | Test additions/updates    |
| **Chore**    | `chore/<short-description>`    | Maintenance tasks         |
| **Hotfix**   | `hotfix/<short-description>`   | Critical production fixes |

### Branch Naming Rules

- Use kebab-case: `feature/add-message-reactions`
- Keep it short: < 50 characters
- Be descriptive: `fix/offline-sync-crash` not `fix/bug`
- No issue numbers in branch name (use PR description)

### Workflow

```bash
# 1. Sync with upstream
git checkout main
git pull upstream main

# 2. Create feature branch
git checkout -b feature/your-feature

# 3. Make changes, commit often
git add .
git commit -m "feat(chat): add message reactions"

# 4. Keep branch updated
git fetch upstream
git rebase upstream/main

# 5. Push and create PR
git push origin feature/your-feature
# Create PR via GitHub UI
```

---

## Commit Convention

We use [Conventional Commits](https://www.conventionalcommits.org/).

### Format

```
<type>(<scope>): <description>

[optional body]

[optional footer(s)]
```

### Types

| Type       | Description                    | Example                                           |
| ---------- | ------------------------------ | ------------------------------------------------- |
| `feat`     | New feature                    | `feat(chat): add message reactions`               |
| `fix`      | Bug fix                        | `fix(auth): resolve token refresh race condition` |
| `docs`     | Documentation                  | `docs(readme): update installation steps`         |
| `style`    | Formatting, missing semicolons | `style: fix indentation in ChatStore`             |
| `refactor` | Code refactoring               | `refactor(sync): simplify conflict resolution`    |
| `perf`     | Performance improvement        | `perf(list): implement FlashList optimization`    |
| `test`     | Adding/updating tests          | `test(chat): add ChatStore unit tests`            |
| `chore`    | Maintenance                    | `chore(deps): upgrade zustand to v5`              |
| `ci`       | CI/CD changes                  | `ci: add bundle size check to pipeline`           |
| `revert`   | Revert commit                  | `revert: revert feat(chat): add reactions`        |

### Scopes

| Scope      | Description                    |
| ---------- | ------------------------------ |
| `chat`     | Chat-related features          |
| `auth`     | Authentication & authorization |
| `sync`     | Offline sync engine            |
| `store`    | Zustand stores                 |
| `ui`       | UI components & screens        |
| `theme`    | Design system & tokens         |
| `security` | Security features              |
| `i18n`     | Internationalization           |
| `perf`     | Performance                    |
| `test`     | Testing infrastructure         |

### Examples

```bash
# Feature with scope
feat(chat): add message reactions

- Add reaction picker component
- Store reactions in MMKV
- Sync reactions via WebSocket
- Closes #123

# Bug fix
fix(auth): resolve token expiration edge case

When the refresh token expires before the access token,
the app crashes. This fix adds proper error handling.

# Breaking change
feat(api)!: migrate to new API endpoint structure

BREAKING CHANGE: API base URL changed from /api/v1 to /v2.
Update your environment configuration.

# Performance
perf(list): implement FlashList for chat messages

Replaced FlatList with FlashList, reducing initial render
time by 40% and memory usage by 30%.

Refs #456
```

---

## Code Quality

### TypeScript Rules

```typescript
// ✅ Good
interface User {
  id: string;
  name: string;
  email: string;
}

const getUser = async (id: string): Promise<User> => {
  const user = await api.getUser(id);
  return user;
};

// ❌ Bad
const getUser = async (id: any): Promise<any> => {
  return await api.getUser(id);
};
```

**Rules**:

- **Strict mode**: No implicit `any`
- **Explicit returns**: Public functions must have return types
- **No type assertions**: Avoid `as` unless absolutely necessary
- **Interfaces over types**: Use `interface` for objects
- **Readonly**: Use `readonly` for immutable properties

### React Component Rules

```typescript
// ✅ Good
interface MessageItemProps {
  message: Message;
  onPress: (id: string) => void;
  onLongPress?: (id: string) => void;
}

const MessageItem = React.memo<MessageItemProps>(({
  message,
  onPress,
  onLongPress,
}) => {
  const handlePress = useCallback(() => {
    onPress(message.id);
  }, [message.id, onPress]);

  return (
    <TouchableOpacity onPress={handlePress}>
      <Text>{message.content.text}</Text>
    </TouchableOpacity>
  );
});

// ❌ Bad
const MessageItem = ({ message, onPress }: any) => {
  return (
    <TouchableOpacity onPress={() => onPress(message.id)}>
      <Text>{message.content.text}</Text>
    </TouchableOpacity>
  );
};
```

**Rules**:

- **Functional components only**: No class components
- **React.memo**: Wrap expensive components
- **useCallback/useMemo**: For expensive computations
- **No inline functions**: Extract to named functions
- **Props interface**: Always define props interface

### Error Handling

```typescript
// ✅ Good
const sendMessage = async (content: string): Promise<Result<Message>> => {
  try {
    const message = await api.sendMessage(content);
    return Result.ok(message);
  } catch (error) {
    Sentry.captureException(error, {
      tags: { action: "sendMessage" },
      extra: { content: content.substring(0, 100) },
    });
    return Result.error(new AppError("Failed to send message"));
  }
};

// ❌ Bad
const sendMessage = async (content: string) => {
  try {
    return await api.sendMessage(content);
  } catch (error) {
    console.log(error);
    throw error;
  }
};
```

**Rules**:

- **Result types**: Use `Result<T, E>` for fallible operations
- **Log to Sentry**: All errors with context
- **User-friendly messages**: Never expose raw errors
- **No sensitive data**: Don't log tokens, passwords, PII

---

## Testing Requirements

### Coverage Targets

| Layer                                | Target  | Current   |
| ------------------------------------ | ------- | --------- |
| **Domain (entities, use cases)**     | 95%     | 90%       |
| **Data (repositories, mappers)**     | 90%     | 85%       |
| **Core (sync, security, errors)**    | 90%     | 85%       |
| **Presentation (components, hooks)** | 80%     | 75%       |
| **Overall**                          | **85%** | **61.2%** |

### Test Structure

```
client/src/
├── domain/
│   └── __tests__/
│       ├── entities/
│       │   ├── Chat.test.ts
│       │   └── Message.test.ts
│       └── usecases/
│           └── SendMessageUseCase.test.ts
├── data/
│   └── __tests__/
│       ├── repositories/
│       │   └── ChatRepositoryImpl.test.ts
│       └── mappers/
│           └── ChatMapper.test.ts
├── core/
│   └── __tests__/
│       ├── sync/
│       │   └── SyncEngine.test.ts
│       └── errors/
│           └── AppError.test.ts
├── presentation/
│   └── stores/
│   │   └── __tests__/
│   │       ├── chatStore.test.ts
│   │       └── messageStore.test.ts
│   ├── hooks/
│   │   └── __tests__/
│   │       └── useChat.test.tsx
│   └── screens/
│       └── __tests__/
│           ├── ChatListScreen.test.tsx
│           └── ChatScreen.test.tsx
└── __tests__/
    ├── integration.test.tsx
    └── performance.test.ts
```

### Writing Tests

```typescript
// Unit Test Example
describe("ChatEntity", () => {
  describe("createPrivate", () => {
    it("should create a private chat with correct participants", () => {
      const chat = ChatEntity.createPrivate("user-2", "user-1");

      expect(chat.id).toBe("chat_user-2_user-1");
      expect(chat.type).toBe("private");
      expect(chat.participantIds).toEqual(["user-1", "user-2"]);
      expect(chat.participantId).toBe("user-2");
      expect(chat.isPinned).toBe(false);
      expect(chat.unreadCount).toBe(0);
    });
  });

  describe("pin", () => {
    it("should mark chat as pinned and update timestamp", () => {
      const chat = ChatEntity.createPrivate("user-2", "user-1");
      const initialUpdatedAt = chat.updatedAt;

      // Wait a bit to ensure timestamp changes
      jest.advanceTimersByTime(10);

      chat.pin();

      expect(chat.isPinned).toBe(true);
      expect(chat.updatedAt.getTime()).toBeGreaterThan(initialUpdatedAt.getTime());
    });
  });
});
```

### Running Tests

```bash
# Run all tests
npm test

# Run specific test file
npm test -- ChatEntity.test.ts

# Run with coverage
npm run test:coverage

# Run in watch mode (development)
npm run test:watch

# Run performance tests
npm run test:performance

# Run integration tests only
npm test -- --testPathPattern=integration
```

---

## Accessibility Requirements

All new components must meet **WCAG 2.1 AA** standards.

### Checklist

- [ ] **Touch Targets**: Minimum 48×48dp
- [ ] **Color Contrast**: 4.5:1 for normal text, 3:1 for large text
- [ ] **Accessibility Labels**: All interactive elements labeled
- [ ] **Accessibility Hints**: Context provided where needed
- [ ] **Semantic Roles**: Correct `accessibilityRole` used
- [ ] **Screen Reader**: Tested with VoiceOver/TalkBack
- [ ] **Keyboard Navigation**: All elements reachable via keyboard
- [ ] **Reduced Motion**: Animations disabled when preferred
- [ ] **RTL Support**: Layout works in RTL languages
- [ ] **Dynamic Type**: Text scales with system settings

### Example: Accessible Button

```typescript
const AccessibleButton = ({
  title,
  onPress,
  testID,
}: {
  title: string;
  onPress: () => void;
  testID?: string;
}) => (
  <TouchableOpacity
    onPress={onPress}
    accessibilityRole="button"
    accessibilityLabel={title}
    accessibilityHint={`Activates ${title.toLowerCase()}`}
    accessible={true}
    testID={testID}
    style={{
      minHeight: 48,
      minWidth: 48,
      justifyContent: 'center',
      alignItems: 'center',
      paddingVertical: 12,
      paddingHorizontal: 16,
      backgroundColor: tokens.color.primary,
      borderRadius: tokens.borderRadius.md,
    }}
  >
    <Text style={{ color: '#FFFFFF', ...tokens.typography.body }}>
      {title}
    </Text>
  </TouchableOpacity>
);
```

---

## Security Guidelines

### Before Submitting

- [ ] **No secrets in code**: No API keys, tokens, passwords
- [ ] **Input validation**: All user inputs validated with Zod
- [ ] **Error messages**: No sensitive data leaked
- [ ] **Network calls**: HTTPS only, SSL pinning where needed
- [ ] **Storage**: Sensitive data in Keychain/Keystore only
- [ ] **Dependencies**: `npm audit` shows no high/critical vulnerabilities

### Secure Coding Examples

```typescript
// ✅ Good: Validate input
const validateMessage = (data: unknown): Message => {
  const schema = z.object({
    id: z.string().uuid(),
    content: z.object({
      type: z.enum(["text", "image", "video"]),
      text: z.string().optional(),
    }),
  });
  return schema.parse(data);
};

// ❌ Bad: No validation
const message = data as Message;

// ✅ Good: Secure token storage
const getToken = async (): Promise<string> => {
  return await Keychain.getItemAsync("auth-token");
};

// ❌ Bad: Insecure storage
const getToken = (): string => localStorage.getItem("token");
```

---

## Performance Guidelines

### Before Submitting

- [ ] **Bundle size**: No significant increase (check with `npm run bundle:analyze`)
- [ ] **Re-renders**: No unnecessary re-renders (use React.memo)
- [ ] **List performance**: FlashList for long lists
- [ ] **Images**: Optimized and lazy-loaded
- [ ] **Animations**: 60fps, use Reanimated worklets
- [ ] **Memory**: No memory leaks (cleanup subscriptions)

### Performance Checklist

```typescript
// ✅ Good: Memoized component
const MessageList = React.memo(({ messages }: { messages: Message[] }) => {
  const memoizedMessages = useMemo(
    () => messages.sort(byDate),
    [messages]
  );

  return (
    <FlashList
      data={memoizedMessages}
      renderItem={renderItem}
      keyExtractor={(item) => item.id}
      estimatedItemSize={80}
    />
  );
});

// ❌ Bad: Unnecessary re-renders
const MessageList = ({ messages }) => {
  const sortedMessages = messages.sort(byDate); // Mutates original!
  return <FlatList data={sortedMessages} renderItem={renderItem} />;
};
```

---

## Pull Request Process

### Before Creating a PR

1. **Sync with main**: `git pull upstream main`
2. **Rebase your branch**: `git rebase upstream/main`
3. **Run quality checks**: `npm run validate`
4. **Run tests**: `npm test`
5. **Check bundle size**: `npm run bundle:analyze` (if UI changes)
6. **Update documentation**: If adding/changing features

### PR Requirements

- [ ] **Title**: Follows Conventional Commits format
- [ ] **Description**: Clear explanation of changes
- [ ] **Linked Issues**: Closes #123, Relates to #456
- [ ] **Screenshots**: For UI changes (before/after)
- [ ] **Tests**: New tests for new functionality
- [ ] **Coverage**: Maintains or improves coverage
- [ ] **Accessibility**: WCAG 2.1 AA compliant
- [ ] **Performance**: No regressions
- [ ] **Security**: No vulnerabilities introduced

### PR Template

```markdown
## Summary

Brief description of changes

## Motivation

Why is this change needed? What problem does it solve?

## Changes

- [ ] Change 1
- [ ] Change 2
- [ ] Change 3

## Screenshots (if applicable)

| Before     | After      |
| ---------- | ---------- |
| screenshot | screenshot |

## Test Plan

- [ ] Unit tests added/updated
- [ ] Integration tests pass
- [ ] Manual testing on iOS
- [ ] Manual testing on Android
- [ ] Accessibility testing

## Checklist

- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Documentation updated
- [ ] No new warnings or errors
- [ ] Tests pass
- [ ] Coverage maintained

Closes #123
```

---

## Review Process

### Review Stages

1. **Automated Checks** (CI/CD)
   - Lint, type-check, format
   - Unit tests + coverage
   - Security audit
   - Bundle size check

2. **Code Review** (1+ approvals required)
   - Architecture alignment
   - Code quality
   - Test coverage
   - Performance impact

3. **Accessibility Review**
   - WCAG 2.1 AA compliance
   - Screen reader testing
   - Touch target verification

4. **Security Review**
   - No sensitive data exposure
   - Input validation
   - Secure storage usage

5. **Merge**
   - Squash and merge to main
   - Delete feature branch
   - Update Jira/Linear ticket

### Review Guidelines

**For Authors**:

- Keep PRs small (< 400 lines changed)
- Write clear descriptions
- Respond to feedback promptly
- Mark comments as resolved when addressed

**For Reviewers**:

- Review within 24 hours
- Be constructive and respectful
- Focus on code, not person
- Approve when satisfied, don't nitpick

---

## Pre-commit Hooks

### Setup

```bash
# Install Husky hooks
npm run prepare

# This creates .husky/pre-commit hook that runs:
# - lint-staged (ESLint + Prettier on staged files)
# - TypeScript type check on changed files
```

### What Runs on Commit

1. **ESLint**: Fix and check staged `.ts`/`.tsx` files
2. **Prettier**: Format staged files
3. **TypeScript**: Type check on staged files
4. **Tests**: Run affected tests (optional)

### Skipping Hooks (Not Recommended)

```bash
git commit --no-verify -m "emergency fix"
```

---

## Troubleshooting

### Common Issues

#### Metro Bundler Cache Issues

```bash
# Clear Expo cache
npx expo start --clear

# Or manually
rm -rf .expo
rm -rf node_modules/.cache
npm start
```

#### iOS Build Issues

```bash
# Clean and rebuild
cd client/ios
rm -rf build
pod install --repo-update
cd ..
npx expo run:ios
```

#### Android Build Issues

```bash
# Clean and rebuild
cd client/android
./gradlew clean
cd ..
npx expo run:android
```

#### TypeScript Errors After Pull

```bash
# Restart TypeScript server in VS Code
# Cmd/Ctrl + Shift + P → "TypeScript: Restart TS Server"

# Or clear cache
rm -rf node_modules/.cache
npm run type-check
```

#### Test Failures

```bash
# Run specific test with verbose output
npm test -- --verbose ChatStore.test.ts

# Run with coverage to see what's missing
npm run test:coverage -- ChatStore.test.ts
```

---

## Getting Help

### Resources

| Resource          | Purpose                       | Link                                                                  |
| ----------------- | ----------------------------- | --------------------------------------------------------------------- |
| **Documentation** | Project docs                  | [README.md](README.md), [ARCHITECTURE.md](ARCHITECTURE.md)            |
| **Discussions**   | Q&A, ideas                    | [GitHub Discussions](https://github.com/your-org/chatapp/discussions) |
| **Issues**        | Bug reports, feature requests | [GitHub Issues](https://github.com/your-org/chatapp/issues)           |
| **Team Chat**     | Real-time communication       | Slack / Discord                                                       |
| **Design Files**  | Figma designs                 | [Figma](https://figma.com/...)                                        |

### Mentorship

New contributors are paired with a mentor for their first PR:

1. **Onboarding call**: 30min intro to codebase
2. **First PR**: Guided through process
3. **Follow-up**: Feedback and next steps

Request mentorship: `mentorship@chatapp.com`

---

## License

By contributing to ChatApp, you agree that your contributions will be licensed under the [MIT License](LICENSE).

---

<div align="center">

**Thank you for contributing to ChatApp!** 🚀

Your contributions help make this project better for everyone.

[🔝 Back to Top](#contributing-to-chatapp-2026)

</div>
