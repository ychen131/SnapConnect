# **SnapConnect \- Modern Minimalist Theme Rules**

This document specifies the visual design system for SnapConnect. These rules should be configured in tailwind.config.js to ensure app-wide consistency.

### **1\. Color Palette**

The palette is minimalist and high-contrast, using a neutral base with a single, vibrant accent color for primary actions and branding.

- **Background (bg-background):** Almost Black (\#111111) \- Provides a deep, immersive feel that makes content pop.
- **Primary UI Elements (bg-ui-primary):** Dark Gray (\#1C1C1E) \- Used for chat bubbles, input fields, and other non-background surfaces.
- **Secondary UI Elements (bg-ui-secondary):** Medium Gray (\#2C2C2E) \- Used for dividers and inactive UI elements.
- **Primary Text (text-text-primary):** White (\#FFFFFF) \- For all primary text and active icons.
- **Secondary Text (text-text-secondary):** Light Gray (\#8E8E93) \- For timestamps, captions, and placeholder text.
- **Accent Color (bg-accent / text-accent):** Electric Blue (\#007AFF) \- Used for buttons, notification dots, sender names, and all key interactive elements. It's our brand color.
- **Destructive Action (bg-error):** Red (\#FF3B30) \- For destructive actions like "Delete Friend".
- **Confirmation (bg-success):** Green (\#34C759) \- For success indicators.

### **2\. Typography**

We will use a single, highly-legible sans-serif font family available through system fonts to ensure performance.

- **Font Family:** San Francisco (on iOS), Roboto (on Android). React Native will handle this by default.
- **Hierarchy:**
  - text-3xl (30pt, Bold): Screen Titles (e.g., "Stories", "Chat").
  - text-xl (20pt, Bold): Section Headers (e.g., "My Story", Friend's name in chat list).
  - text-base (17pt, Regular): Body copy, primary text in UI elements.
  - text-sm (15pt, Regular): Captions, secondary info (e.g., "Opened", timestamps).
  - text-xs (13pt, Regular): Tertiary info, disclaimers.

### **3\. Spacing & Sizing**

A consistent 4-point grid system will be used for all margins, padding, and positioning to create a visually harmonious layout.

- 1 unit \= 4px (p-1, m-1)
- 2 units \= 8px (p-2, m-2)
- 3 units \= 12px (p-3, m-3)
- 4 units \= 16px (p-4, m-4) \- **Default** padding for screen containers and list items.
- 6 units \= 24px (p-6, m-6)
- 8 units \= 32px (p-8, m-8)

### **4\. Iconography**

Icons must be simple, consistent, and instantly recognizable.

- **Style:** Solid, line-art style with a consistent stroke width (2pt). They should feel clean and modern.
- **Source:** We will use a high-quality, open-source icon library like **Feather Icons** or **Lucide Icons**, which are compatible with React Native.
- **Color:**
  - **Active/Tappable Icons:** Primary Text (\#FFFFFF).
  - **Inactive Icons:** Secondary Text (\#8E8E93).
  - **Highlighted Icons (e.g., for notifications):** Accent (\#007AFF).

### **5\. Components & Corner Radius**

- **Buttons:** Will have a standard corner radius of rounded-lg (8px).
- **Input Fields:** Will have a corner radius of rounded-lg (8px).
- **Chat Bubbles:** Will use a larger radius, rounded-2xl (16px), to feel softer and more conversational.
- **Stories/Profile Avatars:** Will be perfect circles (rounded-full).
