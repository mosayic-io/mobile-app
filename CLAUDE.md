# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is an Expo/React Native mobile application. Prioritize mobile-first patterns, performance, and cross-platform compatibility.

It runs in a **development build** (`expo-dev-client`) — Expo Go is NOT supported and must never be suggested: the app pre-installs native modules, and the Expo Go app in the stores lags behind the SDK.

## Production is not a place you run things

The app has a development backend (the Supabase running in Docker from the API repo next door) and a production one (the hosted Supabase project). You may READ production in a limited sense — check whether an environment variable or secret exists, look at a build's status — and SET a secret when the user explicitly asks. You must NEVER run scripts, one-off commands or SQL against the production database, and never point a local run at it with production keys in `.env`. Schema changes reach production only as migration files in the API repo, shipped by a release. If a task seems to need production data, stop and ask.

## The app's identity — set once

`app.json` ships with placeholders: `name`, `slug`, `scheme` (`yourappname`) and `ios.bundleIdentifier` / `android.package` (`com.yourcompany.yourappname`). Naming the app is the first task on a new project, and then those values are left alone — the bundle id is **permanent** once anything has been built or submitted, and the `scheme` is what the links site's `site.config.json` (`appScheme`) and every deep link rely on. `extra.eas.projectId` is written by `eas init` — never by hand. The `version` fields stay at `0.0.1` until you ship: bump them for a release, never for a build.

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
│   ├── (auth)/                # Sign-in flow, pushed from Profile → "Sign in"
│   │   ├── sign-in.tsx        # Sign-in method selection (Google/Apple/email)
│   │   ├── email-auth.tsx     # Email sign in/sign up screen
│   │   └── _layout.tsx        # Auth stack layout (returns to Profile once signed in)
│   ├── (tabs)/                # Tab-based navigation — open to everyone
│   │   ├── index.tsx          # Home screen (public; shows the design preview)
│   │   ├── profile.tsx        # Profile screen (signed-out state holds the "Sign in" button)
│   │   ├── edit-profile.tsx   # Edit profile screen (signed-in only)
│   │   └── _layout.tsx        # Tabs layout
│   └── _layout.tsx            # Root layout with providers; no auth guard — screens check `user` themselves
├── src/
│   ├── components/            # Shared React components
│   │   ├── ui/                # UI primitives (Button, Input, Text, Avatar, Card, ListGroup/ListRow, Segmented, NavBar)
│   │   ├── forms/             # Form components (FormInput with react-hook-form)
│   │   └── error/             # Error boundaries (ErrorBoundary, ScreenErrorBoundary)
│   ├── features/              # Feature-based modules
│   │   ├── auth/              # Authentication (stores, hooks)
│   │   └── profile/           # User profile (hooks)
│   ├── hooks/                 # Global custom hooks (useColors, useIsDark, useShadows, useTabBarPadding — the tab bar floats, screens pad under it)
│   ├── lib/                   # Libraries and utilities
│   │   ├── env.ts             # Env reading + `backendConfigured` (the app runs without a backend)
│   │   ├── embed.ts           # Web build inside a phone-shaped iframe: `?insets=top,bottom` → safe-area insets; posts the colour scheme to the parent
│   │   ├── api.ts             # deleteAuthUser (delete_own_account RPC) + apiFetch for the Python API
│   │   ├── notifications.ts   # Push notification utilities
│   │   ├── supabase.ts        # Supabase client configuration
│   │   ├── queryClient.ts     # TanStack Query configuration
│   │   ├── theme.ts           # Theme colors, spacing, typography, radii, shadows
│   │   └── validations/       # Zod validation schemas
│   ├── stores/                # Global Zustand stores (themeStore, notificationStore)
│   └── types/                 # TypeScript type definitions
├── assets/                    # Static assets (images, fonts)
├── app.json                   # Expo configuration
├── eas.json                   # EAS Build/Submit configuration
└── package.json               # Dependencies and scripts
```

## Auth Model

The home tab is public; sign-in lives in the Profile tab. There is no route
guard — a screen that needs a user checks `useAuthStore().user` itself (see
`edit-profile.tsx`). The app also boots with no backend configured (the
`.env.example` placeholders, or no `.env`): `backendConfigured` in
`src/lib/env.ts` is false, the Supabase client throws a clear error only when
first used, and Profile explains that Supabase needs connecting before sign-in.

## Native code means a rebuild

A development build is compiled once per device and then only `npm start` is needed — until a package with **native code** is added, which means a new build (`eas build --profile development`, or `npm run ios` / `npm run android` locally). So:

- Prefer what's already installed (see Installed Libraries — `expo-image-picker`, `expo-blur`, `expo-notifications` and the rest are pre-built into every development build so a feature never forces a rebuild). Pure-JS libraries can be added freely.
- Install with `npx expo install <package>`, never plain `npm install` for runtime packages — it picks versions compatible with this SDK.
- Don't add a native package on someone's behalf mid-feature: build the feature with what's installed, and say which package it would need.
- Ship with `eas build --profile production` (bump `version` in `app.json` first), then submit. `eas.json` holds the profiles.

## Before you call a change done

`npm run typecheck` (`tsc --noEmit`) passes and `npm run lint` is clean. A screen that doesn't compile is not a feature.

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

The `src/types/database.ts` file in this repo is generated from the Supabase schema and should stay in sync with the migrations. Never edit it by hand — after a migration is applied locally, regenerate it from the API folder: `npx supabase gen types typescript --local > ../<this repo>/src/types/database.ts`.

### Files and uploads (Supabase Storage)

Files live in Storage, not in the database. The bucket and its rules are a migration in the API repo (see its `CLAUDE.md`); on this side:

- Every file goes at a path inside the user's own folder: `${user.id}/avatar.jpg` — the policies depend on it.
- Upload with `supabase.storage.from(bucket).upload(path, body, { upsert: true, contentType })` where `body` is an **ArrayBuffer** (`await fetch(uri).then((r) => r.arrayBuffer())`). Never a Blob or FormData from React Native — that uploads empty files on some devices.
- Keep uploads small (`expo-image-picker`'s `quality` ≈ 0.7, `allowsEditing` for a square crop), overwrite with `upsert` so versions don't pile up, and append `?v=${Date.now()}` to a replaced image's URL so it isn't served from cache.
- Public buckets (avatars) are read by public URL; private ones through signed URLs.

## Component Architecture

### UI Primitives (`src/components/ui/`)

Reusable, theme-aware building blocks used across the entire application:

- `Button` - Pressable button with variants (primary, secondary, outline, ghost, danger)
- `Input` - Text input with label, error, and hint support
- `Text` - Typography component with variants (h1 = the large title, h2, h3, body, bodySmall, caption, label, mono)
- `Avatar` - User avatar: photo, or initials / a person glyph on an accent wash
- `Card` - Surface container with the card radius, a hairline edge and one soft shadow; give it `onPress` and it becomes a tile that dips when pressed
- `ListGroup` / `ListRow` - The iOS inset grouped list (Settings-style): an uppercase header, rows on one rounded surface separated by hairlines; rows take a `detail`, a `leading` swatch/icon, a chevron, a `tone` (accent / danger) and `onPress`
- `Segmented` - The iOS segmented control: a pill track with a thumb that slides to the selected option
- `NavBar` - The glass navigation bar that fades in once a screen's large title scrolls away; screens pass it the `scrollY` shared value from `useAnimatedScrollHandler`

**Usage**: Import from `@/src/components/ui`:
```tsx
import { Button, Text, Input, Avatar, Card, ListGroup, ListRow, Segmented, NavBar } from '@/src/components/ui'
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
// Colors (light and dark mode) — the iOS system palette: grouped-background
// grey with white surfaces (light), black with #1C1C1E surfaces (dark);
// secondary / tertiary / border are translucent so they sit on any surface.
export const lightColors = {
  background, surface, text, secondary, tertiary,
  border,        // hairline separators
  edge,          // the barely-there outline around a card
  primary, onPrimary,
  accent, accentSoft,   // accentSoft = the accent at 16%: avatar washes, chips
  danger, warning, success, onDanger, overlay,
  glassNav, glassTab,   // translucent fills over the blur (NavBar, tab bar)
  segmentTrack, segmentThumb,
}
export const darkColors = { ... }

// Spacing scale
export const spacing = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32 }

// Typography scale
export const fontSize = { xs: 12, sm: 14, base: 16, lg: 18, xl: 24, '2xl': 28, '3xl': 32 }
export const fontWeight = { normal: '400', medium: '500', semibold: '600', bold: '700' }

// Typefaces — the system font everywhere, plus a mono face for token values / code
export const fontFamily = { mono }

// Border radius scale — `card` for every grouping surface, `control` for
// buttons and inputs, `sm` / `md` for small things, `full` for pills and circles
export const borderRadius = { sm: 8, md: 12, control: 14, card: 26, full: 9999 }

// Shadows — one soft card elevation, deeper in dark mode; read via useShadows()
export const shadows = { light: { card }, dark: { card } }
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
      borderRadius: borderRadius.card,
      borderColor: colors.edge,
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
| Vector Graphics | `react-native-svg` | Gradients and custom shapes |
| Glass surfaces | `expo-blur` | The blur under the floating tab bar and the `NavBar` (fills are the `glassTab` / `glassNav` theme tokens). Cards are opaque `surface`. |
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
