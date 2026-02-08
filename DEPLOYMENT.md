# KON-NECT Deployment Guide

This guide details how to deploy your application logic in a decoupled architecture:

**Frontend**: Vercel (recommended)  
**Backend**: Render or Railway

## 1. Backend (Server)

### Platform: Render / Railway / Heroku

1.  **Environment Variables**: In your cloud dashboard, add these keys:
    *   `MONGO_URI`: Your MongoDB connection string.
    *   `JWT_SECRET`: A secure random string.
    *   `GOOGLE_CLIENT_ID`: Your Google OAuth Client ID.
    *   `GOOGLE_CLIENT_SECRET`: Your Google OAuth Client Secret.
    *   `CALLBACK_URL`: Your deployed backend URL `/api/auth/google/callback` (e.g., `https://my-backend.onrender.com/api/auth/google/callback`).
    *   `CLIENT_URL`: Your deployed frontend URL (without trailing slash) e.g., `https://my-frontend.vercel.app`.

2.  **Start Command**: `node server/index.js` or `npm start` (ensure `package.json` points to the correct file).

3.  **Root Directory**: If monorepo, set root to `server/` or adjust build commands.

---

## 2. Frontend (Client)

### Platform: Vercel / Netlify

1.  **Environment Variables**:
    *   `VITE_API_URL`: Your deployed backend URL (e.g., `https://my-backend.onrender.com`).
    *   *(Note: Variables must start with `VITE_` to be exposed to the browser)*.

2.  **Build Command**: `npm run build`
3.  **Output Directory**: `dist`
4.  **Root Directory**: `client/` (If deploying from monorepo).

---

## 3. Google Cloud Console Configuration

Ensure your Google OAuth credentials allow the deployed domains:

1.  **Authorized JavaScript Origins**:
    *   `https://my-frontend.vercel.app` (Your Client URL)
    *   `https://my-backend.onrender.com` (Your Server URL - sometimes needed for popup flow)

2.  **Authorized Redirect URIs**:
    *   `https://my-backend.onrender.com/api/auth/google/callback` (Must match `CALLBACK_URL` env var exactly).

---

## 4. Verification

After deployment:
1.  Open the frontend URL.
2.  Try logging in with Google. If you get `redirect_uri_mismatch`, check the Authorized Redirect URIs in Google Cloud Console.
3.  Check browser console for CORS errors. If present, verify `CLIENT_URL` on the backend matches the frontend origin.
