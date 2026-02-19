# KON-NECT: Project Architecture & System Diagrams

This document provides a comprehensive visual breakdown of how the KON-NECT application works, explaining the technology and logic for everyone.

---

## 🏗️ 1. How KON-NECT Works (System Map)
This map shows how the App, the Server, and external services like Google and Maps work together.

```mermaid
graph TD
    User((fa:fa-user User))
    
    subgraph "The App (Your Phone/Browser)"
        UI[fa:fa-desktop Beautiful Interface]
        Map[fa:fa-map-marked-alt Interactive Map]
        SIO_C[fa:fa-plug Real-time Connection]
        Auth_C[fa:fa-key Account Settings]
    end
    
    subgraph "The Server (The Brain)"
        API[fa:fa-route Data Gateway]
        SIO_S[fa:fa-comments Chat System]
        Passport{{fa:fa-id-badge Secure Login Handler}}
        Matching[fa:fa-microchip Smart Matching Logic]
    end
    
    subgraph "Storage & External"
        DB[(fa:fa-database Database)]
        Google((fa:fa-google Google Account Server))
        OSRM((fa:fa-directions Travel Routes))
    end
    
    User <--> UI
    UI --> Map
    SIO_C <--> SIO_S
    Auth_C <--> API
    Map <--> OSRM
    API <--> Matching
    Matching <--> DB
    API <--> Passport
    Passport <--> Google
```

---

## 💾 2. Database: How Information is Stored
This shows how users, friends, and interests are connected together in our data storage.

```mermaid
erDiagram
    USER ||--o{ FRIEND-REQUEST : "Sends/Receives Requests"
    USER ||--o{ CUSTOM-INTEREST : "Adds New Interests"
    USER ||--o{ FRIENDSHIP : "Has many"
    FRIENDSHIP }o--|| USER : "Connects to"

    USER {
        ObjectId ID PK
        String Name "Visible Display Name"
        String Email UK
        String Photo "Profile Picture URL"
        String Bio "Personal Description"
        String[] Interests "List of Tags"
        Point Location "GPS [Long, Lat]"
        Date LastActive
    }

    FRIEND-REQUEST {
        ObjectId ID PK
        ObjectId From FK
        ObjectId To FK
        String Status "Pending / Accepted / Rejected"
        Date TimeSent
    }

    CUSTOM-INTEREST {
        ObjectId ID PK
        String Name UK
        ObjectId CreatedBy FK
    }
```

---

## 🔐 3. How You Sign In (Secure Login)
This explains the step-by-step process of logging in securely using Google.

```mermaid
sequenceDiagram
    participant U as fa:fa-user User
    participant C as fa:fa-laptop Your App
    participant S as fa:fa-server Main Server
    participant G as fa:fa-google Google Login
    participant DB as fa:fa-database Database

    U->>C: Click "Login with Google"
    C->>S: Request Google Login
    S->>G: Check Identity
    G-->>S: Return Your Profile
    S->>DB: Save/Find User Record
    DB-->>S: User Account Found
    S->>S: Create Login Session
    S-->>C: Redirect Back to App
    C->>C: Remember Login Status
    Note over C,S: You stay logged in for your session
```

---

## 🧠 4. The Compatibility Brain (Smart Matching)
The logic that determines if two people are a good match for each other.

```mermaid
graph TD
    U1["fa:fa-user User A Profile"] --> Data["Read Interests & GPS"]
    U2["fa:fa-user User B Profile"] --> Data
    
    Data --> Dist["Check Distance Between Users"]
    Dist --> Nearby{Is it within 20km?}
    
    Nearby -- "Yes" --> Edge["Build Social Connection"]
    Nearby -- "No" --> NoMatch([fa:fa-times Too Far Away])
    
    Edge --> GNN["Apply Matching Algorithm"]
    GNN --> Embed["Calculate Compatibility"]
    Embed --> ResultLogic{Final Decision}
    
    Data --> Shared{Any Shared Interests?}
    Shared -- "Yes" --> ResultLogic
    Shared -- "No" --> NoMatch
    
    ResultLogic --> Match([fa:fa-check Found a Match!])
```

---

## 🔍 5. Finding People Near You
How the app scans the map to show people within walking distance.

```mermaid
graph LR
    Start([Update My Location]) --> Search[fa:fa-search Search Radius]
    Search --> Range[Find Users Within 20km]
    Range --> Interests{Match My Interests?}
    Interests -- "No" --> Skip[Skip User]
    Interests -- "Yes" --> Calc[Calculate Match Level]
    Calc --> Display[Sort by Best Match]
    Display --> UI([Update Pins on the Map])
```

---

## 🤝 6. Connecting with Others
The simple workflow of sending, accepting, or declining a friend request.

```mermaid
stateDiagram-v2
    [*] --> RequestSent : I send a request
    RequestSent --> Friends : They Accept
    RequestSent --> Denied : They Reject
    Denied --> RequestSent : Try again later
    Friends --> Connected : We can now chat!
    Connected --> [*] : Unfriend or Delete
```

---

## 💬 7. Real-time Chat & Updates
How messages and location updates fly instantly between users without saving them forever (Privacy first).

```mermaid
sequenceDiagram
    participant A as fa:fa-user You
    participant S as fa:fa-hub KON-NECT Server
    participant B as fa:fa-user Nearby Person

    A->>S: Connect to Server
    B->>S: Connect to Server

    rect rgba(255, 255, 255, 0.05)
    Note over A, S: GPS Sync (Private)
    A->>S: Share My Current Location
    S->>S: Check Who Is Close
    S->>A: Update Map with People
    end

    rect rgba(0, 150, 255, 0.1)
    Note over A, B: Instant Chat
    A->>S: Send a Private Message
    S->>B: Deliver Message Instantly
    end
```

---

## 🗺️ 8. Application Navigation Map
How the different screens and settings are organized inside the app.

```mermaid
graph TD
    App[fa:fa-code App Home] --> Logic[fa:fa-layer-group App Settings]
    Logic --> Account[fa:fa-user-lock Account Info]
    Logic --> Theme[fa:fa-palette Dark/Light Mode]
    
    App --> Screens[fa:fa-random App Screens]
    Screens --> Start[fa:fa-door-open Welcome Screen]
    Screens --> Login[fa:fa-sign-in-alt Login Screen]
    Screens --> Main[fa:fa-map Map & Social View]
    
    Main --> MapView[fa:fa-location-arrow Social Map]
    Main --> ChatUI[fa:fa-comment-alt Chat Window]
```
