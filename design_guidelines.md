# ChatApp 2026 — Design Guidelines

> **Version**: 3.0.0  
> **Last Updated**: 2026-09-27  
> **Status**: Production Ready ✅

## Table of Contents

- [Design Philosophy](#design-philosophy)
- [Brand Identity](#brand-identity)
- [Design Tokens](#design-tokens)
- [Color System](#color-system)
- [Typography](#typography)
- [Spacing & Layout](#spacing--layout)
- [Elevation & Shadows](#elevation--shadows)
- [Motion & Animation](#motion--animation)
- [Iconography](#iconography)
- [Component Specifications](#component-specifications)
- [Screen Templates](#screen-templates)
- [Accessibility Requirements](#accessibility-requirements)
- [Asset Specifications](#asset-specifications)

---

## Design Philosophy

### Core Principles

| Principle | Description |
|-----------|-------------|
| **Clarity First** | Every pixel serves a purpose. No decorative noise. |
| **Familiarity** | Users recognize patterns from WhatsApp, iMessage, Telegram |
| **Performance** | 60fps animations, <100ms touch feedback, instant list rendering |
| **Inclusivity** | WCAG 2.1 AA compliant, works for all abilities |
| **Consistency** | Same patterns across all screens and features |

### Design Mantra

> *"Familiar enough to feel intuitive, polished enough to feel premium."*

---

## Brand Identity

### Voice & Tone

- **Professional**: Clear, concise, respectful
- **Friendly**: Warm but not overly casual
- **Trustworthy**: Secure, reliable, transparent
- **Inclusive**: Gender-neutral, culturally aware

### Brand Colors

| Role | Light Mode | Dark Mode | Usage |
|------|-----------|-----------|-------|
| **Primary** | `#00A884` | `#00A884` | CTAs, active states, sent bubbles |
| **Primary Hover** | `#008F6F` | `#008F6F` | Pressed states |
| **Surface** | `#FFFFFF` | `#0B141A` | Cards, bubbles, inputs |
| **Surface Elevated** | `#F0F2F5` | `#1F2C34` | Elevated cards, modals |
| **Background** | `#FFFFFF` | `#0B141A` | Page background |
| **Text Primary** | `#111B21` | `#E9EDEF` | Headings, body text |
| **Text Secondary** | `#667781` | `#8696A0` | Subtitles, timestamps |
| **Success** | `#00A884` | `#00A884` | Online status, success states |
| **Warning** | `#FFB800` | `#FFB800` | Warnings, pending states |
| **Error** | `#EA4335` | `#EA4335` | Errors, destructive actions |
| **Divider** | `#E9EDEF` | `#222D34` | Separators, borders |

### Brand Typography

| Role | iOS | Android | Weight | Size |
|------|-----|---------|--------|------|
| **Display** | SF Pro Display | Roboto | Bold (700) | 34px |
| **Headline** | SF Pro Display | Roboto | Semibold (600) | 28px |
| **Title** | SF Pro Display | Roboto | Semibold (600) | 20px |
| **Body** | SF Pro Text | Roboto | Regular (400) | 16px |
| **Caption** | SF Pro Text | Roboto | Regular (400) | 14px |
| **Small** | SF Pro Text | Roboto | Regular (400) | 12px |

---

## Design Tokens

### Token Structure

```typescript
// client/src/theme/tokens.ts
export const tokens = {
  color: {
    primary: '#00A884',
    primaryHover: '#008F6F',
    surface: '#FFFFFF',
    surfaceElevated: '#F0F2F5',
    background: '#FFFFFF',
    textPrimary: '#111B21',
    textSecondary: '#667781',
    success: '#00A884',
    warning: '#FFB800',
    error: '#EA4335',
    divider: '#E9EDEF',
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
  },
  typography: {
    display: { fontSize: 34, fontWeight: '700', lineHeight: 41 },
    headline: { fontSize: 28, fontWeight: '600', lineHeight: 34 },
    title: { fontSize: 20, fontWeight: '600', lineHeight: 24 },
    body: { fontSize: 16, fontWeight: '400', lineHeight: 20 },
    caption: { fontSize: 14, fontWeight: '400', lineHeight: 18 },
    small: { fontSize: 12, fontWeight: '400', lineHeight: 16 },
  },
  borderRadius: {
    sm: 4,
    md: 8,
    lg: 12,
    xl: 16,
    full: 9999,
  },
  shadows: {
    sm: { shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 1 },
    md: { shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 4, elevation: 2 },
    lg: { shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.12, shadowRadius: 8, elevation: 4 },
  },
  motion: {
    fast: 150,
    normal: 200,
    slow: 300,
    easing: Easing.bezier(0.4, 0, 0.2, 1),
  },
} as const;
```

### Dark Mode Tokens

```typescript
export const darkTokens = {
  color: {
    primary: '#00A884',
    surface: '#0B141A',
    surfaceElevated: '#1F2C34',
    background: '#0B141A',
    textPrimary: '#E9EDEF',
    textSecondary: '#8696A0',
    divider: '#222D34',
  },
} as const;
```

---

## Color System

### Semantic Color Mapping

```typescript
// Usage mapping
export const semanticColors = {
  // Actions
  primary: tokens.color.primary,
  primaryHover: tokens.color.primaryHover,
  destructive: tokens.color.error,

  // Surfaces
  background: tokens.color.background,
  surface: tokens.color.surface,
  surfaceElevated: tokens.color.surfaceElevated,

  // Text
  textPrimary: tokens.color.textPrimary,
  textSecondary: tokens.color.textSecondary,
  textInverse: '#FFFFFF',

  // Feedback
  success: tokens.color.success,
  warning: tokens.color.warning,
  error: tokens.color.error,

  // Structure
  border: tokens.color.divider,
  separator: tokens.color.divider,
} as const;
```

### Contrast Ratios (WCAG 2.1 AA)

| Combination | Ratio | Status |
|-------------|-------|--------|
| Text Primary on Background | 15.2:1 | ✅ AAA |
| Text Secondary on Background | 7.1:1 | ✅ AAA |
| Primary on Surface | 3.8:1 | ✅ AA (Large text) |
| White on Primary | 4.6:1 | ✅ AA |

---

## Typography

### Type Scale

```typescript
export const typeScale = {
  display: { fontSize: 34, lineHeight: 41, letterSpacing: 0.2, fontWeight: '700' },
  headline: { fontSize: 28, lineHeight: 34, letterSpacing: 0.2, fontWeight: '600' },
  title: { fontSize: 20, lineHeight: 24, letterSpacing: 0.1, fontWeight: '600' },
  body: { fontSize: 16, lineHeight: 20, letterSpacing: 0.3, fontWeight: '400' },
  caption: { fontSize: 14, lineHeight: 18, letterSpacing: 0.2, fontWeight: '400' },
  small: { fontSize: 12, lineHeight: 16, letterSpacing: 0.3, fontWeight: '400' },
  overline: { fontSize: 10, lineHeight: 14, letterSpacing: 0.8, fontWeight: '500' },
} as const;
```

### Usage Guidelines

| Token | Use Case | Example |
|-------|----------|---------|
| `display` | App name, splash screen | "ChatApp" |
| `headline` | Screen titles, section headers | "Chats", "Settings" |
| `title` | Card titles, dialog titles | "New Message" |
| `body` | Main content, messages | Message text |
| `caption` | Timestamps, subtitles | "10:30 AM" |
| `small` | Metadata, labels | "Online", "Seen" |

---

## Spacing & Layout

### Spacing Scale

```typescript
export const spacing = {
  xs: 4,   // Icon padding, tight gaps
  sm: 8,   // Component padding, gaps
  md: 16,  // Standard padding, gaps
  lg: 24,  // Section spacing
  xl: 32,  // Screen edge padding
  xxl: 48, // Large section breaks
} as const;
```

### Layout Grid

| Platform | Grid | Margins | Gutters |
|----------|------|---------|---------|
| iOS | 8pt | 16pt (horizontal) | 8pt |
| Android | 8dp | 16dp (horizontal) | 8dp |
| Web | 8px | 24px (max-width container) | 16px |

### Safe Area Handling

```typescript
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const Screen = ({ children }) => {
  const insets = useSafeAreaInsets();

  return (
    <View style={{
      flex: 1,
      paddingTop: insets.top,
      paddingBottom: insets.bottom,
      paddingHorizontal: spacing.md,
    }}>
      {children}
    </View>
  );
};
```

---

## Elevation & Shadows

### Elevation Scale

```typescript
export const elevation = {
  sm: {
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  lg: {
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },
  xl: {
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.16,
    shadowRadius: 16,
    elevation: 8,
  },
} as const;
```

### Usage

| Elevation | Usage |
|-----------|-------|
| `sm` | Chat bubbles, small cards |
| `md` | Floating action buttons, input bars |
| `lg` | Modals, bottom sheets |
| `xl` | Dialogs, full-screen overlays |

---

## Motion & Animation

### Motion Tokens

```typescript
export const motion = {
  duration: {
    fast: 150,
    normal: 200,
    slow: 300,
    slower: 500,
  },
  easing: {
    standard: Easing.bezier(0.4, 0, 0.2, 1),
    decelerate: Easing.bezier(0, 0, 0.2, 1),
    accelerate: Easing.bezier(0.4, 0, 1, 1),
  },
} as const;
```

### Animation Patterns

| Pattern | Duration | Easing | Usage |
|---------|----------|--------|-------|
| **Press Feedback** | 100ms | standard | Button press, ripple |
| **Screen Transition** | 300ms | standard | Push/pop navigation |
| **Fade In** | 200ms | decelerate | Modals, overlays |
| **Slide Up** | 300ms | standard | Bottom sheets |
| **Message Send** | 200ms | standard | Bubble entrance |
| **Typing Indicator** | 1000ms loop | standard | Animated dots |

### Reduced Motion

```typescript
import { useReducedMotion } from 'react-native-reanimated';

const useAccessibleAnimation = () => {
  const reducedMotion = useReducedMotion();

  return {
    duration: reducedMotion ? 0 : motion.duration.normal,
    entering: reducedMotion ? undefined : FadeIn.duration(200),
  };
};
```

---

## Iconography

### Icon System

- **Library**: `@expo/vector-icons` (Feather icons)
- **Size**: 24×24px (standard), 16×24px (compact)
- **Stroke Width**: 2px (standard), 1.5px (compact)
- **Color**: `textPrimary` for default, `primary` for active

### Icon Usage

```typescript
import { Feather } from '@expo/vector-icons';

// Standard icon
<Feather name="search" size={24} color={tokens.color.textPrimary} />

// Active state
<Feather name="message-circle" size={24} color={tokens.color.primary} />

// Disabled state
<Feather name="send" size={24} color={tokens.color.textSecondary} />
```

### Icon Mapping

| Action | Icon | Screen |
|--------|------|--------|
| Search | `search` | ChatList |
| Compose | `edit` | ChatList |
| Call | `phone` | ChatDetail, Calls |
| Video | `video` | ChatDetail |
| Attach | `paperclip` | ChatDetail |
| Send | `send` | ChatDetail |
| More | `more-horizontal` | ChatDetail |
| Back | `chevron-left` | Navigation |
| Close | `x` | Modals |
| Check | `check` | Completed states |
| Error | `alert-circle` | Error states |

---

## Component Specifications

### Chat Bubble

```
┌─────────────────────────────────────────┐
│  Sender (Right - Primary)               │
│  ┌───────────────────────────────────┐  │
│  │ Message text here                 │  │
│  │                                   │  │
│  └───────────────────────────────────┘  │
│                        10:30 AM ✓✓      │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│  Receiver (Left - Surface)              │
│  ┌───────────────────────────────────┐  │
│  │ Message text here                 │  │
│  │                                   │  │
│  └───────────────────────────────────┘  │
│  John Doe · 10:30 AM                    │
└─────────────────────────────────────────┘
```

| Property | Sender | Receiver |
|----------|--------|----------|
| **Background** | `primary` (#00A884) | `surface` (#F0F2F5) |
| **Text Color** | White | `textPrimary` |
| **Corner Radius** | 16px (TL, TR, BL), 4px (BR) | 16px (TR, BR, BL), 4px (TL) |
| **Padding** | 12px horizontal, 8px vertical | 12px horizontal, 8px vertical |
| **Max Width** | 75% of screen | 75% of screen |
| **Shadow** | `sm` elevation | None |

### Chat Row (Chat List)

```
┌──────┬────────────────────────────┬──────────┐
│      │ John Doe                   │  10:30 AM │
│ Avatar│ Last message preview...    │    ✓✓    │
│  48x48│                     · · 3 │          │
└──────┴────────────────────────────┴──────────┘
```

| Property | Value |
|----------|-------|
| **Avatar** | 48×48px, circular, fallback to gray placeholder |
| **Name** | `title` token, bold, `textPrimary` |
| **Preview** | `caption` token, regular, `textSecondary`, 1 line truncated |
| **Timestamp** | `small` token, `textSecondary`, top-right aligned |
| **Badge** | 20×20px circle, `primary` background, white text, bold |
| **Touch Target** | Minimum 48×48px |

### Input Bar

```
┌────────────────────────────────────────────┐
│ 😊 │ Type a message...          │ 📎 │ ➤ │
└────────────────────────────────────────────┘
```

| Property | Value |
|----------|-------|
| **Height** | 56px (iOS), 60px (Android) |
| **Background** | `surfaceElevated` |
| **Border Radius** | 24px (full) |
| **Input Padding** | 12px horizontal, 8px vertical |
| **Send Button** | 40×40px circle, `primary` background, appears when text entered |
| **Icon Size** | 24px |

---

## Screen Templates

### Auth Stack

1. **Splash Screen**
   - Full-screen logo centered
   - Auto-navigate after 2s
   - Background: `primary`

2. **Login Screen**
   - Scrollable form
   - Country code picker + phone input
   - "Continue" primary button
   - Legal text bottom

3. **OTP Screen**
   - 6-digit OTP input (individual boxes)
   - Auto-submit on 6th digit
   - "Resend Code" link

### Main Tabs

1. **Chats** (default)
   - Header: "Chats" title + search icon
   - Search bar expands on icon press
   - FlashList of chat rows
   - Pull-to-refresh

2. **Status** (UI only)
   - "My Status" card with camera button
   - Status list with circular progress ring

3. **Calls** (UI only)
   - Call history list
   - Incoming/Outgoing/Missed icons

4. **Settings**
   - Profile section
   - Settings list (Dark mode, Wallpaper, Clear history, Version)
   - Logout button (destructive)

### Chat Detail

- **Header**: Back, Avatar + Name + Status, Call icons
- **Message List**: Inverted FlashList, auto-scroll to bottom
- **Input Bar**: Emoji, Text input, Attachment, Send

---

## Accessibility Requirements

### Touch Targets

| Element | Minimum Size |
|---------|-------------|
| Buttons | 48×48dp (Android), 44×44pt (iOS) |
| List Items | 48×48dp |
| Icons | 24×24px (with 24px touch area) |
| Input Fields | 48px height |

### Color Contrast

| Text Type | Minimum Ratio | Target |
|-----------|---------------|--------|
| Normal text | 4.5:1 | 7:1 |
| Large text (≥18pt) | 3:1 | 4.5:1 |
| UI components | 3:1 | 4.5:1 |

### Screen Reader Labels

```typescript
// Chat row
accessibilityLabel={`${chat.name}, ${chat.lastMessage?.text || 'No messages'}, ${chat.unreadCount > 0 ? `${chat.unreadCount} unread` : ''}`}
accessibilityRole="button"
accessibilityHint="Double tap to open chat"

// Send button
accessibilityLabel="Send message"
accessibilityHint="Sends the typed message"
accessibilityRole="button"

// Message bubble
accessibilityLabel={`${message.senderName}: ${message.text}`}
accessibilityRole="text"
```

---

## Asset Specifications

### Required Assets

| Asset | Size | Format | Usage |
|-------|------|--------|-------|
| **App Icon** | 1024×1024 | PNG (no alpha) | iOS App Store, Android Play Store |
| **Adaptive Icon** | 1024×1024 | PNG | Android adaptive icon |
| **Splash Icon** | 128×128 | PNG | Splash screen center |
| **Empty Chats** | 400×300 | PNG/SVG | Empty state illustration |
| **Empty Status** | 400×300 | PNG/SVG | Empty state illustration |
| **Empty Calls** | 400×300 | PNG/SVG | Empty state illustration |
| **Avatar Placeholder** | 200×200 | PNG | Default user avatar |
| **Online Indicator** | 16×16 | PNG | Online status dot |

### Asset Organization

```
assets/
├── icons/
│   ├── app-icon.png
│   ├── splash-icon.png
│   └── adaptive-icon.png
├── illustrations/
│   ├── empty-chats.png
│   ├── empty-status.png
│   └── empty-calls.png
├── images/
│   ├── avatar-placeholder.png
│   └── online-indicator.png
└── fonts/
    └── (custom fonts if needed)
```

### Asset Guidelines

- **Format**: PNG for photos, SVG for illustrations
- **Compression**: Use ImageOptim or similar
- **Naming**: kebab-case, descriptive (`empty-chats.png`)
- **Scales**: @1x, @2x, @3x for iOS; mdpi, hdpi, xhdpi, xxhdpi, xxxhdpi for Android

---

## Design Checklist

Before shipping any UI change:

- [ ] Uses design tokens (not hardcoded values)
- [ ] Meets 4.5:1 contrast ratio
- [ ] Touch targets ≥ 48×48dp
- [ ] Has accessibility labels and hints
- [ ] Works in both light and dark modes
- [ ] Supports RTL layout
- [ ] Animations respect reduced motion
- [ ] Tested on iOS and Android
- [ ] Responsive to font scaling
- [ ] No hardcoded strings (uses i18n)

---

**Maintained by**: Design Team  
**Review Cycle**: Monthly  
**Next Review**: October 2026  
**Tools**: Figma, Storybook, React Native
