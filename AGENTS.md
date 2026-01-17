# AGENTS.md

## Project Overview

This is an Expo/React Native mobile application. Prioritize mobile-first patterns, performance, and cross-platform compatibility.

## Documentation Resources

When working on this project, **always consult the official Expo documentation** available at:

- **https://docs.expo.dev/llms.txt** - Index of all available documentation files
- **https://docs.expo.dev/llms-full.txt** - Complete Expo documentation including Expo Router, Expo Modules API, development process
- **https://docs.expo.dev/llms-eas.txt** - Complete EAS (Expo Application Services) documentation
- **https://docs.expo.dev/llms-sdk.txt** - Complete Expo SDK documentation
- **https://reactnative.dev/docs/getting-started** - Complete React Native documentation

These documentation files are specifically formatted for AI agents and should be your **primary reference** for:

- Expo APIs and best practices
- Expo Router navigation patterns
- EAS Build, Submit, and Update workflows
- Expo SDK modules and their usage
- Development and deployment processes

## Project Structure

```
/
├── app/                       # Expo Router file-based routing
│   ├── (auth)/                # Auth screens group (unauthenticated)
│   │   ├── email-auth.tsx     # Email sign in/sign up screen
│   │   ├── onboarding.tsx     # Onboarding/welcome screen
│   │   └── _layout.tsx        # Auth stack layout
│   ├── (tabs)/                # Tab-based navigation (authenticated)
│   │   ├── index.tsx          # Home screen
│   │   ├── profile.tsx        # Profile screen
│   │   ├── edit-profile.tsx   # Edit profile screen
│   │   └── _layout.tsx        # Tabs layout
│   └── _layout.tsx            # Root layout with providers & auth guard
├── src/
│   ├── components/            # Shared React components
│   │   ├── ui/                # UI primitives (Button, Input, Text, Avatar)
│   │   ├── forms/             # Form components (FormInput with react-hook-form)
│   │   └── error/             # Error boundaries (ErrorBoundary, ScreenErrorBoundary)
│   ├── features/              # Feature-based modules
│   │   ├── auth/              # Authentication (stores, hooks)
│   │   └── profile/           # User profile (hooks)
│   ├── hooks/                 # Global custom hooks (useColors, useIsDark)
│   ├── lib/                   # Libraries and utilities
│   │   ├── api.ts             # API client configuration
│   │   ├── notifications.ts   # Push notification utilities
│   │   ├── supabase.ts        # Supabase client configuration
│   │   ├── queryClient.ts     # TanStack Query configuration
│   │   ├── theme.ts           # Theme colors, spacing, typography
│   │   └── validations/       # Zod validation schemas
│   ├── stores/                # Global Zustand stores (themeStore, notificationStore)
│   └── types/                 # TypeScript type definitions
├── assets/                    # Static assets (images, fonts)
├── app.json                   # Expo configuration
├── eas.json                   # EAS Build/Submit configuration
└── package.json               # Dependencies and scripts
```

## Supabase Backend & Migrations

This mobile app relies on a **separate Supabase repository** containing database migrations and backend configuration.

### Locating the Supabase Repository

The Supabase folder is NOT in this repository. Look for it in an adjacent repository in the parent folder:

1. If this repo is named `myproject-mobile`, check for `myproject-api` one level up
2. The naming convention is typically the same project name with `-api` suffix
3. Look for a `supabase/` folder containing `migrations/` directory

Example structure:
```
parent-folder/
├── myproject-mobile/     ← This repository
└── myproject-api/        ← Supabase repository
    └── supabase/
        ├── migrations/   ← Database migrations
        ├── config.toml
        └── seed.sql
```

### Before Making Database Changes

**Always confirm with the user** that you have identified the correct Supabase repository before:
- Reading or modifying migrations
- Generating TypeScript types from the schema
- Making any database-related changes

The `src/types/database.ts` file in this repo is generated from the Supabase schema and should stay in sync with the migrations.

## Component Architecture

### UI Primitives (`src/components/ui/`)

Reusable, theme-aware building blocks used across the entire application:

- `Button` - Pressable button with variants (primary, secondary, outline, ghost, danger)
- `Input` - Text input with label, error, and hint support
- `Text` - Typography component with variants (h1, h2, body, bodySmall, caption)
- `Avatar` - User avatar component

**Usage**: Import from `@/src/components/ui`:
```tsx
import { Button, Text, Input, Avatar } from '@/src/components/ui'
```

### Form Components (`src/components/forms/`)

Form-specific components integrated with react-hook-form:

- `FormInput` - Input wrapper with react-hook-form Controller integration

### Error Boundaries (`src/components/error/`)

Error handling components:

- `ErrorBoundary` - Generic error boundary
- `ScreenErrorBoundary` - Screen-level error boundary wrapper

**Always wrap screen components with ScreenErrorBoundary**:
```tsx
export default function MyScreen() {
  return (
    <ScreenErrorBoundary screenName="My Screen">
      <MyScreenContent />
    </ScreenErrorBoundary>
  )
}
```

### Screen-Specific Components

For components that are only used within a single screen, define them within the screen file itself rather than creating separate files. Only extract to `src/components/` when a component is reused across multiple screens.

## Theme System & Style Guidelines

### CRITICAL: Centralized Theme Enforcement

**All colors, spacing, typography, and border radius values MUST come from `src/lib/theme.ts`**. This ensures visual consistency and makes theme changes propagate throughout the app.

