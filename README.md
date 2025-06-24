# SnapConnect

A modern Snapchat clone built with React Native, Expo, and Supabase, featuring ephemeral messaging and real-time communication.

## 🚀 Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- Expo CLI (`npm install -g @expo/cli`)
- iOS Simulator (for iOS development) or Android Studio (for Android development)

### Installation

1. **Clone the repository**

   ```bash
   git clone <your-repo-url>
   cd SnapConnect
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Environment Setup**
   - Copy `env.example` to `.env`
   - Fill in your Supabase credentials:
     ```bash
     cp env.example .env
     ```

4. **Supabase Setup**
   - Create a new project at [supabase.com](https://supabase.com)
   - Get your project URL and anon key from the project settings
   - Update your `.env` file with the credentials

5. **Start the development server**
   ```bash
   npm start
   ```

## 📱 Running the App

### iOS

```bash
npm run ios
```

### Android

```bash
npm run android
```

### Web

```bash
npm run web
```

## 🏗️ Project Structure

```
src/
├── api/          # Supabase client interactions
├── assets/       # Static assets (fonts, images)
├── components/   # Reusable UI components
├── constants/    # App-wide constants
├── features/     # Redux Toolkit slices
├── hooks/        # Custom React hooks
├── navigation/   # React Navigation setup
├── screens/      # Screen components
├── services/     # Business logic and utilities
├── styles/       # Global styling configuration
└── utils/        # General utility functions
```

## 🛠️ Development

### Code Style

This project uses:

- **ESLint** for code linting
- **Prettier** for code formatting
- **TypeScript** for type safety

### Available Scripts

- `npm start` - Start the Expo development server
- `npm run ios` - Run on iOS simulator
- `npm run android` - Run on Android emulator
- `npm run web` - Run on web browser
- `npm run lint` - Run ESLint
- `npm run format` - Run Prettier

### Environment Variables

Required environment variables (see `env.example`):

- `EXPO_PUBLIC_SUPABASE_URL` - Your Supabase project URL
- `EXPO_PUBLIC_SUPABASE_ANON_KEY` - Your Supabase anonymous key

## 📚 Tech Stack

- **Framework**: React Native with Expo
- **Backend**: Supabase (Auth, Database, Storage, Realtime)
- **State Management**: Redux Toolkit
- **Navigation**: React Navigation
- **Styling**: NativeWind (Tailwind CSS for React Native)
- **Language**: TypeScript

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License.
