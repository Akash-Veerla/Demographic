# KON-NECT: Setup Guide

## Folder Structure

The repository is structured as a monorepo containing both the frontend client and backend server.

```
/KON-NECT
├── client/                 # React Frontend (Vite)
│   ├── public/             # Static Assets
│   ├── src/
│   │   ├── components/     # Reusable UI Blocks
│   │   ├── context/        # React Context (Auth, Theme)
│   │   ├── pages/          # Application Routes
│   │   └── utils/          # API helpers
│   ├── .env                # Client Environment Variables
│   └── package.json
│
├── server/                 # Node.js Backend (Express)
│   ├── auth/               # Passport Strategies (Google)
│   ├── models/             # Mongoose Schemas (User, Chat)
│   ├── routes/             # Express Routers (Auth, Users)
│   ├── scripts/            # Database Seeders
│   ├── .env                # Server Environment Variables
│   └── index.js            # Entry Point
│
├── .gitignore              # Git Ignore Rules
├── README.md               # Project Overview
├── DEPLOYMENT.md           # Deployment Instructions
└── SETUP.md                # This Guide
```

## Setup Instructions

### 1. Backend Setup

1.  Navigate to `server/`:
    ```bash
    cd server
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Configure Environment:
    *   Copy `.env.example` to `.env`.
    *   Fill in `MONGO_URI`, `JWT_SECRET`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`.

4.  Start Server:
    ```bash
    npm run dev
    ```
    (Or `node index.js` if nodemon is not installed globally/locally).

### 2. Frontend Setup

1.  Navigate to `client/`:
    ```bash
    cd client
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Configure Environment:
    *   Copy `.env.example` to `.env`.
    *   Set `VITE_API_URL=http://localhost:5000` (or your backend URL).

4.  Start Client:
    ```bash
    npm run dev
    ```

### 3. Verification

1.  Open `http://localhost:5173`.
2.  You should see the KON-NECT landing page.
3.  Try registering a new user. If successful, backend connection is verified.
