# **SnapConnect \- Final Tech Stack & Developer Guide (Phase 1\)**

**Foundation:**

- **Framework:** React Native with Expo
- **Backend:** Supabase (Auth, Database, Storage, Realtime)

This document outlines the finalized libraries and technologies to build SnapConnect. It includes key conventions, best practices, and common pitfalls to guide our development process.

### **1\. Navigation: React Navigation**

- **Description:** The de-facto, community-driven solution for routing and navigation in React Native.
- **Justification:** Its high-level API will allow us to implement our entire navigation flow (swipes between camera, chat, and stories) very quickly, which is essential for our 7-day sprint.

#### **Best Practices & Considerations**

- **Navigator Nesting:** Structure navigators logically. A common pattern is to have a root stack navigator that handles authentication flow (login/signup screens vs. main app), and a main navigator (e.g., a bottom tab navigator or a custom swiper) for the core app screens. Each tab can then have its own stack navigator for inner navigation (e.g., Chat List \-\> Chat Conversation).
- **Type-Checking Routes:** Strongly type your navigators and routes with TypeScript. This provides auto-completion for route names and parameters, preventing common runtime errors.
- **Screen-Specific Logic:** Use the useFocusEffect hook to run side effects (like fetching data) whenever a screen comes into focus, and clean them up when it goes out of focus. This is more reliable than useEffect for navigation.
- **Common Pitfall:** Avoid passing complex objects or large amounts of data through navigation params. This can slow down navigation and is hard to debug. For complex data, fetch it within the screen or use a global state manager like Redux.

### **2\. State Management: Redux Toolkit**

- **Description:** The official, opinionated toolset for efficient Redux development.
- **Justification:** Given our use of an LLM to automate boilerplate, we can leverage Redux's powerful, scalable architecture and best-in-class DevTools for debugging complex, real-time state changes.

#### **Best Practices & Considerations**

- **Slice Structure:** Use createSlice to co-locate reducer logic, action creators, and initial state for each feature. This keeps related logic organized.
- **Async Operations:** Use createAsyncThunk for all asynchronous logic, such as fetching user data or friends lists from Supabase. This standardizes how loading, success, and error states are handled.
- **Keep Store Serializable:** A core Redux principle. Do not store non-serializable values like functions, promises, or component instances in the store. The Redux DevTools rely on serializability to function correctly.
- **Normalize State:** For complex, nested data like a list of chats with messages, normalize it. Store items in a lookup table (e.g., { byId: { 'chat1': ... }, allIds: \['chat1'\] }) instead of a deep array. This prevents nested state updates and simplifies reducer logic.
- **Common Pitfall:** Overusing Redux for all state. State that is local to a single component (e.g., the value of a text input, or whether a modal is open) should remain in React component state (useState).

### **3\. Camera & AR: expo-camera**

- **Description:** The official Camera API for Expo for rendering a camera preview and capturing media.
- **Justification:** It is the most straightforward, "batteries-included" way to get a camera working quickly and reliably within the Expo ecosystem.

#### **Best Practices & Considerations**

- **Permissions Handling:** Always check for and request camera and microphone permissions _before_ attempting to render the \<Camera /\> component. Render a loading indicator or a "permission required" message until permissions are granted.
- **Resource Management:** The camera is resource-intensive. Ensure you unmount the camera component when it's not visible to release system resources and conserve battery life. For example, use useIsFocused from React Navigation to only render the camera when the screen is active.
- **Optimize Media:** Configure the quality (for photos) and codec (for videos) settings to find a balance between high-quality media and manageable file sizes for faster uploads.
- **Common Pitfall:** Performance can vary significantly across different Android devices. Test on a range of physical devices if possible. What's smooth on a high-end iPhone might be slow on a budget Android device.

### **4\. Real-time Communication: Supabase Realtime Subscriptions**

- **Description:** Supabase's built-in functionality for listening to database changes over WebSockets.
- **Justification:** It's directly integrated into our backend, eliminating the need for an additional service. It's the most direct and efficient real-time solution for our stack.

#### **Best Practices & Considerations**

- **Row-Level Security (RLS) is Mandatory:** This is the most critical convention. All real-time subscriptions respect your RLS policies. Ensure policies are in place so users can only subscribe to changes on data they are authorized to see (e.g., snaps sent to them). **Never disable RLS on a public-facing table.**
- **Scoped Subscriptions:** Be specific. Subscribe to changes on a specific table and use filters (e.g., eq('user_id', userId)) to listen only to relevant events. Avoid subscribing to all changes on a table (\*) if possible.
- **Lifecycle Management:** Create subscriptions when a component mounts (e.g., in useEffect) and **always** remove the subscription in the cleanup function to prevent memory leaks and unnecessary connections.
- **Common Pitfall:** Forgetting to handle the initial data load. A subscription only tells you about _new_ changes. You must first fetch the existing data (e.g., all current chat messages) and _then_ subscribe to get updates.

### **5\. Styling & UI: NativeWind**

- **Description:** A utility-first styling library that brings the power of Tailwind CSS to React Native.
- **Justification:** Our app requires a highly custom UI. NativeWind allows for rapid development of bespoke components, providing maximum flexibility and speed.

#### **Best Practices & Considerations**

- **Centralize the Theme:** Define all design tokens (colors, spacing, fonts, etc.) in tailwind.config.js. Avoid using arbitrary values in class names (e.g., prefer p-4 over p-\[16px\]). This ensures consistency and makes rebranding easy.
- **Create Reusable Components:** For elements used repeatedly (like buttons, input fields, or profile avatars), create a dedicated component. This avoids repeating long strings of utility classes and makes the codebase cleaner.
  - _Example:_ Create a \<PrimaryButton\> component instead of writing className="bg-blue-500 text-white font-bold p-3 rounded-lg" everywhere.
- **Platform-Specific Styles:** Use platform prefixes like ios: and android: for styles that need to differ between platforms.
- **Common Pitfall:** Creating "utility-class soup" which makes components hard to read. If a component has more than 10-15 utility classes, it's a strong signal that parts of it should be extracted into a smaller, reusable component.

### **Appendix: Testing the Redux Toolkit Setup**

To ensure our state management foundation is solid, we will use a layered testing approach:

- **1\. Manual Smoke Test (with Redux DevTools):** The "hello world" of Redux setup. We will create a simple test slice (e.g., a counter), dispatch actions from the UI, and verify in the Redux DevTools that the action was logged and the state was updated correctly. This confirms the core connection between our store, provider, and components is working.
- **2\. Unit Tests (with Jest):** We will write unit tests for our reducer logic. Since reducers are pure functions, we can test them in isolation by providing an initial state and an action, then asserting that the function returns the expected new state. This validates our business logic.
- **3\. Integration Tests (with React Native Testing Library):** We will test the full loop of a feature. These tests will render a component wrapped in the Redux Provider, simulate a user event (like a button press), and then assert that the component's UI updates correctly in response to the Redux state change. This gives us the highest confidence that our components are correctly connected to the store.
