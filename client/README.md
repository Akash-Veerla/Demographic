# Demographic - Client (Frontend)

This is the frontend client for the **Demographic** social map application.

## Tech Stack

-   **Framework**: React (v19) + Vite
-   **Styling**: TailwindCSS + Material UI (MUI)
-   **State Management**: React Context API (`AuthContext`, `ColorModeContext`)
-   **Routing**: React Router DOM (v7)
-   **Real-time**: Socket.io Client
-   **Icons**: Lucide React + Material Symbols

## Features

-   **Premium UI**: Glassmorphism design, animated gradients, and dark mode support.
-   **Interactive Map**: Real-time user discovery using geolocation.
-   **User Profiles**: Dynamic profiles with avatars, interests, and bio.
-   **Chat**: Real-time messaging with nearby users.
-   **Authentication**: Custom JWT-based auth (Register/Login).

## Project Structure

-   `src/components/`: Reusable UI components (Map, Chat, Profile, etc.).
-   `src/context/`: Global state providers (Auth, Theme).
-   `src/utils/`: Helper functions and API configuration (`axios` interceptors).
-   `src/assets/`: Static assets.

## Running Locally

1.  Install dependencies:
    ```bash
    npm install
    ```

2.  Run the development server:
    ```bash
    npm run dev
    ```

3.  The app will open at `http://localhost:5173`.

## Environment Variables

Ensure you have a `.env` file in the root (legacy) or `client/` root depending on your vite config setup, though typically Vite reads from the root `.env` if configured or `client/.env`.

-   `VITE_API_URL`: Backend URL (e.g., `http://localhost:10000`)
