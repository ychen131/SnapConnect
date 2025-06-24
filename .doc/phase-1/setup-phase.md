# **Setup Phase**

This phase focuses on creating a barebones setup that functions at a basic level but isn’t fully usable.

### **1\. Project Scaffolding**

- Initialize a new React Native project using Expo.
- Set up the directory structure as defined in project-rules.md.
- Install and configure Prettier and ESLint for code formatting and linting.
- Initialize a Git repository and create a remote repository on GitHub.

### **2\. Environment Configuration**

- Create a new project in Supabase and configure the database schema.
- Add Supabase environment variables to a .env file and configure them in the project.
- Set up Supabase authentication and define user roles and permissions.
- Create a README.md file with instructions for setting up the development environment.

### **3\. Basic UI and Navigation**

- Install and configure React Navigation for handling navigation between screens.
- Create placeholder screens for the main features (e.g., Camera, Chat, Stories).
- Implement a basic navigation flow to switch between the placeholder screens.
- Set up a basic theme with colors and fonts as defined in theme-rules.md.

### **4\. Continuous Integration**

- Set up a CI/CD pipeline with GitHub Actions to automate testing and deployment.
- Configure the CI pipeline to run tests on every pull request.
- Add a script to automatically format code before committing.
