# Mobile App Template (Expo/React Native)

A production-ready mobile app template built with Expo Router, Supabase Auth, and TanStack Query.

## Features

- **Authentication**: Email/password auth with Supabase
- **Push Notifications**: Full FCM/APNs support via expo-notifications
- **State Management**: Zustand stores for auth, theme, and notifications
- **Data Fetching**: TanStack Query with optimized caching
- **Theming**: Light/dark/system mode support
- **Error Handling**: Error boundaries for screens and global shell
- **TypeScript**: Strict type checking throughout
- **CI/CD**: Codemagic configuration for iOS builds

## Quick Start

### 1. Clone and Install

```bash
npm install
```

### 2. Configure Environment Variables

Copy the example environment file:

```bash
cp .env.example .env
```

Edit `.env` with your Supabase credentials:

```env
EXPO_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
EXPO_PUBLIC_SUPABASE_PUB_KEY=your-anon-key-here
APP_ENV=development
```

### 3. Update App Configuration

Edit `app.json` and replace placeholder values:

- `name`: Your app name
- `slug`: Your app slug (lowercase, hyphens)
- `scheme`: Your deep link scheme (lowercase, no special chars)
- `ios.bundleIdentifier`: Your iOS bundle ID (e.g., `com.yourcompany.yourapp`)
- `android.package`: Your Android package name
- `extra.eas.projectId`: Your EAS project ID (run `eas init` to create one)
- `owner`: Your Expo username
- `updates.url`: Update with your EAS project ID

### 4. Set Up Supabase

This template requires a Supabase backend with specific database tables and migrations. The Supabase configuration is maintained in a **separate repository**.

1. Clone the companion Supabase repository:
   ```bash
   git clone <YOUR_SUPABASE_REPO_URL> supabase-backend
   cd supabase-backend
   ```

2. Start local Supabase:
   ```bash
   supabase start
   ```

3. Run the migrations:
   ```bash
   supabase db reset
   ```

4. Get your local credentials:
   ```bash
   supabase status
   ```
   Copy the `API URL` and `anon key` to your `.env` file.

See the Supabase repository README for more details on the database schema and migrations.

### 5. Start Development

```bash
npx expo start
```

## Environment Configuration

### Local Development (.env)

For local development, use a `.env` file:

```env
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_PUB_KEY=your-anon-key
APP_ENV=development
```

### EAS Builds (eas.json)

For EAS builds, configure environment variables in `eas.json`:

```json
{
  "build": {
    "development": {
      "env": {
        "APP_ENV": "development",
        "EXPO_PUBLIC_SUPABASE_URL": "your-dev-url",
        "EXPO_PUBLIC_SUPABASE_PUB_KEY": "your-dev-key"
      }
    },
    "production": {
      "env": {
        "APP_ENV": "production",
        "EXPO_PUBLIC_SUPABASE_URL": "your-prod-url",
        "EXPO_PUBLIC_SUPABASE_PUB_KEY": "your-prod-key"
      }
    }
  }
}
```

### EAS Secrets (Recommended for Production)

For sensitive values, use EAS secrets:

```bash
eas secret:create --name EXPO_PUBLIC_SUPABASE_URL --value "your-url"
eas secret:create --name EXPO_PUBLIC_SUPABASE_PUB_KEY --value "your-key"
```

Then reference in `eas.json`:

```json
{
  "build": {
    "production": {
      "env": {
        "EXPO_PUBLIC_SUPABASE_URL": "@EXPO_PUBLIC_SUPABASE_URL",
        "EXPO_PUBLIC_SUPABASE_PUB_KEY": "@EXPO_PUBLIC_SUPABASE_PUB_KEY"
      }
    }
  }
}
```

## Push Notifications

### Android Setup

1. Create a Firebase project at https://console.firebase.google.com
2. Add an Android app with your package name
3. Download `google-services.json` and place it in the project root
4. The file is already referenced in `app.json`

### iOS Setup

1. Configure push credentials in EAS:
   ```bash
   eas credentials
   ```
