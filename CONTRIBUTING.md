# Contributing to ChatApp

Thank you for your interest in contributing to ChatApp! This document provides comprehensive guidelines for contributing to our enterprise-grade messaging platform.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Development Environment Setup](#development-environment-setup)
- [Branch Naming Convention](#branch-naming-convention)
- [Commit Message Format](#commit-message-format)
- [Testing Requirements](#testing-requirements)
- [Accessibility Guidelines](#accessibility-guidelines)
- [Internationalization Guidelines](#internationalization-guidelines)
- [Feature Flag Usage](#feature-flag-usage)
- [Pull Request Process](#pull-request-process)
- [Pre-commit Hooks](#pre-commit-hooks)
- [Code Style Guidelines](#code-style-guidelines)
- [Performance Guidelines](#performance-guidelines)
- [Security Guidelines](#security-guidelines)

## Code of Conduct

We are committed to providing a welcoming and inclusive environment for all contributors. Please read our [Code of Conduct](CODE_OF_CONDUCT.md) and follow it in all your interactions with the project.

## Development Environment Setup

### Prerequisites

- **Node.js** >= 18.0.0
- **npm** >= 9.0.0
- **Git** latest version
- **Expo CLI** latest version
- **iOS**: Xcode 14+ and iOS Simulator (Mac only)
- **Android**: Android Studio with Android SDK

### Setup Steps

1. **Fork the Repository**
   ```bash
   # Fork the repository on GitHub
   git clone https://github.com/YOUR_USERNAME/chatapp.git
   cd chatapp
   ```

2. **Add Upstream Remote**
   ```bash
   git remote add upstream https://github.com/original-org/chatapp.git
   git fetch upstream
   ```

3. **Install Dependencies**
   ```bash
   npm install
   ```

4. **Install iOS Dependencies** (Mac only)
   ```bash
   cd ios && pod install && cd ..
   ```

5. **Setup Environment Variables**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

6. **Start Development Server**
   ```bash
   npm run dev
   ```

7. **Run Tests to Verify Setup**
   ```bash
   npm test
   npm run type-check
   npm run lint
   ```

### Development Scripts

```bash
# Development
npm run dev              # Start Expo development server
npm run android          # Run on Android
npm run ios               # Run on iOS
npm run web               # Run on Web

# Code Quality
npm run lint             # Run ESLint
npm run lint:fix         # Fix ESLint issues
npm run format           # Format with Prettier
npm run format:check     # Check formatting
npm run type-check       # TypeScript type checking
npm run validate         # Run all checks

# Testing
npm test                 # Run all tests
npm run test:coverage    # Run tests with coverage
npm run test:watch       # Watch mode for development

# Build
npm run build:web        # Build for web
npm run bundle:analyze    # Analyze bundle size
```

## Branch Naming Convention

We follow a strict branch naming convention to maintain consistency:

### Branch Types

- `feature/` - New features
- `fix/` - Bug fixes
- `docs/` - Documentation changes
- `style/` - Code style changes (formatting, missing semicolons, etc.)
- `refactor/` - Code refactoring
- `perf/` - Performance improvements
- `test/` - Adding or updating tests
- `chore/` - Maintenance tasks, dependency updates
- `hotfix/` - Critical bug fixes for production

### Branch Name Format

```
<branch-type>/<brief-description>
```

### Examples

```bash
feature/message-reactions
fix/offline-sync-crash
docs/api-documentation
style/eslint-rules-update
refactor/state-management
perf/image-loading-optimization
test/chat-screen-tests
chore/dependency-updates
hotfix/security-vulnerability
```

## Commit Message Format

We use [Conventional Commits](https://www.conventionalcommits.org/) specification:

### Format

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

### Types

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation only changes
- `style`: Changes that do not affect the meaning of the code (white-space, formatting, missing semi-colons, etc.)
- `refactor`: Code refactoring
- `perf`: Performance improvements
- `test`: Adding or updating tests
- `chore`: Maintenance tasks, dependency updates
- `ci`: CI/CD changes
- `build`: Build system or dependency changes

### Examples

```bash
feat(chat): add message reactions feature

Add emoji reactions to messages with:
- Reaction picker component
- Reaction storage in MMKV
- Real-time sync via WebSocket

Closes #123

fix(auth): resolve token expiration issue

Update token refresh logic to handle edge cases where
the refresh token expires before the access token.

fixes #456

perf(images): implement lazy loading for chat images

Add intersection observer to load images only when
they enter the viewport, reducing initial bundle size.

Performance improvement: ~30% faster initial load
```

## Testing Requirements

### Coverage Requirements

- **Overall Coverage**: Minimum 85% across lines, branches, functions, and statements
- **Critical Files**: 90%+ coverage for domain entities and repositories
- **UI Components**: 80%+ coverage for presentation components
- **New Features**: 90%+ coverage for all new functionality

### Test Types

#### Unit Tests

- Test business logic in isolation
- Mock external dependencies
- Focus on domain entities, use cases, and utilities
- Use descriptive test names

```typescript
// Example: client/src/domain/__tests__/MessageEntity.test.ts
describe('MessageEntity', () => {
  describe('create', () => {
    it('should create a valid message with required fields', () => {
      // Arrange
      const messageData = {
        chatId: 'chat-123',
        senderId: 'user-123',
        content: { type: 'text', text: 'Hello' }
      };

      // Act
      const message = MessageEntity.create(messageData);

      // Assert
      expect(message.id).toBeDefined();
      expect(message.chatId).toBe(messageData.chatId);
      expect(message.status).toBe(MessageStatus.SENDING);
    });

    it('should throw error for invalid content type', () => {
      // Arrange
      const messageData = {
        chatId: 'chat-123',
        senderId: 'user-123',
        content: { type: 'invalid', text: 'Hello' }
      };

      // Act & Assert
      expect(() => MessageEntity.create(messageData)).toThrow(
        'Invalid content type'
      );
    });
  });
});
```

#### Component Tests

- Test React components with React Testing Library
- Focus on user behavior, not implementation details
- Test accessibility attributes
- Mock child components when necessary

```typescript
// Example: client/src/components/__tests__/MessageItem.test.tsx
describe('MessageItem', () => {
  const defaultProps = {
    message: createMockMessage(),
    onPress: jest.fn(),
    onLongPress: jest.fn()
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render message content correctly', () => {
    render(<MessageItem {...defaultProps} />);
    
    expect(screen.getByText('Hello World')).toBeTruthy();
  });

  it('should call onPress when tapped', () => {
    const { onPress } = defaultProps;
    
    render(<MessageItem {...defaultProps} />);
    fireEvent.press(screen.getByRole('button'));
    
    expect(onPress).toHaveBeenCalledWith(defaultProps.message.id);
  });

  it('should be accessible', () => {
    render(<MessageItem {...defaultProps} />);
    
    const messageElement = screen.getByRole('button');
    expect(messageElement).toHaveAccessibleLabel(
      'Message from John Doe: Hello World'
    );
  });
});
```

#### Integration Tests

- Test interactions between components and stores
- Test API calls and data flow
- Use real implementations where possible

### Running Tests

```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Run specific test file
npm test -- MessageEntity.test.ts

# Run tests in watch mode
npm run test:watch

# Run tests for specific pattern
npm test -- --testPathPattern="domain"
```

## Accessibility Guidelines

### WCAG 2.1 AA Compliance

All new components must meet WCAG 2.1 AA accessibility standards.

### Checklist for New Components

#### Color Contrast

- Text contrast ratio: Minimum 4.5:1 for normal text, 3:1 for large text
- Interactive elements: Minimum 3:1 contrast ratio
- Use tools like WebAIM Contrast Checker

```typescript
// Example: Accessible color palette
export const colors = {
  text: {
    primary: '#000000',    // 21:1 contrast on white
    secondary: '#666666',  // 7:1 contrast on white
    disabled: '#999999',   // 4.9:1 contrast on white
  },
  background: {
    primary: '#FFFFFF',
    secondary: '#F5F5F5',
  },
  interactive: {
    primary: '#007AFF',    // 4.5:1 contrast on white
    disabled: '#CCCCCC',   // 3:1 contrast on white
  }
};
```

#### Touch Targets

- Minimum touch target size: 44x44 points (iOS) / 48x48dp (Android)
- Ensure adequate spacing between interactive elements

```typescript
// Example: Accessible button
const AccessibleButton = styled.TouchableOpacity`
  min-height: 44px;
  min-width: 44px;
  padding: 12px 16px;
  justify-content: center;
  align-items: center;
`;
```

#### Screen Reader Support

- Use semantic elements (Button, TextInput, etc.)
- Provide accessibility labels and hints
- Use accessibilityRole for custom components
- Test with VoiceOver (iOS) and TalkBack (Android)

```typescript
// Example: Accessible custom component
const CustomButton = ({ 
  children, 
  onPress, 
  accessibilityLabel,
  accessibilityHint 
}) => (
  <TouchableOpacity
    onPress={onPress}
    accessibilityRole="button"
    accessibilityLabel={accessibilityLabel}
    accessibilityHint={accessibilityHint}
    accessible={true}
  >
    <Text>{children}</Text>
  </TouchableOpacity>
);
```

#### Keyboard Navigation

- Ensure all interactive elements are keyboard accessible
- Provide focus indicators
- Test with external keyboards

### Testing Accessibility

```bash
# Install accessibility testing tools
npm install --save-dev @testing-library/jest-native

# Run accessibility tests
npm test -- --testPathPattern="accessibility"
```

## Internationalization Guidelines

### Adding New Strings

1. **Add to English Locale**
   ```json
   // client/src/i18n/locales/en.json
   {
     "chat": {
       "sendButton": "Send",
       "typingIndicator": "{{user}} is typing..."
     }
   }
   ```

2. **Add to Other Locales**
   ```json
   // client/src/i18n/locales/es.json
   {
     "chat": {
       "sendButton": "Enviar",
       "typingIndicator": "{{user}} está escribiendo..."
     }
   }
   ```

3. **Use in Components**
   ```typescript
   import { useTranslation } from 'react-i18next';
   
   const SendButton = () => {
     const { t } = useTranslation();
     
     return (
       <Button title={t('chat.sendButton')} />
     );
   };
   ```

### Guidelines

- **Externalize all user-facing strings**
- **Use interpolation for dynamic content**: `{{variable}}`
- **Provide context for translators**: Add comments for ambiguous strings
- **Test with different languages**: Verify layout works with different text lengths
- **RTL Support**: Test with Arabic/Hebrew locales

### RTL Support

```typescript
// Example: RTL-aware styling
import { I18nManager } from 'react-native';

const MessageBubble = styled.View`
  margin-horizontal: 16px;
  margin-vertical: 4px;
  align-self: ${({ isOwn }) => 
    isOwn ? 'flex-end' : 'flex-start'
  };
  flex-direction: ${I18nManager.isRTL ? 'row-reverse' : 'row'};
`;
```

## Feature Flag Usage

### Adding New Feature Flags

1. **Define in Feature Flags Store**
   ```typescript
   // client/src/stores/featureFlagsStore.ts
   export const DEFAULT_FEATURE_FLAGS: Record<string, FeatureFlag> = {
     // ... existing flags
     enableNewFeature: {
       key: 'enableNewFeature',
       name: 'New Feature',
       description: 'Enable the new feature for testing',
       defaultValue: false,
       rolloutPercentage: 0,
       category: 'experimental'
     }
   };
   ```

2. **Use FeatureGate Component**
   ```typescript
   import { FeatureGate } from '../components/FeatureGate';
   
   const NewFeatureComponent = () => (
     <FeatureGate 
       flag="enableNewFeature"
       fallback={<LegacyComponent />}
     >
       <NewComponent />
     </FeatureGate>
   );
   ```

3. **Use in Hooks**
   ```typescript
   import { useFeatureFlag } from '../hooks/useFeatureFlag';
   
   const useNewFeature = () => {
     const isEnabled = useFeatureFlag('enableNewFeature');
     return { isEnabled };
   };
   ```

### A/B Testing

```typescript
// Example: A/B test with 50% rollout
export const DEFAULT_FEATURE_FLAGS = {
  newAlgorithm: {
    key: 'newAlgorithm',
    name: 'New Message Algorithm',
    description: 'Test new message sorting algorithm',
    defaultValue: false,
    rolloutPercentage: 50,
    category: 'performance'
  }
};
```

### Testing Feature Flags

```typescript
// Example: Test with different flag states
describe('NewFeatureComponent', () => {
  it('should show new component when flag is enabled', () => {
    mockUseFeatureFlag('enableNewFeature', true);
    
    render(<NewFeatureComponent />);
    
    expect(screen.getByTestId('new-component')).toBeTruthy();
  });

  it('should show fallback when flag is disabled', () => {
    mockUseFeatureFlag('enableNewFeature', false);
    
    render(<NewFeatureComponent />);
    
    expect(screen.getByTestId('legacy-component')).toBeTruthy();
  });
});
```

## Pull Request Process

### Before Creating a PR

1. **Create a feature branch** from the latest `main` branch
2. **Write tests** for your changes
3. **Ensure all tests pass** with 85%+ coverage
4. **Run code quality checks**: `npm run validate`
5. **Update documentation** if needed
6. **Test on multiple platforms** (iOS, Android, Web)

### Creating a Pull Request

1. **Use the PR template** and fill out all sections
2. **Link to relevant issues** using "Closes #123"
3. **Add screenshots/videos** for UI changes
4. **Describe testing approach**
5. **List any breaking changes**

### PR Review Process

1. **Automated Checks**: CI/CD pipeline runs automatically
2. **Code Review**: At least one team member must review
3. **Testing Review**: Verify test coverage and quality
4. **Accessibility Review**: Verify WCAG compliance
5. **Security Review**: Verify no security vulnerabilities
6. **Performance Review**: Verify no performance regressions

### Merge Requirements

- All automated checks must pass
- At least one approval from a code reviewer
- No conflicts with main branch
- All discussions resolved
- Documentation updated (if needed)

## Pre-commit Hooks

### Setup

```bash
# Install pre-commit hooks
npm run prepare

# This installs husky and creates the .husky/pre-commit hook
```

### What Hooks Do

Pre-commit hooks automatically run on staged files:

- **ESLint**: Fix and check code style
- **Prettier**: Format code consistently
- **TypeScript**: Check for type errors

### Running Hooks Manually

```bash
# Run pre-commit hooks manually
npm run pre-commit

# Skip hooks (not recommended)
git commit --no-verify
```

### Troubleshooting

If hooks fail:

1. **Fix the errors** reported by the tools
2. **Stage the fixes**: `git add .`
3. **Try again**: `git commit`

## Code Style Guidelines

### TypeScript

- **Use strict mode**: No implicit any
- **Prefer interfaces** over types for objects
- **Use explicit return types** for public functions
- **Avoid type assertions** unless necessary

```typescript
// Good
interface User {
  id: string;
  name: string;
}

const getUser = (id: string): Promise<User> => {
  return api.getUser(id);
};

// Bad
const getUser = (id: any) => {
  return api.getUser(id) as any;
};
```

### React Components

- **Use functional components** with hooks
- **Prefer custom hooks** for complex logic
- **Use React.memo** for performance optimization
- **Avoid inline functions** in render

```typescript
// Good
interface MessageItemProps {
  message: Message;
  onPress: (id: string) => void;
}

const MessageItem = React.memo<MessageItemProps>(({ 
  message, 
  onPress 
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

// Bad
const MessageItem = ({ message, onPress }) => {
  return (
    <TouchableOpacity onPress={() => onPress(message.id)}>
      <Text>{message.content.text}</Text>
    </TouchableOpacity>
  );
};
```

### Error Handling

- **Use Result types** for operations that can fail
- **Log errors to Sentry** with context
- **Provide user-friendly error messages**
- **Don't expose sensitive information**

```typescript
// Good
const sendMessage = async (content: string): Promise<Result<Message>> => {
  try {
    const message = await api.sendMessage(content);
    return Result.ok(message);
  } catch (error) {
    Sentry.captureException(error, {
      tags: { action: 'sendMessage' },
      extra: { content: content.substring(0, 100) }
    });
    return Result.error('Failed to send message');
  }
};

// Bad
const sendMessage = async (content: string) => {
  try {
    return await api.sendMessage(content);
  } catch (error) {
    console.log(error);
    throw error;
  }
};
```

## Performance Guidelines

### Bundle Size

- **Keep bundle under 1.5MB**
- **Use lazy loading** for heavy features
- **Optimize images** and assets
- **Remove unused dependencies**

```typescript
// Good: Lazy loading
const LazyChatScreen = lazy(() => import('./ChatScreen'));

// Bad: Eager loading
import ChatScreen from './ChatScreen';
```

### Rendering Performance

- **Use React.memo** for expensive components
- **Use useMemo/useCallback** for expensive computations
- **Optimize lists** with FlashList
- **Avoid unnecessary re-renders**

```typescript
// Good
const MessageList = React.memo(({ messages }) => {
  const memoizedMessages = useMemo(() => 
    messages.sort(byDate), [messages]
  );

  return (
    <FlashList
      data={memoizedMessages}
      renderItem={renderItem}
      keyExtractor={keyExtractor}
    />
  );
});

// Bad
const MessageList = ({ messages }) => {
  const sortedMessages = messages.sort(byDate); // Re-computed every render

  return (
    <FlatList
      data={sortedMessages}
      renderItem={renderItem}
      keyExtractor={keyExtractor}
    />
  );
};
```

### Memory Management

- **Clean up subscriptions** in useEffect
- **Avoid memory leaks** in event listeners
- **Use weak references** where appropriate
- **Monitor memory usage**

```typescript
// Good
useEffect(() => {
  const subscription = api.subscribe(handleUpdate);
  
  return () => {
    subscription.unsubscribe();
  };
}, []);

// Bad
useEffect(() => {
  api.subscribe(handleUpdate); // No cleanup
}, []);
```

## Security Guidelines

### Data Protection

- **Never store secrets** in the app bundle
- **Use secure storage** for sensitive data
- **Validate all inputs** with Zod schemas
- **Sanitize data** before displaying

```typescript
// Good
const validateMessage = (data: unknown): Message => {
  const schema = z.object({
    id: z.string(),
    content: z.object({
      type: z.enum(['text', 'image']),
      text: z.string().optional()
    })
  });
  
  return schema.parse(data);
};

// Bad
const message = data as Message; // No validation
```

### Network Security

- **Use SSL pinning** for API calls
- **Validate certificates** manually
- **Use HTTPS only** connections
- **Implement timeout** for requests

```typescript
// Good
const apiClient = {
  async request(url: string) {
    if (!validateCertificate(url)) {
      throw new SecurityError('Invalid certificate');
    }
    
    return fetch(url, {
      timeout: 10000,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

// Bad
const apiClient = {
  async request(url: string) {
    return fetch(url); // No SSL validation
  }
};
```

### Authentication

- **Use secure token storage** (Keychain/Keystore)
- **Implement token refresh** logic
- **Handle token expiration** gracefully
- **Never log tokens** or sensitive data

```typescript
// Good
const getToken = async (): Promise<string> => {
  try {
    return await keychain.getItem('auth-token');
  } catch (error) {
    Sentry.captureException(error);
    throw new AuthError('Failed to retrieve token');
  }
};

// Bad
const getToken = (): string => {
  return localStorage.getItem('token'); // Insecure storage
};
```

## Getting Help

If you need help with contributing:

1. **Check existing issues** and documentation
2. **Ask in discussions** for general questions
3. **Create an issue** for bugs or feature requests
4. **Contact maintainers** via Slack or email

## License

By contributing to ChatApp, you agree that your contributions will be licensed under the MIT License.

---

Thank you for contributing to ChatApp! Your contributions help make this project better for everyone.
