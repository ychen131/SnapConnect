# **SnapConnect User Flow \- Phase 1 MVP**

**Document Purpose:** This document outlines the primary user journeys for the Phase 1 build of SnapConnect. It serves as a guide for architecture design, UI/UX development, and feature prioritization.

### **1.0 Onboarding & Authentication Flow**

This flow describes the journey for a new or returning user to access the app.  
**1.1. New User Registration**

1. User opens app for the first time.
2. User is presented with two options: "Log In" and "Sign Up".
3. User taps "Sign Up".
4. **Screen 1: Create Account:** User enters email, password, and date of birth.
5. **Screen 2: Choose Username:** User is prompted to create a unique username. The app will check for uniqueness in real-time.
6. **Screen 3: Add Friends (Optional):** App requests permission to scan contacts to find friends already on SnapConnect. User can "Allow" or "Skip".
7. **Screen 4: Camera Permissions:** App requests mandatory permission to use the Camera and Microphone.
8. Upon granting permissions, the user is immediately taken to the **Camera Screen (2.0)**, completing the onboarding process.

**1.2. Existing User Login**

1. User opens app.
2. User taps "Log In".
3. User enters their username and password.
4. Upon successful authentication, the user lands on the **Camera Screen (2.0)**. If they have unread snaps, they may be directed to the **Chat Screen (4.1)** instead.

### **2.0 Core Experience: The Camera & Creation Flow**

This is the default, central experience of the application.

1. User lands on the main **Camera Screen** after opening the app. The rear-facing camera is active by default.
2. **UI Elements on Camera Screen:**
   - **Top-Left:** Link to **Profile/Settings Screen (5.1)**.
   - **Top-Right:** Button to toggle between front/rear camera.
   - **Center:** Large "Capture" button.
   - **Bottom-Left:** Link to **Chat Screen (4.1)**.
   - **Bottom-Right:** Link to **Stories Screen (4.2)**.
   - **Beside Capture Button:** Icon to open AR Filter/Effects carousel.
3. **Capturing Content:**
   - **Photo:** User taps the "Capture" button once.
   - **Video:** User presses and holds the "Capture" button. A progress indicator appears around the button. Recording stops when the button is released or the time limit (e.g., 15 seconds) is reached.
4. **Applying Simple AR Filters/Effects:**
   - Before or after capture, user can tap the "Effects" icon.
   - A horizontal carousel of filter thumbnails appears at the bottom.
   - User taps a thumbnail to apply the effect in real-time. (e.g., B\&W filter, "Good Morning" text overlay, etc.).
   - **Stretch Goal:** Expand this system to include basic facial recognition filters (Option B), such as placing sunglasses or a hat on a detected face. This would be built on top of the initial static overlay system.
5. Once content is captured, the user is automatically taken to the **Preview & Edit Screen (3.0)**.

### **3.0 Preview & Sharing Flow**

This flow begins after a photo or video has been captured.

1. User is on the **Preview & Edit Screen**, viewing the snap they just created.
2. **UI Elements on Preview Screen:**
   - **Top-Left:** "X" button to discard the snap and return to the **Camera Screen (2.0)**.
   - **Top-Right:** Tools like "Add Text" or "Draw".
   - **Bottom-Left:** "Timer" icon to set duration (1-10 seconds for photos).
   - **Bottom-Center:** "Add to Story" button.
   - **Bottom-Right:** "Send To" button.
3. User optionally adds text or drawings.
4. **Sharing Options:**
   - **Option A (Quick Story):** User taps "Add to Story". The snap is immediately posted to their Story for 24 hours, and the user is returned to the **Camera Screen (2.0)**.
   - **Option B (Send To):** User taps "Send To". They are taken to the **Send To Screen**.
5. On the **Send To Screen**, the user sees:
   - **Top Option:** "My Story" \- posts the snap to the user's public story for 24 hours.
   - A list of their friends.
   - A list of groups they are in.
6. User can select one or more friends, groups, and/or their Story.
7. User taps the "Send" arrow icon at the bottom.
8. The app sends the snap and returns the user to the screen they came from (typically the **Camera Screen (2.0)**).

### **4.0 Content Consumption Flows**

This flow describes how users view content from others.  
**4.1. Viewing Direct Snaps (Chat)**

1. From the **Camera Screen (2.0)**, user swipes right or taps the bottom-left icon to access the **Chat Screen**.
2. The screen displays a list of friends with whom they have active conversations.
3. Friends with new, unread snaps are indicated with a solid-colored icon. Opened snaps are indicated with an unfilled icon.
4. User taps on a friend's name to view their snap.
5. The photo/video plays once. For photos, the timer counts down.
6. After the snap is viewed, it is marked as "opened". The user is returned to the Chat list.
7. **Replying:** While viewing a snap, a chat input field and keyboard are visible at the bottom of the screen by default. The user can immediately type a text reply. Alternatively, they can tap a camera icon next to the input field to be taken to the **Camera Screen (2.0)** to send a snap in reply.
8. **Group Messaging:** Group chats appear in this list and function similarly. A snap sent to a group can be viewed once by each member.

**4.2. Viewing Stories**

1. From the **Camera Screen (2.0)**, user swipes left or taps the bottom-right icon to access the **Stories Screen**.
2. The screen displays a list of friends who have posted updates to their Story in the last 24 hours.
3. User taps on a friend's name to begin watching their Story.
4. Stories play sequentially, advancing from one snap to the next automatically.
5. User can tap the right side of the screen to skip to the next snap in a Story, or swipe left to skip to the next person's Story.
6. To exit the Story viewer, the user swipes down, returning to the **Stories Screen**.

### **5.0 Social & Friend Management Flow**

This flow describes how users manage their profile and connections.  
**5.1. Profile & Settings**

1. From the **Camera Screen (2.0)**, user taps their profile icon in the top-left.
2. User is taken to their **Profile Screen**, which displays their username and Snapcode (a unique QR code).
3. From here, they can access a "Settings" page to manage their account (e.g., change password, manage notification).

**5.2. Adding Friends**

1. On the **Profile Screen**, there is an "Add Friends" option.
2. The **Add Friends Screen** provides multiple ways to add someone:
   - **By Username:** A search bar to find users by their exact username.
   - **From Contacts:** The list of users found from their phone contacts.
   - **Add Back:** A list of users who have added them.
3. User sends a friend request. The other user receives a notification and can accept or decline.