2. Select iOS, then push notifications
3. EAS will guide you through creating/uploading push credentials

### Token Storage

Push tokens are automatically stored in the `users.fcm_tokens` column when users sign in.

## Commands

### Development

```bash
npx expo start          # Start dev server
npx expo start --clear  # Clear cache and start
```

### EAS Build & Deploy

Requires EAS CLI installed globally (`npm install -g eas-cli`).

```bash
# Development builds (internal testing)
eas build --profile development --platform ios
eas build --profile development --platform android

# Production builds
eas build --profile production --platform ios
eas build --profile production --platform android

# Build and submit to stores
eas build --profile production --platform ios --auto-submit
eas build --profile production --platform android --auto-submit

# Over-the-air updates
eas update --branch production --message "Description of update"
```

### Build Profiles

| Profile | Purpose |
|---------|---------|
| `development` | Dev client builds for internal distribution |
| `production` | Store builds with auto-increment versioning |

## Project Structure

```
├── app/                    # Expo Router file-based routing
│   ├── (auth)/             # Auth screens (email-auth, onboarding)
│   ├── (tabs)/             # Tab navigation (home, profile, edit-profile)
│   └── _layout.tsx         # Root layout with providers
├── src/
│   ├── components/         # Reusable components
│   │   ├── ui/             # UI primitives (Button, Input, Text, Avatar)
│   │   ├── forms/          # Form components with react-hook-form
│   │   └── error/          # Error boundaries
│   ├── features/           # Feature modules
│   │   ├── auth/           # Authentication (stores)
│   │   └── profile/        # User profile (hooks)
│   ├── hooks/              # Global hooks (useColors, useIsDark)
│   ├── lib/                # Utilities (api, supabase, theme, queryClient, notifications)
│   ├── stores/             # Global Zustand stores (theme, notifications)
│   └── types/              # TypeScript types
├── assets/                 # Static assets
├── app.json                # Expo configuration
└── eas.json                # EAS Build configuration
```

## Adding New Features

### Creating a New CRUD Feature

1. Add types to `src/types/database.ts`
2. Create feature folder: `src/features/yourfeature/`
3. Create hooks: `src/features/yourfeature/hooks/useYourFeature.ts`
4. Export from feature index: `src/features/yourfeature/index.ts`

Example hook structure (see `src/features/items/hooks/useItems.ts`):

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/src/lib/supabase'

export const yourFeatureKeys = {
  all: ['yourfeature'] as const,
  list: (userId: string) => [...yourFeatureKeys.all, 'list', userId] as const,
  detail: (id: string) => [...yourFeatureKeys.all, 'detail', id] as const,
}

export function useYourFeatures(userId: string | undefined) {
  return useQuery({
    queryKey: yourFeatureKeys.list(userId ?? ''),
    queryFn: async () => {
      // Your query logic
    },
    enabled: !!userId,
  })
}
```

## CI/CD with Codemagic

### Setup

1. Connect your repository to Codemagic
2. Add App Store Connect API key to Codemagic integrations
3. Update `codemagic.yaml` with your values:
   - `bundle_identifier`: Your iOS bundle ID
   - `XCODE_WORKSPACE`: Your workspace name (matches app name)
   - `XCODE_SCHEME`: Your scheme name (matches app name)
   - `APP_ID`: Your App Store Connect app ID
   - Environment variables for Supabase

### Building

Push to your repository to trigger builds, or manually trigger from Codemagic dashboard.

## Troubleshooting

### "Expo Go" Errors

If you see errors in Expo Go, you likely need a development build:

```bash
eas build --profile development --platform ios
# or
eas build --profile development --platform android
```

Expo Go has limited native module support. Development builds include all native code.

### Type Errors After Schema Changes

Regenerate database types:

```bash
npx supabase gen types typescript --project-id your-project-id > src/types/database.ts
```

### Push Notifications Not Working

1. Check device is physical (simulators don't support push)
2. Verify `google-services.json` is present for Android
3. Verify iOS push credentials in EAS
4. Check `fcm_tokens` column is being populated

## License

MIT
