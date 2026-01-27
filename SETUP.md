# Project Setup & Deployment Guide

## Prerequisites

**Node.js is Required**
This project requires Node.js to run locally.
- [Download Node.js](https://nodejs.org/) (LTS Version recommended)
- After installing, restart your terminal/code editor.
- Verify installation by running:
  ```bash
  node -v
  npm -v
  ```

## Local Development (Ports Aligned)

We have configured the project to use **Port 5000** for the server to standardize local development.

1.  **Setup Server**
    ```bash
    cd server
    npm install
    # Ensure your .env has MONGO_URI
    npm run dev
    ```
    Server runs at `http://localhost:5000`

2.  **Setup Client**
    ```bash
    cd client
    npm install
    npm run dev
    ```
    Client runs at `http://localhost:5173`

3.  **Test Database Connection**
    We added a script to verify your MongoDB connection without running the full server:
    ```bash
    node server/test-db.js
    ```

## Deployment Configuration

### Render.com (Backend)
- **Repo**: `https://github.com/YourUser/social-map-app` 
- **Root Directory**: `.` (or empty)
- **Build Command**: `npm install`
- **Start Command**: `npm start`
- **Environment Variables**:
    - `MONGO_URI`: (Your MongoDB Connection String)
    - `JWT_SECRET`: (Random Secret)
    - `CLIENT_URL`: `https://your-app-name.vercel.app` (Your Frontend URL)
    - `PORT`: `10000` (Render sets this automatically, but our code handles it)

### Vercel (Frontend)
- **Root Directory**: `client`
- **Build Command**: `vite build`
- **Output Directory**: `dist`
- **Environment Variables**:
    - `VITE_API_URL`: `https://your-app-name.onrender.com` (Your Backend URL)

## Troubleshooting
- **CORS Issues**: If you see CORS errors on the frontend, check that `CLIENT_URL` on Render matches your Vercel URL exactly (no trailing slash).
- **Database Connection**: Run `node server/test-db.js` locally to verify your `MONGO_URI`.
