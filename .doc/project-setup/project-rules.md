# SnapDog - Project & Coding Rules

This document outlines the architectural and coding standards for the SnapDog project. Adherence to these rules is mandatory to ensure the codebase is modular, scalable, maintainable, and easily navigable by both developers and AI-assisted tools.

---

### 1. Directory Structure

Our project will follow a feature-first, modular structure. All application code will reside within the `/src` directory.

/src
├── api/ # Supabase client interactions (e.g., user profiles, snaps API).
├── assets/ # Static assets like images, custom fonts, etc.
│ ├── fonts/
│ └── images/
├── components/ # Shared, reusable UI components (e.g., PrimaryButton, Avatar).
│ └── ui/
├── constants/ # App-wide constants (e.g., route names, string constants).
├── features/ # Redux Toolkit slices, organized by feature (e.g., auth, chat).
│ ├── auth/
│ │ └── authSlice.ts
│ └── chat/
│ └── chatSlice.ts
├── hooks/ # Custom React hooks (e.g., useAuth, useDebounce).
├── navigation/ # React Navigation navigators and configuration.
├── screens/ # Top-level screen components, organized by feature flow.
│ ├── Auth/
│ │ ├── LoginScreen.tsx
│ │ └── SignupScreen.tsx
│ ├── Camera/
│ │ └── CameraScreen.tsx
│ └── ...
├── services/ # Business logic, utility functions, interacting with APIs.
├── styles/ # Global styling configuration.
│ └── tailwind.config.js # Theme and NativeWind configuration.
└── utils/ # General utility functions (e.g., formatters, validators).

---

### 2. File Naming Conventions

Descriptive and consistent naming is crucial for navigability.

- **Components & Screens:** `PascalCase.tsx`. (e.g., `PrimaryButton.tsx`, `ChatScreen.tsx`).
- **Hooks:** `camelCase.ts` with a `use` prefix. (e.g., `useAuth.ts`).
- **API/Services/Utils/Hooks:** `camelCase.ts`. (e.g., `authService.ts`, `dateUtils.ts`).
- **Redux Slices:** `camelCaseSlice.ts`. (e.g., `authSlice.ts`).
- **Test Files:** Append `.spec.ts` or `.spec.tsx`. (e.g., `PrimaryButton.spec.tsx`).

---

### 3. Code & Commenting Standards

Code is read more often than it is written. Clarity is paramount.

- **File Header Comment:** Every file must begin with a block comment explaining its purpose and contents.
  ```typescript
  /**
   * @file CameraScreen.tsx
   * @description This is the main camera screen of the application. It handles
   * camera permissions, media capture, and navigation to other primary screens.
   */
  ```
- **Function Commentation (TSDoc):** All functions, hooks, and components must have TSDoc-style comments explaining their purpose, parameters, and return values.
  ```typescript
  /**
   * A hook to fetch and manage the current user's friend list.
   * @param {string} userId - The ID of the user whose friends to fetch.
   * @returns {{ friends: Friend[], isLoading: boolean, error: Error | null }}
   * An object containing the friend list, loading state, and any error.
   */
  const useFriends = (userId: string) => {
    // ...
  };
  ```
- **Maximum File Length:** No file should exceed 500 lines. This forces modularity and makes files easier for AI tools to parse. If a file grows too large, it must be refactored into smaller, more focused modules.

---

### 4. Technology-Specific Conventions

- **React & React Native:**
  - Always use functional components with Hooks. Class components are not permitted.
  - Destructure props and use TypeScript for typing.
  - Use `Pressable` or `TouchableOpacity` for all tappable elements instead of `View` with `onPress`.

- **Redux Toolkit:**
  - State should be normalized whenever possible to maintain a flat structure.
  - Use `createAsyncThunk` for all asynchronous API calls to standardize state for loading, success, and error cases.
  - Selectors should be created to abstract the shape of the state from the components.

- **NativeWind:**
  - Define all theme colors, fonts, and spacing in `tailwind.config.js` as specified in `theme-rules.md`.
  - For simple, one-off layouts, use utility classes directly in the `className` prop.
  - If a component's `className` string becomes long (>10-15 classes) or the element is reused, it must be extracted into a dedicated, styled component (e.g., `PrimaryButton.tsx`).

- **Supabase:**
  - All interactions with the Supabase client must be abstracted into the `/src/api` or `/src/services` directories.
  - UI components should not directly import or call the Supabase client. They should dispatch Redux thunks that handle the API interaction.
  - Always implement and double-check Row-Level Security (RLS) policies in the Supabase dashboard for any table containing user data.
