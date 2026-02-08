# KON-NECT: Smart Proximity Networking

**KON-NECT** (formerly Demographic) is a real-time social discovery platform designed to connect users based on shared interests within walking distance. It leverages precise geolocation, interest matching clustering, and ephemeral communication to foster explicit, spontaneous real-world interactions.

<img width="1920" height="1080" alt="image" src="https://github.com/user-attachments/assets/792a6f44-959b-44b8-8b6a-1af3107aa91d" />


## Key Features

### 📍 Dynamic Discovery & Clustering
- **Leaflet & OpenStreetMap**: Interactive map interface powered by Leaflet.js.
- **10km Discovery Mode**: Users can explicitly define a discovery radius (default 10km) centered on their real-time location.
- **Global View**: Toggle to see users worldwide for broader networking.

### 🎨 Material You Design System (Android 16 Styled)
- **Glassmorphism UI**: High-end aesthetic with blur effects, animated gradients, and lucid icons.
- **Theme Support**: Seamless Light/Dark mode switching with persistent user preference.
- **Responsive**: Fully optimized for mobile, tablet, and desktop viewports.

### 🔐 Hybrid Authentication
- **Secure JWT**: Stateless session management using JSON Web Tokens.
- **Google OAuth 2.0**: One-click login/signup via Google Passport strategy.
- **Account Management**: User profile customization, password resets, and account deletion functionality.

### 💬 Ephemeral Real-Time Chat
- **Socket.io**: Instant messaging with zero persistence.
- **Session-Based Privacy**: Chat history is **not stored**. Messages exist only during the active socket session, ensuring complete privacy in transient connections. 
- **Direct Messaging**: Latency-free peer-to-peer communication upon connection request acceptance.

### 🚗 Intelligent Routing (OSRM)
- **Turn-by-Turn Directions**: Integrated OSRM (Open Source Routing Machine) to calculate driving/walking paths between users.
- **Distance Estimation**: Real-time distance and ETA calculation.

---

## Tech Stack

### Frontend (Client)
- **Framework**: React 19 + Vite
- **Styling**: TailwindCSS + Material UI (MUI) v6
- **State**: React Context API (`AuthContext`, `ColorModeContext`)
- **Maps**: `react-leaflet`, `leaflet`
- **Real-Time**: `socket.io-client`

### Backend (Server)
- **Runtime**: Node.js + Express
- **Database**: MongoDB Atlas (Mongoose ODM)
- **Auth**: Passport.js (Google Strategy), `jsonwebtoken`
- **Geospatial**: MongoDB `$near` queries with 2dsphere indexing

---

## Prerequisites

- **Node.js** (v18 or higher)
- **MongoDB Atlas Account** (Free Tier is sufficient)
- **Google Cloud Console Project** (for OAuth Client ID/Secret)

---

## Installation & Setup

### 1. Clone the Repository
```bash
git clone https://github.com/Akash-Veerla/KON-NECT.git
cd KON-NECT
```

### 2. Install Dependencies

You must install dependencies for **both** the root backend and the client frontend.

**Backend (Root):**
```bash
npm install
```

**Frontend (Client):**
```bash
cd client
npm install
cd ..
```

### 3. Environment Configuration

#### Backend (.env)
Copy the example file in the `server` directory (or root if running mono-repo style, but standard is `server/.env` based on `index.js` config):

**Note**: The server code looks for `.env` in the project root relative to `server/index.js` (i.e., `../.env` or `server/.env`). Place the `.env` file in `server/`.

```bash
cp server/.env.example server/.env
```

Edit `server/.env` and fill in your details:
- `MONGO_URI`: Your MongoDB connection string.
- `JWT_SECRET`: A long random string.
- `GOOGLE_CLIENT_ID`: From Google Cloud Console.
- `GOOGLE_CLIENT_SECRET`: From Google Cloud Console.
- `CALLBACK_URL`: `http://localhost:5000/api/auth/google/callback`

#### Frontend (.env)
Copy the client example:

```bash
cp client/.env.example client/.env
```

Edit `client/.env`:
- `VITE_API_URL`: `http://localhost:5000` (for local dev)

### 4. Seed the Database (Optional)
Populate the map with 80+ dummy users in the Andhra Pradesh region for testing clustering algorithms.

```bash
# Ensure server can connect to MongoDB first
npm run seed
```

This script (`server/scripts/seedIndia.js`) generates users with valid lat/long coordinates and varied interests.

---

## Running the Application

### Development Mode
Run both backend and frontend concurrently (if configured) or in separate terminals.

**Terminal 1 (Backend):**
```bash
# From root
npm run server
# OR
cd server && node index.js
```
*Server runs on http://localhost:5000*

**Terminal 2 (Frontend):**
```bash
cd client
npm run dev
```
*Client runs on http://localhost:5173*

Open **http://localhost:5173** to view the app.

---

## Usage Guide

1.  **Login/Register**: Use Google Login or create a demo account.
2.  **Map Interface**:
    *   **Discovery (10km)**: Toggle to see users within 10km radius.
    *   **Global View**: See all registered users.
    *   **Search**: Use the search bar for city/place navigation.
3.  **Connect**: Click on a user pin -> Click "Chat" or "Connect".
4.  **Directions**: Click "Get Directions" to draw a route on the map.

---

## Contributing

1.  Fork the repository.
2.  Create a feature branch (`git checkout -b feature/NewFeature`).
3.  Commit your changes (`git commit -m 'Add NewFeature'`).
4.  Push to the branch (`git push origin feature/NewFeature`).
5.  Open a Pull Request.

---

## License

MIT License. See [LICENSE](LICENSE) for details.
