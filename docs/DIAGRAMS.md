# KON-NECT: Project Architecture & System Diagrams

This document provides a comprehensive visual breakdown of how the KON-NECT application works, explaining the logic for everyone in a simple way.

---

## 🏗️ 1. How the System Works
This map shows how the App, the Brain (Back-end), and the Data interact to provide a seamless experience.

```mermaid
graph TD
    User((User))
    
    subgraph "The App (Your Device)"
        UI[Main Interface]
        Map[Interactive Map]
        Route[Navigation Guide]
        LiveLink[Real-time Connection]
    end
    
    subgraph "The Brain (Central Logic)"
        Gateway[Data Gateway]
        ChatHost[Chat System]
        SecureAuth[Secure Login Handler]
        SmartMatch[Interest Link Engine]
        StatsHub[Local Statistics Hub]
    end
    
    subgraph "Storage & External Services"
        Database[(Primary Database)]
        PlaceSearch((Location Search))
        RouteSvc((Map Route Service))
    end
    
    User <--> UI
    UI --> Map
    LiveLink <--> ChatHost
    Map <--> RouteSvc
    Map <--> PlaceSearch
    Gateway <--> SmartMatch
    Gateway <--> StatsHub
    SmartMatch <--> Database
    Gateway <--> SecureAuth
```

---

## 💾 2. Information Structure
This shows how users, friends, conversations, and interests are organized.

```mermaid
erDiagram
    USER ||--o{ FRIEND-REQUEST : "Sends/Receives"
    USER ||--o{ CUSTOM-INTEREST : "Creates Tags"
    USER ||--o{ CONVERSATION : "Participates In"
    USER ||--o{ BLOCKED-USER : "Restricts Visibility"
    FRIENDSHIP }o--|| USER : "Connects to Profile A"
    FRIENDSHIP }o--|| USER : "Connects to Profile B"
    CONVERSATION ||--o{ MESSAGE : "Contains History"

    USER {
        String ID PK
        String Name "Visible Name"
        String Email UK
        String Photo "Profile Picture"
        String Bio "Personal Description"
        String[] Interests "Hobbies & Tags"
        Point Location "GPS Coordinates"
        String AuthMethod "Local / Google"
    }

    FRIEND-REQUEST {
        String ID PK
        String From FK
        String To FK
        String Status "Pending / Cancelled"
        Date TimeSent
    }

    CONVERSATION {
        String ID PK
        String RoomID "Socket identifier"
        String[] Participants "User IDs"
        Date LastMessageAt
    }

    MESSAGE {
        String Sender FK
        String Receiver FK
        String Content "Encrypted Text"
        String Status "Sent / Delivered / Read"
    }

    CUSTOM-INTEREST {
        String ID PK
        String Name "Normalized Tag"
        String CreatedBy FK
    }
```

---

## 🔐 3. Secure Login Process
How you sign in securely via Email or Google.

```mermaid
sequenceDiagram
    participant U as User
    participant A as App
    participant L as Login Gateway
    participant S as Security Server
    participant D as Database

    U->>A: Enter Email/Password OR Google
    A->>L: Request Entry
    alt Alternative: Google Path
        L->>S: Verify Google Identity
        S-->>L: Confirm Profile
    else Alternative: Email Path
        L->>D: Check Password Hash
        D-->>L: Verified
    end
    L->>L: Create JWT Token
    L-->>A: Send Token & Profile
    A->>A: Save to Secure LocalStorage
    Note over A, L: Every request now carries your Token
```

---

## 🧠 4. Compatibility Logic
The intelligence that determines if two people are a good match.

```mermaid
graph TD
    U1[Person A Profile] --> Data[Analyze Interests & GPS]
    U2[Person B Profile] --> Data
    
    Data --> Distance[Check Current Road Distance]
    Distance --> Range{Within 20km?}
    
    Range -- "Yes" --> Link[Create Network Edge]
    Range -- "No" --> NoMatch([Too Far Apart])
    
    Link --> Algorithm[Interest Group Analysis]
    Algorithm --> Score[Calculate Compatibility Score]
    Score --> Logic{Final Verdict}
    
    Data --> Common{Shared Interests?}
    Common -- "Yes" --> Logic
    Common -- "No" --> NoMatch
    
    Logic --> Match([Found a Match!])
```

---

## 🔍 5. People Discovery & Stats
How the app finds people and local trends around you.

```mermaid
graph LR
    Start([Live Location Update]) --> Hub[Stats Hub]
    Hub --> Trends[Calculate Trending Interests]
    Hub --> Nearby[Identify Friends Online]
    
    subgraph "Precision Filters"
        ReverseGeo["Reverse Geocode (Current Place)"]
        Match{Match My Profile?}
        Range[Radius: 20km]
    end
    
    Nearby --> Range
    Range --> Match
    Match -- "Yes" --> Display([Live Pins on Map])
    
    Display --> ReverseGeo
    Display --> Trends
```

---

## 🤝 6. Connection & Trust Lifecycle
Managing requests, friendships, and blocking safely.

```mermaid
stateDiagram-v2
    [*] --> RequestSent : Send Invite
    
    state RequestSent {
        direction LR
        Pending --> Accepted : User B Accepts
        Pending --> Declined : User B Rejects
        Pending --> Cancelled : User A Withdraws
    }
    
    Accepted --> Friends : Mutual Connection
    Friends --> Connected : Private Persistent Chat
    
    state SafetyActions {
        direction TB
        Friends --> Unfriend : Break Connection
        Connected --> Block : Restrict Visibility
    }
    
    Unfriend --> [*]
    Block --> [*]
```

---

## 💬 7. Persistent Encrypted Chat
How messages flow and stay securely stored in the system.

```mermaid
sequenceDiagram
    participant Me as You
    participant Hub as Central Hub
    participant Peer as Nearby Person

    Me->>Hub: Connect (Active Session)
    Hub-->>Me: Fetch Last 50 Messages (Decrypted)

    rect rgba(0, 100, 255, 0.1)
    Note over Me, Peer: Secure Messaging
    Me->>Me: Encrypt Text (AES)
    Me->>Hub: Send Encrypted Message
    Hub->>Hub: Save to Database
    Hub->>Peer: Direct Notification
    Peer->>Hub: Mark as Read
    Hub->>Me: Blue Check (Read Receipt)
    end
```

---

## 🗺️ 8. Navigation & Route Tailing
How the navigation guide follows you accurately on the map.

```mermaid
graph TD
    Start([Set Destination]) --> Router[Calculate Best Path]
    Router --> Display[Draw Route Line]
    
    subgraph "Dynamic Tailing"
        Track[watchPosition Updates]
        Compare[Check Nearest Point on Line]
        Slice[Remove Completed Segment]
    end
    
    Display --> Track
    Track --> Compare
    Compare --> Slice
    Slice --> Redraw[Redraw Shorter Route]
    Redraw --> Track
```

---

## 🏷️ 9. Interest Normalization
How we keep the library of interests clean and professional.

```mermaid
graph LR
    Input[User enters 'hiking'] --> Clean[Trim Whitespace]
    Clean --> Case[Power Capitalization: 'Hiking']
    Case --> Search[Check Existing Tags]
    
    Search --> Exists{Tag Exists?}
    
    Exists -- "Yes" --> UseOld[Use Existing System Tag]
    Exists -- "No" --> Create[Register as New Custom Tag]
    
    UseOld --> Save[Save to User Profile]
    Create --> Save
```

