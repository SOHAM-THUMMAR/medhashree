# Medhashree Client Documentation

## Overview

The Medhashree client is a modern, responsive Single Page Application (SPA) built with React and Vite. It serves as the user interface for both regular students/players and administrators. The frontend handles user authentication, quiz browsing, solo/1v1 quiz playing, leaderboards, profile management, and comprehensive admin dashboard functionalities.

---

## Directory Structure & Key Files

### `src/` (Root Source)
- **`main.jsx`**: The application entry point. It sets up the DOM and wraps the app with the `ThemeProvider`. It also exports a `window.renderQuizHub` for potential hybrid integrations.
- **`App.jsx`**: Defines all the application routes using `react-router-dom`. Routes are split between an `AuthLayout` (for login/register), standard `MainLayout` (for the actual app), and standalone views (like the active `QuizPlayView` and `ForgotPassword`).
- **`index.css` & `App.css`**: Global styles and Tailwind CSS configurations.

### `src/config/`
- **`api.js`**: Contains centralized `fetch` wrappers (`authFetch`, `apiFetch`, `authUpload`) and the `API_BASE` URL configuration. This ensures that the JWT token is injected into HTTP requests uniformly without rewriting Headers everywhere.

### `src/context/` & `src/hooks/`
- **`ThemeContext.jsx` & `useTheme.js`**: Manages the application's Light/Dark mode state and persists the class onto the `document.documentElement` for Tailwind dark mode styling.
- **`SearchContext.jsx`**: A global context providing debounced search capabilities, used mostly across the application to filter components without localized state-drilling.
- **`useGoogleAuth.js`**: A custom hook that lazily loads the Google Identity Services SDK script and encapsulates the logic for triggering the Google OAuth popup and communicating with the backend's Google authentication endpoint.

### `src/layouts/`
- **`AuthLayout.jsx`**: A simplified container for authentication forms (Login/Register) ensuring they are centered and share the same box/UI styling.
- **`MainLayout.jsx`**: The primary wrapper for logged-in user pages. It injects the `Sidebar` and `Topbar` components and handles the scrollable main content area.

### `src/components/` (Reusable UI Parts)
- **`Sidebar.jsx`**: Side navigation menu allowing users to move between Home, Explore, Leaderboard, Battles, Profile, and Admin routes (based on User Role).
- **`Topbar.jsx`**: Top navigation header that incorporates the search bar, theme toggler, notification bell, and user profile picture.
- **`QuizCard.jsx`**: A reusable card component to display brief information about a quiz/category.
- **`ProfileMenu.jsx`**: A dropdown attached to the Topbar allowing quick actions like Logout.
- **`NotificationsPanel.jsx` & `MessagesPanel.jsx`**: UI panels for interactions inside the Topbar.
- **`TournamentDetailsModal.jsx`**: A modal component displaying rich data about an active tournament.

### `src/pages/` (Application Views)
- **`Home.jsx`**: The main dashboard showing recent activities, popular categories, and stats.
- **`Login.jsx` & `Register.jsx`**: Authentication forms handling user input, form validation, error display, and dispatching login requests (including Google OAuth via the custom hook).
- **`Explore.jsx` & `Categories.jsx`**: Pages dedicated to browsing subjects, topics, and micro-topics.
- **`QuizBattle.jsx`**: The matchmaking page. Users choose between playing "1v1" or "Solo". In 1v1 mode, it establishes a Socket connection (via `socket.io-client` mapped to the .NET SignalR Hub) to find an opponent and queues the user. Once matched, it redirects to the `QuizPlayView`.
- **`QuizPlayView.jsx`**: The active gameplay interface. It pulls the generated queue/session ID, displays the questions one by one with a visual timer, registers answers, and ultimately submits the final score back to the server.
- **`Dashboard.jsx`, `MyQuizzes.jsx`, `CreateQuiz.jsx`**: Pages enabling instructors/users to create and manage their own test content.
- **`Leaderboard.jsx`**: Displays top players based on points.
- **`Profile.jsx`**: Manage personal information.
- **`Tournaments.jsx`**: Browse and participate in scheduled tournaments.

### `src/pages/admin/` (Admin Content)
- **`AdminDashboard.jsx`**: High-level overview of system metrics (User counts, active quizzes, etc.).
- **`ManageUsers.jsx`**: Table view to ban/unban or change roles of users.
- **`ManageContent.jsx`**: Interface for adding/removing Categories, Subjects, Questions, and uploading CSVs for bulk imports.
- **`ManageTournaments.jsx` & `CreateTournament.jsx`**: CRUD interfaces for the tournament system.

---

## Technical Flow Example: 1v1 Quiz Matchmaking

Here is the step-by-step flow of how the real-time matchmaking functions across multiple files:

1. **User Initiation (`QuizBattle.jsx`)**: The user selects "1v1", picks a Category and Subject, and clicks "Find Opponent".
2. **Socket Initialization**: The client uses `socket.io-client` to connect to `API_BASE` (with the `/api` stripped off, connecting directly to the root for SignalR mappings). It passes the user's JWT token in the authentication payload.
3. **Queueing**: The frontend emits a `battle:find-match` event with the criteria. The UI changes to a "Searching for Opponent" spinner and begins a 5-minute local countdown.
4. **Matching**: When the server matches two players, it emits `battle:matched` back to the clients, providing a `session_id`.
5. **Redirection (`App.jsx` -> `QuizPlayView.jsx`)**: The socket listener on `QuizBattle.jsx` receives the match data, shows a 3-second visual "Match Found!" animation, then does a `navigate('/play/' + session_id)`.
6. **Gameplay (`QuizPlayView.jsx`)**: The new view loads, fetches the actual questions for that `session_id` using standard HTTP GET via `authFetch`, and renders the interactive quiz game.

---

## Summary of the Web Client

The React application uses a highly decoupled component architecture. Routing defines what the user sees (`App.jsx`), Layouts define the surrounding frame (`MainLayout.jsx`), Pages define the content payload (`Home.jsx`), and Contexts (`ThemeContext`) provide global behaviors. All API communication relies on the centralized `api.js` to ensure authentication hygiene.
