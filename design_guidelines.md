# WhatsApp-Style Chat App Design Guidelines

## Brand Identity

**Purpose**: A professional, reliable messaging platform for one-on-one conversations.

**Aesthetic Direction**: **Editorial/Refined** — Clean, purposeful, and familiar. This app should feel instantly recognizable to WhatsApp users while maintaining polish and attention to detail. The design prioritizes readability, clarity, and trust.

**Memorable Element**: Message bubbles with subtle depth, smooth micro-interactions, and the signature teal accent that signals messaging familiarity.

---

## Navigation Architecture

**Root Navigation**: Tab Bar (4 tabs)

- **Chats** (default/active) - Chat list with search
- **Status** - Story/status feed (UI only)
- **Calls** - Call history list (UI only)
- **Settings** - Profile and app preferences

**Authentication Stack** (modal, pre-tabs):

- Splash Screen → Login Screen → OTP Verification Screen

---

## Screen Specifications

### 1. Splash Screen

- Full-screen logo centered vertically
- App name below logo
- Background: Colors.background
- No header
- Auto-navigates after 2s

### 2. Login Screen

- **Header**: None (full-screen form)
- **Layout**: Scrollable form, centered content
- **Components**:
  - App logo (small, top)
  - Heading: "Enter your phone number"
  - Country code picker + phone input
  - Primary button: "Continue"
  - Legal text (small, bottom): "By continuing, you agree to our Terms & Privacy Policy"
- **Insets**: Vertical padding = insets.top/bottom + Spacing.xl

### 3. OTP Verification Screen

- **Header**: Back button (left), transparent
- **Layout**: Scrollable form, centered
- **Components**:
  - Heading: "Verify your number"
  - Subtext: "Enter the 6-digit code sent to [phone]"
  - 6-digit OTP input (individual boxes)
  - "Resend Code" link
  - Auto-submit on 6th digit
- **Insets**: Top = headerHeight + Spacing.xl, Bottom = insets.bottom + Spacing.xl

### 4. Chat List Screen (Chats Tab)

- **Header**: Custom, opaque
  - Title: "Chats" (large/bold)
  - Right button: Search icon
  - Integrated search bar (expands on icon press)
- **Layout**: FlatList (scrollable)
- **Components**:
  - Pull-to-refresh animation
  - Chat row items:
    - Avatar (left, 48x48, circular)
    - Name (bold, Colors.text)
    - Last message preview (regular, Colors.textSecondary, 1 line truncated)
    - Timestamp (top-right, small, Colors.textSecondary)
    - Unread badge (right, circular, Colors.primary, white count)
    - Online dot (bottom-right of avatar, 10x10, Colors.success)
  - Empty state: "No chats yet" (centered illustration + text)
- **Insets**: Bottom = tabBarHeight + Spacing.xl

### 5. One-to-One Chat Screen

- **Header**: Custom, opaque
  - Left: Back button
  - Center: Avatar (32x32) + Name + "online/typing" status
  - Right: Video call + Voice call icons
- **Layout**: Inverted FlatList (scrollable, auto-scrolls to bottom)
- **Components**:
  - Chat bubbles:
    - Sender (right): Colors.primary background, white text, rounded corners (top-left, top-right, bottom-left = 16, bottom-right = 4)
    - Receiver (left): Colors.surface background, Colors.text, rounded corners (top-left, top-right, bottom-right = 16, bottom-left = 4)
    - Timestamp below bubble (small, Colors.textSecondary)
    - Status icons (sent/delivered/read) for sender messages
  - Typing indicator: "..." animated dots in receiver bubble
  - Long-press menu: Reply, Copy, Delete
- **Message Input Bar** (fixed bottom):
  - Emoji button (left)
  - Text input (center, expandable, Colors.surface, rounded)
  - Attachment icon (right of input)
  - Send button (animated, appears when text entered, Colors.primary circle with white arrow icon)
- **Insets**: Top = headerHeight + Spacing.md, Bottom = insets.bottom + Spacing.md (input bar handles its own spacing)

### 6. Status Screen (Status Tab)

- **Header**: Default, title "Status"
- **Layout**: ScrollView
- **Components**:
  - "My Status" card (top, with camera button)
  - Status list items:
    - Avatar with circular progress ring (seen = gray, unseen = Colors.primary gradient)
    - Name + timestamp
  - Empty state: "No status updates" (illustration + text)
- **Insets**: Bottom = tabBarHeight + Spacing.xl

### 7. Calls Screen (Calls Tab)

- **Header**: Default, title "Calls"
- **Layout**: FlatList
- **Components**:
  - Call row items:
    - Avatar (left, 48x48)
    - Name + call type (voice/video)
    - Timestamp + duration
    - Incoming/Outgoing/Missed icon (colored)
    - Info button (right)
  - Empty state: "No recent calls" (illustration + text)
- **Insets**: Bottom = tabBarHeight + Spacing.xl

### 8. Settings Screen (Settings Tab)

- **Header**: Default, title "Settings"
- **Layout**: ScrollView
- **Components**:
  - Profile section (avatar, name, phone, "Edit Profile" button)
  - Settings list:
    - Dark Mode toggle
    - Chat Wallpaper (navigate to picker)
    - Clear Chat History (with confirmation)
    - App Version (non-interactive)
  - Logout button (bottom, destructive color)
- **Insets**: Bottom = tabBarHeight + Spacing.xl

---

## Color Palette

**Primary**: #25D366 (WhatsApp teal)
**Background**: #FFFFFF (light), #0B141A (dark)
**Surface**: #F0F2F5 (light), #1F2C34 (dark)
**Text**: #000000 (light), #E9EDEF (dark)
**TextSecondary**: #667781 (light), #8696A0 (dark)
**Success**: #00A884
**Error**: #E53935
**Divider**: #E5E5E5 (light), #2A3942 (dark)

---

## Typography

**Font**: System default (SF Pro on iOS, Roboto on Android)
**Scale**:

- **Heading**: 28, Bold
- **Title**: 20, Semibold
- **Body**: 16, Regular
- **Caption**: 14, Regular
- **Small**: 12, Regular

---

## Assets to Generate

1. **icon.png** - App icon with teal speech bubble on white/teal gradient
2. **splash-icon.png** - Larger version of app icon for splash screen
3. **empty-chats.png** - Illustration for empty chat list (person with phone, soft colors)
4. **empty-status.png** - Illustration for empty status screen (camera icon, storytelling theme)
5. **empty-calls.png** - Illustration for empty calls screen (phone handset, calm palette)
6. **avatar-placeholder.png** - Default user avatar (gray circle with person silhouette)

**WHERE USED**:

- icon.png: Device home screen
- splash-icon.png: Splash screen center
- empty-chats.png: Chat List Screen empty state
- empty-status.png: Status Screen empty state
- empty-calls.png: Calls Screen empty state
- avatar-placeholder.png: All screens with user avatars (fallback)

---

## Visual Design Notes

- All chat bubbles have subtle shadow: shadowOffset (0, 1), shadowOpacity 0.08, shadowRadius 2
- Floating send button shadow: shadowOffset (0, 2), shadowOpacity 0.10, shadowRadius 2
- Tab bar icons use Feather icons from @expo/vector-icons
- Message status icons: checkmark (sent), double checkmark (delivered), blue double checkmark (read)
- Smooth 200ms spring animations for all interactive elements
- Skeleton loaders on initial chat list load (3 rows)