**NEVER use inline colors or hardcoded style values without explicit user approval.**

### Theme Structure (`src/lib/theme.ts`)

```tsx
// Colors (light and dark mode)
export const lightColors = {
  background, surface, text, secondary, tertiary,
  border, primary, accent, danger, warning, success
}
export const darkColors = { ... }

// Spacing scale
export const spacing = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32 }

// Typography scale
export const fontSize = { xs: 12, sm: 14, base: 16, lg: 18, xl: 24, '2xl': 28, '3xl': 32 }
export const fontWeight = { normal: '400', medium: '500', semibold: '600', bold: '700' }

// Border radius scale
export const borderRadius = { sm: 8, md: 12, lg: 16, full: 9999 }
```

### Accessing Theme Colors

Use the `useColors()` hook to get theme-aware colors:

```tsx
import { useColors } from '@/src/hooks/useColors'

function MyComponent() {
  const colors = useColors()
  // colors.background, colors.text, colors.accent, etc.
}
```

### Style Pattern: `createStyles` Function

Follow this pattern for all component and screen styles:

```tsx
import { useMemo } from 'react'
import { StyleSheet } from 'react-native'
import { useColors } from '@/src/hooks/useColors'
import { spacing, fontSize, borderRadius, type Colors } from '@/src/lib/theme'

const createStyles = (colors: Colors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
      padding: spacing.lg,
    },
    title: {
      fontSize: fontSize.xl,
      color: colors.text,
    },
    card: {
      backgroundColor: colors.surface,
      borderRadius: borderRadius.md,
      borderColor: colors.border,
    },
  })

function MyComponent() {
  const colors = useColors()
  const styles = useMemo(() => createStyles(colors), [colors])

  return <View style={styles.container}>...</View>
}
```

### Forbidden Practices

The following are **NOT ALLOWED** without explicit user approval:

1. **Inline color values**: `backgroundColor: '#fff'` or `color: 'red'`
2. **Hardcoded spacing**: `padding: 16` instead of `padding: spacing.md`
3. **Hardcoded font sizes**: `fontSize: 14` instead of `fontSize: fontSize.sm`
4. **Hardcoded border radius**: `borderRadius: 8` instead of `borderRadius: borderRadius.sm`
5. **Direct StyleSheet.create without theme colors**: Always use the `createStyles(colors)` pattern

### Acceptable Exceptions (with justification)

- `flex: 1`, `flexDirection`, `alignItems`, `justifyContent` - layout properties
- `width: '100%'`, `height: '100%'` - relative sizing
- `position`, `top`, `left`, `right`, `bottom` - positioning
- Platform-specific shadow values (shadowColor, shadowOffset, etc.)
- `opacity` values for disabled states

## Development Guidelines

### Code Style & Standards

- **TypeScript First**: Use TypeScript for all new code with strict type checking
- **Naming Conventions**: Use meaningful, descriptive names for variables, functions, and components
- **Self-Documenting Code**: Write clear, readable code that explains itself; only add comments for complex business logic or design decisions
- **React 19 Patterns**: Follow modern React patterns including:
  - Function components with hooks
  - Enable React Compiler
  - Proper dependency arrays in useEffect
  - Memoization when appropriate (useMemo, useCallback)
  - Error boundaries for better error handling

### Navigation & Routing

- Use **Expo Router** for all navigation
- Import `Link`, `router`, and `useLocalSearchParams` from `expo-router`
- Docs: https://docs.expo.dev/router/introduction/

### Import Aliases

Use the `@/` alias for imports from the project root:

```tsx
import { Button } from '@/src/components/ui'
import { useColors } from '@/src/hooks'
import { spacing } from '@/src/lib/theme'
```

### Installed Libraries

Use these libraries for their respective purposes. Do not introduce alternative libraries without explicit user approval. Libraries can be removed if their functionality is not needed.

| Purpose | Library | Notes |
|---------|---------|-------|
| Navigation | `expo-router` | File-based routing, import from `expo-router` |
| Images | `expo-image` | Always use instead of React Native's Image |
| Animations | `react-native-reanimated` | Native thread animations |
| Gestures | `react-native-gesture-handler` | Native gesture recognition |
| Storage | `@react-native-async-storage/async-storage` | Key-value persistence |
| Data Fetching | `@tanstack/react-query` | Server state, caching, configured in `lib/queryClient.ts` |
| State Management | `zustand` | Client state, stores in `src/stores/` |
| Forms | `react-hook-form` + `zod` | Form state + validation schemas in `lib/validations/` |
| Backend | `@supabase/supabase-js` | Auth, database, configured in `lib/supabase.ts` |
| Push Notifications | `expo-notifications` | Configured in `lib/notifications.ts` |
| Icons | `@expo/vector-icons` | Use Ionicons or other included icon sets |
| Social Auth | `@react-native-google-signin/google-signin`, `expo-apple-authentication` | Google and Apple sign-in |


## AI Agent Instructions

When working on this project:

1. **Always start by consulting the appropriate documentation**:

   - For general Expo questions: https://docs.expo.dev/llms-full.txt
   - For EAS/deployment questions: https://docs.expo.dev/llms-eas.txt
   - For SDK/API questions: https://docs.expo.dev/llms-sdk.txt

2. **Understand before implementing**: Read the relevant docs section before writing code

3. **Follow existing patterns**: Look at existing components and screens for patterns to follow

4. **Enforce theme consistency**: Never introduce inline colors or hardcoded style values without asking the user first
